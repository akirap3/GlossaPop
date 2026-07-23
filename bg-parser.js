// bg-parser.js - Clean and parse Wiktionary and Free Dictionary API responses

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
  
  // Extract definitions, synonyms, and antonyms by parts of speech
  const definitions = [];
  const synonyms = new Set();
  const antonyms = new Set();
  let example = null;
  if (entry.meanings && Array.isArray(entry.meanings)) {
    entry.meanings.forEach(m => {
      const partOfSpeech = m.partOfSpeech || '';
      if (m.synonyms && Array.isArray(m.synonyms)) {
        m.synonyms.forEach(s => synonyms.add(s));
      }
      if (m.antonyms && Array.isArray(m.antonyms)) {
        m.antonyms.forEach(a => antonyms.add(a));
      }
      if (m.definitions && Array.isArray(m.definitions)) {
        // Retrieve up to 2 definitions per part of speech to keep layout clean
        m.definitions.slice(0, 2).forEach(d => {
          definitions.push(`[${partOfSpeech}] ${d.definition}`);
          if (d.synonyms && Array.isArray(d.synonyms)) d.synonyms.forEach(s => synonyms.add(s));
          if (d.antonyms && Array.isArray(d.antonyms)) d.antonyms.forEach(a => antonyms.add(a));
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
    example,
    synonyms: Array.from(synonyms).slice(0, 5),
    antonyms: Array.from(antonyms).slice(0, 5)
  };
}
