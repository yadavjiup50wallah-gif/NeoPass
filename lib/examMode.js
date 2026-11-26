// lib/examMode.js

/**
 * Switches to a specific tab ID.
 */
export function switchToTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, { active: true }, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(tab);
      }
    });
  });
}

/**
 * Queries for tabs by URL pattern or title.
 */
export function findTabs(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(tabs);
      }
    });
  });
}

/**
 * Injects a script into the active tab to extract text, bypassing CSS user-select: none.
 * It creates a temporary range, selects the text, and copies it to the clipboard.
 */
export function extractAndCopyText(tabId, selector = 'body') {
  return new Promise((resolve, reject) => {
    const injectionScript = {
      func: (selector) => {
        let target = document.querySelector(selector);
        if (!target) target = document.body;
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const success = document.execCommand('copy');
        selection.removeAllRanges();
        return { success, textLength: selection.toString().length };
      },
      args: [selector]
    };

    chrome.scripting.executeScript({
      target: { tabId },
      func: injectionScript.func,
      args: injectionScript.args
    }, (injectionResult) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(injectionResult[0].result);
      }
    });
  });
}

/**
 * Takes a screenshot of the current tab using chrome.tabs.captureVisibleTab.
 * Returns a data URL which can be displayed in the popup or downloaded.
 */
export function captureTabScreenshot(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 90 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(dataUrl);
      }
    });
  });
}
