/* global chrome */
import { promptModelBase } from "../AI_functions/promptHandler";

// Bookmark search system prompt
const systemPrompt = `
You are a helpful assistant that finds and presents relevant bookmarks based on user queries.
You will be provided with:
1. A list of bookmarks, each containing a title and a URL.
2. A specific user query.

Your task is to identify bookmarks that are most relevant to the user query.

Output format:
- If matching bookmarks are found, return the results formatted as:
  <div class="matches">
    <div class="match"><a href="[URL]">[Title]</a></div>
    <div class="match"><a href="[URL]">[Title]</a></div>
    ...
  </div>

- If no bookmarks match the query, respond with:
  NULL

Be concise, accurate, and only use the specified output formats.
`;

// Retrieve all bookmarks
export async function getAllBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      resolve(bookmarkTreeNodes);
    });
  });
}

// Flatten bookmark tree into a list of bookmarks with URLs
export function flattenBookmarks(nodes) {
  let bookmarks = [];

  for (const node of nodes) {
    if (node.url) {
      bookmarks.push(node);
    }
    if (node.children) {
      bookmarks = bookmarks.concat(flattenBookmarks(node.children));
    }
  }

  return bookmarks;
}

// Search bookmarks with AI
export async function searchBookmarks(query) {
  try {
    // Retrieve all bookmarks and flatten the tree
    const bookmarkTree = await getAllBookmarks();
    const flatBookmarks = flattenBookmarks(bookmarkTree);

    // Create the bookmark list for the AI model
    const bookmarkList = flatBookmarks
      .map((b) => `Title: ${b.title}\nURL: ${b.url}`)
      .join("\n\n");

    // Prepare the prompt for the model
    const prompt = `
    Listed below are all the bookmarks:

    ${bookmarkList}

    User Query: ${query}

    Please identify the bookmarks that are most relevant to the user query and return the results in the specified format.
    `;

    // Pass the prompt to the model
    const response = await promptModelBase(systemPrompt, prompt);

    return response;
  } catch (error) {
    console.error("Error in AI bookmark search:", error);
    throw new Error("Unable to search bookmarks. Please try again.");
  }
}
