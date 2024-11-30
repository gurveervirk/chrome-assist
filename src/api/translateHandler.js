/* global chrome */
// src/api/translateHandler.js

import { loadSettings } from "./settingsStorage"; // Import from settingsStorage.js
import { detectLanguage } from "./detectHandler";

let translator;

// Function to create a translator instance with language pair
const createTranslator = async (languagePair) => {
  if (!translation) {
    throw new Error("Translation API is not available in this browser.");
  }

  const canTranslate = await translation.canTranslate(languagePair);
  if (canTranslate === "no") {
    throw new Error(
      "Translation for the specified language pair is not supported."
    );
  }

  if (canTranslate === "readily") {
    translator = await translation.createTranslator(languagePair);
  } else {
    translator = await translation.createTranslator(languagePair);
    translator.addEventListener("downloadprogress", (e) => {
      console.log(`Download progress: ${e.loaded} / ${e.total}`);
    });
    await translator.ready;
  }
};

// Function to handle the translation logic
const promptModel = async (prompt, targetLanguage) => {
  if (!prompt) throw new Error("Prompt is required.");

  // Load settings
  const settings = await loadSettings();
  const languageMapping = settings.translate;

  // Detect source language
  const sourceLanguage = (await detectLanguage(prompt)).detectedLanguage;
  if (sourceLanguage === targetLanguage) {
    return {
      sanitizedResponse: prompt,
    };
  }

  // Check if both source and target languages exist in languageMapping
  if (
    !languageMapping.hasOwnProperty(sourceLanguage) ||
    !languageMapping.hasOwnProperty(targetLanguage)
  ) {
    throw new Error("One or both languages are not supported.");
  }

  const isEnglishInvolved = sourceLanguage === "en" || targetLanguage === "en";

  try {
    let translationResult;

    if (isEnglishInvolved) {
      // If English is involved in the language pair, translate directly
      const languagePair = {
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
      };
      await createTranslator(languagePair);
      translationResult = await translator.translate(prompt, targetLanguage);
    } else {
      // Translate to English first, then to the target language

      let languagePair = {
        sourceLanguage: sourceLanguage,
        targetLanguage: "en",
      };
      await createTranslator(languagePair);

      const intermediateTranslation = await translator.translate(prompt, "en");

      languagePair = {
        sourceLanguage: "en",
        targetLanguage: targetLanguage,
      };
      await createTranslator(languagePair);

      translationResult = await translator.translate(
        intermediateTranslation,
        targetLanguage
      );
    }

    return {
      detectedSourceLanguage: sourceLanguage,
      sanitizedResponse: translationResult,
    };
  } catch (error) {
    throw new Error(`Translation error: ${error.message}`);
  }
};

// Main function to handle translation from page.js
export const handleTranslation = async (prompt, targetLanguage) => {
  try {
    const result = await promptModel(prompt, targetLanguage);
    return result;
  } catch (error) {
    console.error("Error:", error.message);
    throw error; // rethrow the error for further handling if needed
  }
};
