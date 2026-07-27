// test_links.js - TDD Unit Tests for P0 Language-Aware Dynamic Reference Links

const fs = require('fs');
const path = require('path');

// Load utils script
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

// Load ui script
global.escapeHtml = str => str || '';
const uiCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
eval(uiCode.replace('const UIComponents =', 'global.UIComponents ='));

async function runDynamicLinksTddTests() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop P0 Dynamic Language Reference Links TDD Unit Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  const testCases = [
    {
      lang: 'ja',
      word: '番組',
      expectedNames: ['Jisho', 'Weblio', 'OJAD'],
      expectedUrls: [
        'https://jisho.org/search/%E7%95%AA%E7%B5%84',
        'https://cjjc.weblio.jp/content/%E7%95%AA%E7%B5%84',
        'https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:%E7%95%AA%E7%B5%84'
      ]
    },
    {
      lang: 'fr',
      explainLang: 'zh-TW',
      word: 'contente',
      expectedNames: ['Larousse', 'WordReference', 'CNRTL', '法語助手'],
      expectedUrls: [
        'https://www.larousse.fr/dictionnaires/francais/contente',
        'https://www.wordreference.com/fren/contente',
        'https://www.cnrtl.fr/definition/contente',
        'https://www.frdic.com/dicts/fr/contente'
      ]
    },
    {
      lang: 'fr',
      explainLang: 'en',
      word: 'contente',
      expectedNames: ['Larousse', 'WordReference', 'CNRTL'],
      expectedUrls: [
        'https://www.larousse.fr/dictionnaires/francais/contente',
        'https://www.wordreference.com/fren/contente',
        'https://www.cnrtl.fr/definition/contente'
      ]
    },
    {
      lang: 'es',
      word: 'hola',
      expectedNames: ['SpanishDict', 'RAE', 'WordReference'],
      expectedUrls: [
        'https://www.spanishdict.com/translate/hola',
        'https://dle.rae.es/hola',
        'https://www.wordreference.com/es/en/translation.asp?spen=hola'
      ]
    },
    {
      lang: 'de',
      word: 'haus',
      expectedNames: ['Duden', 'DWDS', 'Leo'],
      expectedUrls: [
        'https://www.duden.de/suchen/dudenonline/haus',
        'https://www.dwds.de/wb/haus',
        'https://dict.leo.org/german-english/haus'
      ]
    },
    {
      lang: 'ko',
      word: '안녕',
      expectedNames: ['Naver', 'Daum'],
      expectedUrls: [
        'https://dict.naver.com/search.nhn?query=%EC%95%88%EB%85%95',
        'https://dic.daum.net/search.do?q=%EC%95%88%EB%85%95'
      ]
    },
    {
      lang: 'it',
      word: 'ciao',
      expectedNames: ['Treccani', 'WordReference'],
      expectedUrls: [
        'https://www.treccani.it/vocabolario/ricerca/ciao/',
        'https://www.wordreference.com/iten/ciao'
      ]
    },
    {
      lang: 'pt',
      word: 'obrigado',
      expectedNames: ['Priberam', 'WordReference'],
      expectedUrls: [
        'https://dicionario.priberam.org/obrigado',
        'https://www.wordreference.com/pten/obrigado'
      ]
    },
    {
      lang: 'zh-TW',
      word: '萌典',
      expectedNames: ['MoeDict', 'WordReference'],
      expectedUrls: [
        'https://www.moedict.tw/%E8%90%8C%E5%85%B8',
        'https://www.wordreference.com/zhen/%E8%90%8C%E5%85%B8'
      ]
    },
    {
      lang: 'en',
      word: 'cat',
      expectedNames: ['Cambridge', 'Oxford', 'Merriam-Webster'],
      expectedUrls: [
        'https://dictionary.cambridge.org/dictionary/english/cat',
        'https://www.oxfordlearnersdictionaries.com/definition/english/cat',
        'https://www.merriam-webster.com/dictionary/cat'
      ]
    }
  ];

  testCases.forEach((tc, idx) => {
    console.log(`\n▶ [Test ${idx + 1}] Checking Language "${tc.lang}" (explain: "${tc.explainLang || 'default'}") for word "${tc.word}"`);
    if (typeof getDynamicReferenceLinks === 'function') {
      const links = getDynamicReferenceLinks(tc.word, tc.lang, tc.explainLang || '');
      const names = links.map(l => l.name);
      const urls = links.map(l => l.url);

      const namesMatch = JSON.stringify(names) === JSON.stringify(tc.expectedNames);
      const urlsMatch = JSON.stringify(urls) === JSON.stringify(tc.expectedUrls);

      if (namesMatch && urlsMatch) {
        console.log(`   ✅ PASS: Names ${JSON.stringify(names)} & URLs matched perfectly`);
        passed++;
      } else {
        console.log(`   ❌ FAIL: Got names ${JSON.stringify(names)}, expected ${JSON.stringify(tc.expectedNames)}`);
        console.log(`           Got URLs  ${JSON.stringify(urls)}, expected ${JSON.stringify(tc.expectedUrls)}`);
        failed++;
      }
    } else {
      console.log(`   ❌ FAIL: getDynamicReferenceLinks function not implemented`);
      failed++;
    }
  });

  console.log('\n===============================================================');
  console.log(`📊 TDD Test Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runDynamicLinksTddTests();
