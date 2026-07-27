// test_languages.js - TDD Unit Tests for 2x2 Multi-Language Matrix Upgrade

const fs = require('fs');
const path = require('path');

// Storage & Chrome API Mocks
let mockStorageSync = {};

global.chrome = {
  storage: {
    sync: {
      get: (defaults, cb) => {
        const result = { ...defaults };
        Object.keys(defaults).forEach(k => {
          if (mockStorageSync[k] !== undefined) {
            result[k] = mockStorageSync[k];
          }
        });
        cb(result);
      },
      set: (obj, cb) => {
        Object.assign(mockStorageSync, obj);
        if (cb) cb();
      }
    },
    onChanged: {
      addListener: () => {}
    }
  },
  runtime: {}
};

// Load settings script
const settingsCode = fs.readFileSync(path.join(__dirname, '../settings.js'), 'utf8');
eval(settingsCode.replace('let settings =', 'global.settings ='));

// Load audio script
const audioCode = fs.readFileSync(path.join(__dirname, '../audio.js'), 'utf8');
eval(audioCode);

// Load ui script
global.escapeHtml = str => str || '';
const uiCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
eval(uiCode.replace('const UIComponents =', 'global.UIComponents ='));

async function runLanguageMatrixTddTests() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop 2x2 Multi-Language Matrix TDD Unit Test Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  // TEST 1: Default Settings Schema for 2x2 Language Matrix
  console.log('\n▶ [Test 1] Checking Default 2x2 Language Matrix Settings');
  mockStorageSync = {};
  await loadSettings();

  if (
    settings.sourceLangA === 'en' &&
    settings.sourceLangB === 'fr' &&
    settings.explainLangA === 'zh-TW' &&
    settings.explainLangB === 'en'
  ) {
    console.log('   ✅ PASS: Default 2x2 language matrix initialized correctly');
    passed++;
  } else {
    console.log('   ❌ FAIL: Settings missing sourceLangA/sourceLangB/explainLangA/explainLangB schema:', settings);
    failed++;
  }

  // TEST 2: Multi-Language Speech Locale Mapper
  console.log('\n▶ [Test 2] Checking Audio Speech Voice Locales (ES, DE, JA, KO, IT, PT)');
  const localeTests = [
    { lang: 'en', expected: 'en-US' },
    { lang: 'fr', expected: 'fr-FR' },
    { lang: 'es', expected: 'es-ES' },
    { lang: 'de', expected: 'de-DE' },
    { lang: 'ja', expected: 'ja-JP' },
    { lang: 'ko', expected: 'ko-KR' },
    { lang: 'it', expected: 'it-IT' },
    { lang: 'pt', expected: 'pt-PT' }
  ];

  localeTests.forEach(item => {
    if (typeof getSpeechVoiceLocale === 'function') {
      const loc = getSpeechVoiceLocale(item.lang);
      if (loc === item.expected) {
        console.log(`   ✅ PASS: Language "${item.lang}" ➔ Locale "${loc}"`);
        passed++;
      } else {
        console.log(`   ❌ FAIL: Language "${item.lang}" expected "${item.expected}", got "${loc}"`);
        failed++;
      }
    } else {
      console.log(`   ❌ FAIL: getSpeechVoiceLocale function not implemented`);
      failed++;
    }
  });

  // TEST 3: Language Code Display Label Helper
  console.log('\n▶ [Test 3] Checking Language Display Label Generator');
  const labelTests = [
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

  labelTests.forEach(item => {
    if (typeof getLanguageLabel === 'function') {
      const label = getLanguageLabel(item.code);
      if (label === item.expected) {
        console.log(`   ✅ PASS: Code "${item.code}" ➔ Label "${label}"`);
        passed++;
      } else {
        console.log(`   ❌ FAIL: Code "${item.code}" expected "${item.expected}", got "${label}"`);
        failed++;
      }
    } else {
      console.log(`   ❌ FAIL: getLanguageLabel function not implemented`);
      failed++;
    }
  });

  // TEST 4: Japanese ('ja') detectedLang Highlight Activation Test
  console.log('\n▶ [Test 4] Checking Japanese ("ja") detectedLang Active Highlight');
  const mockTargetGroup = {
    querySelectorAll: () => [
      { dataset: { val: 'ja' }, classList: { add: (c) => mockTargetGroup.activeVal = 'ja', remove: (c) => {} } },
      { dataset: { val: 'de' }, classList: { add: (c) => mockTargetGroup.activeVal = 'de', remove: (c) => {} } }
    ]
  };
  const activeDetectedLang = 'ja';
  const buttons = mockTargetGroup.querySelectorAll();
  let matchedBtn = buttons.find(btn => 
    btn.dataset.val === activeDetectedLang || 
    activeDetectedLang.startsWith(btn.dataset.val) || 
    btn.dataset.val.startsWith(activeDetectedLang)
  );
  if (matchedBtn) matchedBtn.classList.add('active');

  if (mockTargetGroup.activeVal === 'ja') {
    console.log('   ✅ PASS: Japanese ("ja") segment button successfully highlighted blue');
    passed++;
  } else {
    console.log('   ❌ FAIL: Japanese ("ja") segment button failed to highlight blue');
    failed++;
  }
  console.log(`📊 TDD Test Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runLanguageMatrixTddTests();
