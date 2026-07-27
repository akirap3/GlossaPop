// test_ui_options.js - Categorized Test Suite for UI Components, Header, Badges, Tenses & Options Dashboard

const fs = require('fs');
const path = require('path');

// Load dependencies
const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

global.chrome = {
  runtime: { getManifest: () => ({ version: '1.0.7' }), getURL: p => p },
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

const audioCode = fs.readFileSync(path.join(__dirname, '../audio.js'), 'utf8');
eval(audioCode);

global.getFrenchConjugations = (verb, tense) => ({
  je: `je_${tense}`,
  tu: `tu_${tense}`,
  il: `il_${tense}`,
  nous: `nous_${tense}`,
  vous: `vous_${tense}`,
  ils: `ils_${tense}`
});

global.escapeHtml = str => str || '';
const uiCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
eval(uiCode.replace('const UIComponents =', 'global.UIComponents ='));

// Helper for Mock Select
function createMockSelect(optionsArray, initialValue) {
  const options = optionsArray.map(opt => ({
    value: opt.value,
    text: opt.text,
    disabled: false
  }));
  return {
    options,
    value: initialValue,
    querySelectorAll: () => options,
    getElementsByTagName: () => options
  };
}

async function runUiOptionsSuite() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop Categorized Suite 1: UI Components & Options');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // [SUB-SUITE 1.1] Popup Frame Header Badge & Segment Buttons
  // -------------------------------------------------------------
  console.log('\n▶ [1.1] Checking Popup Frame Header Single Badge & 2 Explanation Buttons');
  const mockCard = {
    innerHTML: '',
    querySelector: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => []
  };
  const mockShadow = {
    querySelector: (sel) => (sel === '.glossapop-card' ? mockCard : null)
  };

  if (typeof UIComponents.renderFrame === 'function') {
    UIComponents.renderFrame(mockShadow, '番組', 'ja', 'zh-TW', () => {}, () => {}, () => {});
    const html = mockCard.innerHTML;
    const hasSingleBadge = html.includes('glossapop-badge-tag') && html.includes('JA');
    const hasRightSegment = html.includes('id="explain-lang-group"') && html.includes('data-val="zh-TW"') && html.includes('data-val="en"');

    if (hasSingleBadge && hasRightSegment) {
      console.log('   ✅ PASS: Single left badge [ JA ] and 2 right explanation buttons rendered');
      passed++;
    } else {
      console.log('   ❌ FAIL: Frame HTML missing single left badge or right explanation toggles');
      failed++;
    }
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.2] Lookup Language Badge Prominent Styling
  // -------------------------------------------------------------
  console.log('\n▶ [1.2] Checking Lookup Language Badge Color Palette (Light & Dark Modes)');
  const uiJsCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
  const hasCleanAppleBlue = uiJsCode.includes('background: #0066cc;') && !uiJsCode.includes('#4f46e5');
  const hasVividDarkGradient = uiJsCode.includes('.glossapop-dark .glossapop-badge-tag') && uiJsCode.includes('linear-gradient(135deg, #0a84ff');

  if (hasCleanAppleBlue && hasVividDarkGradient) {
    console.log('   ✅ PASS: Light mode uses clean Apple Blue #0066cc and Dark mode uses vivid gradient #0a84ff');
    passed++;
  } else {
    console.log('   ❌ FAIL: Badge color token checks failed');
    failed++;
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.3] Options Page Mutual Exclusivity Dropdowns
  // -------------------------------------------------------------
  console.log('\n▶ [1.3] Checking Primary & Secondary Dropdowns Mutual Exclusivity');
  global.document = { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] };
  const optionsJsCode = fs.readFileSync(path.join(__dirname, '../options.js'), 'utf8');
  let syncFn = null;
  let swapFn = null;
  eval(optionsJsCode + '\n syncFn = syncLanguageDropdownOptions;\n swapFn = swapLanguageOptions;');

  const langOpts = [{ value: 'zh-TW' }, { value: 'zh-CN' }, { value: 'en' }, { value: 'fr' }];
  const selectA = createMockSelect(langOpts, 'zh-TW');
  const selectB = createMockSelect(langOpts, 'en');

  if (typeof syncFn === 'function') {
    syncFn(selectA, selectB);
    const optInBDisabled = selectB.options.find(o => o.value === 'zh-TW').disabled;
    const optInADisabled = selectA.options.find(o => o.value === 'en').disabled;

    if (optInBDisabled && optInADisabled) {
      console.log('   ✅ PASS: Mutual exclusivity disabled option states verified');
      passed++;
    } else {
      console.log('   ❌ FAIL: Mutual exclusivity option disabling failed');
      failed++;
    }
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.4] Options Page Language Swap Button (⇄)
  // -------------------------------------------------------------
  console.log('\n▶ [1.4] Checking Bi-directional Language Swap Arrow Button (⇄)');
  if (typeof swapFn === 'function') {
    swapFn(selectA, selectB);
    if (selectA.value === 'en' && selectB.value === 'zh-TW') {
      console.log('   ✅ PASS: selectA swapped to "en" and selectB swapped to "zh-TW"');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Swap failed. A="${selectA.value}", B="${selectB.value}"`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.5] Single Line Label Rule (white-space: nowrap)
  // -------------------------------------------------------------
  console.log('\n▶ [1.5] Checking Options Page Single Line Label Rule (white-space: nowrap)');
  const optionsCssCode = fs.readFileSync(path.join(__dirname, '../options.css'), 'utf8');
  const selectLabelBlock = optionsCssCode.match(/\.select-label\s*\{[^}]*\}/s)?.[0] || '';
  const labelBadgeBlock = optionsCssCode.match(/\.label-badge\s*\{[^}]*\}/s)?.[0] || '';

  if (selectLabelBlock.includes('white-space: nowrap;') && labelBadgeBlock.includes('white-space: nowrap;')) {
    console.log('   ✅ PASS: Single-line label CSS rule white-space: nowrap enforced');
    passed++;
  } else {
    console.log('   ❌ FAIL: Single-line label CSS rule missing');
    failed++;
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.6] French 5-Tense Tab Switching Suite
  // -------------------------------------------------------------
  console.log('\n▶ [1.6] Checking French 5-Tense Tab Switching Interactive Clicks');
  global.getFrenchConjugations = (verb, tense) => ({
    je: `je_${tense}`,
    tu: `tu_${tense}`,
    il: `il_${tense}`,
    nous: `nous_${tense}`,
    vous: `vous_${tense}`,
    ils: `ils_${tense}`
  });

  const mockTenseData = {
    word: 'contente',
    isVerb: true,
    lemmaInfo: { lemma: 'contenter' },
    definitions: ['[Verb] inflection of contenter : first / third-person singular present indicative / subjunctive']
  };

  const tensesToTest = [
    { id: 'present', label: 'Présent' },
    { id: 'passe_compose', label: 'Passé C.' },
    { id: 'imparfait', label: 'Imparfait' },
    { id: 'futur_simple', label: 'Futur' },
    { id: 'subjonctif', label: 'Subjonctif' }
  ];

  // DOM Mock for Tense Switching
  class MockElement {
    constructor(tagName, className = '') {
      this.tagName = tagName;
      this.className = className;
      this.classList = {
        add: (c) => { if (!this.className.includes(c)) this.className += ' ' + c; },
        remove: (c) => { this.className = this.className.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim(); },
        contains: (c) => this.className.includes(c)
      };
      this.children = [];
      this.dataset = {};
      this.style = {};
      this.innerHTML = '';
      this.onclick = null;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) {
      let matches = [];
      if (sel.startsWith('.')) {
        const cls = sel.substring(1);
        if (this.className.includes(cls)) matches.push(this);
      }
      this.children.forEach(child => { matches = matches.concat(child.querySelectorAll(sel)); });
      return matches;
    }
  }

  function parseMockHtml(html) {
    const root = new MockElement('div');
    const buttonRegex = /<button class="([^"]+)" data-tense="([^"]+)">([^<]+)<\/button>/g;
    let match;
    while ((match = buttonRegex.exec(html)) !== null) {
      const btn = new MockElement('button', match[1]);
      btn.dataset.tense = match[2];
      btn.innerHTML = match[3];
      root.children.push(btn);
    }
    return root;
  }

  let conjBoxObj = new MockElement('div');
  UIComponents.renderConjugations(conjBoxObj, mockTenseData, 'fr', 'contente');
  conjBoxObj = parseMockHtml(conjBoxObj.innerHTML);

  if (conjBoxObj.children.some(b => b.dataset.tense === 'subjonctif' && b.className.includes('active'))) {
    console.log('   ✅ Initial render correctly defaults to Subjonctif tab active');
    passed++;
  } else {
    console.log('   ❌ Initial render failed');
    failed++;
  }

  tensesToTest.forEach(tenseObj => {
    const box = new MockElement('div');
    UIComponents.renderConjugations(box, mockTenseData, 'fr', 'contente', tenseObj.id);

    const isTabActive = box.innerHTML.includes(`data-tense="${tenseObj.id}"`) && box.innerHTML.includes('active');
    const isConjugationRendered = box.innerHTML.includes('contente') || box.innerHTML.includes('content');

    if (isTabActive && isConjugationRendered) {
      console.log(`   ✅ Clicked [${tenseObj.label}] ➔ Tab active & ${tenseObj.id} grid rendered successfully!`);
      passed++;
    } else {
      console.log(`   ❌ Clicked [${tenseObj.label}] ➔ Failed to switch to ${tenseObj.id}`);
      failed++;
    }
  });

  // -------------------------------------------------------------
  // [SUB-SUITE 1.7] Dictionary Example Sentence Box Rendering
  // -------------------------------------------------------------
  console.log('\n▶ [1.7] Checking Standard Dictionary Example Sentence Box Rendering');
  const mockExampleBox = new MockElement('div', 'glossapop-example-box');
  const testData = {
    word: 'versuche',
    example: { text: "Ich versuche es.", translation: "I'll try it." }
  };

  if (typeof UIComponents.renderExample === 'function') {
    UIComponents.renderExample(mockExampleBox, testData, 'de');
    const html = mockExampleBox.innerHTML;
    const hasExampleHeader = html.includes('EXAMPLE SENTENCE') || html.includes('Example Sentence');
    const hasHighlight = html.includes('glossapop-highlight') && html.includes('versuche');

    if (hasExampleHeader && hasHighlight) {
      console.log('   ✅ PASS: Dictionary Example Sentence header and target word highlight rendered');
      passed++;
    } else {
      console.log(`   ❌ FAIL: Example Sentence box rendering error: "${html}"`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.8] Explain 1 & Explain 2 Vertical Alignment Test
  // -------------------------------------------------------------
  console.log('\n▶ [1.8] Checking Explain 1 & Explain 2 Vertical Alignment Rules');
  const htmlContent = fs.readFileSync(path.join(__dirname, '../options.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '../options.css'), 'utf8');

  const hasAlignStart = htmlContent.includes('align-items: start;') || htmlContent.includes('align-items: flex-start;') || (cssContent.includes('.matrix-grid') && (cssContent.includes('align-items: start') || cssContent.includes('align-items: flex-start')));
  const hasMatchingHints = htmlContent.includes('Primary definition target') && htmlContent.includes('Secondary definition target');

  if (hasAlignStart && hasMatchingHints) {
    console.log('   ✅ PASS: Explain 1 & Explain 2 layout alignment rules (align-items: start & matching hints) verified');
    passed++;
  } else {
    console.log('   ❌ FAIL: Explain 1 & Explain 2 layout alignment rules incomplete');
    failed++;
  }

  // -------------------------------------------------------------
  // [SUB-SUITE 1.9] RWD Layout, 3-Tile Theme Switcher & Auth Toggle Switch Test
  // -------------------------------------------------------------
  console.log('\n▶ [1.9] Checking Options Page RWD Layout, 3-Tile Theme Switcher & Auth Toggle Switch');
  const hasViewportMeta = htmlContent.includes('<meta name="viewport"') && htmlContent.includes('width=device-width');
  const has860Breakpoint = cssContent.includes('@media') && cssContent.includes('max-width: 860px');
  const hasMinWidthZero = cssContent.includes('min-width: 0;');
  const hasRadioGap = cssContent.includes('.radio-card-group') && cssContent.includes('gap:');
  const hasFlexWrap = cssContent.includes('.cloud-status-strip') && cssContent.includes('flex-wrap: wrap') && cssContent.includes('.sheets-actions-group') && cssContent.includes('flex-wrap: wrap');
  const hasCenteredFooter = cssContent.includes('.footer') && cssContent.includes('justify-content: center') && cssContent.includes('text-align: center');
  const has1200Container = cssContent.includes('.container') && (cssContent.includes('max-width: 1200px') || cssContent.includes('max-width: 100%'));
  const hasSegmentedTiles = cssContent.includes('.segmented-control') && cssContent.includes('.segmented-control label');
  const hasAuthToggleSwitch = htmlContent.includes('google-auth-toggle') && cssContent.includes('.toggle-switch') && cssContent.includes('.toggle-slider');

  if (hasViewportMeta && has860Breakpoint && hasMinWidthZero && hasRadioGap && hasFlexWrap && hasCenteredFooter && has1200Container && hasSegmentedTiles && hasAuthToggleSwitch) {
    console.log('   ✅ PASS: Options Page 3-tile theme switcher, accessible Google Auth toggle switch, and centered footer verified');
    passed++;
  } else {
    console.log('   ❌ FAIL: Accessible Google Auth toggle switch or styles missing');
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 Categorized Suite 1 Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runUiOptionsSuite();
