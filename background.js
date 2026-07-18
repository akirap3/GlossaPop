// background.js - Handles cross-origin API requests to bypass CORS restrictions

// Helper function to translate using Lingva with a robust fallback to Google's official translate API
async function translateWord(word, source, target) {
  const lingvaUrl = `https://lingva.ml/api/v1/${source}/${target}/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(lingvaUrl);
    if (response.ok) {
      const data = await response.json();
      if (data && data.translation) {
        return data.translation;
      }
    }
    throw new Error(`Lingva request returned status: ${response.status}`);
  } catch (error) {
    console.warn('Lingva instance error, falling back to official Google Translate API:', error);
    
    // Fallback: Use Google Translate's public client API endpoint
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(word)}`;
    const response = await fetch(googleUrl);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0]; // Extract translated text from the nested arrays
      }
      throw new Error('Unexpected translation response format from fallback API');
    }
    throw new Error('Both Lingva and Google Translate fallback APIs failed');
  }
}

// Parses definitions from Wiktionary by part of speech for rich multilingual dictionary display
function parseWiktionaryDefinitions(entries) {
  const definitions = [];
  if (!entries || !Array.isArray(entries)) return definitions;
  
  entries.forEach(entry => {
    const partOfSpeech = entry.partOfSpeech || '';
    if (entry.definitions && Array.isArray(entry.definitions)) {
      // Retrieve up to 2 definitions per part of speech to keep it clean
      entry.definitions.slice(0, 2).forEach(d => {
        let defText = d.definition || '';
        // Strip HTML tags
        defText = defText.replace(/<[^>]+>/g, ' ');
        defText = defText.replace(/\s+/g, ' ').trim();
        if (defText) {
          definitions.push(`[${partOfSpeech}] ${defText}`);
        }
      });
    }
  });
  return definitions;
}

// Fetch a fallback example sentence from Tatoeba open sentence database
async function fetchTatoebaExample(word, sourceLang, targetLang) {
  const tatoebaLang = sourceLang === 'fr' ? 'fra' : 'eng';
  const url = `https://api.tatoeba.org/v1/sentences?q=${encodeURIComponent(word)}&lang=${tatoebaLang}&sort=relevance`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        const sentence = data.data[0].text;
        if (sentence) {
          const translation = await translateWord(sentence, sourceLang, targetLang);
          return { text: sentence, translation: translation };
        }
      }
    }
  } catch (e) {
    console.warn('Tatoeba example fetch failed:', e);
  }
  return null;
}

// Fetch a fallback example sentence using Google Translate's public examples API, falling back to Tatoeba
async function fetchFallbackExample(word, sourceLang, targetLang) {
  const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=ex&q=${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(googleUrl);
    if (response.ok) {
      const data = await response.json();
      // Google examples array is stored at index 13
      if (data && data[13] && data[13][0] && Array.isArray(data[13][0])) {
        let bestExample = '';
        for (const exArr of data[13][0]) {
          if (exArr && exArr[0]) {
            let text = exArr[0].replace(/<[^>]+>/g, '').trim();
            // Prefer examples that are longer than a single word fragment
            if (text.length > word.length + 3) {
              bestExample = text;
              break;
            }
          }
        }
        
        // Fallback to first item if no long sentence was found
        if (!bestExample && data[13][0][0] && data[13][0][0][0]) {
          bestExample = data[13][0][0][0].replace(/<[^>]+>/g, '').trim();
        }
        
        if (bestExample) {
          // Translate the example sentence into targetLang
          const translation = await translateWord(bestExample, sourceLang, targetLang);
          return { text: bestExample, translation: translation };
        }
      }
    }
  } catch (error) {
    console.warn('Google Translate fallback example retrieval failed, trying Tatoeba:', error);
  }
  
  // Tertiary Fallback: Query Tatoeba
  return await fetchTatoebaExample(word, sourceLang, targetLang);
}

