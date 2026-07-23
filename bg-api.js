// bg-api.js - Handles direct external HTTP queries and translations

// Helper function to translate using Lingva with a robust fallback to Google's official translate API
async function translateWord(word, source, target) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);
  const lingvaUrl = `https://lingva.ml/api/v1/${source}/${target}/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(lingvaUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data && data.translation) {
        return data.translation;
      }
    }
    throw new Error(`Lingva request returned status: ${response.status}`);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Lingva instance error or timeout, falling back to official Google Translate API:', error);
    
    // Fallback: Use Google Translate's public client API endpoint (ultra-fast ~100ms response)
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
