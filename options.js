// options.js - Handles loading settings, auto-saving, and the confirmation toast notification

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
});
