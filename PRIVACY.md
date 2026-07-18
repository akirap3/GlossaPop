# Privacy Policy for GlossaPop

Last Updated: 2026-07-18

Your privacy is extremely important to us. This Privacy Policy describes how **GlossaPop** (the "Extension") handles user data.

## 1. Data Collection and Usage
- **No Personal Data Collection**: GlossaPop does not collect, store, or transmit any personally identifiable information, location data, browsing history, or user search logs.
- **Local Processing**: All word queries, text selections, and configurations (e.g. default translation language preferences) are processed and stored locally inside your browser context using `chrome.storage.sync` and the extension's memory.
- **Third-Party API Requests**: 
  - To provide dictionary definitions and bilingual translation services, the Extension sends word queries securely via HTTPS to the following public endpoints:
    - **Free Dictionary API** (`https://api.dictionaryapi.dev/`)
    - **Lingva Translate API** (`https://lingva.ml/`)
    - **Google Translate API** (`https://translate.googleapis.com/`)
    - **Tatoeba API** (`https://api.tatoeba.org/`)
  - These requests only contain the selected word or text snippet. No user identifiers, IP addresses, or tracking tokens are attached.

## 2. Data Sharing and Transfer
- We do **not** sell, trade, or transfer your data to third parties. 
- No data is used for creditworthiness, lending, or advertising targeting.

## 3. Policy Changes
We may update this Privacy Policy from time to time. Any changes will be reflected by the "Last Updated" date at the top of this page.

## 4. Contact
If you have any questions or feedback, please contact us at:
- **GitHub Issues**: https://github.com/akirapf3/GlossaPop/issues
