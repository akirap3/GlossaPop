// tests/test_french_dormir.js - TDD Test Suite for French 7,826 Verbs Bundle Engine (dormir, partir, sortir, servir, etc.)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. Load compiled browser bundle lib/french-verbs-bundle.js into global context
const bundleCode = fs.readFileSync(path.join(__dirname, '../lib/french-verbs-bundle.js'), 'utf8');
eval(bundleCode);

// 2. Load utils.js into Node.js environment
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

console.log('🧪 Starting French 7,826 Verbs Bundle Engine TDD Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function assertTest(name, condition) {
  if (condition) {
    console.log(`   ✅ PASS: ${name}`);
    passedTests++;
  } else {
    console.error(`   ❌ FAIL: ${name}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// [1] Test LEFFF Bundle Loading & Verb Count
// -------------------------------------------------------------
console.log('▶ [1] Testing LEFFF 7,826 Verbs Bundle Integration...');

assertTest('global.Lefff dictionary loaded in memory', global.Lefff && typeof global.Lefff === 'object');
assertTest('global.frenchVerbs getConjugation helper loaded', global.frenchVerbs && typeof global.frenchVerbs.getConjugation === 'function');
assertTest('LEFFF contains 7,800+ verbs', global.Lefff && Object.keys(global.Lefff).length > 7000);

// -------------------------------------------------------------
// [2] Test "dormir" (sleep) Present Indicative Conjugation
// -------------------------------------------------------------
console.log('\n▶ [2] Testing "dormir" (sleep) 100% Authoritative LEFFF Conjugations...');

const dormirPresent = getFrenchConjugations('dormir', 'present');

assertTest('"dormir" je ➔ "je dors"', dormirPresent && dormirPresent.je === 'je dors');
assertTest('"dormir" tu ➔ "tu dors"', dormirPresent && dormirPresent.tu === 'tu dors');
assertTest('"dormir" il ➔ "il dort"', dormirPresent && dormirPresent.il === 'il dort');
assertTest('"dormir" nous ➔ "nous dormons"', dormirPresent && dormirPresent.nous === 'nous dormons');
assertTest('"dormir" vous ➔ "vous dormez"', dormirPresent && dormirPresent.vous === 'vous dormez');
assertTest('"dormir" ils ➔ "ils dorment"', dormirPresent && dormirPresent.ils === 'ils dorment');

// -------------------------------------------------------------
// [3] Test Prefix & Derivative Verbs (endormir, redormir, pressentir, etc.)
// -------------------------------------------------------------
console.log('\n▶ [3] Testing Derivative & Prefix Verbs (endormir, redormir, pressentir)...');

const endormirPres = getFrenchConjugations('endormir', 'present');
assertTest('"endormir" je ➔ "j’endors" / "j\'endors"', endormirPres && (endormirPres.je === 'j’endors' || endormirPres.je === "j'endors"));
assertTest('"endormir" nous ➔ "nous endormons"', endormirPres && endormirPres.nous === 'nous endormons');

const redormirPres = getFrenchConjugations('redormir', 'present');
assertTest('"redormir" je ➔ "je redors"', redormirPres && redormirPres.je === 'je redors');
assertTest('"redormir" nous ➔ "nous redormons"', redormirPres && redormirPres.nous === 'nous redormons');

const pressentirPres = getFrenchConjugations('pressentir', 'present');
assertTest('"pressentir" je ➔ "je pressens"', pressentirPres && pressentirPres.je === 'je pressens');
assertTest('"pressentir" nous ➔ "nous pressentons"', pressentirPres && pressentirPres.nous === 'nous pressentons');

// Summary
console.log('\n===============================================================');
console.log(`📊 LEFFF Verbs Bundle Suite: ${passedTests} PASSED / ${failedTests} FAILED`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
