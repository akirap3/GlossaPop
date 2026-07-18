// content.js - Handles word selection, Shadow DOM injection, Speech synthesis, and API communication

(async () => {
  // --- 1. State and Settings Initialization ---
  let settings = {
    defaultTargetLang: 'en',
    defaultExplainLang: 'en',
    triggerMode: 'icon'
  };

  let currentWord = '';
  let shadowRoot = null;
  let hostElement = null;

  // Load user configurations
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        defaultTargetLang: 'en',
        defaultExplainLang: 'en',
        triggerMode: 'icon'
      }, (items) => {
        settings = items;
        resolve();
      });
    });
  }

  await loadSettings();

  // Listen for setting changes from the Options page
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      for (let key in changes) {
        settings[key] = changes[key].newValue;
      }
    }
  });

  // --- 2. Shadow DOM Setup ---
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

    // Inject styles scoped strictly inside the Shadow DOM to avoid host page styling pollution
    const style = document.createElement('style');
    style.textContent = `
      /* Floating Trigger Icon */
      .glossapop-trigger-icon {
        position: absolute;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #007aff, #00c6ff);
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease;
        opacity: 0;
        transform: scale(0.8);
        pointer-events: none;
        user-select: none;
      }
      .glossapop-trigger-icon.visible {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }
      .glossapop-trigger-icon:hover {
        transform: scale(1.1);
      }
      .glossapop-trigger-icon svg {
        width: 14px;
        height: 14px;
        fill: #ffffff;
      }

      /* Floating Popup Card - High-Contrast Light Glassmorphism Style */
      .glossapop-card {
        position: absolute;
        width: 320px;
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(24px) saturate(200%);
        -webkit-backdrop-filter: blur(24px) saturate(200%);
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 16px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
        color: #1c1c1e;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        padding: 14px;
        box-sizing: border-box;
        opacity: 0;
        transform: scale(0.95) translateY(8px);
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        user-select: none;
      }
      .glossapop-card.visible {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
      }

      /* Header & Controls */
      .glossapop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .glossapop-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: linear-gradient(135deg, #0056b3, #0088cc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .glossapop-close-btn {
        border: none;
        background: none;
        color: #636366;
        font-size: 16px;
        cursor: pointer;
        padding: 0 4px;
        transition: color 0.2s, transform 0.2s;
        line-height: 1;
      }
      .glossapop-close-btn:hover {
        color: #1c1c1e;
        transform: scale(1.15);
      }

      /* Segmented Toggles */
      .glossapop-toggles {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        padding-bottom: 10px;
      }
      .glossapop-segment {
        display: inline-flex;
        background: rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.03);
        border-radius: 8px;
        padding: 2px;
        flex: 1;
      }
      .glossapop-segment-btn {
        border: none;
        background: none;
        color: #636366;
        padding: 4px 0;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
        text-align: center;
        transition: all 0.2s ease;
      }
      .glossapop-segment-btn.active {
        background: #ffffff;
        color: #1c1c1e;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(0, 0, 0, 0.02);
      }

      /* Content Panel */
      .glossapop-word-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .glossapop-word {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        color: #1c1c1e;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }
      
      .glossapop-word-audio-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .glossapop-phonetic {
        font-size: 12px;
        color: #0066cc;
        font-family: Arial, sans-serif;
      }
      .glossapop-speak-btn {
        background: rgba(0, 102, 204, 0.1);
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #0066cc;
        transition: background-color 0.2s, transform 0.1s;
        padding: 0;
        flex-shrink: 0;
      }
      .glossapop-speak-btn:hover {
        background: rgba(0, 102, 204, 0.2);
        transform: scale(1.05);
      }
      .glossapop-speak-btn svg {
        width: 11px;
        height: 11px;
        fill: currentColor;
      }

      /* Example Box Styles */
      .glossapop-example-box {
        font-size: 11px;
        color: #48484a;
        background: rgba(0, 0, 0, 0.03);
        padding: 8px 10px;
        border-radius: 8px;
        margin-top: 10px;
        border-left: 2px solid #b84a00;
      }
      .glossapop-example-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.5px;
        color: #b84a00;
        margin-bottom: 4px;
      }
      .glossapop-example-text {
        font-style: italic;
        color: #1c1c1e;
        line-height: 1.35;
        font-weight: 500;
      }
      .glossapop-example-translation {
        font-size: 10px;
        color: #555559;
        margin-top: 2px;
        line-height: 1.35;
      }
      .glossapop-example-speak-btn {
        background: rgba(184, 74, 0, 0.1);
        border: none;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #b84a00;
        transition: background-color 0.2s, transform 0.1s;
        padding: 0;
        flex-shrink: 0;
      }
      .glossapop-example-speak-btn:hover {
        background: rgba(184, 74, 0, 0.2);
        transform: scale(1.05);
      }
      .glossapop-example-speak-btn svg {
        width: 9px;
        height: 9px;
        fill: currentColor;
      }

      /* External Reference Links Styles */
      .glossapop-external-links {
        font-size: 10px;
        color: #8e8e93;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        white-space: nowrap;
      }
      .glossapop-external-links span {
        font-weight: 600;
      }
      .glossapop-external-links a {
        color: #0066cc;
        text-decoration: none;
        transition: color 0.2s;
        font-weight: 500;
      }
      .glossapop-external-links a:hover {
        color: #004499;
        text-decoration: underline;
      }

      /* Root Lemma & Derivation Styles */
      .glossapop-lemma-row {
        font-size: 11px;
        color: #48484a;
        background: rgba(52, 199, 89, 0.08);
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-left: 2px solid #34c759;
      }
      .glossapop-lemma-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }
      .glossapop-lemma-text {
        font-weight: 500;
        line-height: 1.35;
        flex: 1;
        margin-right: 6px;
      }
      .glossapop-lemma-speak-btn {
        background: rgba(52, 199, 89, 0.12);
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #34c759;
        transition: background-color 0.2s, transform 0.1s;
        padding: 0;
        flex-shrink: 0;
      }
      .glossapop-lemma-speak-btn:hover {
        background: rgba(52, 199, 89, 0.2);
        transform: scale(1.05);
      }
      .glossapop-lemma-speak-btn svg {
        width: 10px;
        height: 10px;
        fill: currentColor;
      }
      .glossapop-french-tip {
        margin-top: 2px;
        padding-top: 6px;
        border-top: 1px dashed rgba(52, 199, 89, 0.25);
        font-size: 9.5px;
        color: #555559;
        line-height: 1.35;
      }
      /* French Conjugation Table Box Styles */
      .glossapop-conjugation-box {
        font-size: 11px;
        color: #48484a;
        background: rgba(0, 102, 204, 0.05);
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        border-left: 2px solid #0066cc;
      }
      .glossapop-conj-title {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.5px;
        color: #0066cc;
        margin-bottom: 6px;
      }
      .glossapop-conj-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 10px;
      }
      .glossapop-conj-item {
        display: flex;
        justify-content: space-between;
        line-height: 1.35;
      }
      .glossapop-conj-item span {
        color: #8e8e93;
        margin-right: 6px;
      }
      .glossapop-conj-item strong {
        color: #1c1c1e;
        font-weight: 600;
      }

      /* Translation Text */
      .glossapop-content {
        font-size: 13px;
        line-height: 1.5;
        max-height: 160px;
        overflow-y: auto;
        color: #2c2c2e;
        padding-right: 4px;
      }
      /* Custom Scrollbar Styles */
      .glossapop-content::-webkit-scrollbar {
        width: 4px;
      }
      .glossapop-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .glossapop-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 2px;
      }
      
      .glossapop-meaning-item {
        margin-bottom: 6px;
        border-left: 2px solid #0066cc;
        padding-left: 6px;
      }
      
      /* Loading Animation Spinner */
      .glossapop-loader-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 0;
      }
      .glossapop-spinner {
        border: 2px solid rgba(0, 0, 0, 0.08);
        border-top: 2px solid #0066cc;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: glossapop-spin 0.8s linear infinite;
      }
      @keyframes glossapop-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Error States */
      .glossapop-error {
        color: #ff3b30;
        font-size: 12px;
        text-align: center;
        padding: 10px 0;
      }
    `;

    shadowRoot.appendChild(style);

    // Initialize UI trigger icon and card DOM
    const triggerIcon = document.createElement('div');
    triggerIcon.className = 'glossapop-trigger-icon';
    // Magnifying Glass SVG
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

  // --- 3. View Management and Language Switching ---
  let activeTargetLang = 'en';
  let activeExplainLang = 'zh';

  function showPopup(word, x, y) {
    initShadowDOM();
    const card = shadowRoot.querySelector('.glossapop-card');
    
    // Assign settings default languages
    activeTargetLang = settings.defaultTargetLang;
    activeExplainLang = settings.defaultExplainLang;

    // Position card
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    
    renderPopupFrame(word);
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
    }, 50);
  }

  // Setup basic popup interface layout
  function renderPopupFrame(word) {
    const card = shadowRoot.querySelector('.glossapop-card');
    card.innerHTML = `
      <div class="glossapop-header">
        <span class="glossapop-title">GlossaPop</span>
        <button class="glossapop-close-btn">&times;</button>
      </div>
      <div class="glossapop-toggles">
        <div class="glossapop-segment" id="target-lang-group">
          <button class="glossapop-segment-btn ${activeTargetLang === 'en' ? 'active' : ''}" data-val="en">EN</button>
          <button class="glossapop-segment-btn ${activeTargetLang === 'fr' ? 'active' : ''}" data-val="fr">FR</button>
        </div>
        <div class="glossapop-segment" id="explain-lang-group">
          <button class="glossapop-segment-btn ${activeExplainLang === 'zh' ? 'active' : ''}" data-val="zh">Chinese</button>
          <button class="glossapop-segment-btn ${activeExplainLang === 'en' ? 'active' : ''}" data-val="en">English</button>
        </div>
      </div>
      <div class="glossapop-word-info">
        <h3 class="glossapop-word" title="${escapeHtml(word)}">${escapeHtml(word)}</h3>
        <div class="glossapop-word-audio-group" style="display:none;">
          <span class="glossapop-phonetic"></span>
          <button class="glossapop-speak-btn" title="Pronounce">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
        </div>
      </div>
      <div class="glossapop-lemma-row" style="display:none;"></div>
      <div class="glossapop-conjugation-box" style="display:none;"></div>
      <div class="glossapop-content">
        <div class="glossapop-loader-container">
          <div class="glossapop-spinner"></div>
        </div>
      </div>
      <div class="glossapop-example-box" style="display:none;"></div>
      <div class="glossapop-external-links" style="display:none;"></div>
    `;

    // Close button action
    card.querySelector('.glossapop-close-btn').addEventListener('click', hideAll);

    // Toggle target source language
    card.querySelector('#target-lang-group').addEventListener('click', (e) => {
      const btn = e.target.closest('.glossapop-segment-btn');
      if (btn && !btn.classList.contains('active')) {
        card.querySelectorAll('#target-lang-group .glossapop-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTargetLang = btn.dataset.val;
        fetchAndDisplay(word, false);
      }
    });

    // Toggle target explanation translation language
    card.querySelector('#explain-lang-group').addEventListener('click', (e) => {
      const btn = e.target.closest('.glossapop-segment-btn');
      if (btn && !btn.classList.contains('active')) {
        card.querySelectorAll('#explain-lang-group .glossapop-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeExplainLang = btn.dataset.val;
        fetchAndDisplay(word, false);
      }
    });
  }

  // Fetch translation and display results
  async function fetchAndDisplay(word, isInitial = false) {
    const contentDiv = shadowRoot.querySelector('.glossapop-content');
    const audioGroup = shadowRoot.querySelector('.glossapop-word-audio-group');
    const phoneticText = shadowRoot.querySelector('.glossapop-phonetic');
    const speakBtn = shadowRoot.querySelector('.glossapop-speak-btn');
    const lemmaRow = shadowRoot.querySelector('.glossapop-lemma-row');
    const conjBox = shadowRoot.querySelector('.glossapop-conjugation-box');
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

        // 0. Render lemma/root word derivation info if available
        if (lemmaRow) {
          if (data.lemmaInfo && data.lemmaInfo.lemma && !(activeTargetLang === 'fr' && data.isVerb)) {
            const lemma = data.lemmaInfo.lemma;
            const description = data.lemmaInfo.description || '';
            const femForm = (activeTargetLang === 'fr' && !data.isVerb) ? getFrenchFeminineForm(lemma) : null;
            
            if (femForm) {
              lemmaRow.innerHTML = `
                <div class="glossapop-lemma-line">
                  <span class="glossapop-lemma-text">Base (Masculine): <strong>${escapeHtml(lemma)}</strong> (${escapeHtml(description)})</span>
                  <button class="glossapop-lemma-speak-btn" data-word="${escapeHtml(lemma)}" title="Pronounce masculine form">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  </button>
                </div>
                <div class="glossapop-lemma-line">
                  <span class="glossapop-lemma-text">Feminine Form: <strong>${escapeHtml(femForm)}</strong></span>
                  <button class="glossapop-lemma-speak-btn" data-word="${escapeHtml(femForm)}" title="Pronounce feminine form">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  </button>
                </div>
                <div class="glossapop-french-tip">
                  French Tip: The final consonant is silent in masculine (<strong>${escapeHtml(lemma)}</strong>) but is pronounced in feminine (<strong>${escapeHtml(femForm)}</strong>).
                </div>
              `;
            } else {
              lemmaRow.innerHTML = `
                <div class="glossapop-lemma-line">
                  <span class="glossapop-lemma-text">Base Form: <strong>${escapeHtml(lemma)}</strong> (${escapeHtml(description)})</span>
                  <button class="glossapop-lemma-speak-btn" data-word="${escapeHtml(lemma)}" title="Pronounce base form">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  </button>
                </div>
              `;
            }
            
            // Bind speech click event to all speaker buttons inside the lemma row
            lemmaRow.querySelectorAll('.glossapop-lemma-speak-btn').forEach(btn => {
              btn.onclick = () => {
                const targetWord = btn.dataset.word;
                playPronunciation(targetWord, activeTargetLang, null);
              };
            });
            lemmaRow.style.display = 'flex';
          } else {
            lemmaRow.style.display = 'none';
          }
        }

        // 0b. Render French verb conjugation if it is a French verb
        if (conjBox) {
          if (activeTargetLang === 'fr' && data.isVerb) {
            const verbToConjugate = data.lemmaInfo ? data.lemmaInfo.lemma : (data.word || word);
            const conj = getFrenchConjugations(verbToConjugate);
            if (conj) {
              conjBox.innerHTML = `
                <div class="glossapop-conj-title">Conjugaison (Présent): ${escapeHtml(verbToConjugate)}</div>
                <div class="glossapop-conj-grid">
                  <div class="glossapop-conj-item"><span>je</span> <strong>${escapeHtml(conj.je)}</strong></div>
                  <div class="glossapop-conj-item"><span>nous</span> <strong>${escapeHtml(conj.nous)}</strong></div>
                  <div class="glossapop-conj-item"><span>tu</span> <strong>${escapeHtml(conj.tu)}</strong></div>
                  <div class="glossapop-conj-item"><span>vous</span> <strong>${escapeHtml(conj.vous)}</strong></div>
                  <div class="glossapop-conj-item"><span>il/elle</span> <strong>${escapeHtml(conj.il)}</strong></div>
                  <div class="glossapop-conj-item"><span>ils/elles</span> <strong>${escapeHtml(conj.ils)}</strong></div>
                </div>
              `;
              conjBox.style.display = 'block';
            } else {
              conjBox.style.display = 'none';
            }
          } else {
            conjBox.style.display = 'none';
          }
        }

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

        // 4. Render example sentence if available
        if (exampleBox) {
          if (data.example && data.example.text) {
            exampleBox.innerHTML = `
              <div class="glossapop-example-header">
                <span>Example Sentence</span>
                <button class="glossapop-example-speak-btn" title="Pronounce example sentence">
                  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
              </div>
              <div class="glossapop-example-text">"${escapeHtml(data.example.text)}"</div>
              ${data.example.translation ? `<div class="glossapop-example-translation">${escapeHtml(data.example.translation)}</div>` : ''}
            `;
            exampleBox.querySelector('.glossapop-example-speak-btn').onclick = () => {
              playPronunciation(data.example.text, activeTargetLang, null);
            };
            exampleBox.style.display = 'block';
          } else {
            exampleBox.style.display = 'none';
          }
        }

        // 5. Render external dictionary reference links
        if (externalLinksBox) {
          const lookupWord = data.lemmaInfo ? data.lemmaInfo.lemma : (data.word || word);
          const encoded = encodeURIComponent(lookupWord);
          
          if (activeTargetLang === 'en') {
            externalLinksBox.innerHTML = `
              <span>Read more:</span>
              <a href="https://dictionary.cambridge.org/dictionary/english/${encoded}" target="_blank">Cambridge</a>
              <span style="color:rgba(0,0,0,0.15)">|</span>
              <a href="https://www.merriam-webster.com/dictionary/${encoded}" target="_blank">Merriam-Webster</a>
            `;
            externalLinksBox.style.display = 'flex';
          } else if (activeTargetLang === 'fr') {
            externalLinksBox.innerHTML = `
              <span>Read more:</span>
              <a href="https://www.larousse.fr/dictionnaires/francais/${encoded}" target="_blank">Larousse</a>
              <span style="color:rgba(0,0,0,0.15)">|</span>
              <a href="https://www.wordreference.com/fren/${encoded}" target="_blank">WordReference</a>
              <span style="color:rgba(0,0,0,0.15)">|</span>
              <a href="https://www.frdic.com/dicts/fr/${encoded}" target="_blank">法語助手</a>
            `;
            externalLinksBox.style.display = 'flex';
          } else {
            externalLinksBox.style.display = 'none';
          }
        }
      } else {
        const errMsg = (response && response.error) ? response.error : 'Word not found or API request failed.';
        contentDiv.innerHTML = `<div class="glossapop-error">${escapeHtml(errMsg)}</div>`;
      }
    });
  }

  // Helper to derive French feminine form for adjectives/nouns
  function getFrenchFeminineForm(word) {
    if (!word || word.endsWith('e')) return null;
    
    // Check common endings
    if (word.endsWith('ien')) return word.slice(0, -3) + 'ienne';
    if (word.endsWith('en')) return word.slice(0, -2) + 'enne';
    if (word.endsWith('on')) return word.slice(0, -2) + 'onne';
    if (word.endsWith('er')) return word.slice(0, -2) + 'ère';
    if (word.endsWith('eux')) return word.slice(0, -3) + 'euse';
    if (word.endsWith('if')) return word.slice(0, -2) + 'ive';
    if (word.endsWith('el')) return word.slice(0, -2) + 'elle';
    
    // Irregular/Exceptions
    if (word === 'blanc') return 'blanche';
    if (word === 'public') return 'publique';
    if (word === 'beau') return 'belle';
    if (word === 'nouveau') return 'nouvelle';
    
    if (word.endsWith('c')) return word.slice(0, -1) + 'que';
    
    // Default suffix addition
    return word + 'e';
  }

  // Helper to retrieve French present tense conjugations
  function getFrenchConjugations(verb) {
    const v = verb.toLowerCase().trim();
    
    // Irregulars
    const irregulars = {
      'être': { je: 'suis', tu: 'es', il: 'est', nous: 'sommes', vous: 'êtes', ils: 'sont' },
      'avoir': { je: 'ai', tu: 'as', il: 'a', nous: 'avons', vous: 'avez', ils: 'ont' },
      'aller': { je: 'vais', tu: 'vas', il: 'va', nous: 'allons', vous: 'allez', ils: 'vont' },
      'faire': { je: 'fais', tu: 'fais', il: 'fait', nous: 'faisons', vous: 'faites', ils: 'font' },
      'dire': { je: 'dis', tu: 'dis', il: 'dit', nous: 'disons', vous: 'dites', ils: 'disent' },
      'pouvoir': { je: 'peux', tu: 'peux', il: 'peut', nous: 'pouvons', vous: 'pouvez', ils: 'peuvent' },
      'vouloir': { je: 'veux', tu: 'veux', il: 'veut', nous: 'voulons', vous: 'voulez', ils: 'veulent' },
      'savoir': { je: 'sais', tu: 'sais', il: 'sait', nous: 'savons', vous: 'savez', ils: 'savent' },
      'voir': { je: 'vois', tu: 'vois', il: 'voit', nous: 'voyons', vous: 'voyez', ils: 'voient' },
      'devoir': { je: 'dois', tu: 'dois', il: 'doit', nous: 'devons', vous: 'devez', ils: 'doivent' },
      'revenir': { je: 'reviens', tu: 'reviens', il: 'revient', nous: 'revenons', vous: 'revenez', ils: 'reviennent' },
      'devenir': { je: 'deviens', tu: 'deviens', il: 'devient', nous: 'devenons', vous: 'devenez', ils: 'deviennent' },
      'venir': { je: 'viens', tu: 'viens', il: 'vient', nous: 'venons', vous: 'venez', ils: 'viennent' },
      'prendre': { je: 'prends', tu: 'prends', il: 'prend', nous: 'prenons', vous: 'prenez', ils: 'prennent' },
      'comprendre': { je: 'comprends', tu: 'comprends', il: 'comprend', nous: 'comprenons', vous: 'comprenez', ils: 'comprennent' },
      'apprendre': { je: 'apprends', tu: 'apprends', il: 'apprend', nous: 'apprenons', vous: 'apprenez', ils: 'apprennent' },
      'mettre': { je: 'mets', tu: 'mets', il: 'met', nous: 'mettons', vous: 'mettez', ils: 'mettent' },
      'partir': { je: 'pars', tu: 'pars', il: 'part', nous: 'partons', vous: 'partez', ils: 'partent' },
      'sortir': { je: 'sors', tu: 'sors', il: 'sort', nous: 'sortons', vous: 'sortez', ils: 'sortent' },
      'lire': { je: 'lis', tu: 'lis', il: 'lit', nous: 'lisons', vous: 'lisez', ils: 'lisent' },
      'écrire': { je: 'écris', tu: 'écris', il: 'écrit', nous: 'écrivons', vous: 'écrivez', ils: 'écrivent' }
    };
    
    if (irregulars[v]) return irregulars[v];
    
    // Regular -er verbs
    if (v.endsWith('er')) {
      const stem = v.slice(0, -2);
      // Nous forms for -ger and -cer verbs
      const nousForm = v.endsWith('ger') ? stem + 'eons' : (v.endsWith('cer') ? stem.slice(0, -1) + 'çons' : stem + 'ons');
      return {
        je: (stem[0] && stem[0].match(/[aeiouyhéèàùâêîôû]/i) ? "j’" : "je ") + stem + 'e',
        tu: stem + 'es',
        il: stem + 'e',
        nous: nousForm,
        vous: stem + 'ez',
        ils: stem + 'ent'
      };
    }
    
    // Regular -ir verbs (finir type)
    if (v.endsWith('ir')) {
      const stem = v.slice(0, -2);
      return {
        je: 'je ' + stem + 'is',
        tu: stem + 'is',
        il: stem + 'it',
        nous: stem + 'issons',
        vous: stem + 'issez',
        ils: stem + 'issent'
      };
    }
    
    // Fallback or generic regular -re verbs
    if (v.endsWith('re')) {
      const stem = v.slice(0, -2);
      return {
        je: 'je ' + stem + 's',
        tu: stem + 's',
        il: stem + 't',
        nous: stem + 'ons',
        vous: stem + 'ez',
        ils: stem + 'ent'
      };
    }
    
    return null;
  }

  // Dismiss popup and floating icons
  function hideAll() {
    if (!shadowRoot) return;
    const triggerIcon = shadowRoot.querySelector('.glossapop-trigger-icon');
    const card = shadowRoot.querySelector('.glossapop-card');
    
    if (triggerIcon) triggerIcon.classList.remove('visible');
    if (card) card.classList.remove('visible');
  }

  // High-quality voice pronunciation player
  function playPronunciation(word, lang, dictAudioUrl) {
    // 1. Try playing Free Dictionary API direct human recording (MP3) if available
    if (lang === 'en' && dictAudioUrl) {
      const audio = new Audio(dictAudioUrl);
      audio.play().then(() => {
        console.log('Played Free Dictionary human audio');
      }).catch(err => {
        console.warn('Free Dictionary audio playback failed, falling back:', err);
        playGoogleTts(word, lang);
      });
      return;
    }
    
    // 2. Play Google Translate TTS (very natural neural speech)
    playGoogleTts(word, lang);
  }

  function playGoogleTts(word, lang) {
    const ttsLang = lang === 'en' ? 'en' : 'fr';
    // Google Translate TTS keyless endpoint
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(word)}`;
    
    const audio = new Audio(ttsUrl);
    audio.play().then(() => {
      console.log('Played Google Translate TTS audio');
    }).catch(err => {
      console.warn('Google TTS audio playback failed, falling back to Web Speech API:', err);
      // 3. Fallback to Web Speech API (local system synthesis)
      speakWordLocal(word, lang);
    });
  }

  // Local Web Speech synthesis with premium voice selection as final fallback
  function speakWordLocal(word, lang) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    const langPrefix = lang === 'en' ? 'en' : 'fr';
    utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    
    // Filter voices that match the language prefix (e.g. 'fr' or 'en')
    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => v.lang.startsWith(langPrefix));
    
    let selectedVoice = null;
    if (matchingVoices.length > 0) {
      // 1. Try to find a premium neural/google/natural voice for the language
      selectedVoice = matchingVoices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('natural') || 
        v.name.toLowerCase().includes('siri') || 
        v.name.toLowerCase().includes('premium') || 
        v.name.toLowerCase().includes('thomas') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('daniel')
      );
      
      // 2. Fall back to the first available voice for the target language (forces correct locale)
      if (!selectedVoice) {
        selectedVoice = matchingVoices[0];
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 0.95; // Slightly slower speed sounds more natural
    window.speechSynthesis.speak(utterance);
  }

  // HTML escaping utility for XSS mitigation
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (match) => {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });
  }

  // --- 4. Event Listeners and Text Selection Coordinates ---
  
  // Listen for mouseup selection event (to show the trigger bubble)
  document.addEventListener('mouseup', (e) => {
    // Skip if clicks are placed inside the Shadow DOM container
    if (hostElement && e.composedPath().includes(hostElement)) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Check boundary sizes to avoid full paragraphs being processed
    if (!selectedText || selectedText.length > 50 || /[\r\n]/.test(selectedText)) {
      hideAll();
      return;
    }

    currentWord = selectedText;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    initShadowDOM();

    if (settings.triggerMode === 'icon') {
      const triggerIcon = shadowRoot.querySelector('.glossapop-trigger-icon');
      
      // Calculate float icon coordinates (at bottom-right of selection box)
      const iconX = rect.right + window.scrollX + 6;
      const iconY = rect.bottom + window.scrollY + 6;

      triggerIcon.style.left = `${iconX}px`;
      triggerIcon.style.top = `${iconY}px`;
      
      shadowRoot.querySelector('.glossapop-card').classList.remove('visible');
      triggerIcon.classList.add('visible');
    }
  });

  // Listen for double-click event (direct popup queries)
  document.addEventListener('dblclick', (e) => {
    if (settings.triggerMode !== 'dblclick') return;
    if (hostElement && e.composedPath().includes(hostElement)) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText || selectedText.length > 50 || /[\r\n]/.test(selectedText)) {
      return;
    }

    currentWord = selectedText;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Align popup right below target selection area
    const cardX = rect.left + window.scrollX;
    const cardY = rect.bottom + window.scrollY + 10;

    showPopup(currentWord, cardX, cardY);
  });

  // Dismiss popup if user clicks on page margins/blank spots
  document.addEventListener('mousedown', (e) => {
    if (!hostElement) return;
    if (e.composedPath().includes(hostElement)) {
      return;
    }
    hideAll();
  });
})();
