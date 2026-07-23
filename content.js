// content.js - Handles Shadow DOM popup setup, life cycle coordination, and data fetching

// --- Global Shared Variables ---
let currentWord = '';
let shadowRoot = null;
let hostElement = null;

// Track active popup language state dynamically
let activeTargetLang = 'en';
let activeExplainLang = 'zh';

// Initialize settings loading upon startup
loadSettings();

// --- Shadow DOM Setup ---
function initShadowDOM() {
  if (hostElement) return;

  hostElement = document.createElement('div');
  hostElement.id = 'glossapop-host';
  
  // Ensure the host element doesn't affect page layout
  hostElement.style.position = 'absolute';
  hostElement.style.top = '0';
  hostElement.style.left = '0';
  hostElement.style.width = '100%';
  hostElement.style.height = '0';
  hostElement.style.overflow = 'visible';
  hostElement.style.zIndex = '2147483647';

  document.documentElement.appendChild(hostElement);
  shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // Inject styles scoped strictly inside the Shadow DOM (loaded from ui.js)
  const style = document.createElement('style');
  style.textContent = POPUP_CSS;
  shadowRoot.appendChild(style);

  // Initialize UI trigger icon and card DOM
  const triggerIcon = document.createElement('div');
  triggerIcon.className = 'glossapop-trigger-icon';
  triggerIcon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
  
  const card = document.createElement('div');
  card.className = 'glossapop-card';

  shadowRoot.appendChild(triggerIcon);
  shadowRoot.appendChild(card);

  // Open popup upon trigger icon click
  triggerIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerIcon.classList.remove('visible');
    showPopup(currentWord, parseFloat(triggerIcon.style.left), parseFloat(triggerIcon.style.top));
  });

  // Prevent click events inside the card from bubbling to document (which closes the card)
  card.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// --- View Management and Language Switching ---
function showPopup(word, x, y) {
  initShadowDOM();
  const card = shadowRoot.querySelector('.glossapop-card');
  
  // Assign settings default languages
  activeTargetLang = settings.defaultTargetLang;
  activeExplainLang = settings.defaultExplainLang;

  // Position card
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;
  
  // Render initial structure
  renderPopupFrame(
    shadowRoot, 
    word, 
    activeTargetLang, 
    activeExplainLang, 
    hideAll, 
    (newTarget) => {
      activeTargetLang = newTarget;
      fetchAndDisplay(word, false);
    },
    (newExplain) => {
      activeExplainLang = newExplain;
      fetchAndDisplay(word, false);
    }
  );
  card.classList.add('visible');
  
  fetchAndDisplay(word, true); // true indicates initial query (runs auto-detection)
  
  // Adjust layout calculations dynamically to prevent clipping out of screen boundaries
  setTimeout(() => {
    const cardRect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newLeft = x;
    let newTop = y;

    if (cardRect.right > viewportWidth) {
      newLeft = Math.max(10, viewportWidth - cardRect.width - 20 + window.scrollX);
    }
    if (cardRect.bottom > viewportHeight) {
      newTop = Math.max(10, y - cardRect.height - 30);
    }
    
    card.style.left = `${newLeft}px`;
    card.style.top = `${newTop}px`;
  }, 10);
}

