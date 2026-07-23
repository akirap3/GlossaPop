// bg-dictionary.js - Orchestrates dictionary lookups, root words, and conjugations

// High-performance LRU in-memory cache to instantly return repeated translation queries (0ms latency)
const translationCache = new Map();
const MAX_CACHE_SIZE = 150;

function getCachedResult(key) {
  if (translationCache.has(key)) {
    const val = translationCache.get(key);
    // Refresh position for LRU eviction order
    translationCache.delete(key);
    translationCache.set(key, val);
    return val;
  }
  return null;
}

function setCachedResult(key, value) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

// Fetch French phonetic IPA from Wiktionary HTML
async function fetchFrenchPhonetic(word) {
  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/html/${encodeURIComponent(word)}`);
    if (res.ok) {
      const html = await res.text();
      
      // Pattern 1: French pronunciation key
      const match = html.match(/Appendix:French_pronunciation.*?class="IPA[^"]*"[^>]*>\/(.*?)\//s);
      if (match && match[1]) {
        return `/${match[1]}/`;
      }
      
      // Pattern 2: Near French section
      const frenchIdx = html.indexOf('id="French"');
      if (frenchIdx !== -1) {
        const substring = html.substring(frenchIdx, frenchIdx + 3000);
        const ipaMatch = substring.match(/class="IPA[^"]*"[^>]*>\/(.*?)\//);
        if (ipaMatch && ipaMatch[1]) {
          return `/${ipaMatch[1]}/`;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch French IPA phonetic:', e);
  }
  return '';
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
  const cleanWord = word.trim();
  const cacheKey = `auto:${target}:${cleanWord.toLowerCase()}`;
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(cleanWord)}`;
  
  try {
    const response = await fetch(googleUrl);
    if (response.ok) {
      const googleData = await response.json();
      const detectedLang = (googleData && googleData[2]) ? googleData[2] : 'en';
      const translation = (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) ? googleData[0][0][0] : '';
      
      const targetSourceLang = (detectedLang === 'fr' || detectedLang === 'en') ? detectedLang : 'en';
      
      let result = {
        word: cleanWord,
        translation,
        phonetic: '',
        audio: '',
        definitions: [translation],
        detectedLang: targetSourceLang,
        example: null
      };
      
      // Kick off Lemma info and secondary details (EN dictionary / FR IPA) concurrently
      const lemmaPromise = fetchLemmaInfo(cleanWord, targetSourceLang);
      
      let extraPromise = Promise.resolve(null);
      if (targetSourceLang === 'en') {
        extraPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
          .then(res => res.ok ? res.json() : null)
          .then(dictData => dictData ? parseDictionaryData(dictData) : null)
          .catch(e => null);
      } else if (targetSourceLang === 'fr') {
        extraPromise = fetchFrenchPhonetic(cleanWord)
          .then(phonetic => ({ phonetic }))
          .catch(e => null);
      }

      const [lemmaRes, extraRes] = await Promise.all([lemmaPromise, extraPromise]);

      if (extraRes) {
        if (extraRes.phonetic) result.phonetic = extraRes.phonetic;
        if (extraRes.audio) result.audio = extraRes.audio;
        if (extraRes.example) result.example = extraRes.example;
        if (target === 'en' && extraRes.definitions && extraRes.definitions.length > 0) {
          result.definitions = extraRes.definitions;
        }
      }

      const { lemmaInfo, isVerb, wiktionaryDefinitions, example } = lemmaRes || {};
      result.lemmaInfo = lemmaInfo || null;
      result.isVerb = isVerb || false;
      
      if (example && !result.example) {
        result.example = example;
      }
      
      if (!result.example) {
        const exampleWord = result.lemmaInfo ? result.lemmaInfo.lemma : cleanWord;
        try {
          result.example = await fetchFallbackExample(exampleWord, targetSourceLang, target);
        } catch (e) {
          console.warn('Fallback example fetch failed:', e);
        }
      }
      
      if (targetSourceLang === 'fr' && wiktionaryDefinitions && wiktionaryDefinitions.length > 0) {
        result.definitions = wiktionaryDefinitions;
      }
      
      setCachedResult(cacheKey, result);
      return result;
    }
    throw new Error('Google Translate detection failed');
  } catch (error) {
    console.warn('Auto-detect query failed, falling back to local accent checking:', error);
    
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
      
    const phonetic = (guessedLang === 'fr') ? await fetchFrenchPhonetic(word) : '';
      
    return {
      word,
      translation,
      phonetic,
      audio: '',
      definitions,
      detectedLang: guessedLang,
      lemmaInfo,
      isVerb,
      example: resultExample
    };
  }
}
