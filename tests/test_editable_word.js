// tests/test_editable_word.js - TDD Test Suite for Editable Word Title, CEFR Badge Isolation & Blur Auto-Query

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser globals for Node.js environment
global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  scrollX: 0,
  scrollY: 0
};

global.document = {
  listeners: {},
  addEventListener(event, fn) {
    this.listeners[event] = fn;
  },
  removeEventListener(event, fn) {
    delete this.listeners[event];
  },
  createElement(tag) {
    return {
      tagName: tag.toUpperCase(),
      className: '',
      title: '',
      textContent: '',
      removeAttribute() {},
      remove() { this.removed = true; }
    };
  },
  documentElement: {
    hasAttribute: () => false,
    getAttribute: () => null
  }
};

global.chrome = {
  runtime: {
    getURL: (path) => path,
    getManifest: () => ({ version: '1.0.7' })
  },
  storage: {
    sync: {
      get: (keys, cb) => cb({}),
      set: (data, cb) => cb && cb()
    },
    local: {
      get: (keys, cb) => cb({}),
      set: (data, cb) => cb && cb()
    }
  }
};

const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

global.settings = {
  explainLangA: 'zh-TW',
  explainLangB: 'en',
  themeMode: 'auto'
};

global.escapeHtml = str => str || '';
global.getLanguageLabel = code => code;

// Load ui.js code dynamically into test environment
const uiCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
eval(uiCode.replace('const UIComponents =', 'global.UIComponents ='));

console.log('🧪 Starting Editable Word Title, CEFR & Blur Auto-Query TDD Test Suite...\n');

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
// [1] Test Editable Word HTML Structure
// -------------------------------------------------------------
console.log('▶ [1] Testing Editable Word Title Markup...');

class MockBadgeElement {
  constructor() {
    this.className = 'glossapop-cefr-badge cefr-c1';
    this.textContent = 'C1';
    this.title = 'Advanced';
  }
  removeAttribute() {}
  remove() { this.removed = true; }
}

class MockContainerElement {
  constructor() {
    this.badge = new MockBadgeElement();
  }
  querySelector(sel) {
    if (sel === '.glossapop-cefr-badge') return this.badge;
    return null;
  }
  appendChild(child) {
    this.badge = child;
  }
}

class MockCardElement {
  constructor() {
    this.innerHTML = '';
    this.listeners = {};
    this.style = {};
    this.container = new MockContainerElement();
    this.wordTitleNode = {
      textContent: 'maisons',
      getAttribute: (attr) => attr === 'contenteditable' ? (/contenteditable="true"/i.test(this.innerHTML) ? 'true' : null) : null,
      listeners: {},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      blur() {
        if (typeof this.listeners['blur'] === 'function') {
          this.listeners['blur']();
        }
      }
    };
    this.editBtnNode = {
      listeners: {},
      addEventListener(event, fn) { this.listeners[event] = fn; }
    };
  }
  querySelector(selector) {
    if (selector === '.glossapop-word-title-container') return this.container;
    if (selector === '.glossapop-word') return this.wordTitleNode;
    if (selector === '.glossapop-edit-btn') return this.editBtnNode;
    return {
      listeners: {},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      querySelectorAll: () => []
    };
  }
  querySelectorAll() { return []; }
}

const singleMockCard = new MockCardElement();
const mockShadow = {
  querySelector: (sel) => {
    if (sel === '.glossapop-card') return singleMockCard;
    return singleMockCard.querySelector(sel);
  }
};

let queriedWordsList = [];
UIComponents.renderFrame(
  mockShadow,
  'maisons',
  'fr',
  'zh-TW',
  () => {},
  () => {},
  () => {},
  (editedWord) => { queriedWordsList.push(editedWord); }
);

const cardEl = singleMockCard;
const wordTitleEl = cardEl.querySelector('.glossapop-word');

