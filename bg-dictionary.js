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
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
      headers: { 'User-Agent': 'GlossaPop/1.0 (Chrome Extension; contact@glossapop.org)' }
    });
    if (res.ok) {
      const data = await res.json();
      const langKey = lang === 'en' ? 'en' : 'fr';
      const entries = data[langKey] || data[lang] || [];
      
      let isVerb = false;
      let isAdjective = false;
      let apiFeminineForm = null;
      let apiConjugations = null;
      
      let lemmaInfo = null;
      let wiktionaryDefinitions = [];
      let synonyms = [];
      let antonyms = [];
      let example = null;
      
      if (entries && Array.isArray(entries)) {
        // Parse definitions, synonyms, and antonyms by part of speech
        const parsedWik = parseWiktionaryDefinitions(entries);
        wiktionaryDefinitions = parsedWik.definitions;
        synonyms = parsedWik.synonyms;
        antonyms = parsedWik.antonyms;
        
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
        
        // Strict Heuristic: Only look for base lemma derivation if the definition explicitly indicates an inflected form.
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.definitions && firstEntry.definitions[0]) {
          const firstDefHtml = firstEntry.definitions[0].definition || '';
          const lowerDef = firstDefHtml.toLowerCase();
          if (lowerDef.includes('participle of') || lowerDef.includes('inflection of') || lowerDef.includes('plural of') || lowerDef.includes('form of') || firstDefHtml.includes('class="form-of-definition')) {
            const matches = firstDefHtml.matchAll(/href="\/wiki\/([^"#\s>]+)[^"]*"\s+title="([^"]+)"/g);
            for (const m of matches) {
              const lemmaCandidate = decodeURIComponent(m[1]).split('#')[0].replace(/_/g, ' ');
              // Skip Wiktionary special namespace pages (like Appendix:, Category:, Help:)
              if (!lemmaCandidate.includes(':') && lemmaCandidate.toLowerCase() !== word.toLowerCase()) {
                let description = firstDefHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                lemmaInfo = { lemma: lemmaCandidate, description };
                break;
              }
            }
          }
        }

        // Pure Dynamic POS Classification based on primary entry & derived lemmaInfo
        if (entries.length > 0) {
          let primaryPos = (entries[0].partOfSpeech || '').toLowerCase();
          if (primaryPos === 'symbol' && entries.length > 1) {
            primaryPos = (entries[1].partOfSpeech || '').toLowerCase();
          }
          const hasAdjEntry = entries.some(e => (e.partOfSpeech || '').toLowerCase() === 'adjective');
          
          if (primaryPos === 'verb' || primaryPos === 'participle') {
            isVerb = true;
            isAdjective = hasAdjEntry;
          } else if (primaryPos === 'adjective') {
            isAdjective = true;
            isVerb = !!lemmaInfo || entries.some(e => {
              const pos = (e.partOfSpeech || '').toLowerCase();
              if (pos !== 'verb' && pos !== 'participle') return false;
              return (e.definitions || []).some(d => {
                const defText = (d.definition || '').toLowerCase();
                return defText.includes('participle of') || defText.includes('inflection of') || defText.includes('past historic') || defText.includes('form of');
              });
            });
          } else if (primaryPos === 'adverb') {
            isAdjective = false;
            isVerb = false;
          } else if (primaryPos === 'noun') {
            isAdjective = false;
            isVerb = false;
          } else {
            isVerb = entries.some(e => ['verb', 'participle'].includes((e.partOfSpeech || '').toLowerCase()));
            isAdjective = hasAdjEntry;
          }
        }

        // Override isVerb if lemmaInfo indicates verb inflection/participle form
        if (lemmaInfo) {
          const desc = (lemmaInfo.description || '').toLowerCase();
          if (!desc.includes('plural of') && !desc.includes('adverbial form')) {
            isVerb = true;
          }
        }

        // Dynamically fetch base lemma definitions, synonyms, and antonyms for inflected forms (e.g. automobilistes -> automobiliste)
        if (lemmaInfo && lemmaInfo.lemma) {
          try {
            const lemmaRes = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(lemmaInfo.lemma)}`, {
              headers: { 'User-Agent': 'GlossaPop/1.0 (Chrome Extension; contact@glossapop.org)' }
            });
            if (lemmaRes.ok) {
              const lemmaData = await lemmaRes.json();
              const lemmaEntries = lemmaData[langKey] || lemmaData[lang] || [];
              if (lemmaEntries && Array.isArray(lemmaEntries)) {
                const parsedLemmaWik = parseWiktionaryDefinitions(lemmaEntries);
                if (synonyms.length === 0) synonyms = parsedLemmaWik.synonyms || [];
                if (antonyms.length === 0) antonyms = parsedLemmaWik.antonyms || [];
                
                // Append base lemma definitions so inflected forms show the actual English meaning
                if (parsedLemmaWik.definitions && Array.isArray(parsedLemmaWik.definitions)) {
                  parsedLemmaWik.definitions.forEach(d => {
                    if (!wiktionaryDefinitions.includes(d)) {
                      wiktionaryDefinitions.push(d);
                    }
                  });
                }
              }
            }
          } catch (e) {
            console.warn('Dynamic root lemma definitions fetch failed:', e);
          }
        }

        // Hybrid API Extraction for dynamic Feminine Form & Conjugations
        entries.forEach(entry => {
          if (entry.definitions) {
            entry.definitions.forEach(d => {
              const html = d.definition || '';
              const femMatch = html.match(/feminine\s+(?:singular\s+)?of\s+<a[^>]+>([^<]+)<\/a>/i) ||
                               html.match(/feminine\s+form\s+of\s+<a[^>]+>([^<]+)<\/a>/i);
              if (femMatch && !apiFeminineForm) {
                apiFeminineForm = femMatch[1].trim();
              }
            });
          }
        });
      }
      return { lemmaInfo, isVerb, isAdjective, wiktionaryDefinitions, synonyms, antonyms, example, apiFeminineForm, apiConjugations };
    }
  } catch (e) {
    console.warn('Wiktionary lemma fetch failed:', e);
  }
  return { lemmaInfo: null, isVerb: false, isAdjective: false, wiktionaryDefinitions: [], synonyms: [], antonyms: [], example: null, apiFeminineForm: null, apiConjugations: null };
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
        if (extraRes.synonyms) result.synonyms = extraRes.synonyms;
        if (extraRes.antonyms) result.antonyms = extraRes.antonyms;
        if (target === 'en' && extraRes.definitions && extraRes.definitions.length > 0) {
          result.definitions = extraRes.definitions;
        }
      }

      const { lemmaInfo, isVerb, isAdjective, wiktionaryDefinitions, synonyms: wikSyn, antonyms: wikAnt, example } = lemmaRes || {};
      result.lemmaInfo = lemmaInfo || null;
      result.isVerb = isVerb || false;
      result.isAdjective = isAdjective || false;
      
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
      
      // Combine synonyms & antonyms dynamically from Wiktionary and API queries
      result.synonyms = Array.from(new Set([
        ...(result.synonyms || []),
        ...(wikSyn || [])
      ])).filter(Boolean).slice(0, 6);

      result.antonyms = Array.from(new Set([
        ...(result.antonyms || []),
        ...(wikAnt || [])
      ])).filter(Boolean).slice(0, 6);

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
