// settings.js - Manages Chrome Storage configs sync and configurations update

let settings = {
  sourceLangA: 'en',
  sourceLangB: 'fr',
  explainLangA: 'zh-TW',
  explainLangB: 'en',
  triggerMode: 'icon',
  themeMode: 'auto'
};

// Load user configurations
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      sourceLangA: 'en',
      sourceLangB: 'fr',
      explainLangA: 'zh-TW',
      explainLangB: 'en',
      triggerMode: 'icon',
      themeMode: 'auto'
    }, (items) => {
      if (!['icon', 'dblclick'].includes(items.triggerMode)) {
        items.triggerMode = 'icon';
      }
      settings = items;
      resolve();
    });
  });
}

// Keep configurations in sync in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    for (let key in changes) {
      settings[key] = changes[key].newValue;
    }
  }
});
