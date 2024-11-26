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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log(`Context menu item clicked: ${info.menuItemId}`);

  try {
      chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const tabId = tab.id;
        chrome.sidePanel.setOptions({
          tabId,
          path: 'index.html?tabId=' + tabId,
          enabled: true
        });
        await chrome.sidePanel.open({
          tabId: tabId
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

  setTimeout(() => {
    chrome.runtime.sendMessage({ command, text, html, tabId: tab.id });
  }, 2000);
  
  console.log(`Command ${command} executed!`);
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Shortcut triggered for command: ${command}`);

  let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
      chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const tabId = activeTab.id;
        chrome.sidePanel.setOptions({
          tabId,
          path: 'index.html?tabId=' + tabId,
          enabled: true
        });
        await chrome.sidePanel.open({
          tabId: tabId
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

  chrome.runtime.sendMessage({ command, text, html, tabId: activeTab.id });
});

// Listen for new bookmarks
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  console.log(`New bookmark created: ${bookmark.title} (${bookmark.url})`);

  // Retrieve the content of the bookmarked page
  let [activeTab] = await chrome.tabs.query({ url: bookmark.url });

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

  console.log("HTML content for summarization:", html, "Type:", typeof html);

  console.log("Retrieved page content for summarization.");

  // Retrieve the favicon URL
  const faviconURL = activeTab.favIconUrl || "";

  // Send the content for summarization
  const message = {
    command: "summarize-bookmark",
    text,
    html,
    bookmarkId: id,
    bookmarkURL: bookmark.url,
    faviconURL,
    tabId: activeTab.id,
  };

  chrome.runtime.sendMessage(message);
});

// Listen for deleted bookmarks
chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log(`Bookmark removed: ${id}`);

  // Send a command to delete the bookmark
  chrome.runtime.sendMessage({ command: "delete-bookmark", bookmarkId: id});
});
