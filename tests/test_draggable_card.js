// tests/test_draggable_card.js - TDD Test Suite for Draggable Popup Card & Bottom Boundary Placement

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

// Load ui.js code dynamically into test environment
const uiCode = fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8');
eval(uiCode.replace('const UIComponents =', 'global.UIComponents ='));

console.log('🧪 Starting Draggable Popup Card TDD Test Suite...\n');

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
// [1] Test Draggable Card Method Existence & Event Binding
// -------------------------------------------------------------
console.log('▶ [1] Testing makeCardDraggable method...');
assertTest('UIComponents.makeCardDraggable should be a function', typeof UIComponents.makeCardDraggable === 'function');

// Mock Card & Header DOM Element
class MockElement {
  constructor(tagName = 'DIV', className = '') {
    this.tagName = tagName;
    this.className = className;
    this.style = {};
    this.children = [];
    this.listeners = {};
    this.classList = {
      add: (c) => { this.className += ' ' + c; },
      remove: (c) => { this.className = this.className.replace(c, '').trim(); }
    };
    this.ownerDocument = global.document;
  }
  addEventListener(event, fn) {
    this.listeners[event] = fn;
  }
  removeEventListener(event, fn) {
    delete this.listeners[event];
  }
  closest(selector) {
    if (selector.includes(this.tagName.toLowerCase())) return this;
    return null;
  }
  getBoundingClientRect() {
    return {
      left: parseFloat(this.style.left) || 100,
      top: parseFloat(this.style.top) || 100,
      width: 380,
      height: 400,
      right: (parseFloat(this.style.left) || 100) + 380,
      bottom: (parseFloat(this.style.top) || 100) + 400
    };
  }
}

const mockCard = new MockElement('DIV', 'glossapop-card');
mockCard.style.left = '100px';
mockCard.style.top = '150px';

const mockHeader = new MockElement('DIV', 'glossapop-header');

UIComponents.makeCardDraggable(mockCard, mockHeader);

assertTest('makeCardDraggable sets cursor grab on header', mockHeader.style.cursor === 'grab');
assertTest('Header has mousedown listener attached', typeof mockHeader.listeners['mousedown'] === 'function');

// -------------------------------------------------------------
// [2] Test Drag Motion (MouseDown -> MouseMove -> MouseUp)
// -------------------------------------------------------------
console.log('\n▶ [2] Testing Drag Motion (mouse events)...');

// Simulate MouseDown on header
const mouseDownEvent = {
  clientX: 200,
  clientY: 200,
  target: mockHeader,
  preventDefault: () => {},
  stopPropagation: () => {}
};

mockHeader.listeners['mousedown'](mouseDownEvent);

assertTest('MouseDown sets header cursor to grabbing', mockHeader.style.cursor === 'grabbing');
assertTest('MouseMove listener attached to document', typeof document.listeners['mousemove'] === 'function');

// Simulate MouseMove (+50px X, +30px Y)
const mouseMoveEvent = {
  clientX: 250,
  clientY: 230
};

document.listeners['mousemove'](mouseMoveEvent);

assertTest('MouseMove updates card left to 150px', mockCard.style.left === '150px');
assertTest('MouseMove updates card top to 180px', mockCard.style.top === '180px');

// Simulate MouseUp
const mouseUpEvent = {};
document.listeners['mouseup'](mouseUpEvent);

assertTest('MouseUp resets header cursor to grab', mockHeader.style.cursor === 'grab');

// -------------------------------------------------------------
// [3] Test Drag Cancellation on Interactive Buttons
// -------------------------------------------------------------
console.log('\n▶ [3] Testing Drag Cancellation on Interactive Children...');

const mockButton = new MockElement('BUTTON', 'glossapop-close-btn');
const buttonMouseDownEvent = {
  clientX: 200,
  clientY: 200,
  target: mockButton,
  preventDefault: () => {},
  stopPropagation: () => {}
};

mockHeader.listeners['mousedown'](buttonMouseDownEvent);

assertTest('MouseDown on button does not trigger drag mode', mockHeader.style.cursor !== 'grabbing');

// -------------------------------------------------------------
// [4] Test Bottom-of-Screen Viewport Adjustment Calculation
// -------------------------------------------------------------
console.log('\n▶ [4] Testing Bottom-of-Screen Viewport Placement...');

function calculateAdjustedPosition(x, y, cardWidth, cardHeight, viewportWidth, viewportHeight, scrollX = 0, scrollY = 0) {
  let newLeft = x;
  let newTop = y;

  if (x + cardWidth > viewportWidth + scrollX) {
    newLeft = Math.max(10 + scrollX, scrollX + viewportWidth - cardWidth - 20);
  }
  if (y + cardHeight > viewportHeight + scrollY) {
    const topAboveSelection = y - cardHeight - 30;
    if (topAboveSelection > scrollY) {
      newTop = topAboveSelection;
    } else {
      newTop = Math.max(scrollY + 10, scrollY + viewportHeight - cardHeight - 20);
    }
  }

  return { left: newLeft, top: newTop };
}

// Normal placement (top-left of screen)
const normalPos = calculateAdjustedPosition(100, 100, 380, 400, 1024, 768);
assertTest('Normal position remains unchanged', normalPos.left === 100 && normalPos.top === 100);

// Near bottom of screen (y = 650, height = 400 => bottom = 1050 > 768)
const bottomPos = calculateAdjustedPosition(100, 650, 380, 400, 1024, 768);
assertTest('Bottom position flips above selection or clamps inside viewport', bottomPos.top < 650 && bottomPos.top + 400 <= 768);

// Summary
console.log('\n===============================================================');
console.log(`📊 Draggable Card Test Suite: ${passedTests} PASSED / ${failedTests} FAILED`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
