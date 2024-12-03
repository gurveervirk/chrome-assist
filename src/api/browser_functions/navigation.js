/* global chrome */
import { promptModelBase } from "../AI_functions/promptHandler";

const systemPrompt = `
You are a browser navigation assistant. Your job is to understand where the user wants to navigate and return ONLY a valid URL.

For internal Chrome pages, return URLs in this format:
- chrome://PAGENAME
  Examples: chrome://settings, chrome://history, chrome://bookmarks, chrome://downloads, chrome://extensions

For YouTube searches, return URLs in this format:
- https://www.youtube.com/results?search_query=SEARCH_TERMS_HERE
  Remember: YouTube searches will ALWAYS use "search_query". Return ONLY search_query links for YouTube searches.

For external websites:
- Include https:// in the URL.
- Add .com if no top-level domain (TLD) is specified.
- Provide only the clean URL with no additional content.

Invalid requests:
- If you cannot understand the navigation request or it's invalid, return exactly: NULL

Examples:
User: "open settings"
Assistant: chrome://settings

User: "search for cats on YouTube"
Assistant: https://www.youtube.com/results?search_query=cats

User: "take me to Facebook"
Assistant: https://facebook.com
`;

export const handleNavigation = async (userPrompt) => {
  try {
    // Use the promptHandler to get the AI's response
    const response = await promptModelBase(systemPrompt, userPrompt);

    const cleanResponse = response.trim();

    // Handle invalid responses
    if (cleanResponse === "NULL") {
      console.warn("Invalid navigation request. No action taken.");
      return false;
    }

    // Open the determined URL in a new browser tab
    await chrome.tabs.create({ url: cleanResponse });
    return true;
  } catch (error) {
    console.error("Navigation error:", error);
    return false;
  }
};
