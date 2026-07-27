// test_auto_lang.js - TDD Unit Tests for Automatic Page Language Sensor & Single Badge Header

const fs = require('fs');
const path = require('path');

// Load utils script
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

// Load settings script
global.chrome = {
  storage: {
    sync: {
      get: (defaults, cb) => cb(defaults),
      set: (obj, cb) => cb && cb()
    },
    onChanged: { addListener: () => {} }
  }
};
const settingsCode = fs.readFileSync(path.join(__dirname, '../settings.js'), 'utf8');
eval(settingsCode.replace('let settings =', 'global.settings ='));

// Load audio script
const audioCode = fs.readFileSync(path.join(__dirname, '../audio.js'), 'utf8');
eval(audioCode);

// Load ui script
global.escapeHtml = str => str || '';
const uiCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
eval(uiCode.replace('const UIComponents =', 'global.UIComponents ='));

async function runAutoLangTddTests() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop Auto Page Language Sensor & Header TDD Unit Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  // TEST 1: detectPageLanguage DOM Attribute Sensing
  console.log('\n▶ [Test 1] Checking detectPageLanguage DOM Sensing');
  const domTests = [
    {
      doc: { documentElement: { lang: 'ja' } },
      expected: 'ja'
    },
    {
      doc: { documentElement: { lang: 'fr-FR' } },
      expected: 'fr'
    },
    {
      doc: { documentElement: { lang: 'es-ES' } },
      expected: 'es'
    },
    {
      doc: { documentElement: { lang: 'de' } },
      expected: 'de'
    },
    {
      doc: { documentElement: { lang: '' }, querySelector: () => ({ getAttribute: () => 'zh_TW' }) },
      expected: 'zh-TW'
    },
    {
      doc: { documentElement: { lang: '' }, querySelector: () => null },
      expected: 'en'
    }
  ];

  domTests.forEach((t, i) => {
    if (typeof detectPageLanguage === 'function') {
      const res = detectPageLanguage(t.doc);
      if (res === t.expected) {
        console.log(`   ✅ PASS: Case ${i + 1} ➔ Detected "${res}"`);
        passed++;
      } else {
        console.log(`   ❌ FAIL: Case ${i + 1} expected "${t.expected}", got "${res}"`);
        failed++;
      }
    } else {
      console.log(`   ❌ FAIL: detectPageLanguage function not implemented`);
      failed++;
    }
  });

  // TEST 2: Single Left Badge & 2 Right Explanation Buttons Header Render
  console.log('\n▶ [Test 2] Checking Popup Frame Single Left Badge & 2 Explanation Buttons');
  const mockCard = {
    innerHTML: '',
    querySelector: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => []
  };
  const mockShadow = {
    querySelector: (sel) => {
      if (sel === '.glossapop-card') return mockCard;
      return null;
    }
  };
  global.chrome.runtime = { getURL: p => p };

  if (typeof UIComponents.renderFrame === 'function') {
    UIComponents.renderFrame(
      mockShadow,
      '番組',
      'ja',
      'zh-TW',
      () => {},
      () => {},
      () => {}
    );

    const html = mockCard.innerHTML;
    const containsSingleBadge = html.includes('glossapop-badge-tag') && html.includes('JA');
    const containsRightSegment = html.includes('id="explain-lang-group"') && html.includes('data-val="zh-TW"') && html.includes('data-val="en"');

    if (containsSingleBadge && containsRightSegment) {
      console.log('   ✅ PASS: Single left badge [ JA ] and 2 right explanation buttons rendered');
      passed++;
    } else {
      console.log('   ❌ FAIL: Frame HTML missing single left badge or right explanation toggles:', html);
      failed++;
    }
  } else {
    console.log('   ❌ FAIL: UIComponents.renderFrame function missing');
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 TDD Test Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runAutoLangTddTests();
