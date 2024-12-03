// @ts-nocheck
// src/api/translateHandler.js

export const promptTranslationAPI = async (prompt, targetLanguage) => {
  if (!prompt) throw new Error("Prompt is required.");
  if (!('translation' in self)) {
    throw new Error("Translation API is not available.");
  }
  if (!(self.translation.createTranslator)) {
    throw new Error("Translator Creation is not available.");
  }
  try {

    console.log("Translation: ", translation);
    const translator = await translation.createTranslator({
      sourceLanguage: "en",
      targetLanguage: targetLanguage
    });

    console.log("Translator created:", translator);

    const translationResult = await translator.translate(prompt);

    return translationResult;
  } catch (error) {
    throw new Error(`Translation error: ${error.message}`);
  }
};

export const handleTranslation = async (prompt, targetLanguage) => {
  try {
    const result = await promptTranslationAPI(prompt, targetLanguage);
    return result;
  } catch (error) {
    console.error("Error:", error.message);
    throw error; // rethrow the error for further handling if needed
  }
};
