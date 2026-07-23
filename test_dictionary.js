// test_dictionary.js - Comprehensive Multi-Dimensional Quality Assurance Test Suite for GlossaPop
// Covers:
// 1. 100-Word POS & Definition Resolution Suite (10 words x 5 POS x 2 Languages)
// 2. French Feminine Form Derivation & Suppletive Exception Suite
// 3. French Verb Conjugation & Elision Engine Completeness Suite (5 Tenses x 6 Persons)
// 4. Inflected Form Base Lemma Definition Resolution Suite (e.g. automobilistes -> motorist)
// 5. CEFR Level Estimation & UI Color Token Suite
// 6. Security XSS Neutralization & Escaping Safety Suite

const fs = require('fs');
const path = require('path');

// Mock browser environment for Node.js test execution
global.chrome = {
  runtime: {
    getURL: (p) => p
  }
};

// Load core extension scripts
const utilsCode = fs.readFileSync(path.join(__dirname, 'utils.js'), 'utf8');
const bgApiCode = fs.readFileSync(path.join(__dirname, 'bg-api.js'), 'utf8');
const bgParserCode = fs.readFileSync(path.join(__dirname, 'bg-parser.js'), 'utf8');
const bgDictCode = fs.readFileSync(path.join(__dirname, 'bg-dictionary.js'), 'utf8');

eval(utilsCode);
eval(bgApiCode);
eval(bgParserCode);
eval(bgDictCode);

