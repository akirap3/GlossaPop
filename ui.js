// ui.js - Scoped styles, layout declarations, and components markup

const POPUP_CSS = `
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
    -webkit-user-select: none;
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
    -webkit-user-select: none;
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
  .glossapop-brand {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .glossapop-brand-logo {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 2px 6px rgba(0, 102, 204, 0.15);
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

  /* CEFR Level Badge Styles */
  .glossapop-cefr-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-left: 6px;
    vertical-align: middle;
  }

  /* French Tense Switcher Tabs Styles */
  .glossapop-tense-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(0, 102, 204, 0.12);
    padding-bottom: 4px;
  }
  .glossapop-tense-tab {
    font-size: 9px;
    font-weight: 600;
    color: #8e8e93;
    background: transparent;
    border: none;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .glossapop-tense-tab.active {
    color: #ffffff;
    background: #0066cc;
  }
  .glossapop-tense-tab:hover:not(.active) {
    background: rgba(0, 102, 204, 0.1);
    color: #0066cc;
  }

  /* Synonyms & Antonyms Tag Chips Styles */
  .glossapop-synonyms-box {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .glossapop-synonyms-title {
    font-size: 9.5px;
    font-weight: 700;
    color: #8e8e93;
    text-transform: uppercase;
    margin-right: 2px;
  }
  .glossapop-chip {
    display: inline-block;
    font-size: 10px;
    font-weight: 500;
    color: #0066cc;
    background: rgba(0, 102, 204, 0.08);
    padding: 2px 7px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .glossapop-chip:hover {
    background: rgba(0, 102, 204, 0.18);
    transform: translateY(-1px);
  }
  .glossapop-chip.antonym {
    color: #d32f2f;
    background: rgba(211, 47, 47, 0.08);
  }
  .glossapop-chip.antonym:hover {
    background: rgba(211, 47, 47, 0.18);
  }
`;

// Renders popup card's main frame
function renderPopupFrame(shadowRoot, word, activeTargetLang, activeExplainLang, hideAll, onTargetChange, onExplainChange) {
  const cefr = getCEFRLevel(word, activeTargetLang);
  const cefrBadge = cefr ? `<span class="glossapop-cefr-badge" style="color:${cefr.color}; background:${cefr.bg};" title="${escapeHtml(cefr.label)}">${cefr.text}</span>` : '';

  const card = shadowRoot.querySelector('.glossapop-card');
  card.innerHTML = `
    <div class="glossapop-header">
      <div class="glossapop-brand">
        <img class="glossapop-brand-logo" src="${chrome.runtime.getURL('icons/logo-cat.png')}" alt="Logo">
        <span class="glossapop-title">GlossaPop</span>
      </div>
      <button class="glossapop-close-btn" title="Close Popup">&times;</button>
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
      <h3 class="glossapop-word" title="${escapeHtml(word)}">${escapeHtml(word)}${cefrBadge}</h3>
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
    <div class="glossapop-synonyms-box" style="display:none;"></div>
    <div class="glossapop-example-box" style="display:none;"></div>
    <div class="glossapop-external-links" style="display:none;"></div>
  `;

  // Close action
  card.querySelector('.glossapop-close-btn').addEventListener('click', hideAll);

  // Target source language switches
  card.querySelector('#target-lang-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.glossapop-segment-btn');
    if (btn && !btn.classList.contains('active')) {
      card.querySelectorAll('#target-lang-group .glossapop-segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onTargetChange(btn.dataset.val);
    }
  });

  // Explanation target language switches
  card.querySelector('#explain-lang-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.glossapop-segment-btn');
    if (btn && !btn.classList.contains('active')) {
      card.querySelectorAll('#explain-lang-group .glossapop-segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onExplainChange(btn.dataset.val);
    }
  });
}

