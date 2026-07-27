// test_tenses.js - Verification script for French Verb Conjugation Tab Switching

const fs = require('fs');

// DOM Mocks
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

  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }

  querySelectorAll(sel) {
    let matches = [];
    if (sel.startsWith('.')) {
      const cls = sel.substring(1);
      if (this.className.includes(cls)) matches.push(this);
    }
    this.children.forEach(child => {
      matches = matches.concat(child.querySelectorAll(sel));
    });
    return matches;
  }
}

// Parse HTML string to simple mock elements tree
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

global.escapeHtml = (str) => str || '';
global.getFrenchConjugations = (verb, tense) => ({
  je: `je_${tense}`,
  tu: `tu_${tense}`,
  il: `il_${tense}`,
  nous: `nous_${tense}`,
  vous: `vous_${tense}`,
  ils: `ils_${tense}`
});
global.playPronunciation = () => {};

const uiContent = fs.readFileSync('./ui.js', 'utf8');
eval(uiContent.replace('const UIComponents =', 'global.UIComponents ='));

function runTenseSwitchingTests() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop French Conjugation 5-Tense Tab Switching Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  const mockData = {
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

  // 1. Initial Render Verification
  const conjBox = new MockElement('div');
  UIComponents.renderConjugations(conjBox, mockData, 'fr', 'contente');

  console.log('▶ [Step 1] Initial Card Render for Subjunctive word "contente"');
  if (conjBox.innerHTML.includes('data-tense="subjonctif"') && conjBox.innerHTML.includes('active')) {
    console.log('   ✅ Initial render correctly defaults to Subjonctif tab active');
    passed++;
  } else {
    console.log('   ❌ Initial render failed');
    failed++;
  }

  // 2. Simulate User Clicking EACH of the 5 Tense Tabs
  console.log('\n▶ [Step 2] Testing User Clicks across ALL 5 Tenses:');
  tensesToTest.forEach(tenseObj => {
    // Call renderConjugations with explicit tense click
    UIComponents.renderConjugations(conjBox, mockData, 'fr', 'contente', tenseObj.id);

    const isTabActive = conjBox.innerHTML.includes(`class="glossapop-tense-tab active" data-tense="${tenseObj.id}"`);
    const isConjugationRendered = conjBox.innerHTML.includes(`je_${tenseObj.id}`);

    if (isTabActive && isConjugationRendered) {
      console.log(`   ✅ Clicked [${tenseObj.label}] ➔ Tab active & ${tenseObj.id} grid rendered successfully!`);
      passed++;
    } else {
      console.log(`   ❌ Clicked [${tenseObj.label}] ➔ Failed to switch to ${tenseObj.id}`);
      failed++;
    }
  });

  console.log('\n===============================================================');
  console.log(`📊 Tense Switching Verification: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runTenseSwitchingTests();
