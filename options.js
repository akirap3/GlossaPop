// options.js - Handles loading settings, auto-saving, Google Auth & Anki CSV exports

document.addEventListener('DOMContentLoaded', () => {
  const statusToast = document.getElementById('status');
  let toastTimeout = null;

  // Set dynamic version text from manifest.json
  try {
    const manifest = chrome.runtime.getManifest();
    const versionEl = document.getElementById('app-version');
    if (versionEl && manifest && manifest.version) {
      versionEl.textContent = `GlossaPop Version ${manifest.version} | Manifest V3`;
    }
  } catch (e) {}

  // 1. Retrieve saved values from storage to initialize UI elements
  const explainLangA = document.getElementById('explainLangA');
  const explainLangB = document.getElementById('explainLangB');

  chrome.storage.sync.get({
    explainLangA: 'zh-TW',
    explainLangB: 'en',
    triggerMode: 'icon',
    themeMode: 'auto'
  }, (items) => {
    if (explainLangA) explainLangA.value = items.explainLangA;
    if (explainLangB) explainLangB.value = items.explainLangB;

    // Apply mutual exclusivity sync on startup
    syncLanguageDropdownOptions(explainLangA, explainLangB);

    // Trigger Mode Selection
    const validTriggerMode = ['icon', 'dblclick'].includes(items.triggerMode) ? items.triggerMode : 'icon';
    const triggerRadio = document.querySelector(`input[name="triggerMode"][value="${validTriggerMode}"]`);
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

  // Swap languages button listener
  const swapBtn = document.getElementById('swap-explain-langs');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      swapLanguageOptions(explainLangA, explainLangB);
      chrome.storage.sync.set({
        explainLangA: explainLangA ? explainLangA.value : 'zh-TW',
        explainLangB: explainLangB ? explainLangB.value : 'en'
      }, () => showStatusToast());
    });
  }

  // Monitor select dropdown changes to auto-save values instantly
  [explainLangA, explainLangB].forEach(selectEl => {
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        syncLanguageDropdownOptions(explainLangA, explainLangB);
        chrome.storage.sync.set({
          explainLangA: explainLangA ? explainLangA.value : 'zh-TW',
          explainLangB: explainLangB ? explainLangB.value : 'en'
        }, () => showStatusToast());
      });
    }
  });

  // 3. Monitor radio changes to auto-save values instantly
  const inputs = document.querySelectorAll('input[type="radio"]');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      const triggerMode = document.querySelector('input[name="triggerMode"]:checked').value;
      const themeMode = document.querySelector('input[name="themeMode"]:checked').value;

      chrome.storage.sync.set({
        triggerMode,
        themeMode
      }, () => {
        showStatusToast();
      });
    });
  });

  // 4. Google Drive & Sheets Integration Handlers
  const authToggle = document.getElementById('google-auth-toggle');
  const authLabel = document.getElementById('google-auth-label');
  const authStatus = document.getElementById('google-auth-status');
  const authBtn = document.getElementById('google-auth-btn');
  const sheetsActions = document.getElementById('sheets-actions');
  const syncBtn = document.getElementById('sync-words-btn');
  const exportEnBtn = document.getElementById('export-anki-en-btn');
  const exportFrBtn = document.getElementById('export-anki-fr-btn');

  function updateAuthUI(connected) {
    if (authToggle) {
      authToggle.checked = !!connected;
    }
    if (authLabel) {
      authLabel.textContent = connected ? 'Connected' : 'Disconnected';
      authLabel.className = 'toggle-status-label ' + (connected ? 'connected' : 'disconnected');
    }
    if (authStatus) {
      authStatus.textContent = connected ? '🟢 Connected to Google Drive' : '⚪ Not Connected';
      authStatus.style.color = connected ? '#30d158' : '#e5e5ea';
    }
    if (authBtn) {
      authBtn.textContent = connected ? 'Disconnect' : 'Connect Google Account';
    }
    if (sheetsActions) {
      sheetsActions.style.display = connected ? 'flex' : 'none';
    }
  }

  // Check initial Auth status
  chrome.runtime.sendMessage({ action: 'getAuthStatus' }, (res) => {
    updateAuthUI(res && res.connected);
  });

  // Toggle Connect / Disconnect
  if (authToggle) {
    authToggle.addEventListener('change', () => {
      const shouldConnect = authToggle.checked;
      if (!shouldConnect) {
        chrome.runtime.sendMessage({ action: 'disconnectGoogleAuth' }, () => {
          updateAuthUI(false);
          showStatusToast();
        });
      } else {
        if (authLabel) authLabel.textContent = '⏳ Connecting...';
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
        exportEnBtn.textContent = '📥 Export English CSV';
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
        exportFrBtn.textContent = '📥 Export French CSV';
        if (res && res.success) {
          triggerCsvDownload(res.filename, res.csvContent);
        } else {
          alert('Export Error: ' + (res ? res.error : 'Failed to export CSV'));
        }
      });
    });
  }
});

/**
 * Ensures Primary (explainLangA) and Secondary (explainLangB) Target dropdowns are mutually exclusive
 */
function syncLanguageDropdownOptions(selectA, selectB) {
  if (!selectA || !selectB) return;

  const valA = selectA.value;
  const valB = selectB.value;

  const optsA = Array.from(selectA.options || (selectA.getElementsByTagName ? selectA.getElementsByTagName('option') : []));
  const optsB = Array.from(selectB.options || (selectB.getElementsByTagName ? selectB.getElementsByTagName('option') : []));

  // 1. Disable selected value A in selectB options
  optsB.forEach(opt => {
    opt.disabled = (opt.value === valA);
  });

  // 2. Disable selected value B in selectA options
  optsA.forEach(opt => {
    opt.disabled = (opt.value === valB);
  });

  // 3. If selectB collides with selectA, auto-switch selectB to first enabled option
  if (valB === valA) {
    const validOptB = optsB.find(opt => !opt.disabled && opt.value !== valA);
    if (validOptB) {
      selectB.value = validOptB.value;
      // Re-run sync to update disabled states for new valB
      syncLanguageDropdownOptions(selectA, selectB);
    }
  }
}

/**
 * Swaps Primary and Secondary Target language dropdown values
 */
function swapLanguageOptions(selectA, selectB) {
  if (!selectA || !selectB) return;
  const temp = selectA.value;
  selectA.value = selectB.value;
  selectB.value = temp;
  syncLanguageDropdownOptions(selectA, selectB);
}
