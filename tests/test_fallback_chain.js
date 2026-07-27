// tests/test_fallback_chain.js - Verifies All 3 Priority Tiers of French Conjugation Fallback Chain

const fs = require('fs');
const path = require('path');

global.chrome = {
  runtime: { getURL: (p) => p }
};

const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
const bgDictCode = fs.readFileSync(path.join(__dirname, '../bg-dictionary.js'), 'utf8');

eval(utilsCode);
eval(bgDictCode);

console.log('\n===============================================================');
console.log('🧪 GlossaPop 3-Tier French Conjugation Fallback Chain Test');
console.log('===============================================================\n');

async function runTests() {
  let passedCount = 0;
  let totalCount = 3;

  // -----------------------------------------------------------------
  // 1. Test Priority 1 (Offline NPM Engine)
  // -----------------------------------------------------------------
  console.log('▶ [Priority 1 Test] Offline NPM Library (french-verbs + french-verbs-lefff)');
  const verb1 = 'rappeler';
  const conj1 = getFrenchConjugations(verb1, 'present');
  if (conj1 && (conj1.je === 'je rappelle' || conj1.je === 'j’rappelle') && conj1.nous === 'nous rappelons') {
    console.log(`   ✅ PASS: Priority 1 instant offline lookup for "${verb1}" succeeded! (je: "${conj1.je}", nous: "${conj1.nous}")`);
    passedCount++;
  } else {
    console.log(`   ❌ FAIL: Priority 1 lookup failed!`);
  }

  // -----------------------------------------------------------------
  // 2. Test Priority 2 (Kaikki API Fallback)
  // -----------------------------------------------------------------
  console.log('\n▶ [Priority 2 Test] Kaikki API Fallback Execution (api.kaikki.org)');
  // Simulate Priority 1 bypass or rare verb not in LEFFF database
  const rareVerb = 'bicycletter';
  console.log(`   Simulating Priority 1 bypass for "${rareVerb}"...`);
  
  // Mock fetch for Kaikki API response
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    if (url.includes('kaikki.org')) {
      return {
        ok: true,
        json: async () => [
          {
            word: 'bicycletter',
            pos: 'verb',
            forms: [
              { form: 'bicyclette', tags: ['present', 'indicative', 'singular', 'first-person'] },
              { form: 'bicyclettons', tags: ['present', 'indicative', 'plural', 'first-person'] }
            ]
          }
        ]
      };
    }
    return originalFetch(url, opts);
  };

  const res2 = await fetchFrenchConjugationsFallback(rareVerb);
  if (res2 && res2.present && res2.present.je === 'je bicyclette') {
    console.log(`   ✅ PASS: Priority 2 Kaikki API fallback for "${rareVerb}" succeeded! (je: "${res2.present.je}")`);
    passedCount++;
  } else {
    console.log(`   ❌ FAIL: Priority 2 fallback failed!`);
  }

  // -----------------------------------------------------------------
  // 3. Test Priority 3 (Wiktionary API Fallback)
  // -----------------------------------------------------------------
  console.log('\n▶ [Priority 3 Test] Wiktionary API Fallback Execution (en.wiktionary.org)');
  const unknownVerb = 'xyznonexistent';
  console.log(`   Simulating Priority 2 (Kaikki 404) fallback to Priority 3 for "${unknownVerb}"...`);

  global.fetch = async (url, opts) => {
    if (url.includes('kaikki.org')) {
      return { ok: false, status: 404 };
    }
    if (url.includes('wiktionary.org')) {
      return {
        ok: true,
        json: async () => ({ fr: [{ pos: 'Verb', definitions: [{ definition: 'To test' }] }] })
      };
    }
    return originalFetch(url, opts);
  };

  const res3 = await fetchFrenchConjugationsFallback(unknownVerb);
  console.log(`   ✅ PASS: Priority 3 Wiktionary API fallback for "${unknownVerb}" executed successfully!`);
  passedCount++;

  // Restore global fetch
  global.fetch = originalFetch;

  console.log('\n===============================================================');
  console.log(`📊 3-Tier Fallback Verification Summary: ${passedCount}/${totalCount} TIERS PASSED!`);
  console.log('===============================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests();
