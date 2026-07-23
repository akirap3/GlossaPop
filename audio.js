// audio.js - Multi-tier natural neural voice pronunciation manager

let currentAudioInstance = null;

// Ensure browser voices are pre-loaded into cache upon extension initialization
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

/**
 * Immediately stop all active audio playback (both HTML5 Audio and Web Speech API)
 */
function stopAudio() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch (e) {}
    currentAudioInstance = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Main entrance to play human-like natural voice pronunciation
 */
function playPronunciation(word, lang, dictAudioUrl) {
  stopAudio();

  const cleanText = (word || '').replace(/\s+/g, ' ').trim();
  if (!cleanText) return;

  // 1. For paragraph/long text (>180 chars), use local Web Speech API (handles paragraphs natively)
  if (cleanText.length > 180) {
    speakWordLocal(cleanText, lang);
    return;
  }

  // 2. Try playing Free Dictionary API direct human recording (MP3) if available
  if (lang === 'en' && dictAudioUrl) {
    currentAudioInstance = new Audio(dictAudioUrl);
    currentAudioInstance.play().then(() => {
      console.log('Played Free Dictionary human audio');
    }).catch(err => {
      console.warn('Free Dictionary audio playback failed, falling back to Neural TTS:', err);
      playGoogleNeuralTts(cleanText, lang);
    });
    return;
  }

  // 3. Play Google Translate HD Neural TTS (high-definition natural voice)
  playGoogleNeuralTts(cleanText, lang);
}

/**
 * Play Google Neural Wavenet TTS (24kHz HD Natural Voice)
 */
function playGoogleNeuralTts(word, lang) {
  const ttsLang = lang === 'en' ? 'en' : 'fr';
  // Use client=gtx endpoint for high-definition Wavenet neural voice
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=gtx&q=${encodeURIComponent(word)}`;
  
  currentAudioInstance = new Audio(ttsUrl);
  currentAudioInstance.play().then(() => {
    console.log('Played Google HD Neural TTS audio');
  }).catch(err => {
    console.warn('Google Neural TTS playback failed, falling back to Web Speech API:', err);
    speakWordLocal(word, lang);
  });
}

/**
 * Local Web Speech synthesis with Intelligent HD Neural Voice prioritization
 */
function speakWordLocal(word, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  const langPrefix = lang === 'en' ? 'en' : 'fr';
  utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';

  const voices = window.speechSynthesis.getVoices();
  const matchingVoices = voices.filter(v => v.lang.startsWith(langPrefix));

  if (matchingVoices.length > 0) {
    // Score voices by quality tier to pick the most natural human-like voice
    const scoredVoices = matchingVoices.map(voice => {
      const name = voice.name.toLowerCase();
      let score = 0;

      // Tier 1: Modern Neural / Wavenet / Premium / Enhanced / Natural online voices
      if (name.includes('google') || name.includes('natural') || name.includes('neural') || name.includes('enhanced') || name.includes('premium') || name.includes('online') || name.includes('wavenet')) {
        score += 100;
      }
      // Tier 2: Siri & Premium Human Voice Models
      if (name.includes('siri') || name.includes('samantha') || name.includes('thomas') || name.includes('amélie') || name.includes('amelie') || name.includes('audrey') || name.includes('daniel') || name.includes('karen')) {
        score += 50;
      }
      // Penalty: Known legacy robotic synthesizer voices
      if (name.includes('alex') || name.includes('fred') || name.includes('zarvox') || name.includes('albert') || name.includes('boing') || name.includes('cellos') || name.includes('pipe organ')) {
        score -= 200;
      }

      return { voice, score };
    });

    // Sort descending by score
    scoredVoices.sort((a, b) => b.score - a.score);
    utterance.voice = scoredVoices[0].voice;
  }

  utterance.rate = 0.92; // Natural human speech tempo (slightly relaxed)
  utterance.pitch = 1.0; // Natural pitch
  window.speechSynthesis.speak(utterance);
}