// Query Wiktionary to check for lemma (root word), derivation info, and parts of speech
async function fetchLemmaInfo(word, lang) {
  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
    if (res.ok) {
      const data = await res.json();
      const langKey = lang === 'en' ? 'en' : 'fr';
      const entries = data[langKey];
      
      let isVerb = false;
      if (langKey === 'fr' && entries && Array.isArray(entries)) {
        isVerb = entries.some(e => e.partOfSpeech === 'Verb');
      }
      
      let lemmaInfo = null;
      let wiktionaryDefinitions = [];
      let example = null;
      
      if (entries && Array.isArray(entries)) {
        // Parse definitions by part of speech
        wiktionaryDefinitions = parseWiktionaryDefinitions(entries);
        
        // Find first available example sentence
        for (const entry of entries) {
          if (entry.definitions && Array.isArray(entry.definitions)) {
            for (const def of entry.definitions) {
              if (def.parsedExamples && Array.isArray(def.parsedExamples) && def.parsedExamples.length > 0) {
                const exObj = def.parsedExamples[0];
                if (exObj.example) {
                  let text = exObj.example.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                  let translation = '';
                  if (exObj.translation) {
                    translation = exObj.translation.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                  }
                  example = { text, translation };
                  break;
                }
              } else if (def.examples && Array.isArray(def.examples) && def.examples.length > 0) {
                let text = def.examples[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                example = { text, translation: '' };
                break;
              }
            }
          }
          if (example) break;
        }
        
        // Strict Heuristic: Only look for base lemma derivation if the VERY FIRST definition on the page
        // is actually an inflected form (indicated by form-of-definition class).
        // This prevents common base words (like "de", "revenir", "le") from picking up false positive derivations.
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.definitions && firstEntry.definitions[0]) {
          const firstDefHtml = firstEntry.definitions[0].definition || '';
          if (firstDefHtml.includes('class="form-of-definition')) {
            for (const entry of entries) {
              if (entry.definitions && Array.isArray(entry.definitions)) {
                for (const defObj of entry.definitions) {
                  const html = defObj.definition || '';
                  if (html.includes('class="form-of-definition')) {
                    // Match links globally to find all candidates
                    const matches = html.matchAll(/href="\/wiki\/([^"#\s>]+)[^"]*"\s+title="([^"]+)"/g);
                    for (const m of matches) {
                      const lemmaCandidate = decodeURIComponent(m[1]).replace(/_/g, ' ');
                      // Skip Wiktionary special namespace pages (like Appendix:, Category:, Help:)
                      if (!lemmaCandidate.includes(':') && lemmaCandidate.toLowerCase() !== word.toLowerCase()) {
                        // Clean description text
                        let description = html.replace(/<[^>]+>/g, ' ');
                        description = description.replace(/\s+/g, ' ').trim();
                        lemmaInfo = { lemma: lemmaCandidate, description };
                        break;
                      }
                    }
                    if (lemmaInfo) break;
                  }
                }
              }
              if (lemmaInfo) break;
            }
          }
        }
      }
      return { lemmaInfo, isVerb, wiktionaryDefinitions, example };
    }
  } catch (e) {
    console.warn('Wiktionary lemma fetch failed:', e);
  }
  return { lemmaInfo: null, isVerb: false, wiktionaryDefinitions: [], example: null };
}

