# Chrome-Assist

<div align="center">
  <img height="200" width="200" alt="gurveervirk/chrome-assist" src="https://github.com/gurveervirk/chrome-assist/blob/main/public/icons/android-chrome-512x512.png">
</div>

Chrome-Assist is a powerful, on-device Chrome extension powered by Gemini Nano that provides seamless text assistance capabilities. With a few keyboard shortcuts, users can summarize, translate, rewrite, and compose text directly within their Chrome browser.

## Features

- **Summarize Text**: Generate quick summaries in various formats, such as "tl;dr" or "key points."
- **Translate Text**: Instantly translate selected text into a wide range of supported languages.
- **Rewrite Text**: Adjust the tone or style of selected text for different contexts.
- **Compose Text**: Generate new content with formal, neutral, or casual tones in customizable lengths and formats.
- **Customizable Settings**: Tailor the output based on your preferences, such as length, tone, and format.
- **On-Device Processing**: All operations are performed locally on your device, ensuring data privacy and security.
- **Enhance Web Search Queries**: Improve search queries using Gemini Nano, providing better context-rich queries for wider discoverability and reach.
- **Summarize Bookmarks**: Summarize bookmarked articles for quick reference and recall, with the help of extracted keywords, relevant title and a summary.

## Availability
Chrome-Assist’s APIs are available behind an experimental flag from Chrome 129+ on desktop platforms and Android.

Make sure you are on Chrome version 129.0.6639.0 or above.
We recommend using [Chrome Canary](https://www.google.com/chrome/canary/) or [Chrome Dev channel](https://www.google.com/chrome/dev/?extra=devchannel) for the latest version.

## Getting Started

To install and run Chrome-Assist:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/gurveervirk/chrome-assist.git
   ```
2. **Install Dependencies**:
    ```bash
    npm install
    ```
3. **Build the Project**:
    ```bash
    npm run build
    ```
4. **Add the Extension to Chrome**:
    1. Open Chrome and navigate to chrome://extensions.
    2. Enable Developer mode (toggle in the top-right corner).
    3. Click Load unpacked and select the build folder from the project.
    4. Grant Necessary Permissions: Chrome-Assist requires permissions for storage, scripting, and active tabs to function effectively. 
        
        **For more details, refer to the [Permissions Documentation](https://docs.google.com/document/d/18otm-D9xhn_XyObbQrc1v7SI-7lBX3ynZkjEpiS1V04/edit?tab=t.0)**
## Usage
**Via Context Menu**:
1. Right-click on the selected text or page.
2. Choose the desired action from the context menu or open the sidepanel.
3. Done! The output will be displayed in the sidepanel.

**Via Keyboard Shortcuts** (Only available after opening the sidepanel):
- **Summarize**: `Alt + Shift + S`
- **Translate**: `Alt + Shift + A`
- **Rewrite**: `Alt + Shift + R`
- **Compose**: `Alt + Shift + W`