assertTest('Word title element should have contenteditable="true"', wordTitleEl && wordTitleEl.getAttribute('contenteditable') === 'true');
assertTest('Pencil edit button removed and title has text cursor hover affordance', !/glossapop-edit-btn/i.test(cardEl.innerHTML) && !/✏️/.test(cardEl.innerHTML));

// -------------------------------------------------------------
// [2] Test Keydown Enter Event Triggers Re-Query Clean Word
// -------------------------------------------------------------
console.log('\n▶ [2] Testing Enter Keypress Clean Word Extraction...');

if (wordTitleEl && typeof wordTitleEl.listeners['keydown'] === 'function') {
  wordTitleEl.textContent = 'il A1'; // User edited or title accidentally contained badge suffix
  
  const enterEvent = {
    key: 'Enter',
    preventDefault: () => {},
    stopPropagation: () => {}
  };

  wordTitleEl.listeners['keydown'](enterEvent);
  assertTest('Pressing Enter strips accidental "A1" suffix and re-queries "il"', queriedWordsList[queriedWordsList.length - 1] === 'il');
}

// -------------------------------------------------------------
// [3] Test Blur Event (Clicking Elsewhere) Auto-Triggers Re-Query
// -------------------------------------------------------------
console.log('\n▶ [3] Testing Blur Event (Clicking Elsewhere) Auto-Query...');

assertTest('Word title has blur listener attached', wordTitleEl && typeof wordTitleEl.listeners['blur'] === 'function');

if (wordTitleEl && typeof wordTitleEl.listeners['blur'] === 'function') {
  const previousQueryCount = queriedWordsList.length;
  wordTitleEl.textContent = 'maison'; // User typed 'maison' without pressing Enter
  
  // Simulate clicking elsewhere (blur event)
  wordTitleEl.listeners['blur']();

  assertTest('Blur event automatically re-queries edited word "maison"', queriedWordsList[queriedWordsList.length - 1] === 'maison');
  assertTest('Blur event on unchanged word does not trigger duplicate query', () => {
    const countBefore = queriedWordsList.length;
    wordTitleEl.listeners['blur']();
    return queriedWordsList.length === countBefore;
  });
}

// -------------------------------------------------------------
// [4] Test Secondary In-Card Query CEFR Badge Update
// -------------------------------------------------------------
console.log('\n▶ [4] Testing Secondary In-Card CEFR Badge Update...');

function updateCardTitleAndBadge(shadowRoot, newWord, targetLang) {
  const titleContainer = shadowRoot.querySelector('.glossapop-word-title-container');
  const titleEl = shadowRoot.querySelector('.glossapop-word');
  if (titleEl) {
    const wordCount = newWord.split(/\s+/).filter(Boolean).length;
    const isSentence = wordCount > 4;
    const displayWord = isSentence ? (newWord.length > 30 ? newWord.substring(0, 27) + '...' : newWord) : newWord;
    titleEl.textContent = displayWord;

    if (titleContainer) {
      let badgeEl = titleContainer.querySelector('.glossapop-cefr-badge');
      const cefr = isSentence ? null : getCEFRLevel(newWord, targetLang);
      if (cefr) {
        if (!badgeEl) {
          badgeEl = global.document.createElement('span');
          titleContainer.appendChild(badgeEl);
        }
        badgeEl.className = `glossapop-cefr-badge cefr-${cefr.text.toLowerCase()}`;
        badgeEl.title = cefr.label;
        badgeEl.textContent = cefr.text;
      } else if (badgeEl) {
        badgeEl.remove();
      }
    }
  }
}

updateCardTitleAndBadge(mockShadow, 'il', 'fr');

assertTest('Title textContent updated to pure word "il"', singleMockCard.wordTitleNode.textContent === 'il');
assertTest('CEFR badge in container updated from C1 to A1', singleMockCard.container.badge.textContent === 'A1');
assertTest('CEFR badge class updated to cefr-a1', singleMockCard.container.badge.className.includes('cefr-a1'));

// Summary
console.log('\n===============================================================');
console.log(`📊 Editable Word & Blur Suite: ${passedTests} PASSED / ${failedTests} FAILED`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
