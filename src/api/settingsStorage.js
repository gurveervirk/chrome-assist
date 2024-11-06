// src/api/settingsStorage.js

/* global chrome */

const isChromeExtension = typeof chrome !== "undefined" && chrome.storage;

const SETTINGS_KEY = "chromeAssistSettings";

export const loadSettings = async () => {
  if (!isChromeExtension) {
    return Promise.reject(new Error("Chrome storage API is not available"));
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(items.chromeAssistsettings || {});
      }
    });
  });
};

export const saveSettings = async (settings) => {
  if (!isChromeExtension) {
    return Promise.reject(new Error("Chrome storage API is not available"));
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({chromeAssistsettings: settings}, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving settings: ", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log("Settings saved: ", settings);
        resolve();
      }
    });
  });
};