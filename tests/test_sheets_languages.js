// tests/test_sheets_languages.js - TDD Test Suite for 10-Language Google Sheets Integration
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Read bg-sheets.js code
const sheetsCode = fs.readFileSync(path.join(__dirname, '../bg-sheets.js'), 'utf8');

// Create mock environment for testing bg-sheets.js logic
const mockChrome = {
  storage: {
    sync: { get: (keys, cb) => cb({ googleAuthConnected: true, spreadsheetId: 'mock-sheet-id' }), set: () => {} },
    local: { get: (keys, cb) => cb({ oauthToken: 'mock-token', oauthTokenExpiry: Date.now() + 100000 }), set: () => {} }
  },
  identity: { getAuthToken: (opts, cb) => cb('mock-token') }
};

global.chrome = mockChrome;
global.fetch = async (url) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({ files: [{ id: 'mock-sheet-id' }], sheets: [{ properties: { title: 'English Words' } }, { properties: { title: 'German Words' } }], valueRanges: [] })
  };
};

eval(sheetsCode);

console.log('🧪 Starting 10-Language Google Sheets TDD Test Suite...\n');

// Test 1: 10-Language Sheet Title Mapping
console.log('▶ [1] Testing 10-Language Sheet Title Mapping...');

assert.strictEqual(getSheetTitleForLang('en'), 'English Words');
assert.strictEqual(getSheetTitleForLang('fr'), 'French Words');
assert.strictEqual(getSheetTitleForLang('es'), 'Spanish Words');
assert.strictEqual(getSheetTitleForLang('de'), 'German Words');
assert.strictEqual(getSheetTitleForLang('ja'), 'Japanese Words');
assert.strictEqual(getSheetTitleForLang('ko'), 'Korean Words');
assert.strictEqual(getSheetTitleForLang('it'), 'Italian Words');
assert.strictEqual(getSheetTitleForLang('pt'), 'Portuguese Words');
assert.strictEqual(getSheetTitleForLang('zh-TW'), 'Traditional Chinese Words');
assert.strictEqual(getSheetTitleForLang('zh-CN'), 'Simplified Chinese Words');
assert.strictEqual(getSheetTitleForLang('unknown'), 'English Words');

console.log('   ✅ PASS: All 10 Language Sheet Titles correctly mapped!');

// Test 2: Ensure Sheet Exists Dynamic Function
console.log('▶ [2] Testing Dynamic Sheet Creation Logic...');
assert.strictEqual(typeof ensureSheetExists, 'function');
console.log('   ✅ PASS: ensureSheetExists helper present');

console.log('\n===============================================================');
console.log('📊 10-Language Sheets Suite: ALL CHECKS PASSED');
console.log('===============================================================\n');
