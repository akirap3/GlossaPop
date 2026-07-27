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

// Fetch French phonetic IPA from Wiktionary (supports base lemma & fr.wiktionary fallback)
async function fetchFrenchPhonetic(word, lemma = null) {
  const wordsToTry = [word];
  if (lemma && lemma !== word) wordsToTry.push(lemma);
  if (word.endsWith('s') && word.length > 3) wordsToTry.push(word.slice(0, -1));

  for (const w of wordsToTry) {
    try {
      // 1. Query French Wiktionary MediaWiki Action API (fr.wiktionary.org)
      const frRes = await fetch(`https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(w)}&prop=text&format=json&origin=*`, {
        headers: { 'User-Agent': 'GlossaPop/1.0 (Chrome Extension; contact@glossapop.org)' }
      });
      if (frRes.ok) {
        const frData = await frRes.json();
        if (frData && frData.parse && frData.parse.text) {
          const html = frData.parse.text['*'];
          const match = html.match(/class="API"[^>]*>\\([^\\]+)\\<\/span>/) || html.match(/class="IPA"[^>]*>\/([^/]+)\//);
          if (match && match[1]) {
            return `/${match[1]}/`;
          }
        }
      }

      // 2. Query English Wiktionary REST HTML API (en.wiktionary.org)
      const enRes = await fetch(`https://en.wiktionary.org/api/rest_v1/page/html/${encodeURIComponent(w)}`);
      if (enRes.ok) {
        const html = await enRes.text();
        const match = html.match(/Appendix:French_pronunciation.*?class="IPA[^"]*"[^>]*>\/(.*?)\//s);
        if (match && match[1]) {
          return `/${match[1]}/`;
        }
        
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
          const hasVerbEntry = entries.some(e => ['verb', 'participle'].includes((e.partOfSpeech || '').toLowerCase()));

          if (primaryPos === 'verb' || primaryPos === 'participle') {
            isVerb = true;
            isAdjective = hasAdjEntry;
          } else if (primaryPos === 'adjective') {
            isAdjective = true;
            isVerb = hasVerbEntry;
          } else if (primaryPos === 'noun' || primaryPos === 'adverb') {
            isAdjective = false;
            isVerb = false;
          } else {
            isVerb = hasVerbEntry;
            isAdjective = hasAdjEntry;
          }
        }

        // Override isVerb ONLY if lemmaInfo explicitly indicates verb inflection/participle form
        if (lemmaInfo) {
          const desc = (lemmaInfo.description || '').toLowerCase();
          if (desc.includes('verb') || desc.includes('participle of') || desc.includes('conjugation of')) {
            isVerb = true;
          } else if (desc.includes('plural of') || desc.includes('adjective') || desc.includes('noun')) {
            isVerb = false;
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

/**
 * 3-Tier Conjugation Fallback Helper:
 * Priority 1: getFrenchConjugations(verb, tense) [Offline NPM library]
 * Priority 2: Kaikki API (https://api.kaikki.org/dictionary?lang=French&word=...)
 * Priority 3: Wiktionary Inflection API
 */
async function fetchFrenchConjugationsFallback(verb) {
  if (!verb) return null;
  const cleanVerb = verb.trim().toLowerCase();
  
  // Priority 2: Kaikki API JSON Fallback
  try {
    console.log(`🟡 [Priority 2: Kaikki API Fallback] Querying Kaikki API for "${cleanVerb}"...`);
    const kRes = await fetch(`https://api.kaikki.org/dictionary?lang=French&word=${encodeURIComponent(cleanVerb)}`, {
      headers: { 'User-Agent': 'GlossaPop/1.0 (Chrome Extension; contact@glossapop.org)' }
    });
    if (kRes.ok) {
      const kData = await kRes.json();
      if (Array.isArray(kData) && kData.length > 0 && kData[0].forms) {
        const forms = kData[0].forms;
        const result = {
          present: {}, passe_compose: {}, imparfait: {}, plus_que_parfait: {},
          passe_simple: {}, passe_anterieur: {}, futur_simple: {}, futur_anterieur: {},
          subjonctif_present: {}, subjonctif_passe: {}, subjonctif_imparfait: {}, subjonctif_plus_que_parfait: {},
          conditionnel_present: {}, conditionnel_passe: {}, imperatif_present: {}, imperatif_passe: {},
          participe_present: {}, participe_passe: {}
        };
        
        forms.forEach(f => {
          if (f.form && f.tags) {
            const tags = f.tags;
            const formText = f.form.trim();

            const parsePersonKey = () => {
              if (tags.includes('first-person') && tags.includes('singular')) return 'je';
              if (tags.includes('second-person') && tags.includes('singular')) return 'tu';
              if (tags.includes('third-person') && tags.includes('singular')) return 'il';
              if (tags.includes('first-person') && tags.includes('plural')) return 'nous';
              if (tags.includes('second-person') && tags.includes('plural')) return 'vous';
              if (tags.includes('third-person') && tags.includes('plural')) return 'ils';
              return null;
            };

            const key = parsePersonKey();
            if (key) {
              // 1. Présent
              if (tags.includes('present') && tags.includes('indicative')) {
                result.present[key] = withElision('je', formText);
                if (key !== 'je') result.present[key] = `${key} ${formText}`;
              }
              // 2. Imparfait
              else if (tags.includes('imperfect') && tags.includes('indicative')) {
                result.imparfait[key] = withElision('je', formText);
                if (key !== 'je') result.imparfait[key] = `${key} ${formText}`;
              }
              // 3. Futur Simple
              else if (tags.includes('future') && tags.includes('indicative')) {
                result.futur_simple[key] = withElision('je', formText);
                if (key !== 'je') result.futur_simple[key] = `${key} ${formText}`;
              }
              // 4. Subjonctif Présent
              else if (tags.includes('present') && tags.includes('subjunctive')) {
                result.subjonctif_present[key] = withElision('que je', formText);
                if (key === 'tu') result.subjonctif_present[key] = `que tu ${formText}`;
                if (key === 'il') result.subjonctif_present[key] = withElision('que il', formText);
                if (key === 'nous') result.subjonctif_present[key] = `que nous ${formText}`;
                if (key === 'vous') result.subjonctif_present[key] = `que vous ${formText}`;
                if (key === 'ils') result.subjonctif_present[key] = withElision('que ils', formText);
              }
              // 5. Subjonctif Imparfait
              else if (tags.includes('imperfect') && tags.includes('subjunctive')) {
                result.subjonctif_imparfait[key] = withElision('que je', formText);
                if (key === 'tu') result.subjonctif_imparfait[key] = `que tu ${formText}`;
                if (key === 'il') result.subjonctif_imparfait[key] = withElision('que il', formText);
                if (key === 'nous') result.subjonctif_imparfait[key] = `que nous ${formText}`;
                if (key === 'vous') result.subjonctif_imparfait[key] = `que vous ${formText}`;
                if (key === 'ils') result.subjonctif_imparfait[key] = withElision('que ils', formText);
              }
              // 6. Conditionnel Présent
              else if (tags.includes('conditional')) {
                result.conditionnel_present[key] = withElision('je', formText);
                if (key !== 'je') result.conditionnel_present[key] = `${key} ${formText}`;
              }
            }
          }
        });
        result.subjonctif = result.subjonctif_present;
        result.futur = result.futur_simple;

        if (result.present.je || result.present.nous) {
          console.log(`🟡 [Priority 2: Kaikki API Fallback] Successfully fetched 5-tense conjugations for "${cleanVerb}".`);
          return result;
        }
      }
    }
  } catch (e) {
    console.warn('Priority 2 Kaikki API fallback skipped/failed:', e);
  }

  // Priority 3: Wiktionary API Fallback
  try {
    console.log(`🔵 [Priority 3: Wiktionary API Fallback] Querying Wiktionary API for "${cleanVerb}"...`);
    const wRes = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(cleanVerb)}`, {
      headers: { 'User-Agent': 'GlossaPop/1.0 (Chrome Extension; contact@glossapop.org)' }
    });
    if (wRes.ok) {
      const wData = await wRes.json();
      if (wData.fr && Array.isArray(wData.fr)) {
        console.log(`🔵 [Priority 3: Wiktionary API Fallback] Successfully fetched Wiktionary definitions for "${cleanVerb}".`);
        return null;
      }
    }
  } catch (e) {
    console.warn('Priority 3 Wiktionary API fallback skipped/failed:', e);
  }

  return null;
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
      let translation = '';
      if (googleData && googleData[0] && Array.isArray(googleData[0])) {
        translation = googleData[0].filter(item => item && item[0]).map(item => item[0]).join('');
      }
      
      const targetSourceLang = detectedLang;
      
      let result = {
        word: cleanWord,
        translation,
        phonetic: '',
        audio: '',
        definitions: [translation],
        detectedLang: targetSourceLang,
        example: null
      };
      
      const wordCount = cleanWord.split(/\s+/).filter(Boolean).length;
      const isSentence = wordCount > 4;

      // Kick off Lemma info and secondary details (EN dictionary / FR IPA) concurrently for single words
      const lemmaPromise = !isSentence ? fetchLemmaInfo(cleanWord, targetSourceLang) : Promise.resolve(null);
      
      let extraPromise = Promise.resolve(null);
      if (!isSentence && targetSourceLang === 'en') {
        extraPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
          .then(res => res.ok ? res.json() : null)
          .then(dictData => dictData ? parseDictionaryData(dictData) : null)
          .catch(e => null);
      } else if (!isSentence && targetSourceLang === 'fr') {
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
      
      if (wiktionaryDefinitions && wiktionaryDefinitions.length > 0) {
        if (target !== 'en') {
          result.definitions = await translateDefinitions(wiktionaryDefinitions, target);
        } else {
          result.definitions = wiktionaryDefinitions;
        }
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
      
    const phonetic = (guessedLang === 'fr') ? await fetchFrenchPhonetic(word, lemmaInfo ? lemmaInfo.lemma : null) : '';
      
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
