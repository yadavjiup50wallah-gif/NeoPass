// lib/handshake.js
// Centralized bypass state and mock payloads for NeoPass

const IS_DEV = false;
function log(...args) {
  if (IS_DEV) console.log(...args);
}

// Default state
const DEFAULT_STATE = {
  isBypassActive: true,
  version: '1.0.0',
  lastUpdated: new Date().toISOString()
};

// In-memory cache (exported for other modules)
export let BYPASS_STATE = { ...DEFAULT_STATE };

// Initialize state from storage on first load
export function initBypassState() {
  return new Promise((resolve) => {
    chrome.storage.local.get('neopass_state', (result) => {
      if (result.neopass_state) {
        BYPASS_STATE = { ...DEFAULT_STATE, ...result.neopass_state };
      }
      log('[NeoPass] State initialized:', BYPASS_STATE);
      resolve(BYPASS_STATE);
    });
  });
}

// Persist state to storage
function saveBypassState() {
  chrome.storage.local.set({ neopass_state: BYPASS_STATE });
}

// Jittered mock data generators
function generateJitteredLicense() {
  return {
    status: "active",
    tier: "enterprise",
    license_key: `NEO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    features: {
      advanced_analytics: true,
      priority_support: true,
      custom_domains: true,
      api_access: true
    },
    user_id: `user_${Math.random().toString(36).substring(2,8)}`,
    org_id: `org_${Math.random().toString(36).substring(2,8)}`,
    is_trial: false,
    grace_period_active: false
  };
}

function generateJitteredFeatures() {
  return {
    version: "1.0.0",
    flags: {
      enable_ai_assistant: true,
      enable_realtime_collaboration: true,
      enable_advanced_debugging: true,
      enable_custom_themes: true,
      enable_api_access: true,
      enable_export: true,
      enable_dark_mode: true
    },
    config: {
      max_projects: 1000,
      max_members: 100,
      storage_limit_mb: 10240,
      rate_limit_rps: 1000
    }
  };
}

// Tab command handler
export function handleTabCommand(message, sender, sendResponse) {
  const { action, tabId, url, active } = message;
  switch (action) {
    case 'SWITCH_TAB':
      if (tabId) {
        chrome.tabs.update(tabId, { active: true }, (tab) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, data: tab });
          }
        });
        return true;
      }
      break;
    case 'CREATE_TAB':
      chrome.tabs.create({ url: url || 'chrome://newtab', active: true }, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, data: tab });
        }
      });
      return true;
    case 'CLOSE_TAB':
      if (tabId) {
        chrome.tabs.remove(tabId, () => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
        return true;
      }
      break;
    case 'GET_CURRENT_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ success: true, data: tabs[0] || null });
      });
      return true;
    default:
      sendResponse({ success: false, error: 'Unknown tab action' });
      return true;
  }
}

// Patched message handler
export function patchedHandleMessage(message, sender, sendResponse) {
  // Ensure state is initialized
  initBypassState().then((state) => {
    // 1. Control messages
    if (message.type === 'NEOPASS_GET_STATE') {
      sendResponse({ success: true, data: state });
      return;
    }
    if (message.type === 'NEOPASS_TOGGLE') {
      BYPASS_STATE.isBypassActive = !state.isBypassActive;
      BYPASS_STATE.lastUpdated = new Date().toISOString();
      saveBypassState();
      log(`[NeoPass] Bypass toggled to: ${BYPASS_STATE.isBypassActive}`);
      sendResponse({ success: true, data: BYPASS_STATE });
      return;
    }

    // 2. If bypass inactive, pass through
    if (!BYPASS_STATE.isBypassActive) {
      sendResponse({ success: true, data: message.data || null, bypassed: false });
      return;
    }

    // 3. License checks
    if (['VALIDATE_LICENSE','CHECK_LICENSE','GET_ENTITLEMENTS','check_license','validate_subscription','validateLicense','checkLicense','getEntitlements'].includes(message.type) ||
        (message.action && ['validateLicense','checkLicense','getEntitlements'].includes(message.action))) {
      log('[NeoPass] Intercepted license check. Returning jittered mock.');
      sendResponse({ success: true, data: generateJitteredLicense(), bypassed: true });
      return;
    }

    // 4. Feature flag requests
    if (['GET_FEATURE_FLAGS','GET_CONFIG','get_feature_flags','getConfig','getFeatureFlags','getConfig'].includes(message.type) ||
        (message.action && ['getFeatureFlags','getConfig'].includes(message.action))) {
      log('[NeoPass] Intercepted feature flag request. Returning jittered mock.');
      sendResponse({ success: true, data: generateJitteredFeatures(), bypassed: true });
      return;
    }

    // 5. Telemetry
    if (['TELEMETRY','SEND_TELEMETRY','send_telemetry','trackEvent','telemetry','track'].includes(message.type) ||
        (message.action && ['telemetry','track'].includes(message.action))) {
      log('[NeoPass] Dropped telemetry payload.');
      sendResponse({ success: true, data: { dropped: true }, bypassed: true });
      return;
    }

    // 6. Default pass-through
    sendResponse({ success: true, data: message.data || null, bypassed: false });
  });
  return true;
}
