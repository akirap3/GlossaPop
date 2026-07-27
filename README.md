# GlossaPop

A modern, ultra-high-performance Chrome Extension built with Manifest V3 for floating dictionary popups and language learning. Highlight or double-click any word on a webpage to instantly look up definitions in your preferred explanation languages, featuring IPA phonetics, multi-tier audio pronunciations, 5-tense French conjugations, example sentences, dynamic reference links, Google Drive & Sheets cloud synchronization, and complete Shadow DOM style isolation.

👉 **[Install GlossaPop on Chrome Web Store](https://chromewebstore.google.com/detail/kmamglgfhenmcomflbdmfjdnmnlkggad)**

![GlossaPop Screenshot](assets/promo-screenshot.jpg)

---

## ✨ Key Features

### 🌐 Automatic Page Language Sensor & Multi-Language Support
- **Automatic Language Auto-Sensor**: GlossaPop automatically senses the host webpage language (Japanese, French, Spanish, German, Traditional Chinese, English, etc.) and routes dictionary lookups to the correct source engine without manual switching.
- **Single Source Badge & Dual Target Toggles**: Header cleanly displays a single detected language badge (e.g. `[ DE ]`, `[ JA ]`, `[ FR ]`) alongside 2 customizable explanation target toggles (e.g. `[ 繁中 ] [ EN ]`).
- **Bi-Directional Target Swap**: Options dashboard features `Explain 1` (Primary Target) and `Explain 2` (Secondary Target) mutually exclusive dropdowns with a 1-click bi-directional swap arrow button (`⇄`).
- **Language-Aware Dynamic Reference Links**: Automatically generates contextual dictionary links tailored to the lookup language:
  - **Japanese**: Jisho, Weblio, OJAD
  - **French**: Larousse, WordReference, CNRTL, French Assistant (法語助手)
  - **Spanish**: SpanishDict, RAE, WordReference
  - **German**: Duden, DWDS, Leo
  - **Korean**: Naver, Daum
  - **Italian**: Treccani, WordReference
  - **Portuguese**: Priberam, WordReference
  - **Traditional Chinese**: MoeDict (教育部重編國語辭典), WordReference
  - **English**: Cambridge, Oxford, Merriam-Webster

### 🛡️ Isolated Shadow DOM & Responsive Design
- **Shadow DOM Isolation**: Renders the floating popup card inside an isolated Shadow DOM container, preventing host webpage CSS (styles, fonts, background reset, CORS) from corrupting the UI layout.
- **Ultra-Responsive Options Dashboard (320px to 1200px+)**: Fully responsive Options page (RWD) that scales fluidly on iPad Pro (1200px max-width fill screen), desktop windows, and compact mobile viewports down to industry-standard **320px** without horizontal scrollbars or clipping.

### ☁️ Google Drive & Sheets Cloud Synchronization
- **1-Click Vocabulary Saving (`☆ Save` ➔ `★ Saved`)**: Save words directly to your personal Google Sheet with a single click.
- **Automatic Deduplication & Local Sync**: Displays `✓ Already in Vocabulary Book` and prevents duplicate entries. Saved words automatically sync to local cache upon connecting.
- **Dual-Tab Sheet Architecture**: Intelligently categorizes English words into `English Words` tab and French words into `French Words` tab.
- **Smart 3-Step Sheet Resolution**: Auto-detects existing `GlossaPop Vocabulary Book` spreadsheets in Google Drive (ignoring trashed files), ensuring seamless multi-device usage.
- **1-Click CSV Export**: Export saved English (`GlossaPop_EN.csv`) and French (`GlossaPop_FR.csv`) word collections for Anki flashcards directly from the Options dashboard.
- **OAuth Silent Token Refresh**: Built-in 401 token expiration handler that silently refreshes OAuth credentials using `prompt=none`.

### 🎨 Themes & WCAG AAA Accessibility Compliance
- **3-Tile Segmented Control Switcher**:
  - **🌗 Auto**: Matches OS system preferences (`prefers-color-scheme`).
  - **☀️ Light Glassmorphism**: Crisp translucent white card (`rgba(255, 255, 255, 0.75)`) with Apple System Royal Blue (`#0066cc`) badges.
  - **🌙 Dark Glassmorphism**: High-contrast sleek dark glass card (`rgba(19, 15, 36, 0.92)`) with neon gradient accents.
- **Accessible iOS/macOS Toggle Switch**: Accessible Google Account Connect/Disconnect toggle switch (`.toggle-switch`) with high-contrast text (> 4.5:1 ratio) and `:focus-visible` keyboard focus outlines (`#64d2ff`).

### 📚 Deep Dictionary & Linguistic Engine
- **Dynamic IPA Phonetics**:
  - **English Phonetics**: Fetched from Free Dictionary API.
  - **French Phonetics**: Extracted dynamically from Wiktionary HTML API regex parser (e.g. `/mɛ.zɔ̃/` for *maison*).
- **Multi-Tier Audio Pronunciation**:
  - **Tier 1 (Human Voice MP3)**: High-quality real human audio recordings for English words.
  - **Tier 2 (Neural Speech)**: Clear neural TTS audio via Google Translate API for French and fallback words.
  - **Tier 3 (Localized Web Speech)**: Fail-safe speech output via `window.speechSynthesis` with locale matching (`en-US`, `fr-FR`, `ja-JP`, `de-DE`, etc.).
- **French 5-Tense Verb Conjugation Engine**: Interactive tabbed conjugation grid displaying 5 core tenses: **Présent**, **Passé composé**, **Imparfait**, **Futur simple**, and **Subjonctif**. Non-verb words automatically filter out the conjugation panel.
- **Standard Dictionary Example Sentences**: Displays example sentences with target word highlighting. Queries Google Translate examples database and Tatoeba API as fallbacks.
- **CEFR Framework Level Badge**: Color-coded European language level badges (A1/A2 green, B1/B2 blue, C1/C2 purple).
- **Clickable Synonyms & Antonyms Chips**: Interactive tag chips under definitions; clicking any chip instantly queries that word inside the active popup card.

---

## 📁 File Structure

The project follows a modular, single-responsibility architecture:

```
GlossaPop/
├── assets/            # Project promotional screenshots and mockups
├── manifest.json      # Manifest V3 configuration, OAuth2 scopes & host permissions
├── background.js      # Background service worker router & message dispatcher
├── bg-api.js          # External API queries (Wiktionary, Lingva, Google Translate, Tatoeba)
├── bg-parser.js       # HTML/JSON definition and example sentence parsers
├── bg-dictionary.js   # Orchestrates dictionary flows, POS classification, and French IPA
├── bg-sheets.js       # Google Drive & Sheets API v4 engine, OAuth token refresh, and CSV export
├── utils.js           # Shared utilities (HTML escaping, French feminine forms, verb conjugations)
├── audio.js           # Front-end audio pronouncer (Human MP3, Google TTS, Web Speech)
├── ui.js              # Scoped CSS styles tag and HTML card templates with theme support
├── settings.js        # Syncs and loads configuration options using chrome.storage.sync
├── events.js          # Cursor mouseup selections, double-clicks, and click-outside dismissal
├── content.js         # Main coordinator initializing Shadow DOM hosts and routing events
├── options.html       # Configurations page UI markup with Google Sync & CSV Export buttons
├── options.css        # Premium dark glassmorphism responsive styling for settings panel
├── options.js         # Settings manager handling Google OAuth connection and options
├── icons/             # Extension icons and circular mascot logos
├── tests/             # Categorized automated verification test suites (218 checks)
│   ├── test_languages.js   # Language matrix, audio locales, auto-sensor & dynamic links tests
│   ├── test_ui_options.js  # UI components, popup frame, theme switcher & RWD layout tests
│   ├── test_auth.js        # OAuth token expiration, 401 handling & silent refresh tests
│   └── test_dictionary.js  # 100-word POS resolution, conjugations, CEFR & Wiktionary tests
├── CHROMEWEBSTORE.md  # Chrome Web Store submission metadata, descriptions & justifications
├── PRIVACY.md         # Privacy Policy declaration complying with developer guidelines
└── README.md          # Project overview, feature list, and installation guide
```

---

## 🚀 Installation Guide

### Option A: Install from Chrome Web Store (Recommended)
Visit the official [GlossaPop Chrome Web Store Page](https://chromewebstore.google.com/detail/kmamglgfhenmcomflbdmfjdnmnlkggad) and click **Add to Chrome**.

### Option B: Load Unpacked (Developer Mode)
1. **Download/Clone** this repository to your local machine.
2. Open Google Chrome and enter `chrome://extensions/` in the address bar.
3. Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. Click the **Load unpacked** button in the top-left corner.
5. Choose the `GlossaPop` root folder containing `manifest.json`.
6. GlossaPop is active! You will see it listed under your Chrome extensions.

---

## 💡 How to Use

1. Go to any webpage (e.g. Wikipedia, news sites).
2. Highlight a word or phrase with your mouse cursor.
3. Click the floating magnifying glass icon (or double-click if configured) to open the dictionary card.
4. Click **`☆ Save`** to save the word directly to your Google Sheet (`★ Saved`).
5. Click the speaker icon to play natural audio pronunciation.
6. Use the header language badges (`[ DE ]`, `[ 繁中 ]`, `[ EN ]`) to toggle source and target explanation languages.
7. Open **Extension Options** by right-clicking the GlossaPop extension icon and selecting **Options**. Here you can manage Google Cloud Sync, toggle appearance themes, and export Anki CSV files.

---

## 🧪 Automated Testing

GlossaPop includes a comprehensive 218-check categorized automated test suite built on Node.js:

```bash
# Run all categorized test suites
node tests/test_languages.js && node tests/test_ui_options.js && node tests/test_auth.js && node tests/test_dictionary.js
```

---

## 🛠️ APIs & Technologies Used

- **Google Drive API v3 & Sheets API v4**: Real-time cloud sync & spreadsheet management (`https://www.googleapis.com/auth/drive.file`)
- **English Queries**: [Free Dictionary API](https://dictionaryapi.dev/)
- **French & Multilingual Queries**: [Wiktionary REST API](https://en.wiktionary.org/api/rest_v1/page/definition/) & [Wiktionary HTML API](https://en.wiktionary.org/api/rest_v1/page/html/)
- **Example Sentence Fallbacks**: Google Translate Examples Database & [Tatoeba API](https://api.tatoeba.org/)
- **Audio Output**: Free Dictionary MP3s, Google Translate TTS API, and Web Speech API (`window.speechSynthesis`)
- **Storage & State Sync**: Chrome Storage Sync API (`chrome.storage.sync`)
