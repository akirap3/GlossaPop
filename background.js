// background.js - Handles cross-origin API requests using modular sub-scripts

importScripts('bg-api.js', 'bg-parser.js', 'bg-dictionary.js', 'bg-sheets.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // --- Google Sheets / Auth Actions ---
  if (message.action === 'getAuthStatus') {
    chrome.storage.sync.get(['googleAuthConnected'], (stored) => {
      sendResponse({ success: true, connected: !!stored.googleAuthConnected });
    });
    return true;
  }

  if (message.action === 'getRedirectUrl') {
    const url = chrome.identity.getRedirectURL();
    sendResponse({ success: true, url });
    return true;
  }

  if (message.action === 'connectGoogleAuth') {
    getAuthToken(true)
      .then(async (token) => {
        await new Promise(res => chrome.storage.sync.set({ googleAuthConnected: true }, res));
        try {
          await fetchSpreadsheetWords(token);
        } catch (e) {
          console.warn('Initial spreadsheet sync warning:', e);
        }
        sendResponse({ success: true, connected: true });
      })
      .catch((err) => {
        chrome.storage.sync.set({ googleAuthConnected: false });
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.action === 'disconnectGoogleAuth') {
    (async () => {
      try {
        let token = null;
        try { token = await getAuthToken(false); } catch (e) {}
        await removeAuthToken(token);
        sendResponse({ success: true, connected: false });
      } catch (e) {
        await new Promise(res => chrome.storage.sync.set({ googleAuthConnected: false, spreadsheetId: null }, res));
        await new Promise(res => chrome.storage.local.remove(['oauthToken', 'savedWords'], res));
        sendResponse({ success: true, connected: false });
      }
    })();
    return true;
  }

  if (message.action === 'saveWordToSheet') {
    (async () => {
      try {
        const storedSync = await new Promise(res => chrome.storage.sync.get(['googleAuthConnected'], res));
        if (!storedSync.googleAuthConnected) {
          sendResponse({ success: false, error: 'Google Account is disconnected. Please connect in Options.' });
          return;
        }

        const token = await getAuthToken(false);
        const { targetLang, wordData } = message;
        
        // 1. Check local deduplication cache first
        const wordKey = (wordData.word || '').trim().toLowerCase();
        const storedLocal = await new Promise(res => chrome.storage.local.get(['savedWords'], res));
        const savedWords = storedLocal.savedWords || {};

        if (savedWords[wordKey]) {
          sendResponse({ success: true, duplicate: true, word: wordData.word });
          return;
        }

        // 2. Append row to Google Sheets
        const res = await appendWordToSheet(token, targetLang, wordData);
        
        // 3. Update local cache
        savedWords[wordKey] = true;
        await new Promise(res => chrome.storage.local.set({ savedWords }, res));

        sendResponse({ success: true, duplicate: false, spreadsheetId: res.spreadsheetId });
      } catch (err) {
        console.error('saveWordToSheet error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'syncSavedWords') {
    (async () => {
      try {
        const storedSync = await new Promise(res => chrome.storage.sync.get(['googleAuthConnected'], res));
        if (!storedSync.googleAuthConnected) {
          sendResponse({ success: false, error: 'Google Account is disconnected. Please connect in Options.' });
          return;
        }
        const token = await getAuthToken(false);
        const savedWordsMap = await fetchSpreadsheetWords(token);
        sendResponse({ success: true, count: Object.keys(savedWordsMap).length });
      } catch (err) {
        console.error('syncSavedWords error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'exportAnkiCsv') {
    (async () => {
      try {
        const storedSync = await new Promise(res => chrome.storage.sync.get(['googleAuthConnected'], res));
        if (!storedSync.googleAuthConnected) {
          sendResponse({ success: false, error: 'Google Account is disconnected. Please connect in Options.' });
          return;
        }
        const token = await getAuthToken(false);
        const csvContent = await exportAnkiCsv(token, message.targetLang);
        sendResponse({ success: true, csvContent, filename: `GlossaPop_${message.targetLang.toUpperCase()}.csv` });
      } catch (err) {
        console.error('exportAnkiCsv error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // --- Translation Action ---
  if (message.action === 'fetchTranslation') {
    const { word, source, target } = message;
    
    (async () => {
      try {
        let result = {};
        
        // Scenario 1: Source language is 'auto' (automatic detection requested)
        if (source === 'auto') {
          result = await autoDetectAndTranslate(word, target);
        }
        // Scenario 2: Source language is English and target is English
        else if (source === 'en' && target === 'en') {
          const cleanWord = word.trim();
          const cacheKey = `${source}:${target}:${cleanWord.toLowerCase()}`;
          const cached = getCachedResult(cacheKey);
          if (cached) {
            sendResponse({ success: true, data: cached });
            return;
          }

          const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
          const lemmaPromise = fetchLemmaInfo(cleanWord, 'en');
          
          const response = await dictPromise;
          if (response.ok) {
            const data = await response.json();
            result = parseDictionaryData(data);
          } else {
            try {
              const translation = await translateWord(cleanWord, 'en', 'en');
              result = {
                word: cleanWord,
                translation: translation,
                phonetic: '',
                definitions: [translation],
                example: null
              };
            } catch (fallbackError) {
              throw new Error('Word definitions not found and translation fallback failed');
            }
          }
          result.detectedLang = 'en';
          
          const { lemmaInfo, isVerb, wiktionaryDefinitions, example } = await lemmaPromise;
          result.lemmaInfo = lemmaInfo;
          result.isVerb = isVerb;
          
          if (example && !result.example) {
            result.example = example;
          }
          
          if (!result.example) {
            const exampleWord = result.lemmaInfo ? result.lemmaInfo.lemma : cleanWord;
            try {
              result.example = await fetchFallbackExample(exampleWord, 'en', 'en');
            } catch (e) {
              console.warn('Fallback example fetch failed:', e);
            }
          }
          
          // If dictionary api was empty, fall back to rich wiktionary definitions
          if ((!result.definitions || result.definitions.length === 0) && wiktionaryDefinitions && wiktionaryDefinitions.length > 0) {
            result.definitions = wiktionaryDefinitions;
          }

          setCachedResult(cacheKey, result);
        } 
        // Scenario 3: Explicit source languages (EN or FR) and other target pairs
        else {
          try {
            const cleanWord = word.trim();
            const cacheKey = `${source}:${target}:${cleanWord.toLowerCase()}`;
            const cached = getCachedResult(cacheKey);
            if (cached) {
              sendResponse({ success: true, data: cached });
              return;
            }

            const translationPromise = translateWord(cleanWord, source, target);
            const lemmaPromise = fetchLemmaInfo(cleanWord, source);
            
            let extraPromise = Promise.resolve(null);
            if (source === 'en') {
              extraPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
                .then(res => res.ok ? res.json() : null)
                .then(dictData => dictData ? parseDictionaryData(dictData) : null)
                .catch(() => null);
            } else if (source === 'fr') {
              extraPromise = fetchFrenchPhonetic(cleanWord)
                .then(phonetic => ({ phonetic }))
                .catch(() => null);
            }

            const [translation, lemmaRes, extraRes] = await Promise.all([
              translationPromise,
              lemmaPromise,
              extraPromise
            ]);

            const { lemmaInfo, isVerb, isAdjective, wiktionaryDefinitions, synonyms: wikSyn, antonyms: wikAnt, example } = lemmaRes || {};

            let definitions = (wiktionaryDefinitions && wiktionaryDefinitions.length > 0) 
              ? wiktionaryDefinitions 
              : [translation];

            if (extraRes && extraRes.definitions && extraRes.definitions.length > 0) {
              definitions = extraRes.definitions;
            }

            if (target !== 'en') {
              definitions = await translateDefinitions(definitions, target);
            }

            const phonetic = (extraRes && extraRes.phonetic) ? extraRes.phonetic : '';
            const audio = (extraRes && extraRes.audio) ? extraRes.audio : '';

            // Combine synonyms & antonyms dynamically from Wiktionary and API queries
            const synonyms = Array.from(new Set([
              ...(extraRes && extraRes.synonyms ? extraRes.synonyms : []),
              ...(wikSyn || [])
            ])).filter(Boolean).slice(0, 6);

            const antonyms = Array.from(new Set([
              ...(extraRes && extraRes.antonyms ? extraRes.antonyms : []),
              ...(wikAnt || [])
            ])).filter(Boolean).slice(0, 6);

            result = {
              word: cleanWord,
              translation,
              phonetic,
              audio,
              definitions,
              detectedLang: source,
              lemmaInfo,
              isVerb,
              isAdjective,
              example: (extraRes && extraRes.example) ? extraRes.example : example,
              synonyms,
              antonyms
            };

            if (!result.example) {
              const exampleWord = result.lemmaInfo ? result.lemmaInfo.lemma : cleanWord;
              try {
                result.example = await fetchFallbackExample(exampleWord, source, target);
              } catch (e) {
                console.warn('Fallback example fetch failed:', e);
              }
            }

            setCachedResult(cacheKey, result);
          } catch (error) {
            console.warn('Scenario 3 query partial failure:', error);
            if (!result || !result.word) {
              result = {
                word: word.trim(),
                translation: word.trim(),
                phonetic: '',
                audio: '',
                definitions: [word.trim()],
                detectedLang: source,
                lemmaInfo: null,
                isVerb: false,
                example: null,
                synonyms: [],
                antonyms: []
              };
            }
          }
        }
        
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error('GlossaPop Background Fetch Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keeps the message channel open for asynchronous responses
  }
});