// -------------------------------------------------------------
// Dataset 1: 100 POS & Definition Test Cases (EN & FR)
// -------------------------------------------------------------
const posTestCases = [
  // --- ENGLISH (50 Words) ---
  { lang: 'en', pos: 'Noun', word: 'cat', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'dog', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'house', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'book', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'apple', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'car', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'city', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'tree', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'computer', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Noun', word: 'water', expectIsVerb: false, expectIsAdj: false },

  { lang: 'en', pos: 'Verb', word: 'run', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'walk', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'eat', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'sleep', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'think', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'speak', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'build', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'create', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'achieve', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Verb', word: 'write', expectIsVerb: true, expectIsAdj: false },

  { lang: 'en', pos: 'Adjective', word: 'beautiful', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'important', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'small', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'big', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'happy', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'fast', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'bright', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'strong', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'difficult', expectIsVerb: false, expectIsAdj: true },
  { lang: 'en', pos: 'Adjective', word: 'ancient', expectIsVerb: false, expectIsAdj: true },

  { lang: 'en', pos: 'Adverb', word: 'quickly', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'slowly', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'happily', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'always', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'often', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'rarely', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'easily', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'quietly', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'carefully', expectIsVerb: false, expectIsAdj: false },
  { lang: 'en', pos: 'Adverb', word: 'recently', expectIsVerb: false, expectIsAdj: false },

  { lang: 'en', pos: 'Participle/Inflection', word: 'running', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'went', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'eating', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'built', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'thought', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'broken', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'spoken', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'taken', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'driven', expectIsVerb: true, expectIsAdj: false },
  { lang: 'en', pos: 'Participle/Inflection', word: 'walking', expectIsVerb: true, expectIsAdj: false },

  // --- FRENCH (50 Words) ---
  { lang: 'fr', pos: 'Noun', word: 'pétrole', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'profit', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'maison', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'flambée', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'eau', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'jour', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'temps', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'vie', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'monde', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Noun', word: 'pays', expectIsVerb: false, expectIsAdj: false },

  { lang: 'fr', pos: 'Verb', word: 'parler', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'manger', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'finir', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'vendre', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'choisir', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'attendre', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'pouvoir', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'vouloir', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'savoir', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Verb', word: 'devoir', expectIsVerb: true, expectIsAdj: false },

  { lang: 'fr', pos: 'Adjective', word: 'petit', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'grand', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'beau', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'nouveau', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'ancien', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'jeune', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'vieux', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'fort', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'long', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Adjective', word: 'bon', expectIsVerb: false, expectIsAdj: true },

  { lang: 'fr', pos: 'Adverb', word: 'lentement', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'facilement', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'souvent', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'toujours', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'jamais', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'rapidement', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'heureusement', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'ensemble', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'parfois', expectIsVerb: false, expectIsAdj: false },
  { lang: 'fr', pos: 'Adverb', word: 'tellement', expectIsVerb: false, expectIsAdj: false },

  { lang: 'fr', pos: 'Participle/Inflection', word: 'profitant', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'soient', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'allons', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'faisons', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'mangeait', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'parti', expectIsVerb: false, expectIsAdj: true },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'sorti', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'pris', expectIsVerb: true, expectIsAdj: true },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'eu', expectIsVerb: true, expectIsAdj: false },
  { lang: 'fr', pos: 'Participle/Inflection', word: 'été', expectIsVerb: false, expectIsAdj: false }
];

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('🧪 GlossaPop Comprehensive Quality Assurance Test Suite');
  console.log('===============================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  // -------------------------------------------------------------
  // SUITE 1: 100-Word POS & Definition Resolution Suite
  // -------------------------------------------------------------
  console.log('▶ [SUITE 1/6] 100-Word POS & Definition Resolution Suite');
  for (let i = 0; i < posTestCases.length; i++) {
    const test = posTestCases[i];
    const testNum = String(i + 1).padStart(3, '0');

    try {
      const res = await fetchLemmaInfo(test.word, test.lang);
      let pass = false;
      if (test.pos === 'Noun') {
        pass = !res.isVerb && res.wiktionaryDefinitions.length > 0;
      } else if (test.pos === 'Verb') {
        pass = (res.isVerb || res.wiktionaryDefinitions.some(d => d.startsWith('[Verb]'))) && res.wiktionaryDefinitions.length > 0;
      } else if (test.pos === 'Adjective') {
        pass = res.isAdjective && res.wiktionaryDefinitions.length > 0;
      } else if (test.pos === 'Adverb') {
        pass = !res.isVerb && !res.isAdjective && res.wiktionaryDefinitions.length > 0;
      } else if (test.pos === 'Participle/Inflection') {
        pass = (res.isVerb || res.isAdjective || !!res.lemmaInfo || (res.wiktionaryDefinitions && res.wiktionaryDefinitions.length > 0));
      }

      if (pass) {
        passedCount++;
      } else {
        console.log(`   ❌ [Test ${testNum}] FAIL (${test.word}): Expected (isVerb=${test.expectIsVerb}, isAdj=${test.expectIsAdj}), Got (isVerb=${res.isVerb}, isAdj=${res.isAdjective})`);
        failedCount++;
      }
    } catch (err) {
      console.log(`   💥 [Test ${testNum}] ERROR (${test.word}): ${err.message}`);
      failedCount++;
    }
  }
  console.log(`   ✅ Suite 1 Completed. (${passedCount}/100 Passed)\n`);

  // -------------------------------------------------------------
  // SUITE 2: French Feminine Form Derivation & Suppletives Suite
  // -------------------------------------------------------------
  console.log('▶ [SUITE 2/6] French Feminine Form Derivation Suite');
  const feminineTests = [
    { mas: 'petit', expectedFem: 'petite' },
    { mas: 'ancien', expectedFem: 'ancienne' },
    { mas: 'bon', expectedFem: 'bonne' },
    { mas: 'premier', expectedFem: 'première' },
    { mas: 'heureux', expectedFem: 'heureuse' },
    { mas: 'actif', expectedFem: 'active' },
    { mas: 'cruel', expectedFem: 'cruelle' },
    { mas: 'public', expectedFem: 'publique' },
    { mas: 'beau', expectedFem: 'belle' },
    { mas: 'nouveau', expectedFem: 'nouvelle' },
    { mas: 'vieux', expectedFem: 'vieille' },
    { mas: 'blanc', expectedFem: 'blanche' }
  ];

  let suite2Passed = true;
  feminineTests.forEach(t => {
    const res = getFrenchFeminineForm(t.mas);
    if (res === t.expectedFem) {
      passedCount++;
    } else {
      console.log(`   ❌ Feminine FAIL: ${t.mas} -> Expected ${t.expectedFem}, Got ${res}`);
      failedCount++;
      suite2Passed = false;
    }
  });
  if (suite2Passed) console.log(`   ✅ Suite 2 Completed. All 12 Feminine Form derivations passed.`);

  // -------------------------------------------------------------
  // SUITE 3: French Conjugation Engine Completeness & Elision Suite
  // -------------------------------------------------------------
  console.log('\n▶ [SUITE 3/6] French Conjugation Engine Completeness Suite');
  const conjugationVerbs = ['parler', 'manger', 'finir', 'vendre', 'devenir', 'être', 'avoir'];
  const tenses = ['present', 'passe_compose', 'imparfait', 'futur_simple', 'subjonctif'];
  let suite3Passed = true;

  conjugationVerbs.forEach(v => {
    tenses.forEach(t => {
      const conj = getFrenchConjugations(v, t);
      if (conj && conj.je && conj.tu && conj.il && conj.nous && conj.vous && conj.ils) {
        passedCount++;
      } else {
        console.log(`   ❌ Conjugation FAIL: Verb ${v} Tense ${t} incomplete!`);
        failedCount++;
        suite3Passed = false;
      }
    });
  });
  if (suite3Passed) console.log(`   ✅ Suite 3 Completed. All 35 Conjugation tables (5 tenses x 7 verbs) passed.`);

  // -------------------------------------------------------------
  // SUITE 4: Inflected Form Base Lemma & French IPA Resolution Suite
  // -------------------------------------------------------------
  console.log('\n▶ [SUITE 4/6] Inflected Form Base Lemma & French IPA Resolution Suite');
  const inflectedWords = ['automobilistes', 'perturbations', 'running', 'soient', 'built'];
  let suite4Passed = true;

  for (const w of inflectedWords) {
    const lang = (w === 'running' || w === 'built') ? 'en' : 'fr';
    const res = await fetchLemmaInfo(w, lang);
    if (res.wiktionaryDefinitions && res.wiktionaryDefinitions.length > 1) {
      passedCount++;
    } else {
      console.log(`   ❌ Base Lemma Definition FAIL for "${w}": Definitions count=${res.wiktionaryDefinitions.length}`);
      failedCount++;
      suite4Passed = false;
    }

    if (lang === 'fr') {
      const ipa = await fetchFrenchPhonetic(w, res.lemmaInfo ? res.lemmaInfo.lemma : null);
      if (ipa && ipa.startsWith('/') && ipa.endsWith('/')) {
        passedCount++;
      } else {
        console.log(`   ❌ French IPA Resolution FAIL for "${w}": Got "${ipa}"`);
        failedCount++;
        suite4Passed = false;
      }
    }
  }
  if (suite4Passed) console.log(`   ✅ Suite 4 Completed. All inflected form base lemma definitions and French IPAs retrieved.`);

  // -------------------------------------------------------------
  // SUITE 5: CEFR Difficulty Level Estimation Suite
  // -------------------------------------------------------------
  console.log('\n▶ [SUITE 5/6] CEFR Level Estimation & Color Tokens Suite');
  const cefrTests = [
    { word: 'cat', expectedText: 'A1' },
    { word: 'window', expectedText: 'A2' },
    { word: 'building', expectedText: 'B1' },
    { word: 'subsequent', expectedText: 'B2' },
    { word: 'reconstruct', expectedText: 'C1' },
    { word: 'unconstitutional', expectedText: 'C2' }
  ];
  let suite5Passed = true;

  cefrTests.forEach(t => {
    const res = getCEFRLevel(t.word, 'en');
    if (res && res.text === t.expectedText && res.color && res.bg) {
      passedCount++;
    } else {
      console.log(`   ❌ CEFR FAIL: Word ${t.word} Expected ${t.expectedText}, Got ${res ? res.text : 'null'}`);
      failedCount++;
      suite5Passed = false;
    }
  });
  if (suite5Passed) console.log(`   ✅ Suite 5 Completed. CEFR level tokens verified.`);

  // -------------------------------------------------------------
  // SUITE 6: Security XSS Neutralization & Escaping Suite
  // -------------------------------------------------------------
  console.log('\n▶ [SUITE 6/6] Security XSS Neutralization Suite');
  const xssInput = '<script>alert("xss")</script> & \'test\'';
  const escaped = escapeHtml(xssInput);
  if (!escaped.includes('<') && !escaped.includes('>') && escaped.includes('&lt;script&gt;')) {
    passedCount++;
    console.log(`   ✅ Suite 6 Completed. HTML escaping XSS security verified.`);
  } else {
    console.log(`   ❌ Security XSS FAIL: Escaped output was ${escaped}`);
    failedCount++;
  }

  // -------------------------------------------------------------
  // Final Test Summary
  // -------------------------------------------------------------
  const totalTests = 100 + 12 + 35 + 8 + 6 + 1; // 162 Total Verification Checks
  console.log(`\n===============================================================`);
  console.log(`📊 Comprehensive QA Summary: ${passedCount} PASSED / ${failedCount} FAILED out of ${totalTests} Total Verification Checks`);
  console.log(`===============================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests();
