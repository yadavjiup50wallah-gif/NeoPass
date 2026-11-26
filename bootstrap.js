// bootstrap.js

// 1. Import handshake.js FIRST to ensure its listener is registered first
import { patchedHandleMessage, handleTabCommand, initBypassState, BYPASS_STATE } from './lib/handshake.js';

// Initialize persistent state
initBypassState();

// Keep-alive alarm to prevent service worker shutdown
chrome.alarms.create('neopass-keepalive', { periodInMinutes: 0.4 }); // Every 24 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'neopass-keepalive') {
    console.log('[NeoPass] Keep-alive ping. State:', BYPASS_STATE.isBypassActive);
  }
});

// 2. Register the bypass listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Route tab commands
  if (message.type === 'TAB_COMMAND') {
    return handleTabCommand(message, sender, sendResponse);
  }
  // Only intercept if the message is from a Neocolab context or is a known Neocolab message type
  // This prevents breaking other extension functionality
  const isNeocolabMessage = message.type && (
    message.type.includes('LICENSE') ||
    message.type.includes('FEATURE') ||
    message.type.includes('TELEMETRY') ||
    message.type.includes('CONFIG') ||
    message.type.includes('SUBSCRIPTION') ||
    message.type === 'NEOPASS_GET_STATE' ||
    message.type === 'NEOPASS_TOGGLE'
  );

  if (isNeocolabMessage) {
    console.log('[NeoPass] Intercepting Neocolab message:', message.type);
    // Use the patched handler
    return patchedHandleMessage(message, sender, sendResponse);
  }

  // For non-Neocolab messages, pass through (do not call sendResponse, let other listeners handle it)
  // Since we didn't return true, Chrome will wait for other listeners.
  // If no other listener handles it, the sender will get no response.
  // To be safe, we can return a default response for unknown messages.
  sendResponse({ success: true, data: message.data || null, bypassed: false });
  return true;
});

// 3. Import the frozen worker.js SECOND
// This ensures its listeners are registered after ours.
// Its handleMessage will still run, but its sendResponse will be ignored for Neocolab messages.
import './worker.js';

// 4. Log status
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[NeoPass] Bootstrap loaded. Bypass is ACTIVE. Original worker.js logic preserved.`);
});