// Helper to perform translation with auto-detection of the source language
async function autoDetectAndTranslate(word, target) {
  const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(googleUrl);
    if (response.ok) {
      const googleData = await response.json();
      const detectedLang = (googleData && googleData[2]) ? googleData[2] : 'en';
      const translation = (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) ? googleData[0][0][0] : '';
      
      // Map detected language to supported types ('en' or 'fr')
      // If it is neither, fall back to the user's default (typically 'en')
      const targetSourceLang = (detectedLang === 'fr' || detectedLang === 'en') ? detectedLang : 'en';
      
      let result = {
        word,
        translation,
        phonetic: '',
        audio: '',
        definitions: [translation],
        detectedLang: targetSourceLang,
        example: null
      };
      
      // Fetch lemma info in parallel
      const lemmaPromise = fetchLemmaInfo(word, targetSourceLang);
      
      // If English is detected, fetch rich phonetic and audio pronunciations
      if (targetSourceLang === 'en') {
        try {
          const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
          const dictRes = await fetch(dictUrl);
          if (dictRes.ok) {
            const dictData = await dictRes.json();
            const parsed = parseDictionaryData(dictData);
            result.phonetic = parsed.phonetic || '';
            result.audio = parsed.audio || '';
            result.example = parsed.example || null;
            
            // If target explanation language is English, display detailed definitions
            if (target === 'en' && parsed.definitions && parsed.definitions.length > 0) {
              result.definitions = parsed.definitions;
            }
          }
        } catch (e) {
          console.log('Unable to fetch English dictionary info in auto-mode:', e);
        }
      }
      
      const { lemmaInfo, isVerb, wiktionaryDefinitions, example } = await lemmaPromise;
      result.lemmaInfo = lemmaInfo;
      result.isVerb = isVerb;
      
      if (example && !result.example) {
        result.example = example;
      }
      
      // Fetch fallback example sentence if still null (try lemma form first if available)
      if (!result.example) {
        const exampleWord = result.lemmaInfo ? result.lemmaInfo.lemma : word;
        try {
          result.example = await fetchFallbackExample(exampleWord, targetSourceLang, target);
        } catch (e) {
          console.warn('Fallback example fetch failed:', e);
        }
      }
      
      // Use Wiktionary rich part-of-speech definitions for French words
      if (targetSourceLang === 'fr' && wiktionaryDefinitions && wiktionaryDefinitions.length > 0) {
        result.definitions = wiktionaryDefinitions;
      }
      
      return result;
    }
    throw new Error('Google Translate detection failed');
  } catch (error) {
    console.warn('Auto-detect query failed, falling back to local accent checking:', error);
    
    // Fallback: Check for French accented letters
    const hasFrenchAccents = /[éèàùçâêîôûëïüœæÉÈÀÙÇÂÊÎÔÛËÏÜŒÆ]/.test(word);
    const guessedLang = hasFrenchAccents ? 'fr' : 'en';
    
    const translation = await translateWord(word, guessedLang, target);
    const { lemmaInfo, isVerb, wiktionaryDefinitions, example } = await fetchLemmaInfo(word, guessedLang);
    
    let resultExample = example;
    if (!resultExample) {
      const exampleWord = lemmaInfo ? lemmaInfo.lemma : word;
      try {
        resultExample = await fetchFallbackExample(exampleWord, guessedLang, target);
      } catch (e) {
        console.warn('Fallback example fetch failed:', e);
      }
    }
    
    const definitions = (guessedLang === 'fr' && wiktionaryDefinitions && wiktionaryDefinitions.length > 0) 
      ? wiktionaryDefinitions 
      : [translation];
      
    return {
      word,
      translation,
      phonetic: '',
      audio: '',
      definitions,
      detectedLang: guessedLang,
      lemmaInfo,
      isVerb,
      example: resultExample
    };
  }
}

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

// Parses the JSON response from the Free Dictionary API
function parseDictionaryData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { definitions: [] };
  }
  
  const entry = data[0];
  const word = entry.word;
  
  // Find phonetic script and audio URL
  let phonetic = entry.phonetic || '';
  let audio = '';
  
  if (entry.phonetics && Array.isArray(entry.phonetics)) {
    // Prioritize phonetic items containing audio URLs
    const withAudio = entry.phonetics.find(p => p.audio);
    if (withAudio) {
      audio = withAudio.audio;
      if (!phonetic) phonetic = withAudio.text || '';
    }
    
    // Fallback: search for the first phonetic item containing text
    if (!phonetic) {
      const withText = entry.phonetics.find(p => p.text);
      if (withText) phonetic = withText.text;
    }
  }
  
  // Extract definitions and map by parts of speech
  const definitions = [];
  let example = null;
  if (entry.meanings && Array.isArray(entry.meanings)) {
    entry.meanings.forEach(m => {
      const partOfSpeech = m.partOfSpeech || '';
      if (m.definitions && Array.isArray(m.definitions)) {
        // Retrieve up to 2 definitions per part of speech to keep layout clean
        m.definitions.slice(0, 2).forEach(d => {
          definitions.push(`[${partOfSpeech}] ${d.definition}`);
          if (d.example && !example) {
            example = { text: d.example, translation: '' };
          }
        });
      }
    });
  }
  
  return {
    word,
    phonetic,
    audio,
    definitions,
    example
  };
}
