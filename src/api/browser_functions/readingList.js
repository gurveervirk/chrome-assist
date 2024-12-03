/* global chrome */
export async function addToReadingList() {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id || !tab.url || !tab.title) {
        throw new Error('No valid active tab found');
      }
  
      // Add to reading list
      await chrome.readingList.addEntry({
        url: tab.url,
        title: tab.title,
        hasBeenRead: false
      });
      
      return 'Done!';
    } catch (error) {
      console.error('Error adding to reading list:', error);
      return error instanceof Error ? (error.message === "Duplicate URL." ? "Already added!" : error.message) : "Unknown error";
    }
}