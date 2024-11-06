// src/api/detectHandler.js

import { loadSettings } from "./settingsStorage";

let detector;

export const createDetector = async () => {
  if (!window.translation) {
    throw new Error("Translation API not available in this browser.");
  }

  const canDetect = await window.translation.canDetect();
  if (canDetect !== 'no') {
    detector = await window.translation.createDetector();
    if (canDetect === 'after-download') {
      // Listen for download progress events if the model needs to download first
      detector.addEventListener("downloadprogress", (e) => {
        console.log(`Download progress: ${e.loaded} / ${e.total}`);
      });
      await detector.ready;  // Wait until the model is ready after download
    }
  } else {
    throw new Error("Language detector is not supported");
  }
};

export const detectLanguage = async (prompt) => {
  if (!prompt) throw new Error("Prompt is required for language detection");

  if (!window.translation) {
    throw new Error("Detect API unavailable");
  }

  if (!detector) {
    await createDetector();
  }

  try {
    const detectedLanguage = await detector.detect(prompt.trim());

    const settings = await loadSettings();
    const languageName = settings.detect?.languageMapping[detectedLanguage] || "Unknown";

    return { detectedLanguage, languageName };
  } catch (error) {
    throw new Error(`Error detecting language: ${error.message}`);
  }
};
