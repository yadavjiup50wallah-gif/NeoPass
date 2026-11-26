# Defect Triage – P0 to P2

| Severity | File | Issue | Suggested Fix |
|----------|------|-------|--------------|
| **P0** | `manifest.json` | Missing `minimum_chrome_version`. | Add `"minimum_chrome_version": "119"`.
| **P0** | `worker.js` | Duplicate toast implementations (multiple similar functions). | Consolidate into a single reusable toast module.
| **P0** | `worker.js` | In‑memory global state will be lost on service‑worker eviction. | Persist mutable state to `chrome.storage.session`.
| **P0** | `worker.js` | No abort/timeout handling for `fetch` calls (e.g., heartbeat). | Wrap fetch with `AbortController`, 30 s timeout, retry back‑off.
| **P1** | `manifest.json` | Unused permissions `webRequest` and `downloads`. | Verify zero references (see grep) then remove them.
| **P1** | `worker.js` & `contentScript.js` | Dynamic registration of content scripts (`activate()`), causing double registration. | Rely solely on manifest‑declared content scripts.
| **P1** | `worker.js` | Version mismatch: `mockExtensionInfo.version` (hard‑coded) differs from `data/inject/mock_code/mock_manifest.json`. | Add startup assertion and log warning if mismatched.
| **P2** | `worker.js` | No `declarative_net_request` block for `rules.json`. | Add DNR rule_resources entry.
| **P2** | `worker.js` | No handling for `chrome.runtime.onSuspend` cleanup beyond storing unload time. | Ensure proper cleanup or state persistence.
| **P2** | `manifest.json` | No `minimum_chrome_version` despite using APIs introduced in Chrome 111+. | (Already covered in P0). |

*All items are based on a read‑only audit; no code has been changed yet.*