// Fetch translation and display results
async function fetchAndDisplay(word, isInitial = false) {
  const contentDiv = shadowRoot.querySelector('.glossapop-content');
  const audioGroup = shadowRoot.querySelector('.glossapop-word-audio-group');
  const phoneticText = shadowRoot.querySelector('.glossapop-phonetic');
  const speakBtn = shadowRoot.querySelector('.glossapop-speak-btn');
  const lemmaRow = shadowRoot.querySelector('.glossapop-lemma-row');
  const conjBox = shadowRoot.querySelector('.glossapop-conjugation-box');
  const synonymsBox = shadowRoot.querySelector('.glossapop-synonyms-box');
  const exampleBox = shadowRoot.querySelector('.glossapop-example-box');
  const externalLinksBox = shadowRoot.querySelector('.glossapop-external-links');

  // Show loading spinner
  contentDiv.innerHTML = `
    <div class="glossapop-loader-container">
      <div class="glossapop-spinner"></div>
    </div>
  `;
  if (audioGroup) audioGroup.style.display = 'none';
  if (lemmaRow) lemmaRow.style.display = 'none';
  if (conjBox) conjBox.style.display = 'none';
  if (synonymsBox) synonymsBox.style.display = 'none';
  if (exampleBox) exampleBox.style.display = 'none';
  if (externalLinksBox) externalLinksBox.style.display = 'none';

  // Determine query source language (use 'auto' for initial queries)
  const sourceLangQuery = isInitial ? 'auto' : activeTargetLang;

  // Query background.js proxy to avoid CORS barriers
  chrome.runtime.sendMessage({
    action: 'fetchTranslation',
    word: word,
    source: sourceLangQuery,
    target: activeExplainLang
  }, (response) => {
    if (chrome.runtime.lastError) {
      contentDiv.innerHTML = `<div class="glossapop-error">Connection Error: Unable to communicate with the background worker.</div>`;
      return;
    }

    if (response && response.success) {
      const data = response.data;
      
      // Update active target language and UI segments dynamically if detected
      if (isInitial && data.detectedLang) {
        activeTargetLang = data.detectedLang;
        const targetGroup = shadowRoot.querySelector('#target-lang-group');
        if (targetGroup) {
          targetGroup.querySelectorAll('.glossapop-segment-btn').forEach(btn => {
            if (btn.dataset.val === activeTargetLang) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        }
      }

      // Update card title heading for secondary in-card queries
      if (!isInitial) {
        const titleEl = shadowRoot.querySelector('.glossapop-word');
        if (titleEl) {
          const cefr = getCEFRLevel(word, activeTargetLang);
          const cefrBadge = cefr ? `<span class="glossapop-cefr-badge" style="color:${cefr.color}; background:${cefr.bg};" title="${escapeHtml(cefr.label)}">${cefr.text}</span>` : '';
          titleEl.innerHTML = `${escapeHtml(word)}${cefrBadge}`;
        }
      }

      // Render modular DOM elements (loaded from ui.js)
      renderLemma(lemmaRow, data, activeTargetLang);
      renderConjugations(conjBox, data, activeTargetLang, word);
      if (synonymsBox) renderSynonyms(synonymsBox, data, (clickedChipWord) => fetchAndDisplay(clickedChipWord, false));
      renderExample(exampleBox, data, activeTargetLang);
      renderLinks(externalLinksBox, data, activeTargetLang, word);

      // 1. Render phonetics if available
      if (data.phonetic) {
        phoneticText.textContent = data.phonetic;
      } else {
        phoneticText.textContent = '';
      }
      if (audioGroup) audioGroup.style.display = 'flex';

      // 2. Bind pronunciation playback (Multi-tier Audio Playback)
      speakBtn.onclick = () => {
        playPronunciation(data.word || word, activeTargetLang, data.audio);
      };

      // 3. Render definition texts
      if (data.definitions && data.definitions.length > 0) {
        let html = '';
        data.definitions.forEach(def => {
          html += `<div class="glossapop-meaning-item">${escapeHtml(def)}</div>`;
        });
        contentDiv.innerHTML = html;
      } else if (data.translation) {
        contentDiv.innerHTML = `<div class="glossapop-meaning-item">${escapeHtml(data.translation)}</div>`;
      } else {
        contentDiv.innerHTML = `<div class="glossapop-error">No definitions found.</div>`;
      }
    } else {
      const errMsg = (response && response.error) ? response.error : 'Word not found or API request failed.';
      contentDiv.innerHTML = `<div class="glossapop-error">${escapeHtml(errMsg)}</div>`;
    }
  });
}

// Dismiss popup and floating icons
function hideAll() {
  if (!shadowRoot) return;
  const triggerIcon = shadowRoot.querySelector('.glossapop-trigger-icon');
  const card = shadowRoot.querySelector('.glossapop-card');
  
  if (triggerIcon) triggerIcon.classList.remove('visible');
  if (card) card.classList.remove('visible');
}
