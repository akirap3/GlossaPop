// test_languages.js - Categorized Suite 2 for Multi-Language Matrix, Sensor & Dynamic Reference Links

const fs = require('fs');
const path = require('path');

// Load dependencies
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

global.chrome = {
  storage: {
    sync: {
      get: (defaults, cb) => cb(defaults),
      set: (obj, cb) => cb && cb()
    },
    onChanged: { addListener: () => {} }
  }
};

const settingsCode = fs.readFileSync(path.join(__dirname, '../settings.js'), 'utf8');
eval(settingsCode.replace('let settings =', 'global.settings ='));

const audioCode = fs.readFileSync(path.join(__dirname, '../audio.js'), 'utf8');
eval(audioCode);

async function runLanguagesSuite() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop Categorized Suite 2: Languages, Sensor & Links');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // [SUB-SUITE 2.1] Default Language Settings Initialization
  // -------------------------------------------------------------
  console.log('\n▶ [2.1] Checking Default Language Settings');
  if (settings.explainLangA === 'zh-TW' && settings.explainLangB === 'en') {
    console.log('   ✅ PASS: Default explanation language matrix initialized correctly');
    passed++;
  } else {
    console.log('   ❌ FAIL: Default language matrix initialization error');
    failed++;
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 2.2] Audio Speech Voice Locales
  // -------------------------------------------------------------
  console.log('\n▶ [2.2] Checking Audio Speech Voice Locales');
  const locales = [
    { lang: 'en', expected: 'en-US' },
    { lang: 'fr', expected: 'fr-FR' },
    { lang: 'es', expected: 'es-ES' },
    { lang: 'de', expected: 'de-DE' },
    { lang: 'ja', expected: 'ja-JP' },
    { lang: 'ko', expected: 'ko-KR' },
    { lang: 'it', expected: 'it-IT' },
    { lang: 'pt', expected: 'pt-PT' }
  ];

  locales.forEach(loc => {
    const res = getSpeechVoiceLocale(loc.lang);
    if (res === loc.expected) {
      console.log(`   ✅ PASS: Language "${loc.lang}" ➔ Locale "${res}"`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Language "${loc.lang}" ➔ Got "${res}", expected "${loc.expected}"`);
      failed++;
    }
  });

  // -------------------------------------------------------------
  // [SUB-SUITE 2.3] Language Display Labels
  // -------------------------------------------------------------
  console.log('\n▶ [2.3] Checking Language Display Labels');
  const labels = [
    { code: 'en', expected: 'EN' },
    { code: 'fr', expected: 'FR' },
    { code: 'es', expected: 'ES' },
    { code: 'de', expected: 'DE' },
    { code: 'ja', expected: 'JA' },
    { code: 'ko', expected: 'KO' },
    { code: 'it', expected: 'IT' },
    { code: 'pt', expected: 'PT' },
    { code: 'zh-TW', expected: '繁中' },
    { code: 'zh-CN', expected: '簡中' }
  ];

  labels.forEach(lbl => {
    const res = getLanguageLabel(lbl.code);
    if (res === lbl.expected) {
      console.log(`   ✅ PASS: Code "${lbl.code}" ➔ Label "${res}"`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Code "${lbl.code}" ➔ Got "${res}", expected "${lbl.expected}"`);
      failed++;
    }
  });

  // -------------------------------------------------------------
  // [SUB-SUITE 2.4] Auto Page Language Sensor (detectPageLanguage)
  // -------------------------------------------------------------
  console.log('\n▶ [2.4] Checking Automatic Page Language Sensor (detectPageLanguage)');
  const domTests = [
    { doc: { documentElement: { lang: 'ja' } }, expected: 'ja' },
    { doc: { documentElement: { lang: 'fr-FR' } }, expected: 'fr' },
    { doc: { documentElement: { lang: 'es-ES' } }, expected: 'es' },
    { doc: { documentElement: { lang: 'de' } }, expected: 'de' },
    { doc: { documentElement: { lang: '' }, querySelector: () => ({ getAttribute: () => 'zh_TW' }) }, expected: 'zh-TW' },
    { doc: { documentElement: { lang: '' }, querySelector: () => null }, expected: 'en' }
  ];

  domTests.forEach((t, i) => {
    const res = detectPageLanguage(t.doc);
    if (res === t.expected) {
      console.log(`   ✅ PASS: Sensor Case ${i + 1} ➔ Detected "${res}"`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Sensor Case ${i + 1} expected "${t.expected}", got "${res}"`);
      failed++;
    }
  });

  // -------------------------------------------------------------
  // [SUB-SUITE 2.5] Dynamic Language Reference Links
  // -------------------------------------------------------------
  console.log('\n▶ [2.5] Checking Language-Aware Dynamic Reference Links');
  const linkTests = [
    {
      lang: 'ja', word: '番組',
      expectedNames: ['Jisho', 'Weblio', 'OJAD'],
      expectedUrls: [
        'https://jisho.org/search/%E7%95%AA%E7%B5%84',
        'https://cjjc.weblio.jp/content/%E7%95%AA%E7%B5%84',
        'https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:%E7%95%AA%E7%B5%84'
      ]
    },
    {
      lang: 'fr', explainLang: 'zh-TW', word: 'contente',
      expectedNames: ['Larousse', 'WordReference', 'CNRTL', '法語助手'],
      expectedUrls: [
        'https://www.larousse.fr/dictionnaires/francais/contente',
        'https://www.wordreference.com/fren/contente',
        'https://www.cnrtl.fr/definition/contente',
        'https://www.frdic.com/dicts/fr/contente'
      ]
    },
    {
      lang: 'fr', explainLang: 'en', word: 'contente',
      expectedNames: ['Larousse', 'WordReference', 'CNRTL'],
      expectedUrls: [
        'https://www.larousse.fr/dictionnaires/francais/contente',
        'https://www.wordreference.com/fren/contente',
        'https://www.cnrtl.fr/definition/contente'
      ]
    },
    {
      lang: 'es', word: 'hola',
      expectedNames: ['SpanishDict', 'RAE', 'WordReference'],
      expectedUrls: [
        'https://www.spanishdict.com/translate/hola',
        'https://dle.rae.es/hola',
        'https://www.wordreference.com/es/en/translation.asp?spen=hola'
      ]
    },
    {
      lang: 'de', word: 'haus',
      expectedNames: ['Duden', 'DWDS', 'Leo'],
      expectedUrls: [
        'https://www.duden.de/suchen/dudenonline/haus',
        'https://www.dwds.de/wb/haus',
        'https://dict.leo.org/german-english/haus'
      ]
    },
    {
      lang: 'ko', word: '안녕',
      expectedNames: ['Naver', 'Daum'],
      expectedUrls: [
        'https://dict.naver.com/search.nhn?query=%EC%95%88%EB%85%95',
        'https://dic.daum.net/search.do?q=%EC%95%88%EB%85%95'
      ]
    },
    {
      lang: 'it', word: 'ciao',
      expectedNames: ['Treccani', 'WordReference'],
      expectedUrls: [
        'https://www.treccani.it/vocabolario/ricerca/ciao/',
        'https://www.wordreference.com/iten/ciao'
      ]
    },
    {
      lang: 'pt', word: 'obrigado',
      expectedNames: ['Priberam', 'WordReference'],
      expectedUrls: [
        'https://dicionario.priberam.org/obrigado',
        'https://www.wordreference.com/pten/obrigado'
      ]
    },
    {
      lang: 'zh-TW', word: '萌典',
      expectedNames: ['MoeDict', 'WordReference'],
      expectedUrls: [
        'https://www.moedict.tw/%E8%90%8C%E5%85%B8',
        'https://www.wordreference.com/zhen/%E8%90%8C%E5%85%B8'
      ]
    },
    {
      lang: 'en', word: 'cat',
      expectedNames: ['Cambridge', 'Oxford', 'Merriam-Webster'],
      expectedUrls: [
        'https://dictionary.cambridge.org/dictionary/english/cat',
        'https://www.oxfordlearnersdictionaries.com/definition/english/cat',
        'https://www.merriam-webster.com/dictionary/cat'
      ]
    }
  ];

  linkTests.forEach((tc, idx) => {
    const res = getDynamicReferenceLinks(tc.word, tc.lang, tc.explainLang || '');
    const names = res.map(l => l.name);
    const urls = res.map(l => l.url);

    const namesMatch = JSON.stringify(names) === JSON.stringify(tc.expectedNames);
    const urlsMatch = JSON.stringify(urls) === JSON.stringify(tc.expectedUrls);

    if (namesMatch && urlsMatch) {
      console.log(`   ✅ PASS: Links Case ${idx + 1} (${tc.lang}) ➔ ${JSON.stringify(names)} matched`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Links Case ${idx + 1} (${tc.lang}) failed`);
      failed++;
    }
  });

  // -------------------------------------------------------------
  // [SUB-SUITE 2.6] 10-Language Word Micro-Sensor (detectWordLanguage)
  // -------------------------------------------------------------
  console.log('\n▶ [2.6] Checking 10-Language Word Micro-Sensor (detectWordLanguage)');
  const wordSensorTests = [
    { word: 'たべもの', fallback: 'en', expected: 'ja' },
    { word: 'ラーメン', fallback: 'en', expected: 'ja' },
    { word: '안녕하세요', fallback: 'en', expected: 'ko' },
    { word: 'groß', fallback: 'en', expected: 'de' },
    { word: 'schön', fallback: 'en', expected: 'de' },
    { word: 'español', fallback: 'en', expected: 'es' },
    { word: 'français', fallback: 'en', expected: 'fr' },
    { word: 's’appeler', fallback: 'en', expected: 'fr' },
    { word: 'pão', fallback: 'en', expected: 'pt' },
    { word: '繁體中文', fallback: 'en', expected: 'zh-TW' },
    { word: 'hello', fallback: 'en', expected: 'en' }
  ];

  wordSensorTests.forEach((tc, idx) => {
    const res = typeof detectWordLanguage === 'function' ? detectWordLanguage(tc.word, tc.fallback) : 'NOT_IMPLEMENTED';
    if (res === tc.expected) {
      console.log(`   ✅ PASS: Micro-Sensor Case ${idx + 1} ("${tc.word}") ➔ Detected "${res}"`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Micro-Sensor Case ${idx + 1} ("${tc.word}") expected "${tc.expected}", got "${res}"`);
      failed++;
    }
  });

  console.log('\n===============================================================');
  console.log(`📊 Categorized Suite 2 Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runLanguagesSuite();

