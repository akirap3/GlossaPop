// options.js - Handles loading settings, auto-saving, Google Auth & Anki CSV exports

document.addEventListener('DOMContentLoaded', () => {
  const statusToast = document.getElementById('status');
  let toastTimeout = null;

  // 1. Retrieve saved values from storage to initialize UI elements
  chrome.storage.sync.get({
    defaultTargetLang: 'en',
    defaultExplainLang: 'en',
    triggerMode: 'icon',
    themeMode: 'auto'
  }, (items) => {
    // Target Language Selection
    const targetRadio = document.querySelector(`input[name="defaultTargetLang"][value="${items.defaultTargetLang}"]`);
    if (targetRadio) targetRadio.checked = true;

    // Explanation Language Selection
    const explainRadio = document.querySelector(`input[name="defaultExplainLang"][value="${items.defaultExplainLang}"]`);
    if (explainRadio) explainRadio.checked = true;

    // Trigger Mode Selection
    const triggerRadio = document.querySelector(`input[name="triggerMode"][value="${items.triggerMode}"]`);
    if (triggerRadio) triggerRadio.checked = true;

    // Theme Mode Selection
    const themeRadio = document.querySelector(`input[name="themeMode"][value="${items.themeMode}"]`);
    if (themeRadio) themeRadio.checked = true;
  });

  // 2. Trigger auto-save feedback via toast alert
  function showStatusToast() {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    
    statusToast.classList.add('show');
    
    // Hide notification after 1.5 seconds
    toastTimeout = setTimeout(() => {
      statusToast.classList.remove('show');
    }, 1500);
  }

  // 3. Monitor radio changes to auto-save values instantly
  const inputs = document.querySelectorAll('input[type="radio"]');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      const defaultTargetLang = document.querySelector('input[name="defaultTargetLang"]:checked').value;
      const defaultExplainLang = document.querySelector('input[name="defaultExplainLang"]:checked').value;
      const triggerMode = document.querySelector('input[name="triggerMode"]:checked').value;
      const themeMode = document.querySelector('input[name="themeMode"]:checked').value;

      chrome.storage.sync.set({
        defaultTargetLang,
        defaultExplainLang,
        triggerMode,
        themeMode
      }, () => {
        showStatusToast();
      });
    });
  });

  // 4. Google Drive & Sheets Integration Handlers
  const authStatus = document.getElementById('google-auth-status');
  const authBtn = document.getElementById('google-auth-btn');
  const sheetsActions = document.getElementById('sheets-actions');
  const syncBtn = document.getElementById('sync-words-btn');
  const exportEnBtn = document.getElementById('export-anki-en-btn');
  const exportFrBtn = document.getElementById('export-anki-fr-btn');

  function updateAuthUI(connected) {
    if (!authStatus || !authBtn || !sheetsActions) return;
    if (connected) {
      authStatus.textContent = '🟢 Connected to Google Drive';
      authStatus.style.color = '#30d158';
      authBtn.textContent = 'Disconnect';
      authBtn.style.background = '#ff453a';
      sheetsActions.style.display = 'flex';
    } else {
      authStatus.textContent = '⚪ Not Connected';
      authStatus.style.color = '#e5e5ea';
      authBtn.textContent = 'Connect Google Account';
      authBtn.style.background = '#0a84ff';
      sheetsActions.style.display = 'none';
    }
  }

  // Check initial Auth status
  chrome.runtime.sendMessage({ action: 'getAuthStatus' }, (res) => {
    updateAuthUI(res && res.connected);
  });

  // Toggle Connect / Disconnect
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      const isConnected = authBtn.textContent === 'Disconnect';
      if (isConnected) {
        chrome.runtime.sendMessage({ action: 'disconnectGoogleAuth' }, () => {
          updateAuthUI(false);
          showStatusToast();
        });
      } else {
        authBtn.textContent = '⏳ Connecting...';
        chrome.runtime.sendMessage({ action: 'connectGoogleAuth' }, (res) => {
          if (res && res.success) {
            updateAuthUI(true);
            showStatusToast();
          } else {
            updateAuthUI(false);
            const err = (res && res.error) ? res.error : '';
            if (err.includes('redirect_uri_mismatch') || err.includes('invalid request')) {
              chrome.runtime.sendMessage({ action: 'getRedirectUrl' }, (urlRes) => {
                const myUrl = urlRes ? urlRes.url : '';
                alert(`⚠️ Redirect URI Mismatch:\n\n請在 Google Cloud Console 編輯 GlossaPop Web 憑證，在 "Authorized redirect URIs" (已授權的重新導向 URI) 新增以下這串網址：\n\n${myUrl}`);
              });
            } else {
              alert('Google Auth Notice: ' + (err || 'Connection process was closed.'));
            }
          }
        });
      }
    });
  }

  // Sync Words Button
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      syncBtn.textContent = '⏳ Syncing...';
      chrome.runtime.sendMessage({ action: 'syncSavedWords' }, (res) => {
        syncBtn.textContent = '🔄 Sync Vocabulary Cache';
        if (res && res.success) {
          alert(`✓ Synced ${res.count} words from your Google Sheet to local cache!`);
        } else {
          alert('Sync Error: ' + (res ? res.error : 'Failed to sync'));
        }
      });
    });
  }

  // Export Anki CSV helper function
  function triggerCsvDownload(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (exportEnBtn) {
    exportEnBtn.addEventListener('click', () => {
      exportEnBtn.textContent = '⏳ Exporting...';
      chrome.runtime.sendMessage({ action: 'exportAnkiCsv', targetLang: 'en' }, (res) => {
        exportEnBtn.textContent = '📥 Export English Anki CSV';
        if (res && res.success) {
          triggerCsvDownload(res.filename, res.csvContent);
        } else {
          alert('Export Error: ' + (res ? res.error : 'Failed to export CSV'));
        }
      });
    });
  }

  if (exportFrBtn) {
    exportFrBtn.addEventListener('click', () => {
      exportFrBtn.textContent = '⏳ Exporting...';
      chrome.runtime.sendMessage({ action: 'exportAnkiCsv', targetLang: 'fr' }, (res) => {
        exportFrBtn.textContent = '📥 Export French Anki CSV';
        if (res && res.success) {
          triggerCsvDownload(res.filename, res.csvContent);
        } else {
          alert('Export Error: ' + (res ? res.error : 'Failed to export CSV'));
        }
      });
    });
  }
});
