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
  hostElement.style.setProperty('color-scheme', 'light dark', 'important');

  // --- Dark Reader Isolation ---
  // Detect and neutralize Dark Reader's filter-based color inversion.
  // CSS filters on a parent cascade visually to ALL children; filter:none does NOT undo it.
  // For Filter mode: apply inverse transform to cancel parent's invert(1) hue-rotate(180deg).
  // For Dynamic mode: Shadow DOM naturally isolates, but we clean up any injected styles.
  function applyDarkReaderCounterFilter() {
    const mode = document.documentElement.getAttribute('data-darkreader-mode');
    if (mode === 'filter' || mode === 'filter+') {
      hostElement.style.setProperty('filter', 'invert(1) hue-rotate(180deg)', 'important');
    } else {
      hostElement.style.removeProperty('filter');
    }
  }
  applyDarkReaderCounterFilter();

  // Watch for Dark Reader toggling on/off (it sets/removes data-darkreader-mode on <html>)
  const darkReaderObserver = new MutationObserver(() => applyDarkReaderCounterFilter());
  darkReaderObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-darkreader-mode']
  });

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

  // Apply theme mode class based on settings
  card.classList.remove('glossapop-dark', 'glossapop-light');
  if (settings.themeMode === 'dark') {
    card.classList.add('glossapop-dark');
  } else if (settings.themeMode === 'light') {
    card.classList.add('glossapop-light');
  } else {
    // Auto mode: detect Dark Reader or similar dark-mode extensions
    const isDarkReaderActive = document.documentElement.hasAttribute('data-darkreader-mode')
      || document.documentElement.hasAttribute('data-darkreader-scheme')
      || !!document.querySelector('meta[name="darkreader"]');
    if (isDarkReaderActive) {
      card.classList.add('glossapop-dark');
    }
    // Otherwise, @media (prefers-color-scheme: dark) handles native OS dark mode
  }

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

      // Render modular DOM elements (loaded from ui.js) if it is a single word lookup
      const wordCount = word.split(/\s+/).filter(Boolean).length;
      const isSentence = wordCount > 4;

      if (isSentence) {
        if (lemmaRow) lemmaRow.style.display = 'none';
        if (conjBox) conjBox.style.display = 'none';
        if (synonymsBox) synonymsBox.style.display = 'none';
        if (exampleBox) exampleBox.style.display = 'none';
        if (externalLinksBox) externalLinksBox.style.display = 'none';
        
        // Show TTS pronunciation audio button for sentence/paragraph mode
        if (phoneticText) phoneticText.textContent = '';
        if (audioGroup) audioGroup.style.display = 'flex';
        if (speakBtn) {
          speakBtn.title = "Pronounce selected text";
          speakBtn.onclick = () => {
            playPronunciation(word, activeTargetLang, null);
          };
        }
      } else {
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
        if (speakBtn) {
          speakBtn.title = "Pronounce";
          speakBtn.onclick = () => {
            playPronunciation(data.word || word, activeTargetLang, data.audio);
          };
        }
      }

      // 3. Render definition texts
      if (!isSentence && data.definitions && data.definitions.length > 0) {
        let html = '';
        data.definitions.forEach(def => {
          html += `<div class="glossapop-meaning-item">${escapeHtml(def)}</div>`;
        });
        contentDiv.innerHTML = html;
      } else if (data.translation) {
        contentDiv.innerHTML = `<div class="glossapop-meaning-item" style="border-left: 2px solid #007aff; font-size: 13.5px; line-height: 1.45;">${escapeHtml(data.translation)}</div>`;
      } else {
        contentDiv.innerHTML = `<div class="glossapop-error">No translation found.</div>`;
      }

      // 4. Bind Google Sheets Save Button & Deduplication status
      const saveBtn = shadowRoot.querySelector('#glossapop-save-word');
      if (saveBtn) {
        const queryKey = (data.word || word).trim().toLowerCase();
        chrome.storage.local.get(['savedWords'], (stored) => {
          const savedWords = stored.savedWords || {};
          if (savedWords[queryKey]) {
            saveBtn.classList.add('saved');
            saveBtn.textContent = '★ Saved';
          } else {
            saveBtn.classList.remove('saved');
            saveBtn.textContent = '☆ Save';
          }
        });

        saveBtn.onclick = (e) => {
          e.stopPropagation();
          const wordToSave = data.word || word;
          const cefrObj = getCEFRLevel(wordToSave, activeTargetLang);

          const wordData = {
            word: wordToSave,
            phonetic: data.phonetic || '',
            cefr: cefrObj ? cefrObj.text : '',
            definition: (data.definitions && data.definitions[0]) ? data.definitions[0] : (data.translation || ''),
            exampleSentence: data.example ? data.example.text : '',
            exampleTranslation: data.example ? data.example.translation : ''
          };

          saveBtn.textContent = '⏳ Saving...';

          chrome.runtime.sendMessage({
            action: 'saveWordToSheet',
            targetLang: activeTargetLang,
            wordData
          }, (res) => {
            if (chrome.runtime.lastError) {
              saveBtn.textContent = '☆ Save';
              showToastNotice(shadowRoot, `❌ Auth Required: Connect in Options`);
              return;
            }

            if (res && res.success) {
              saveBtn.classList.add('saved');
              saveBtn.textContent = '★ Saved';
              if (res.duplicate) {
                showToastNotice(shadowRoot, `✓ Already in Vocabulary Book`);
              } else {
                showToastNotice(shadowRoot, `✓ Saved to Google Sheet!`);
              }
            } else {
              saveBtn.classList.remove('saved');
              saveBtn.textContent = '☆ Save';
              const err = (res && res.error) ? res.error : 'Failed to save';
              showToastNotice(shadowRoot, `❌ ${err}`);
            }
          });
        };
      }
    } else {
      const errMsg = (response && response.error) ? response.error : 'Word not found or API request failed.';
      contentDiv.innerHTML = `<div class="glossapop-error">${escapeHtml(errMsg)}</div>`;
    }
  });
}

// Dismiss popup and floating icons
function hideAll() {
  if (typeof stopAudio === 'function') {
    stopAudio();
  }
  if (!shadowRoot) return;
  const triggerIcon = shadowRoot.querySelector('.glossapop-trigger-icon');
  const card = shadowRoot.querySelector('.glossapop-card');
  
  if (triggerIcon) triggerIcon.classList.remove('visible');
  if (card) card.classList.remove('visible');
}
