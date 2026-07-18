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
          const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
          const lemmaPromise = fetchLemmaInfo(word, 'en');
          
          const response = await dictPromise;
          if (response.ok) {
            const data = await response.json();
            result = parseDictionaryData(data);
          } else {
            try {
              const translation = await translateWord(word, 'en', 'en');
              result = {
                word,
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
            const exampleWord = result.lemmaInfo ? result.lemmaInfo.lemma : word;
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
        } 
        // Scenario 3: Explicit source languages (EN or FR) and other target pairs
        else {
          try {
            const translationPromise = translateWord(word, source, target);
            const lemmaPromise = fetchLemmaInfo(word, source);
            
            const translation = await translationPromise;
            
            let phonetic = '';
            let audio = '';
            let dictExample = null;
            if (source === 'en') {
              try {
                const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
                const dictRes = await fetch(dictUrl);
                if (dictRes.ok) {
                  const dictData = await dictRes.json();
                  const parsed = parseDictionaryData(dictData);
                  phonetic = parsed.phonetic;
                  audio = parsed.audio;
                  dictExample = parsed.example;
                }
              } catch (e) {
                console.log('Unable to fetch English phonetics/audio:', e);
              }
            }
            
            const { lemmaInfo, isVerb, wiktionaryDefinitions, example } = await lemmaPromise;
            
            const definitions = (source === 'fr' && wiktionaryDefinitions && wiktionaryDefinitions.length > 0)
              ? wiktionaryDefinitions
              : [translation];
              
            result = {
              word,
              translation: translation,
              phonetic,
              audio,
              definitions,
              detectedLang: source,
              lemmaInfo,
              isVerb,
              example: dictExample || example
            };
            
            if (!result.example) {
              const exampleWord = result.lemmaInfo ? result.lemmaInfo.lemma : word;
              try {
                result.example = await fetchFallbackExample(exampleWord, source, target);
              } catch (e) {
                console.warn('Fallback example fetch failed:', e);
              }
            }
          } catch (error) {
            throw new Error('Translation service is temporarily unavailable');
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
