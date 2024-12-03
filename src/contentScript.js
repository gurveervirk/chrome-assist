/* global chrome */
import { handleTranslation } from "./api/AI_functions/translateHandler";

console.log("Content script loaded");
// Listen for messages from the background script and trigger custom events accordingly
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content script:", message);
    (async () => {
        try{
            if (message.command === "translate-in-context-script") {
                const { text, targetLanguage } = message;
                const translationResult = await handleTranslation(text, targetLanguage);
                console.log("Translation result:", translationResult);
                sendResponse(translationResult);
            }
        }
        catch(err){
          console.error("Error in message handling:", err);
          sendResponse({ error: err });
        }
      })();
      return true;
});