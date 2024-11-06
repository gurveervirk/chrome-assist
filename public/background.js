const defaultSettings = {
  prompt: {
      available: { temperature: [0, 1], topK: [1, 100] },
      temperature: 0.7,
      topK: 40,
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
  write: {
      available: {
          tone: ["formal", "neutral", "casual"],
          format: ["plain-text", "markdown"],
          length: ["short", "medium", "long"],
      },
      tone: "formal",
      length: "medium",
      format: "plain-text",
      context: "",
  },
  rewrite: {
      available: {
          tone: ["formal", "neutral", "casual"],
          format: ["plain-text", "markdown"],
          length: ["short", "medium", "long"],
      },
      tone: "formal",
      length: "medium",
      format: "plain-text",
      context: "",
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
  }
  else {
    console.log("chromeAssistsettings already initialized.");
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Shortcut triggered for command: ${command}`);

  await chrome.action.openPopup();
  console.log("Popup opened!");

  let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check if the active tab is a chrome:// page
  if (activeTab.url.startsWith("chrome://")) {
      console.warn("Active tab is a chrome:// URL, aborting operation.");
      return; // Early exit if it's a restricted page
  }

  const selectedText = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => window.getSelection().toString(),
  });
  
  const text = selectedText[0]?.result || "";
  console.log(`Selected text!`);

  chrome.tabs.sendMessage(activeTab.id, { command, text });
  chrome.runtime.sendMessage({ command, text });
});
