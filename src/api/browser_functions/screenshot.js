/* global chrome */
export async function captureAndSaveScreenshot() {
    try {
      console.log('Starting screenshot capture...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      const screenshot = await chrome.tabs.captureVisibleTab(null, {
        format: 'png'
      });
      
      const res = await fetch(screenshot);
      const blob = await res.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      // Simple download with saveAs dialog
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const downloadOptions = {
        url: url,
        filename: `ScreenshotByChromeAssist - ${timestamp}.png`,
        saveAs: true
      };
      
      await chrome.downloads.download(downloadOptions);
      URL.revokeObjectURL(url);
  
      return true;
      
    } catch (error) {
      console.error('Detailed screenshot error:', error);
      throw error;
    }
}