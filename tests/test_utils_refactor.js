// tests/test_utils_refactor.js - TDD Test Suite for utils.js Refactoring
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load utils.js in Node context
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

console.log('🧪 Starting utils.js Refactoring TDD Test Suite...\n');

// Test 1: Helper Functions (Feminization, Verb Decomposition, Past Participles)
console.log('▶ [1] Testing Core Morphological Helpers...');
assert.strictEqual(getFrenchFeminineForm('beau'), 'belle');
assert.strictEqual(getFrenchFeminineForm('nouveau'), 'nouvelle');
assert.strictEqual(getFrenchFeminineForm('petit'), 'petite');
assert.strictEqual(getFrenchFeminineForm('italien'), 'italienne');

const decompDevenir = decomposeFrenchVerb('devenir');
assert.strictEqual(decompDevenir.prefix, 'de');
assert.strictEqual(decompDevenir.base, 'venir');

assert.strictEqual(getFrenchPastParticiple('rappeler'), 'rappelé');
assert.strictEqual(getFrenchPastParticiple('devenir'), 'devenu');
assert.strictEqual(getFrenchPastParticiple('faire'), 'fait');
console.log('   ✅ PASS: Core Morphological Helpers');

// Test 2: LEFFF Helper & Offline Conjugation Engine (Node & Browser)
console.log('▶ [2] Testing 18-Tense Engine (Node & Browser fallback)...');
const conjNode = getFrenchConjugations('rappeler', 'subjonctif_imparfait');
assert.strictEqual(conjNode.je, 'que je rappelasse');
assert.strictEqual(conjNode.il, 'qu’il rappelât');

// Test Browser Fallback by mocking require = undefined
const browserUtilsCode = utilsCode.replace(/typeof require !== 'undefined'/g, 'false');
eval(browserUtilsCode);

const conjBrowserPqp = getFrenchConjugations('rappeler', 'plus_que_parfait');
assert.strictEqual(conjBrowserPqp.je, 'j’avais rappelé');

const conjBrowserPs = getFrenchConjugations('rappeler', 'passe_simple');
assert.strictEqual(conjBrowserPs.nous, 'nous rappelâmes');

const conjBrowserImpPass = getFrenchConjugations('rappeler', 'imperatif_passe');
assert.strictEqual(conjBrowserImpPass.tu, '(tu) aie rappelé');
console.log('   ✅ PASS: 18-Tense Engine (Node & Browser fallback)');

// Restore original eval for remaining tests
eval(utilsCode);

// Test 3: detectFrenchQueryTense Reverse Table & Suffix Matching
console.log('▶ [3] Testing Tense Auto-Detection...');
assert.strictEqual(detectFrenchQueryTense('rappelle'), 'present');
assert.strictEqual(detectFrenchQueryTense('serai'), 'futur_simple');
assert.strictEqual(detectFrenchQueryTense('fasse'), 'subjonctif_present');
assert.strictEqual(detectFrenchQueryTense('rappelasse'), 'subjonctif_imparfait');
assert.strictEqual(detectFrenchQueryTense('rappellerais'), 'conditionnel_present');
assert.strictEqual(detectFrenchQueryTense('rappelant'), 'participe_present');
console.log('   ✅ PASS: Tense Auto-Detection');

console.log('\n===============================================================');
console.log('📊 Utils TDD Test Suite: ALL CHECKS PASSED');
console.log('===============================================================\n');
