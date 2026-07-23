// background.js - Handles cross-origin API requests using modular sub-scripts

importScripts('bg-api.js', 'bg-parser.js', 'bg-dictionary.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
            
            let phonetic = extraRes?.phonetic || '';
            let audio = extraRes?.audio || '';
            let dictExample = extraRes?.example || null;
            let synonyms = extraRes?.synonyms || [];
            let antonyms = extraRes?.antonyms || [];
            
            const { lemmaInfo, isVerb, isAdjective, wiktionaryDefinitions, synonyms: wikSyn, antonyms: wikAnt, example } = lemmaRes || {};
            
            const definitions = (source === 'fr' && wiktionaryDefinitions && wiktionaryDefinitions.length > 0)
              ? wiktionaryDefinitions
              : [translation];
              
            // Combine synonyms & antonyms from Wiktionary, extra dicts, and fallback dictionaries
            const wordFallback = getFallbackSynonyms(cleanWord);
            const lemmaFallback = lemmaInfo ? getFallbackSynonyms(lemmaInfo.lemma) : { synonyms: [], antonyms: [] };

            synonyms = Array.from(new Set([
              ...(synonyms || []),
              ...(wikSyn || []),
              ...(wordFallback.synonyms || []),
              ...(lemmaFallback.synonyms || [])
            ])).filter(Boolean).slice(0, 6);

            antonyms = Array.from(new Set([
              ...(antonyms || []),
              ...(wikAnt || []),
              ...(wordFallback.antonyms || []),
              ...(lemmaFallback.antonyms || [])
            ])).filter(Boolean).slice(0, 6);

            result = {
              word: cleanWord,
              translation: translation,
              phonetic,
              audio,
              definitions,
              detectedLang: source,
              lemmaInfo: lemmaInfo || null,
              isVerb: isVerb || false,
              isAdjective: isAdjective || false,
              example: dictExample || example || null,
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
