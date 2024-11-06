// contentScript.js
function dispatchCustomEvent(eventName, detail) {
    console.log(`Dispatching custom event: ${eventName} with detail: ${detail}`);
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// Listen for messages from the background script and trigger custom events accordingly
chrome.runtime.onMessage.addListener((message) => {
    console.log(`Received message from background: ${JSON.stringify(message)}`);
    if (message.command && message.text) {
        dispatchCustomEvent(message.command, message.text);
    } else if (message.command) {
        dispatchCustomEvent(message.command);
    }
});
