/* global chrome */
import { promptModelBase } from "../AI_functions/promptHandler";

const systemPrompt = `
You are a browser history assistant. Your tasks include:
1. Searching browser history based on user queries.
2. Returning the most relevant results from a list of browser history items.

For searching history:
- You will receive a numbered list of history titles and a user query.
- Find up to 3 most relevant matches based on:
  - Direct word matches (e.g., "hackathon" matches "Hackathon 2024")
  - Related terms (e.g., "coding" matches "programming")
  - Partial matches (e.g., "git" matches "GitHub")
  - Common variations (e.g., "ai" matches "artificial intelligence").

Response format:
- If matches are found:
  <div class="matches">
    <div class="match"><a href="[URL]">[Title]</a></div>
    <div class="match"><a href="[URL]">[Title]</a></div>
  </div>
- If no matches are found, respond with:
  NULL
`;

export const searchHistory = async (query) => {
  try {
    const historyItems = await getRecentHistory();

    // Create a map for quick access
    const historyMap = new Map(
      historyItems.map((item, index) => [index + 1, item])
    );

    // Prepare the history list for the model
    const historyList = historyItems
      .map((item, index) => `${index + 1}. ${item.title || "Untitled"}`)
      .join("\n");

    const prompt = `Find relevant items matching: "${query}"\nList:\n${historyList}`;

    // Get the model's response
    const response = await promptModelBase(systemPrompt, prompt);

    // Parse the response to extract matches
    const matches = response.match(/<div class="match">(\d+)<\/div>/g);
    if (matches) {
      const formattedMatches = matches
        .map((match) => {
          const number = match.match(/\d+/)?.[0];
          if (number) {
            const item = historyMap.get(parseInt(number));
            if (item) {
              return `<div class="match"><a href="${item.url}">${
                item.title || "Untitled"
              }</a></div>`;
            }
          }
          return "";
        })
        .filter(Boolean);

      return `<div class="matches">${formattedMatches.join("\n")}</div>`;
    }

    return "NULL";
  } catch (error) {
    console.error("Error searching history:", error);
    return "Error searching history. Please try again.";
  }
};

// Function to fetch recent history
const getRecentHistory = async () => {
  return new Promise((resolve, reject) => {
    chrome.history.search(
      { text: "", startTime: 0, maxResults: 100 },
      (results) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(results);
      }
    );
  });
};

// Function to clear the last 24 hours of history
export const clearLast24HoursHistory = async () => {
  try {
    const now = Date.now();
    const startTime = now - 24 * 60 * 60 * 1000; // 24 hours ago

    return new Promise((resolve) => {
      chrome.history.deleteRange({ startTime, endTime: now }, () => {
        if (chrome.runtime.lastError) {
          resolve(
            `Error clearing history: ${chrome.runtime.lastError.message}`
          );
        } else {
          resolve("Successfully cleared last 24 hours of history.");
        }
      });
    });
  } catch (error) {
    console.error("Error clearing last 24 hours of history:", error);
    return "Error clearing history. Please try again.";
  }
};

// Function to clear all history
export const clearAllHistory = async () => {
  try {
    return new Promise((resolve) => {
      chrome.history.deleteAll(() => {
        if (chrome.runtime.lastError) {
          resolve(
            `Error clearing history: ${chrome.runtime.lastError.message}`
          );
        } else {
          resolve("Successfully cleared all browsing history.");
        }
      });
    });
  } catch (error) {
    console.error("Error clearing all history:", error);
    return "Error clearing history. Please try again.";
  }
};
