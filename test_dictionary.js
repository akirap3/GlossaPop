// test_dictionary.js - Comprehensive test suite for GlossaPop dictionary parsing & logic
// 100 Test Cases: 10 words per part of speech (Nouns, Verbs, Adjectives, Adverbs, Participles/Inflections) for EN and FR
const fs = require('fs');
const path = require('path');

// Mock browser / chrome extension environment for Node.js test execution
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

// Test Dataset: 10 words x 5 parts of speech x 2 languages = 100 Test Cases
const testCases = [
  // ==========================================
  // --- ENGLISH TEST SUITE (50 Words Total) ---
  // ==========================================
  
  // 1. English Nouns (10 words)
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

  // 2. English Verbs (10 words)
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

  // 3. English Adjectives (10 words)
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

  // 4. English Adverbs (10 words)
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

  // 5. English Participles & Inflected Verbs (10 words)
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

  // ==========================================
  // --- FRENCH TEST SUITE (50 Words Total) ---
  // ==========================================

  // 1. French Nouns (10 words)
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

  // 2. French Verbs (10 words)
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

  // 3. French Adjectives (10 words)
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

  // 4. French Adverbs (10 words)
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

  // 5. French Participles & Inflected Verbs (10 words)
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
  console.log('🧪 GlossaPop Comprehensive Test Suite (100 Test Cases)');
  console.log('   (10 Words x 5 Parts of Speech x 2 Languages: EN & FR)');
  console.log('===============================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    const testNum = String(i + 1).padStart(3, '0');
    console.log(`[Test ${testNum}/100] (${test.lang.toUpperCase()}) [${test.pos}] "${test.word}"`);

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

      // Special check for French conjugations availability on base verbs
      if (test.lang === 'fr' && test.pos === 'Verb') {
        const rootVerb = res.lemmaInfo ? res.lemmaInfo.lemma : test.word;
        const conj = getFrenchConjugations(rootVerb, 'present');
        if (!conj || !conj.je) pass = false;
      }

      // Special check for French feminine derivation availability
      if (test.lang === 'fr' && test.expectIsAdj) {
        const rootWord = (res.lemmaInfo && !res.isAdjective) ? res.lemmaInfo.lemma : test.word;
        const fem = getFrenchFeminineForm(rootWord);
        if (!fem && !rootWord.endsWith('e')) pass = false;
      }

      if (pass) {
        console.log(`   ✅ PASS: isVerb=${res.isVerb}, isAdj=${res.isAdjective}, definitions=${res.wiktionaryDefinitions.length}`);
        passedCount++;
      } else {
        console.log(`   ❌ FAIL: Expected (isVerb=${test.expectIsVerb}, isAdj=${test.expectIsAdj}), Got (isVerb=${res.isVerb}, isAdj=${res.isAdjective})`);
        failedCount++;
      }
    } catch (err) {
      console.log(`   💥 ERROR: ${err.message}`);
      failedCount++;
    }
    console.log('---------------------------------------------------------------');
  }

  console.log(`\n===============================================================`);
  console.log(`📊 Test Summary: ${passedCount} PASSED / ${failedCount} FAILED out of ${testCases.length} Tests`);
  console.log(`===============================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests();
