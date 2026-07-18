# GlossaPop

A modern, high-performance Chrome Extension built with Manifest V3 for floating translation popups. Select any word on a page to look up its definition in English or French instantly, complete with phonetics, audio pronunciations, and layout isolation.

---

## Key Features

- **Shadow DOM Style Isolation**: Floats the popup in a clean Shadow DOM element, fully preventing the host website's styles (CORS, background styles, or font configurations) from corrupting the layout.
- **CORS-Free Architecture**: Queries are routed through the background service worker, completely bypassing domain CORS/CSP blocks that normally halt content script fetch requests.
- **Web Speech API Pronunciation**: Uses the native browser speech engine to read words aloud. Dynamically switches between English (`en-US`) and French (`fr-FR`) audio locales based on the queried word.
- **Dynamic Translation Toggles**: Switch between English/French source languages and Chinese/English translation results directly in the popup card. Updates are retrieved in real-time.
- **Configurable Triggers**:
  - **Double Click**: Triggers the lookup immediately below the selected word.
  - **Text Selection**: Shows a non-intrusive float bubble; clicking it opens the card to ensure standard reading flows are not interrupted.
- **Premium Options UI**: Glassmorphism dashboard layout with auto-save updates synced instantly across all active tabs.

---

## File Structure

```
GlossaPop/
├── manifest.json      # Manifest V3 configuration settings & declarations
├── background.js      # Service worker proxying API fetch calls to avoid CORS
├── content.js         # Text selection listeners, Shadow DOM injection & Speech controller
├── options.html       # Configurations page UI markup
├── options.css        # Premium dark glassmorphism styling for settings panel
├── options.js         # Settings manager linking inputs with chrome.storage.sync
├── icons/             # Contains generated premium extension logo PNG icons (16, 32, 48, 128)
├── generate_icons.py  # Python script utilizing Pillow to draw the custom logo icons
└── README.md          # Extension overview and installation guide
```

---

## Installation Guide

Follow these steps to load GlossaPop on Google Chrome:

1. **Download/Clone** this repository directory to your local machine.
2. Open Google Chrome and enter `chrome://extensions/` in the address bar.
3. Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. Click the **Load unpacked** button in the top-left corner.
5. Choose the `GlossaPop` root folder containing `manifest.json`.
6. GlossaPop is now active! You will see it listed under your active extensions.

---

## How to Use

1. Go to any public web page (e.g. Wikipedia).
2. Highlight a word using your mouse.
3. Click the magnifying glass icon that floats near your selection to open the lookup card.
4. Click the speaker icon to play the pronunciation.
5. Use the header switches (EN/FR and Chinese/English) to change source and translation outputs.
6. Open the **Extension Options** page by clicking details on the extension card or right-clicking the icon. You can switch the trigger mode to **Double Click** to display the popup immediately without the middle bubble step.

---

## APIs and Technologies Used

- **English Queries**: [Free Dictionary API](https://dictionaryapi.dev/)
- **French/Bilingual Queries**: [Lingva Translate API](https://github.com/lingva-translate/lingva-translate) (Keyless Google Translate Proxy)
- **Audio Output**: Web Speech API (`window.speechSynthesis`)
- **Storage Sync**: Chrome Storage Sync API (`chrome.storage.sync`)
