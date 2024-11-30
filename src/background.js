/* global chrome */
import { promptSummarizeModel } from "./api/summarizeHandler";
import { handleTranslation } from "./api/translateHandler";
import { handleWrite } from "./api/writeHandler";
import { handleRewrite, enhanceSearchQueries } from "./api/rewriteHandler";
import { saveBookmark, deleteBookmark, saveOutput, deleteOutput, fetchOutputs, fetchBookmarks } from "./utils/db";
import { loadSettings, saveSettings } from "./api/settingsStorage";
import { v4 as uuidv4 } from "uuid";
import { set } from "mongoose";

const defaultSettings = {
  prompt: {
      available: { temperature: [0, 1], topK: [1, 8] },
      temperature: 0.3,
      topK: 5,
  },
  summarize: {
      available: {
          type: ["tl;dr", "key-points", "teaser", "headline"],
          format: ["plain-text", "markdown"],
          length: ["short", "medium", "long"],
      },
      type: "tl;dr",
      format: "plain-text",
      length: "medium",
  },
  rewrite: {
      available: {
          tone: ["as-is", "more-formal", "more-casual"],
          format: ["as-is", "plain-text", "markdown"],
          length: ["as-is", "shorter", "longer"],
      },
      tone: "as-is",
      length: "as-is",
      format: "as-is",
      context: "I am.",
  },
  write: {
      available: {
          tone: ["formal", "neutral", "casual"],
          format: ["plain-text", "markdown"],
          length: ["short", "medium", "long"],
      },
      tone: "formal",
      length: "medium",
      format: "plain-text",
      context: "I am.",
  },
  detect: {
      languageMapping: {
          af: "Afrikaans",
          am: "Amharic",
          ar: "Arabic",
          "ar-Latn": "Arabic (Latin)",
          az: "Azerbaijani",
          be: "Belarusian",
          bg: "Bulgarian",
          "bg-Latn": "Bulgarian (Latin)",
          bn: "Bengali",
          bs: "Bosnian",
          ca: "Catalan",
          ceb: "Cebuano",
          co: "Corsican",
          cs: "Czech",
          cy: "Welsh",
          da: "Danish",
          de: "German",
          el: "Greek",
          "el-Latn": "Greek (Latin)",
          en: "English",
          eo: "Esperanto",
          es: "Spanish",
          et: "Estonian",
          eu: "Basque",
          fa: "Persian",
          fi: "Finnish",
          fil: "Filipino",
          fr: "French",
          fy: "Frisian",
          ga: "Irish",
          gd: "Scottish Gaelic",
          gl: "Galician",
          gu: "Gujarati",
          ha: "Hausa",
          haw: "Hawaiian",
          hi: "Hindi",
          "hi-Latn": "Hindi (Latin)",
          hmn: "Hmong",
          hr: "Croatian",
          ht: "Haitian Creole",
          hu: "Hungarian",
          hy: "Armenian",
          id: "Indonesian",
          ig: "Igbo",
          is: "Icelandic",
          it: "Italian",
          iw: "Hebrew",
          ja: "Japanese",
          "ja-Latn": "Japanese (Latin)",
          jv: "Javanese",
          ka: "Georgian",
          kk: "Kazakh",
          km: "Khmer",
          kn: "Kannada",
          ko: "Korean",
          ku: "Kurdish",
          ky: "Kyrgyz",
          la: "Latin",
          lb: "Luxembourgish",
          lo: "Lao",
          lt: "Lithuanian",
          lv: "Latvian",
          mg: "Malagasy",
          mi: "Maori",
          mk: "Macedonian",
          ml: "Malayalam",
          mn: "Mongolian",
          mr: "Marathi",
          ms: "Malay",
          mt: "Maltese",
          my: "Burmese",
          ne: "Nepali",
          nl: "Dutch",
          no: "Norwegian",
          ny: "Chichewa",
          pa: "Punjabi",
          pl: "Polish",
          ps: "Pashto",
          pt: "Portuguese",
          ro: "Romanian",
          ru: "Russian",
          "ru-Latn": "Russian (Latin)",
          sd: "Sindhi",
          si: "Sinhala",
          sk: "Slovak",
          sl: "Slovenian",
          sm: "Samoan",
          sn: "Shona",
          so: "Somali",
          sq: "Albanian",
          sr: "Serbian",
          st: "Sesotho",
          su: "Sundanese",
          sv: "Swedish",
          sw: "Swahili",
          ta: "Tamil",
          te: "Telugu",
          tg: "Tajik",
          th: "Thai",
          tr: "Turkish",
          uk: "Ukrainian",
          ur: "Urdu",
          uz: "Uzbek",
          vi: "Vietnamese",
          xh: "Xhosa",
          yi: "Yiddish",
          yo: "Yoruba",
          zh: "Chinese",
          "zh-Latn": "Chinese (Latin)",
          zu: "Zulu",
      },
  },
  translate: {
      languageMapping: {
          en: "English",
          es: "Spanish",
          fr: "French",
          de: "German",
          ar: "Arabic",
          bn: "Bengali",
          hi: "Hindi",
          it: "Italian",
          ja: "Japanese",
          ko: "Korean",
          nl: "Dutch",
          pl: "Polish",
          pt: "Portuguese",
          ru: "Russian",
          th: "Thai",
          tr: "Turkish",
          vi: "Vietnamese",
          zh: "Chinese (Simplified)",
          "zh-Hant": "Chinese (Traditional)",
      },
      selectedLanguage: "en",
  },
  bookmark: {
      available: {
          type: ["tl;dr", "key-points", "teaser", "headline"],
          format: ["plain-text", "markdown"],
          length: ["short", "medium", "long"],
          numKeywords: [1, 50],
      },
      type: "tl;dr",
      format: "plain-text",
      length: "long",
      titlePrompt:"Generate a clear, concise title capturing the text's core theme, tone, and purpose, appealing to the intended audience. Return only the title." ,
      keywordsPrompt: "Identify numKeywords relevant keywords that capture the text's main topics, themes, and concepts, enhancing discoverability and search relevance. Return only the keywords as an unordered list in HTML.",
      numKeywords: 25,
  },
  search: {
    available: {
      numQueries: [1, 10],
    },
    prompt: "You are an advanced AI model designed to generate enhanced web search queries from user input.\nYour task is to understand the user's input prompt and craft numQueries sleek, concise web search queries to help the user find better results.\n\nKey Guidelines:\n- Focus only on relevant keywords that contribute directly to finding useful results.\n- Omit unnecessary or 'extra' words that add no value to the search process.\n- These queries should be phrases, not full sentences or questions.\n- Ensure the queries are highly specific, well-targeted, and optimized for web search engines.\nReturn the final numQueries web search queries as an unordered list.",
    numQueries: 5,
  }
};

chrome.runtime.onInstalled.addListener((details) => {
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
      title: "Translate Selection",
      contexts: ["selection"], // Visible when text is selected
      documentUrlPatterns: ["*://*/*"] // Apply to all URLs
    });

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
    else if (command === "trigger-translate") {
      const result = await handleTranslation(text, "en");
      outputData = {
        id: uuidv4(),
        input: text,
        text: result,
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
      // Save the output if we have generated data
      await saveOutput(outputData);
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
        sendResponse(outputData);
      } else if (message.command === "get-settings") {
        const storedSettings = await loadSettings();
        const filteredSettings = Object.keys(storedSettings)
          .filter(key => key !== "detect")
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
          sendResponse(response);
        }
        catch(err){
          console.error("Error in bookmarking:", err);
          sendResponse({ error: err });
        }
      }
    }
    catch(err){
      console.error("Error in message handling:", err);
      sendResponse({ error: err });
    }
  })();
  return true;
});