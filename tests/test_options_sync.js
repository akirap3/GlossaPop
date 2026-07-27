// test_options_sync.js - TDD Unit Tests for Options Page Dropdown Mutual Exclusivity

const fs = require('fs');
const path = require('path');

// Mock DOM Select Element
function createMockSelect(optionsArray, initialValue) {
  const options = optionsArray.map(opt => ({
    value: opt.value,
    text: opt.text,
    disabled: false
  }));
  return {
    options,
    value: initialValue,
    querySelectorAll: (sel) => options,
    getElementsByTagName: (tag) => options
  };
}

// Load options.js logic to test syncLanguageDropdownOptions
const langOptions = [
  { value: 'zh-TW', text: '繁體中文' },
  { value: 'zh-CN', text: '簡體中文' },
  { value: 'en', text: 'English' },
  { value: 'fr', text: 'French' },
  { value: 'es', text: 'Spanish' }
];

async function runOptionsSyncTddTests() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop Options Page Mutual Exclusivity TDD Unit Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  const selectA = createMockSelect(langOptions, 'zh-TW');
  const selectB = createMockSelect(langOptions, 'en');

  global.document = {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  };
  global.chrome = {
    runtime: { getManifest: () => ({ version: '1.0.7' }) },
    storage: { sync: { get: () => {} } }
  };
  const optionsJsPath = path.join(__dirname, '../options.js');
  const optionsJsCode = fs.readFileSync(optionsJsPath, 'utf8');

  let syncFn = null;
  eval(optionsJsCode + '\n syncFn = syncLanguageDropdownOptions;');

  console.log('\n▶ [Test 1] Checking initial dropdown option disabling when selectA="zh-TW" and selectB="en"');
  if (typeof syncFn === 'function') {
    syncFn(selectA, selectB);

    const optInBDisabled = selectB.options.find(o => o.value === 'zh-TW').disabled;
    const optInADisabled = selectA.options.find(o => o.value === 'en').disabled;

    if (optInBDisabled && optInADisabled) {
      console.log('   ✅ PASS: "zh-TW" disabled in Select B, and "en" disabled in Select A');
      passed++;
    } else {
      console.log(`   ❌ FAIL: optInBDisabled=${optInBDisabled}, optInADisabled=${optInADisabled}`);
      failed++;
    }
  } else {
    console.log('   ❌ FAIL: syncLanguageDropdownOptions function not implemented');
    failed++;
  }

  console.log('\n▶ [Test 2] Checking auto-switch when selectA changes to "en" (which collides with selectB="en")');
  if (typeof syncFn === 'function') {
    selectA.value = 'en';
    syncFn(selectA, selectB);

    if (selectB.value !== 'en') {
      console.log(`   ✅ PASS: Select B auto-switched to valid available value "${selectB.value}"`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: Select B remained invalid collision value "en"`);
      failed++;
    }
  } else {
    console.log('   ❌ FAIL: syncLanguageDropdownOptions function not implemented');
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 TDD Test Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runOptionsSyncTddTests();
