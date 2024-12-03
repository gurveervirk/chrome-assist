import { promptSummarizeModel } from "./api/AI_functions/summarizeHandler";
import { handleWrite } from "./api/AI_functions/writeHandler";
import { handleRewrite, enhanceSearchQueries } from "./api/AI_functions/rewriteHandler";
import { loadSettings, saveSettings } from "./api/AI_functions/settingsStorage";
import { parseCommand } from "./api/parser";
import { saveBookmark, deleteBookmark, saveOutput, deleteOutput, fetchOutputs, fetchBookmarks, saveEmbedding, fetchEmbeddings } from "./utils/db";
import { defaultSettings } from "./utils/constants";
import { pipeline, cos_sim } from "@huggingface/transformers";
import { v4 as uuidv4 } from "uuid";

// Singleton class for the embedding pipeline
class EmbeddingPipeline {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

function convertFloat32ArraysToArrays(arrayOfFloat32Arrays) {
  return arrayOfFloat32Arrays.reduce((accumulator, currentFloat32Array) => {
      // Convert Float32Array to a regular JavaScript array using Array.from
      const jsArray = Array.from(currentFloat32Array);

      // Add the converted array to the accumulator
      accumulator.push(jsArray);

      return accumulator;
  }, []);
}

chrome.runtime.onInstalled.addListener(async (details) => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({url: cs.matches})) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      const target = {tabId: tab.id, allFrames: cs.all_frames};
      if (cs.js[0]) chrome.scripting.executeScript({
        files: cs.js,
        injectImmediately: cs.run_at === 'document_start',
        world: cs.world, // requires Chrome 111+
        target,
      });
    }
  }
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL || details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    // Set default settings on installation
    chrome.storage.sync.set({ chromeAssistsettings: defaultSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting default settings:", chrome.runtime.lastError);
      } else {
        console.log("Default settings have been initialized.");
      }
    });

    // Create context menu items for each command
    chrome.contextMenus.create({
      id: "trigger-summarize",
      title: "Summarize Selection",
      contexts: ["selection"], // Visible when text is selected
      documentUrlPatterns: ["*://*/*"] // Apply to all URLs
    });

    chrome.contextMenus.create({
      id: "trigger-translate",
      title: "Transliterate Selection",
      contexts: ["selection"], // Visible when text is selected
      documentUrlPatterns: ["*://*/*"] // Apply to all URLs
    });

    const languages = defaultSettings.translate.languageMapping;

    // Create sub-menu items for each language
    for (const [code, language] of Object.entries(languages)) {
      if (code === "en") continue; // Skip English as it's the default language
      chrome.contextMenus.create({
        id: `trigger-translate-${code}`,
        title: `to ${language}`,
        parentId: "trigger-translate", // Make this a sub-menu of "Translate Selection"
        contexts: ["selection"], // Visible when text is selected
        documentUrlPatterns: ["*://*/*"], // Apply to all URLs
      });
    }

    chrome.contextMenus.create({
      id: "trigger-rewrite",
      title: "Rewrite Selection",
      contexts: ["selection"] // Visible when text is selected
    });

    chrome.contextMenus.create({
      id: "trigger-write",
      title: "Write Assistance",
      contexts: ["editable"] // Visible in editable fields
    });

    chrome.contextMenus.create({
      id: "open-sidepanel",
      title: "Open Side Panel",
    });

    console.log("Context menus with suggested keys created.");
  }
  else {
    console.log("chromeAssistsettings and Context menus already initialized.");
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

async function getEmbedding(text) {
  const embedder = await EmbeddingPipeline.getInstance();
  console.log("Embedding pipeline loaded successfully.");

  const roundDecimalsDown = (num) => parseFloat(num.toFixed(3));

  // Generate embeddings for text
  let textEmbedding = embedder(text, { pooling: 'mean', normalize: true }).then((res) => res.data.map(roundDecimalsDown));

  // Convert Float32Arrays to regular arrays
  textEmbedding = convertFloat32ArraysToArrays([await textEmbedding]);

  return textEmbedding;
}

async function embed(text, id) {
  const textEmbedding = await getEmbedding(text);
  await saveEmbedding({ 
    id: id,
    embedding: textEmbedding[0] 
  });
}
// Handle the menu item and command
async function handleMenuAndCommand(command, text) {
  if (command === "trigger-write") {
    return;
  }

  // Notify loading state after 2 seconds
  setTimeout(() => {
    chrome.runtime.sendMessage({ command: "loading-output" });
  }, 100);

  let outputData = null;

  try {
    if (command === "trigger-summarize") {
      const result = await promptSummarizeModel(text, false);
      outputData = {
        id: uuidv4(),
        input: text,
        text: result,
        timestamp: new Date().toISOString(),
        type: 'Summary',
      };
    } 
    else if (command.startsWith("trigger-translate")) {
      const languageCode = command.split("-")[2];
      console.log(`Translating to language code: ${languageCode}`);
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { command: "translate-in-context-script", text, targetLanguage: languageCode }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      });
      outputData = {
        id: uuidv4(),
        input: text,
        text: response,
        timestamp: new Date().toISOString(),
        type: 'Translation',
      };
    }
    else if (command === "trigger-rewrite") {
      const result = await handleRewrite(text);
      outputData = {
        id: uuidv4(),
        input: text,
        text: result,
        timestamp: new Date().toISOString(),
        type: 'Composition',
      };
    }

    if (outputData) {
      // Save the output and embedding if we have generated data
      await saveOutput(outputData);
      await embed(outputData.text, outputData.id);
    }
  } catch (error) {
    console.error("Error handling command:", error);
  } finally {
    // Ensure "output-ready" is always sent after all operations
    console.log("Sending output-ready message");
    setTimeout(() => {
      chrome.runtime.sendMessage({ command: "output-ready" });
    }, 100);
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log(`Context menu item clicked: ${info.menuItemId}`);

  try {
      chrome.tabs.query({ active: true, currentWindow: true }, async function () {
        chrome.sidePanel.setOptions({
          path: 'index.html',
          enabled: true
        });
        await chrome.sidePanel.open({
          tabId: tab.id
        });
      });
  
      console.log("Side panel configured.");
  } catch (error) {
      console.error("Failed to configure side panel:", error);
  }
  
  if (!tab) {
    console.error("No active tab found.");
    return;
  }

  const command = info.menuItemId;

  if(command === "open-sidepanel") {
    return;
  }

  let text = "";
  let html = "";

  // Retrieve selected text if applicable
  if (info.selectionText) {
    text = info.selectionText;
  } else if (command !== "write") {
    // For non-write commands, fall back to page content if no selection
    const pageText = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const html = document.documentElement.outerHTML; // Full HTML content
        const textContent = document.body.innerText;   // Inner text of the body
        return { html, textContent }; // Return both HTML and text
      },
    });
    text = pageText[0]?.result?.textContent || "";
    html = pageText[0]?.result?.html || "";
    console.log(html);
    console.log(typeof html);
  }

  await handleMenuAndCommand(command, text);
  
  console.log(`Command ${command} executed!`);
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Shortcut triggered for command: ${command}`);

  let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
      chrome.tabs.query({ active: true, currentWindow: true }, async function () {
        chrome.sidePanel.setOptions({
          path: 'index.html',
          enabled: true
        });
        await chrome.sidePanel.open({
          tabId: activeTab.id
        });
      });
  
      console.log("Side panel configured.");
  } catch (error) {
      console.error("Failed to configure side panel:", error);
  }

  // Check if the active tab is a chrome:// page
  if (activeTab.url.startsWith("chrome://")) {
      console.warn("Active tab is a chrome:// URL, aborting operation.");
      chrome.runtime.sendMessage({ command, text: "", tabId: activeTab.id });
      return; // Early exit if it's a restricted page
  }

  const selectedText = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => window.getSelection().toString(),
  });
  
  let text = selectedText[0]?.result || "";
  let html = "";

  // If no text is selected, select the entire page's main text content
  if (!text) {
      const pageText = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
        const html = document.documentElement.outerHTML; // Full HTML content
        const textContent = document.body.innerText;   // Inner text of the body
        return { html, textContent }; // Return both HTML and text
      },
      });
      text = pageText[0]?.result?.textContent || "";
      html = pageText[0]?.result?.html || "";
      console.log(html);
      console.log(typeof html);
  }

  console.log(`Selected text! Length: ${text.length}`);

  await handleMenuAndCommand(command, text);

  console.log(`Command ${command} executed`);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handling only write, rewrite, delete, search and other get functions
  (async () => {
    try{
      if (message.command === "write") {
        const result = await handleWrite(message.text, message.tone, message.length);
        const outputData = {
          id: uuidv4(),
          input: message.text,
          text: result,
          timestamp: new Date().toISOString(),
          type: 'Composition'
        };
        await saveOutput(outputData);
        await embed(outputData.text, outputData.id);
        sendResponse(outputData);
      } else if (message.command === "rewrite") {
        const result = await handleRewrite(message.text);
        const outputData = {
          id: message.id || uuidv4(),
          input: message.text,
          text: result,
          timestamp: new Date().toISOString(),
          type: message.type || 'Composition'
        };
        await saveOutput(outputData);
        await embed(outputData.text, outputData.id);
        sendResponse(outputData);
      } else if (message.command === "delete-output") {
        await deleteOutput(message.id);
        sendResponse({ success: true });
      } else if (message.command === "delete-bookmark") {
        await deleteBookmark(message.id);
        sendResponse({ success: true });
      } else if (message.command === "enhance-query") {
        const searchQuery = message.text;
        const enhancedQueries = await enhanceSearchQueries(searchQuery);
        const outputData = {
          id: uuidv4(),
          input: searchQuery,
          text: enhancedQueries,
          timestamp: new Date().toISOString(),
          type: 'Search'
        };
        await saveOutput(outputData);
        await embed(outputData.text, outputData.id);
        sendResponse(outputData);
      } else if (message.command === "get-settings") {
        const storedSettings = await loadSettings();
        const filteredSettings = Object.keys(storedSettings)
          .filter(key => key !== "detect" && key !== "translate")
          .reduce((obj, key) => {
            obj[key] = storedSettings[key];
            return obj;
          }, {});
        sendResponse(filteredSettings);
      } else if (message.command === "save-settings") {
        await saveSettings(message.settings);
        sendResponse({ success: true });
      } else if (message.command === "get-outputs") {
        const outputs = await fetchOutputs();
        sendResponse(outputs);
      } else if (message.command === "get-bookmarks") {
        const bookmarks = await fetchBookmarks();
        sendResponse(bookmarks);
      } else if (message.command === "bookmark") {
        // Retrieve the content of the bookmarked page
        try{
          let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          let bookmarks = await fetchBookmarks();
          let bookmarkedURLs = bookmarks.map(bookmark => bookmark.url);
          if (bookmarkedURLs.includes(activeTab.url)) {
            sendResponse({ response: "Bookmark already exists" });
            console.warn("Bookmark already exists for the URL.");
            return;
          }
  
          if (!activeTab) {
            console.warn("No active tab found for the bookmarked URL.");
            return;
          }
  
          const pageText = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              const html = document.documentElement.outerHTML; // Full HTML content
              const textContent = document.body.innerText;   // Inner text of the body
              return { html, textContent }; // Return both HTML and text
            },
          });
  
          let text = pageText[0]?.result?.textContent || "";
          let html = pageText[0]?.result?.html || "";
          const result = await promptSummarizeModel(text, true);
          const bookmarkData = {
            id: uuidv4(),
            url: activeTab.url,
            favicon: activeTab.favIconUrl,
            ...result,
          };
          const response = await saveBookmark(bookmarkData);
          await embed(result.tldr, bookmarkData.id);
          sendResponse(response);
        }
        catch(err){
          console.error("Error in bookmarking:", err);
          sendResponse({ error: err });
        }
      } else if (message.command === "search") {
        const query = message.query;
        const queryEmbedding = await getEmbedding(query);
        const storedEmbeddings = await fetchEmbeddings(message.ids);

        console.log(storedEmbeddings.length + " embeddings fetched from the database.");

        const messageIDsNotFound = message.ids.filter(id => !storedEmbeddings.map(embedding => embedding.id).includes(id)).map(id => (id));
        // Perform similarity search, sort the ids and return the sorted ids as an array
        let results = storedEmbeddings.map((embedding) => {
          return {
            id: embedding.id,
            score: cos_sim(queryEmbedding[0], embedding.embedding),
          };
        });
        results.sort((a, b) => b.score - a.score);
        // Extract the ids from the sorted results
        results = results.map(result => result.id);
        // Append the ids that were not found in the database
        results.push(...messageIDsNotFound.map(id => (id)));
        console.log("Results sorted by similarity score:", results);
        sendResponse(results);
      } else if (message.command === "summarize") {
        let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const text = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            const selection = window.getSelection();
            return selection.toString();
          }
        });
        const result = await promptSummarizeModel(text, false);
        const outputData = {
          id: uuidv4(),
          input: text,
          text: result,
          timestamp: new Date().toISOString(),
          type: 'Summary'
        };
        await saveOutput(outputData);
        await embed(outputData.text, outputData.id);
        sendResponse(outputData);
      } else if (message.command === "translate") {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: "translate-in-context-script", text: message.text, targetLanguage: message.targetLanguage }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        const outputData = {
          id: uuidv4(),
          input: message.text,
          text: response,
          timestamp: new Date().toISOString(),
          type: 'Translation'
        };
        await saveOutput(outputData);
        await embed(outputData.text, outputData.id);
        sendResponse(outputData);
      } else if (message.command === "assist") {
        const input = message.input;
        const response = await parseCommand(input);
        sendResponse(response);
      }
    }
    catch(err){
      console.error("Error in message handling:", err);
      sendResponse({ error: err });
    }
  })();
  return true;
});