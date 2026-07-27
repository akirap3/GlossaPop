/**
 * GlossaPop Test Suite: Complete 18-Tense French Engine & 5-Page Pagination Test
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load GlossaPop core utils via eval in Node.js environment
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

let passed = 0;
let failed = 0;

console.log('===============================================================');
console.log('🧪 GlossaPop Suite: Complete 18-Tense French Engine & 5-Page UI');
console.log('===============================================================');

// -------------------------------------------------------------
// [SUB-SUITE 1] Priority 1 Offline LEFFF Engine 18-Tense Coverage
// -------------------------------------------------------------
console.log('\n▶ [1] Checking Priority 1 Offline Engine for All 18 Tenses');

const all18Tenses = [
  'present', 'passe_compose', 'imparfait', 'plus_que_parfait',          // Page 1
  'passe_simple', 'passe_anterieur', 'futur_simple', 'futur_anterieur', // Page 2
  'subjonctif_present', 'subjonctif_passe', 'subjonctif_imparfait', 'subjonctif_plus_que_parfait', // Page 3
  'conditionnel_present', 'conditionnel_passe', 'imperatif_present', 'imperatif_passe', // Page 4
  'participe_present', 'participe_passe'                                // Page 5
];

const testVerbs = ['parler', 'finir', 'vendre', 'être', 'avoir', 'faire', 'aller'];

testVerbs.forEach(verb => {
  let verbPassed = true;
  all18Tenses.forEach(tense => {
    const conj = (typeof getFrenchConjugations === 'function') ? getFrenchConjugations(verb, tense) : null;
    if (!conj || typeof conj !== 'object') {
      console.log(`   ❌ FAIL: Verb "${verb}" missing conjugation for tense "${tense}"`);
      failed++;
      verbPassed = false;
    }
  });
  if (verbPassed) {
    console.log(`   ✅ PASS: Verb "${verb}" successfully generated all 18 tenses`);
    passed++;
  }
});

// -------------------------------------------------------------
// [SUB-SUITE 2] Tense Detection & 5-Page Auto-Targeting Index
// -------------------------------------------------------------
console.log('\n▶ [2] Checking Tense Detection & 5-Page Auto-Targeting Index');

const autoTargetCases = [
  { word: 'rappelle', expectedTense: 'present', expectedPage: 1 },
  { word: 'rappellerai', expectedTense: 'futur_simple', expectedPage: 2 },
  { word: 'rappellerais', expectedTense: 'conditionnel_present', expectedPage: 4 },
  { word: 'rappellasse', expectedTense: 'subjonctif_imparfait', expectedPage: 3 },
  { word: 'rappelant', expectedTense: 'participe_present', expectedPage: 5 },
  { word: 'serai', expectedTense: 'futur_simple', expectedPage: 2 },
  { word: 'fasse', expectedTense: 'subjonctif_present', expectedPage: 3 }
];

autoTargetCases.forEach(tc => {
  const detected = (typeof detectFrenchQueryTense === 'function') ? detectFrenchQueryTense(tc.word) : null;
  const pageInfo = (typeof getTensePageInfo === 'function') ? getTensePageInfo(detected) : null;
  const actualPage = pageInfo ? pageInfo.pageIndex : null;

  if (detected === tc.expectedTense && actualPage === tc.expectedPage) {
    console.log(`   ✅ PASS: "${tc.word}" ➔ Detected "${detected}" on Page ${actualPage}/5`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: "${tc.word}" ➔ Expected (${tc.expectedTense}, Page ${tc.expectedPage}), Got (${detected}, Page ${actualPage})`);
    failed++;
  }
});

console.log('\n===============================================================');
console.log(`📊 18-Tense Suite Summary: ${passed} PASSED / ${failed} FAILED`);
console.log('===============================================================');

if (failed > 0) process.exit(1);