// Renders lemma information row
function renderLemma(lemmaRow, data, activeTargetLang) {
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

// Renders French verb conjugation grids with 4 tense tabs
function renderConjugations(conjBox, data, activeTargetLang, queryWord, activeTense = 'present') {
  if (activeTargetLang === 'fr' && data.isVerb) {
    const verbToConjugate = data.lemmaInfo ? data.lemmaInfo.lemma : (data.word || queryWord);
    const conj = getFrenchConjugations(verbToConjugate, activeTense);
    if (conj) {
      const tenses = [
        { id: 'present', label: 'Présent' },
        { id: 'passe_compose', label: 'Passé C.' },
        { id: 'imparfait', label: 'Imparfait' },
        { id: 'futur_simple', label: 'Futur' }
      ];
      const tabsHtml = tenses.map(t => `<button class="glossapop-tense-tab ${activeTense === t.id ? 'active' : ''}" data-tense="${t.id}">${t.label}</button>`).join('');

      conjBox.innerHTML = `
        <div class="glossapop-conj-title">Conjugaison: ${escapeHtml(verbToConjugate)}</div>
        <div class="glossapop-tense-tabs">${tabsHtml}</div>
        <div class="glossapop-conj-grid">
          <div class="glossapop-conj-item"><span>je</span> <strong>${escapeHtml(conj.je)}</strong></div>
          <div class="glossapop-conj-item"><span>nous</span> <strong>${escapeHtml(conj.nous)}</strong></div>
          <div class="glossapop-conj-item"><span>tu</span> <strong>${escapeHtml(conj.tu)}</strong></div>
          <div class="glossapop-conj-item"><span>vous</span> <strong>${escapeHtml(conj.vous)}</strong></div>
          <div class="glossapop-conj-item"><span>il/elle</span> <strong>${escapeHtml(conj.il)}</strong></div>
          <div class="glossapop-conj-item"><span>ils/elles</span> <strong>${escapeHtml(conj.ils)}</strong></div>
        </div>
      `;

      // Bind click event to tense tabs
      conjBox.querySelectorAll('.glossapop-tense-tab').forEach(tab => {
        tab.onclick = (e) => {
          e.stopPropagation();
          const selectedTense = tab.dataset.tense;
          renderConjugations(conjBox, data, activeTargetLang, queryWord, selectedTense);
        };
      });

      conjBox.style.display = 'block';
      return;
    }
  }
  conjBox.style.display = 'none';
}

// Renders clickable synonyms and antonyms tag chips
function renderSynonyms(synonymsBox, data, onChipClick) {
  const synonyms = data.synonyms || [];
  const antonyms = data.antonyms || [];
  if (synonyms.length === 0 && antonyms.length === 0) {
    synonymsBox.style.display = 'none';
    return;
  }
  
  let html = '';
  if (synonyms.length > 0) {
    html += `<span class="glossapop-synonyms-title">Synonyms:</span>`;
    html += synonyms.map(s => `<span class="glossapop-chip" data-word="${escapeHtml(s)}">${escapeHtml(s)}</span>`).join('');
  }
  if (antonyms.length > 0) {
    html += `<span class="glossapop-synonyms-title" style="margin-left:4px;">Antonyms:</span>`;
    html += antonyms.map(a => `<span class="glossapop-chip antonym" data-word="${escapeHtml(a)}">${escapeHtml(a)}</span>`).join('');
  }
  
  synonymsBox.innerHTML = html;
  synonymsBox.querySelectorAll('.glossapop-chip').forEach(chip => {
    chip.onclick = (e) => {
      e.stopPropagation();
      if (onChipClick) onChipClick(chip.dataset.word);
    };
  });
  synonymsBox.style.display = 'flex';
}

// Renders example sentences
function renderExample(exampleBox, data, activeTargetLang) {
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

// Renders external reference links
function renderLinks(externalLinksBox, data, activeTargetLang, queryWord) {
  const lookupWord = data.lemmaInfo ? data.lemmaInfo.lemma : (data.word || queryWord);
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
