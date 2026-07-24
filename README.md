# GlossaPop

A modern, high-performance Chrome Extension built with Manifest V3 for floating translation popups. Select any word on a page to look up its definition in English or French instantly, complete with phonetics, audio pronunciations, grammatical conjugations, example sentences, Google Sheets sync, and layout isolation.

👉 **[Install GlossaPop on Chrome Web Store](https://chromewebstore.google.com/detail/kmamglgfhenmcomflbdmfjdnmnlkggad)**

![GlossaPop Screenshot](assets/promo-screenshot.jpg)

---

## Key Features

- **Isolated Shadow DOM Popup**: Floats the popup in a clean Shadow DOM container, fully preventing the host website's styles (CORS, background styles, or font configurations) from corrupting the layout.
- **Google Drive & Sheets Integration**:
  - **1-Click Save (`☆ Save` ➔ `★ Saved`)**: Save words directly to your personal Google Sheet with a single click.
  - **Automatic Deduplication & Local Sync**: Displays `✓ Already in Vocabulary Book` and prevents duplicate entries. Automatically syncs saved words to local cache upon connecting.
  - **Dual-Tab Sheet Architecture**: Intelligently categorizes English words into `English Words` tab and French words into `French Words` tab.
  - **Smart 3-Step Sheet Resolution**: Auto-detects existing `GlossaPop Vocabulary Book` files in Google Drive (filtering out trashed files), ensuring reconnecting or using multiple devices reuses the same sheet seamlessly.
  - **1-Click Vocabulary CSV Export**: Easily export your saved English (`GlossaPop_EN.csv`) and French (`GlossaPop_FR.csv`) word collections directly from the Options page.
- **Flexible Theme Modes (Auto / Light / Dark)**:
  - **Auto**: Automatically matches your OS system preference (`prefers-color-scheme`).
  - **Light Glassmorphism**: Translucent white glass card (`rgba(255, 255, 255, 0.75)`) with `24px` backdrop blur.
  - **Dark Glassmorphism**: High-contrast sleek dark glass card (`rgba(25, 25, 30, 0.92)`) with neon blue/green accent badges.
- **Dynamic API Definition Translation**:
  - Automatically translates Wiktionary definition items into your selected explanation language (**Chinese** or **English**) on the fly via Google Translate API without hardcoded dictionary lists.
- **WCAG AA Compliance**: High-contrast typography across both light and dark themes ensures maximum readability (over 4.5:1 contrast ratio).
- **Personalized Mascot Branding**: Displays a high-density circular mascot logo next to the title in both the popup card and options page.
- **Smart Language Auto-Detection**: Automatically detects if a clicked/double-clicked word is English or French, updates UI toggles dynamically, and loads the appropriate pronunciation engine.
- **Dynamic IPA Phonetics (English & French)**:
  - **English Phonetics**: Fetched from the Free Dictionary API.
  - **French Phonetics**: Fetched dynamically from Wiktionary HTML API via a custom regex parser matching IPA keys (e.g. `/mɛ.zɔ̃/` for *maison*).
- **Multi-Tier Natural Audio Pronunciation Engine**:
  - **Tier 1 (Real Human Voice)**: Plays high-quality human recordings (MP3s) fetched from the Free Dictionary API for English.
  - **Tier 2 (Neural Speech)**: Plays clear neural speech using Google Translate TTS for French and fallback words.
  - **Tier 3 (Localized Web Speech Fallback)**: Uses `window.speechSynthesis` as a fail-safe with exact locale matching (`en-US`/`fr-FR`).
- **Multilingual Example Sentences**: Displays example sentences and translations. Queries Google Translate's public examples database followed by Tatoeba API if dictionary examples are unavailable.
- **CEFR Language Level Badge (A1–C2)**: Displays color-coded European Framework level badges (A1/A2 green, B1/B2 blue, C1/C2 purple).
- **French Multi-Tense Verb Conjugations**: Dynamically displays tabbed conjugations for French verbs across 5 core tenses: **Présent**, **Passé composé**, **Imparfait**, **Futur simple**, and **Subjonctif**. Non-verb nouns and adjectives automatically filter out the conjugation box.
- **Clickable Synonyms & Antonyms Chips**: Displays interactive synonym and antonym tag chips under definitions; clicking any chip instantly queries that word inside the active card.
- **External Dictionary Reference Links**: Direct links at the bottom of the card mapping to base lemma forms:
  - **English**: Cambridge Dictionary, Merriam-Webster
  - **French**: Larousse, WordReference, French Assistant (法語助手)
- **Configurable Triggers**:
  - **Double Click**: Triggers the lookup immediately below the selected word.
  - **Text Selection**: Shows a non-intrusive float bubble; clicking it opens the card.

---

## File Structure

The project follows a clean, single-responsibility modular structure:

```
GlossaPop/
├── assets/            # Project promotional screenshots and mockups
├── manifest.json      # Manifest V3 configuration settings, OAuth2 scopes & permissions
├── background.js      # Background service worker router & message dispatcher
├── bg-api.js          # Direct external API queries (Lingva, Google Translate, Tatoeba, Definition Translation)
├── bg-parser.js       # HTML/JSON definition and example parsers for background queries
├── bg-dictionary.js   # Orchestrates dictionary flows, POS classification, and French phonetics
├── bg-sheets.js       # Google Drive & Sheets API v4 engine, OAuth token management, and CSV export
├── utils.js           # Shared utilities (escaping, French feminine derivation, conjugations)
├── audio.js           # Front-end audio pronouncer (Human MP3, Google TTS, Web Speech)
├── ui.js              # Scoped CSS styles tag and HTML card templates with theme support
├── settings.js        # Syncs and loads configuration options using chrome.storage.sync
├── events.js          # Cursor mouseup selections, double-clicks, and click-outside dismissal
├── content.js         # Main coordinator initializing Shadow DOM hosts and routing events
├── options.html       # Configurations page UI markup with Google Sync & CSV Export buttons
├── options.css        # Premium dark glassmorphic styling for settings panel
├── options.js         # Settings manager handling Google OAuth connection and settings
├── icons/             # Contains extension icons and circular mascot logo
├── CHROMEWEBSTORE.md  # Chrome Web Store submission metadata, descriptions & justifications
├── PRIVACY.md         # Privacy Policy declaration complying with developer guidelines
└── README.md          # Extension overview, file structure, and installation guide
```

---

## Installation Guide

### Option A: Install from Chrome Web Store (Recommended)
Simply visit the official [GlossaPop Chrome Web Store Page](https://chromewebstore.google.com/detail/kmamglgfhenmcomflbdmfjdnmnlkggad) and click **Add to Chrome**.

### Option B: Load Unpacked (Developer Mode)
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
3. Click the floating magnifying glass icon (or double-click if configured) to open the lookup card.
4. Click **`☆ Save`** to save the word directly to your Google Sheet (`★ Saved`).
5. Click the speaker icon next to the word to play pronunciation.
6. Use the header switches (EN/FR and Chinese/English) to change source and translation output languages.
7. Open **Extension Options** by right-clicking the GlossaPop extension icon and selecting **Options**. Here you can connect your Google Account, sync vocabulary caches, and export CSV files.

---

## APIs and Technologies Used

- **Google Drive API v3 & Sheets API v4**: Real-time cloud sync & spreadsheet management (`https://www.googleapis.com/auth/drive.file`)
- **English Queries**: [Free Dictionary API](https://dictionaryapi.dev/)
- **French/Bilingual Queries**: [Wiktionary REST API](https://en.wiktionary.org/api/rest_v1/page/definition/) & [Wiktionary HTML API](https://en.wiktionary.org/api/rest_v1/page/html/) (French IPA extraction)
- **Example Fallbacks**: Google Translate Examples Database & [Tatoeba API](https://api.tatoeba.org/)
- **Audio Output**: Free Dictionary MP3s, Google Translate TTS API, and Web Speech API (`window.speechSynthesis`)
- **Storage Sync**: Chrome Storage Sync API (`chrome.storage.sync`)
