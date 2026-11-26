// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const bypassStatus = document.getElementById('bypassStatus');
  const toggleBypassBtn = document.getElementById('toggleBypassBtn');
  const copyActiveTabBtn = document.getElementById('copyActiveTabBtn');
  const screenshotBtn = document.getElementById('screenshotBtn');
  const setExamTabBtn = document.getElementById('setExamTabBtn');
  const goToExamBtn = document.getElementById('goToExamBtn');
  const setNotesTabBtn = document.getElementById('setNotesTabBtn');
  const goToNotesBtn = document.getElementById('goToNotesBtn');
  const examTabStatus = document.getElementById('examTabStatus');
  const notesTabStatus = document.getElementById('notesTabStatus');
  const screenshotPreview = document.getElementById('screenshotPreview');

  // --- Bypass Status Logic ---
  function refreshStatus() {
    chrome.runtime.sendMessage({ type: 'NEOPASS_GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return;
      const isActive = response.data.isBypassActive;
      bypassStatus.textContent = isActive ? 'ACTIVE' : 'INACTIVE';
      bypassStatus.className = `status-value ${isActive ? 'status-active' : 'status-inactive'}`;
    });
  }

  refreshStatus();
  toggleBypassBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'NEOPASS_TOGGLE' }, () => refreshStatus());
  });

  // --- Helper Functions for Tabs & Storage ---
  function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
    });
  }

  function saveTabId(key, tabId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: tabId }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  function getTabId(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key] || null));
    });
  }

  async function updateTabStatuses() {
    const examId = await getTabId('neopass_exam_tab_id');
    const notesId = await getTabId('neopass_notes_tab_id');
    examTabStatus.textContent = examId ? `Exam Tab: Set (ID: ${examId})` : 'Exam Tab: Not Set';
    notesTabStatus.textContent = notesId ? `Notes Tab: Set (ID: ${notesId})` : 'Notes Tab: Not Set';
  }

  updateTabStatuses();

  // --- Tab Manager Buttons ---
  setExamTabBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (tab) {
      await saveTabId('neopass_exam_tab_id', tab.id);
      setExamTabBtn.textContent = 'Saved!';
      setExamTabBtn.classList.add('success');
      setTimeout(() => {
        setExamTabBtn.textContent = 'Set as Exam';
        setExamTabBtn.classList.remove('success');
      }, 2000);
      updateTabStatuses();
    }
  });

  goToExamBtn.addEventListener('click', async () => {
    const examId = await getTabId('neopass_exam_tab_id');
    if (examId) chrome.tabs.update(examId, { active: true });
    else alert('No exam tab set. Click "Set as Exam" first.');
  });

  setNotesTabBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (tab) {
      await saveTabId('neopass_notes_tab_id', tab.id);
      setNotesTabBtn.textContent = 'Saved!';
      setNotesTabBtn.classList.add('success');
      setTimeout(() => {
        setNotesTabBtn.textContent = 'Set as Notes';
        setNotesTabBtn.classList.remove('success');
      }, 2000);
      updateTabStatuses();
    }
  });

  goToNotesBtn.addEventListener('click', async () => {
    const notesId = await getTabId('neopass_notes_tab_id');
    if (notesId) chrome.tabs.update(notesId, { active: true });
    else alert('No notes tab set. Click "Set as Notes" first.');
  });

  // --- Exam Tools ---
  copyActiveTabBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'EXAM_COPY_TEXT',
        tabId: tab.id,
        selector: 'body'
      });
      if (result.success) {
        copyActiveTabBtn.textContent = 'Copied!';
        copyActiveTabBtn.classList.add('success');
        setTimeout(() => {
          copyActiveTabBtn.textContent = 'Copy Page Text';
          copyActiveTabBtn.classList.remove('success');
        }, 2000);
      } else {
        copyActiveTabBtn.textContent = 'Failed';
        setTimeout(() => copyActiveTabBtn.textContent = 'Copy Page Text', 2000);
      }
    } catch (e) {
      console.error('Copy error:', e);
    }
  });

  screenshotBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    try {
      const dataUrl = await chrome.runtime.sendMessage({ type: 'EXAM_SCREENSHOT', tabId: tab.id });
      if (dataUrl) {
        screenshotPreview.src = dataUrl;
        screenshotPreview.style.display = 'block';
      }
    } catch (e) {
      console.error('Screenshot error:', e);
    }
  });
});
