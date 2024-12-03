/* global chrome */
import { promptModelBase } from "../AI_functions/promptHandler";

const systemPrompt = `
You are a helpful assistant that finds relevant browser tabs based on user queries.
You will be provided with a list of open tabs. Each tab includes:
1. Tab ID
2. Title
3. URL

Your task is to identify tabs that are most relevant to the user's query.

Output format:
- If matching tabs are found, return the results formatted as:
  <div class="matches">
    <div class="match"><a href="#" data-tab-id="[TAB_ID]">[Title]</a></div>
    ...
  </div>

- If no tabs match the query, respond with:
  NULL

Notes:
- Use the exact Tab ID provided in the input for the data-tab-id attribute.
- The href should always be "#" since navigation will be handled using the tab ID.
- Be concise, accurate, and use only the specified formats.
`;

async function getAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs);
    });
  });
}

export async function searchTabs(query) {
  try {
    // Get all open tabs
    const tabs = await getAllTabs();

    // Prepare the list of tabs for the AI model
    const tabList = tabs
      .map(
        (t) =>
          `Tab ID: ${t.id}\nTitle: ${t.title || "Untitled"}\nURL: ${
            t.url || "No URL"
          }`
      )
      .join("\n\n");

    // Prepare the prompt for the AI model
    const prompt = `
Here are all the open tabs:

${tabList}

User Query: "${query}"

Please identify the most relevant tabs and format the results as specified.
`;

    // Use promptHandler to get the AI response
    const response = await promptModelBase(systemPrompt, prompt);

    // Validate the response
    if (response.trim() === "NULL") {
      console.warn("No matching tabs found for query:", query);
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error in AI tab search:", error);
    throw error;
  }
}
