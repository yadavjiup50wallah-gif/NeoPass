// content.js

// 1. Intercept Fetch API
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  console.log('[NeoPass Content] Fetch intercepted:', url);

  if (url.includes('neocolab.com/telemetry') || url.includes('neocolab.com/analytics')) {
    console.log('[NeoPass Content] Dropping telemetry fetch.');
    return Promise.resolve(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  if (url.includes('neocolab.com/api/') && (url.includes('license') || url.includes('entitlements'))) {
    console.log('[NeoPass Content] Spoofing license fetch.');
    const mockLicense = {
      status: "active",
      tier: "enterprise",
      license_key: "NEO-PASS-LOCAL-BYPASS",
      expires_at: "2099-12-31T23:59:59Z",
      features: {
        advanced_analytics: true,
        priority_support: true,
        custom_domains: true,
        api_access: true
      },
      user_id: "local_bypass_user",
      org_id: "local_bypass_org"
    };
    return Promise.resolve(new Response(JSON.stringify(mockLicense), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  return originalFetch.call(this, input, init);
};

// 2. Intercept XMLHttpRequest (XHR)
const OriginalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new OriginalXHR();
  const originalOpen = xhr.open;
  const originalSend = xhr.send;
  let method = '';
  let url = '';

  xhr.open = function(methodArg, urlArg, ...args) {
    method = methodArg;
    url = urlArg;
    console.log(`[NeoPass Content] XHR intercepted: ${method} ${url}`);
    return originalOpen.apply(xhr, [methodArg, urlArg, ...args]);
  };

  xhr.send = function(body) {
    if (url.includes('neocolab.com/telemetry') || url.includes('neocolab.com/analytics')) {
      console.log('[NeoPass Content] Dropping telemetry XHR.');
      xhr.status = 200;
      xhr.response = JSON.stringify({ success: true });
      xhr.readyState = 4;
      xhr.onreadystatechange?.();
      xhr.onload?.();
      return;
    }

    if (url.includes('neocolab.com/api/') && (url.includes('license') || url.includes('entitlements'))) {
      console.log('[NeoPass Content] Spoofing license XHR.');
      const mockLicense = {
        status: "active",
        tier: "enterprise",
        license_key: "NEO-PASS-LOCAL-BYPASS",
        expires_at: "2099-12-31T23:59:59Z",
        features: {
          advanced_analytics: true,
          priority_support: true,
          custom_domains: true,
          api_access: true
        },
        user_id: "local_bypass_user",
        org_id: "local_bypass_org"
      };
      xhr.status = 200;
      xhr.response = JSON.stringify(mockLicense);
      xhr.readyState = 4;
      xhr.onreadystatechange?.();
      xhr.onload?.();
      return;
    }
    return originalSend.apply(xhr, [body]);
  };

  return xhr;
};

// 3. Intercept WebSocket (if Neocolab uses real-time connections)
const OriginalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  console.log('[NeoPass Content] WebSocket intercepted:', url);
  if (url.includes('neocolab.com/telemetry') || url.includes('neocolab.com/analytics')) {
    console.log('[NeoPass Content] Closing telemetry WebSocket.');
    const ws = new OriginalWebSocket(url, protocols);
    ws.close();
    return ws;
  }
  return new OriginalWebSocket(url, protocols);
};

// 4. Expose a global object for debugging
window.NeoPass = {
  version: '1.0.0',
  isBypassActive: true,
  log: (msg) => console.log(`[NeoPass] ${msg}`)
};
