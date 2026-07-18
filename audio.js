// audio.js - Multi-tier natural voice pronunciation manager

// High-quality voice pronunciation player
function playPronunciation(word, lang, dictAudioUrl) {
  // 1. Try playing Free Dictionary API direct human recording (MP3) if available
  if (lang === 'en' && dictAudioUrl) {
    const audio = new Audio(dictAudioUrl);
    audio.play().then(() => {
      console.log('Played Free Dictionary human audio');
    }).catch(err => {
      console.warn('Free Dictionary audio playback failed, falling back:', err);
      playGoogleTts(word, lang);
    });
    return;
  }
  
  // 2. Play Google Translate TTS (very natural neural speech)
  playGoogleTts(word, lang);
}

function playGoogleTts(word, lang) {
  const ttsLang = lang === 'en' ? 'en' : 'fr';
  // Google Translate TTS keyless endpoint
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(word)}`;
  
  const audio = new Audio(ttsUrl);
  audio.play().then(() => {
    console.log('Played Google Translate TTS audio');
  }).catch(err => {
    console.warn('Google TTS audio playback failed, falling back to Web Speech API:', err);
    // 3. Fallback to Web Speech API (local system synthesis)
    speakWordLocal(word, lang);
  });
}

// Local Web Speech synthesis with premium voice selection as final fallback
function speakWordLocal(word, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  const langPrefix = lang === 'en' ? 'en' : 'fr';
  utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
  
  // Filter voices that match the language prefix (e.g. 'fr' or 'en')
  const voices = window.speechSynthesis.getVoices();
  const matchingVoices = voices.filter(v => v.lang.startsWith(langPrefix));
  
  let selectedVoice = null;
  if (matchingVoices.length > 0) {
    // 1. Try to find a premium neural/google/natural voice for the language
    selectedVoice = matchingVoices.find(v => 
      v.name.toLowerCase().includes('google') || 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('siri') || 
      v.name.toLowerCase().includes('premium') || 
      v.name.toLowerCase().includes('thomas') ||
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('daniel')
    );
    
    // 2. Fall back to the first available voice for the target language (forces correct locale)
    if (!selectedVoice) {
      selectedVoice = matchingVoices[0];
    }
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  utterance.rate = 0.95; // Slightly slower speed sounds more natural
  window.speechSynthesis.speak(utterance);
}
