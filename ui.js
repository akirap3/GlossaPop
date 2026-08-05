// ui.js - Modernized UI Rendering Engine & Modular Component System for GlossaPop

/**
 * Scoped Glassmorphic Component Styles
 */
const POPUP_CSS = `
  /* Dark Reader / Extension Isolation */
  :host {
    /* Block Dark Reader Dynamic mode from overriding our colors via CSS variables */
    --darkreader-neutral-background: none !important;
    --darkreader-neutral-text: none !important;
    --darkreader-selection-background: none !important;
    --darkreader-selection-text: none !important;
    color-scheme: light dark !important;
  }

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

  /* Floating Popup Card - Glassmorphism Style */
  .glossapop-card {
    position: absolute;
    width: 320px;
    min-width: 280px;
    min-height: 200px;
    max-width: 90vw;
    max-height: 90vh;
    resize: both;
    overflow: auto;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px) saturate(190%);
    -webkit-backdrop-filter: blur(20px) saturate(190%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 16px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
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
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  }
  .glossapop-header.dragging {
    cursor: grabbing;
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
  }

  /* Theme Mode Toggle (in-card) */
  .glossapop-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .glossapop-theme-toggle {
    border: none;
    background: none;
    cursor: pointer;
    padding: 2px;
    font-size: 13px;
    line-height: 1;
    opacity: 0.5;
    transition: opacity 0.2s, transform 0.15s;
    border-radius: 4px;
  }
  .glossapop-theme-toggle:hover {
    opacity: 1;
    transform: scale(1.15);
  }
  .glossapop-close-btn {
    line-height: 1;
  }
  .glossapop-close-btn:hover {
    color: #1c1c1e;
    transform: scale(1.15);
  }
  /* Sleek Glassmorphic Source Language Dropdown (Single Unified Pill) */
  .glossapop-source-select-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .glossapop-source-select {
    appearance: none;
    -webkit-appearance: none;
    background: #0066cc url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") no-repeat right 8px center / 12px 12px;
    border: 1px solid rgba(0, 102, 204, 0.3);
    color: #ffffff;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 4px 24px 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 102, 204, 0.25);
    outline: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .glossapop-source-select:hover {
    background-color: #0052a3;
    box-shadow: 0 3px 10px rgba(0, 102, 204, 0.35);
    transform: translateY(-1px);
  }
  .glossapop-source-select option {
    background: #1c1c1e;
    color: #ffffff;
    font-weight: 600;
  }

  /* Modern Segmented Quick-Switch Pills Bar */
  .glossapop-quick-pills-bar {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 12px;
    padding: 2px 0;
  }
  .glossapop-pills-label {
    font-size: 9.5px;
    font-weight: 700;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-right: 2px;
  }
  .glossapop-source-pill {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 12px;
    background: rgba(0, 102, 204, 0.08);
    color: #0066cc;
    border: 1px solid rgba(0, 102, 204, 0.18);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .glossapop-source-pill:hover {
    background: rgba(0, 102, 204, 0.16);
    border-color: rgba(0, 102, 204, 0.3);
    transform: translateY(-1px);
  }
  .glossapop-source-pill.active {
    background: #0066cc;
    color: #ffffff;
    border-color: #0066cc;
    box-shadow: 0 2px 6px rgba(0, 102, 204, 0.3);
  }

  /* Save Word Button */
  .glossapop-save-btn {
    border: 1px solid rgba(0, 102, 204, 0.2);
    background: rgba(0, 102, 204, 0.08);
    color: #0066cc;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    transition: all 0.2s ease;
  }
  .glossapop-save-btn:hover {
    background: rgba(0, 102, 204, 0.18);
    transform: scale(1.04);
  }
  .glossapop-save-btn.saved {
    border-color: rgba(52, 199, 89, 0.35);
    background: rgba(52, 199, 89, 0.12);
    color: #2e7d32;
  }
  .glossapop-save-btn:disabled,
  .glossapop-save-btn.disabled {
    opacity: 0.45;
    cursor: not-allowed !important;
    pointer-events: none !important;
    transform: none !important;
    background: rgba(142, 142, 147, 0.12) !important;
    border-color: rgba(142, 142, 147, 0.2) !important;
    color: #8e8e93 !important;
  }

  /* Toast Notice Banner */
  .glossapop-toast-notice {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(28, 28, 30, 0.92);
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
    opacity: 0;
    pointer-events: none;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 99;
    white-space: nowrap;
  }
  .glossapop-toast-notice.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
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
  .glossapop-word-title-container {
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 260px;
  }
  .glossapop-word {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: #1c1c1e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 240px;
  }
  .glossapop-word[contenteditable="true"] {
    outline: none;
    border-radius: 4px;
    padding: 0 4px;
    transition: background-color 0.2s, box-shadow 0.2s;
  }
  .glossapop-word[contenteditable="true"]:hover {
    background-color: rgba(0, 102, 204, 0.08);
    cursor: text;
  }
  .glossapop-word[contenteditable="true"]:focus {
    background-color: rgba(0, 102, 204, 0.12);
    box-shadow: 0 0 0 1.5px #0066cc;
    cursor: text;
  }
  .glossapop-edit-btn {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 11px;
    opacity: 0.55;
    padding: 1px 3px;
    transition: opacity 0.2s, transform 0.2s;
    line-height: 1;
  }
  .glossapop-edit-btn:hover {
    opacity: 1;
    transform: scale(1.15);
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
  .glossapop-separator {
    color: rgba(0, 0, 0, 0.15);
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
    align-items: center;
    line-height: 1.35;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 6px;
    transition: background-color 0.15s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11.5px;
  }
  .glossapop-conj-item:hover {
    background-color: rgba(0, 102, 204, 0.12);
  }
  .glossapop-conj-item strong {
    color: #1c1c1e;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Translation Text */
  .glossapop-content {
    font-size: 13px;
    line-height: 1.5;
    max-height: 180px;
    overflow-y: auto;
    color: #2c2c2e;
    padding-right: 4px;
  }
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
  
  /* Loading Spinner */
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
    color: var(--cefr-color, #1565c0);
    background-color: var(--cefr-bg, rgba(21, 101, 192, 0.12));
  }
  .glossapop-cefr-badge.cefr-a1 { --cefr-color: #2e7d32; --cefr-bg: rgba(46, 125, 50, 0.12); }
  .glossapop-cefr-badge.cefr-a2 { --cefr-color: #00796b; --cefr-bg: rgba(0, 121, 107, 0.12); }
  .glossapop-cefr-badge.cefr-b1 { --cefr-color: #1565c0; --cefr-bg: rgba(21, 101, 192, 0.12); }
  .glossapop-cefr-badge.cefr-b2 { --cefr-color: #4a148c; --cefr-bg: rgba(74, 20, 140, 0.12); }
  .glossapop-cefr-badge.cefr-c1 { --cefr-color: #7b1fa2; --cefr-bg: rgba(123, 31, 162, 0.12); }
  .glossapop-cefr-badge.cefr-c2 { --cefr-color: #c2185b; --cefr-bg: rgba(194, 24, 91, 0.12); }

  /* French Tense Switcher Pager & Header Styles */
  .glossapop-conj-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .glossapop-conj-pager {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    color: #0066cc;
  }
  .glossapop-pager-btn {
    background: rgba(0, 102, 204, 0.08);
    border: 1px solid rgba(0, 102, 204, 0.2);
    border-radius: 6px;
    color: #0066cc;
    width: 18px;
    height: 18px;
    line-height: 16px;
    text-align: center;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    padding: 0;
    transition: all 0.15s ease;
  }
  .glossapop-pager-btn:hover:not(:disabled) {
    background: #0066cc;
    color: #ffffff;
  }
  .glossapop-pager-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .glossapop-dark .glossapop-conj-pager { color: #64d2ff; }
  .glossapop-dark .glossapop-pager-btn {
    background: rgba(100, 210, 255, 0.12);
    border-color: rgba(100, 210, 255, 0.25);
    color: #64d2ff;
  }
  .glossapop-dark .glossapop-pager-btn:hover:not(:disabled) {
    background: #0a84ff;
    color: #ffffff;
  }
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

  /* =============================================================
   * Dark Glassmorphic Theme
   * Dual strategy: .glossapop-dark forces dark, @media auto-detects
   * .glossapop-light forces light (no dark overrides applied)
   * ============================================================= */

  /* --- Forced Dark Mode via class --- */
  .glossapop-card.glossapop-dark,
  /* --- Auto Dark Mode: apply when no forced class and system prefers dark --- */
  .glossapop-card:not(.glossapop-light):not(.glossapop-dark) {
    /* base dark styles set below via shared selector */
  }

  .glossapop-card.glossapop-dark .glossapop-word,
  .glossapop-card.glossapop-dark .glossapop-close-btn,
  .glossapop-card.glossapop-dark .glossapop-close-btn:hover,
  .glossapop-card.glossapop-dark .glossapop-title,
  .glossapop-card.glossapop-dark .glossapop-phonetic { /* placeholder for shared selector */ }

  /* ---- Dark theme rules (class-driven) ---- */
  .glossapop-dark {
    background: rgba(25, 25, 30, 0.92) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(24px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
    color: #ffffff !important;
  }
  .glossapop-dark .glossapop-word { color: #ffffff; }
  .glossapop-dark .glossapop-close-btn { color: #e5e5ea; }
  .glossapop-dark .glossapop-close-btn:hover { color: #ffffff; }
  .glossapop-dark .glossapop-title {
    background: linear-gradient(135deg, #0a84ff, #64d2ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .glossapop-dark .glossapop-cefr-badge.cefr-a1 { --cefr-color: #30d158; --cefr-bg: rgba(48, 209, 88, 0.15); }
  .glossapop-dark .glossapop-cefr-badge.cefr-a2 { --cefr-color: #40e0d0; --cefr-bg: rgba(64, 224, 208, 0.15); }
  .glossapop-dark .glossapop-cefr-badge.cefr-b1 { --cefr-color: #64d2ff; --cefr-bg: rgba(100, 210, 255, 0.15); }
  .glossapop-dark .glossapop-cefr-badge.cefr-b2 { --cefr-color: #bf5af2; --cefr-bg: rgba(191, 90, 242, 0.15); }
  .glossapop-dark .glossapop-cefr-badge.cefr-c1 { --cefr-color: #da8fff; --cefr-bg: rgba(218, 143, 255, 0.15); }
  .glossapop-dark .glossapop-cefr-badge.cefr-c2 { --cefr-color: #ff375f; --cefr-bg: rgba(255, 55, 95, 0.15); }
  .glossapop-dark .glossapop-phonetic { color: #64d2ff; }
  .glossapop-dark .glossapop-source-select {
    background: linear-gradient(135deg, #0a84ff, #5e5ce6) url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") no-repeat right 8px center / 12px 12px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 3px 10px rgba(10, 132, 255, 0.45);
  }
  .glossapop-dark .glossapop-pills-label { color: #8e8e93; }
  .glossapop-dark .glossapop-source-pill {
    background: rgba(100, 210, 255, 0.12);
    color: #64d2ff;
    border-color: rgba(100, 210, 255, 0.25);
  }
  .glossapop-dark .glossapop-source-pill:hover {
    background: rgba(100, 210, 255, 0.22);
    border-color: rgba(100, 210, 255, 0.4);
  }
  .glossapop-dark .glossapop-source-pill.active {
    background: #0a84ff;
    color: #ffffff;
    border-color: #0a84ff;
    box-shadow: 0 2px 8px rgba(10, 132, 255, 0.5);
  }
  .glossapop-dark .glossapop-segment-btn { color: #e5e5ea; }
  .glossapop-dark .glossapop-segment-btn.active {
    background: rgba(10, 132, 255, 0.22);
    border: 1px solid rgba(10, 132, 255, 0.4);
    color: #64d2ff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
  .glossapop-dark .glossapop-content { color: #ffffff; }
  .glossapop-dark .glossapop-meaning-item { color: #ffffff; border-left-color: #0a84ff; }
  .glossapop-dark .glossapop-speak-btn { background: rgba(10, 132, 255, 0.15); color: #0a84ff; }
  .glossapop-dark .glossapop-speak-btn:hover { background: rgba(10, 132, 255, 0.3); }
  .glossapop-dark .glossapop-example-box { background: rgba(255, 255, 255, 0.04); color: #ffffff; border-left-color: #ff9f0a; }
  .glossapop-dark .glossapop-example-header { color: #ff9f0a; }
  .glossapop-dark .glossapop-example-speak-btn { background: rgba(255, 159, 10, 0.15); color: #ff9f0a; }
  .glossapop-dark .glossapop-example-speak-btn:hover { background: rgba(255, 159, 10, 0.3); }
  .glossapop-dark .glossapop-example-text { color: #ffffff; }
  .glossapop-dark .glossapop-example-translation { color: #e5e5ea; }
  .glossapop-dark .glossapop-external-links { color: #e5e5ea; }
  .glossapop-dark .glossapop-external-links a { color: #64d2ff; }
  .glossapop-dark .glossapop-external-links a:hover { color: #9cdbff; }
  .glossapop-dark .glossapop-conj-item strong { color: #ffffff; }
  .glossapop-dark .glossapop-conj-item span { color: #c7c7cc; }
  .glossapop-dark .glossapop-conj-item:hover { background-color: rgba(10, 132, 255, 0.15); }
  .glossapop-dark .glossapop-tense-tab { color: #c7c7cc; }
  .glossapop-dark .glossapop-tense-tab.active { background: #0a84ff; color: #ffffff; }
  .glossapop-dark .glossapop-tense-tab:hover:not(.active) { background: rgba(10, 132, 255, 0.15); color: #0a84ff; }
  .glossapop-dark .glossapop-synonyms-title { color: #c7c7cc; }
  .glossapop-dark .glossapop-chip { color: #64d2ff; background: rgba(10, 132, 255, 0.15); }
  .glossapop-dark .glossapop-chip:hover { background: rgba(10, 132, 255, 0.3); }
  .glossapop-dark .glossapop-chip.antonym { color: #ff453a; background: rgba(255, 69, 58, 0.15); }
  .glossapop-dark .glossapop-chip.antonym:hover { background: rgba(255, 69, 58, 0.3); }
  .glossapop-dark .glossapop-save-btn { border-color: rgba(100, 210, 255, 0.4); background: rgba(100, 210, 255, 0.15); color: #64d2ff; }
  .glossapop-dark .glossapop-save-btn:hover { background: rgba(100, 210, 255, 0.3); }
  .glossapop-dark .glossapop-save-btn.saved { border-color: rgba(48, 209, 88, 0.45); background: rgba(48, 209, 88, 0.2); color: #30d158; }
  .glossapop-dark .glossapop-toast-notice { background: rgba(255, 255, 255, 0.95); color: #1c1c1e; }
  .glossapop-dark .glossapop-lemma-row { background: rgba(48, 209, 88, 0.15); color: #ffffff; border-left-color: #30d158; }
  .glossapop-dark .glossapop-lemma-text { color: #e5e5ea; }
  .glossapop-dark .glossapop-lemma-text strong { color: #30d158; }
  .glossapop-dark .glossapop-lemma-speak-btn { background: rgba(48, 209, 88, 0.15); color: #30d158; }
  .glossapop-dark .glossapop-lemma-speak-btn:hover { background: rgba(48, 209, 88, 0.3); }
  .glossapop-dark .glossapop-conjugation-box { background: rgba(10, 132, 255, 0.08); color: #ffffff; border-left-color: #0a84ff; }
  .glossapop-dark .glossapop-conj-title { color: #64d2ff; }
  .glossapop-dark .glossapop-highlight { background-color: rgba(255, 159, 10, 0.25); color: #ff9f0a; }
  .glossapop-dark .glossapop-french-tip { color: #c7c7cc; }
  .glossapop-dark .glossapop-french-tip strong { color: #30d158; }
  .glossapop-dark .glossapop-separator { color: rgba(255, 255, 255, 0.35); }
  .glossapop-dark .glossapop-segment { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.05); }

  /* ---- Auto mode: system dark preference, no forced class ---- */
  @media (prefers-color-scheme: dark) {
    .glossapop-card:not(.glossapop-light) {
      background: rgba(25, 25, 30, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
    .glossapop-card:not(.glossapop-light) .glossapop-word { color: #ffffff; }
    .glossapop-card:not(.glossapop-light) .glossapop-close-btn { color: #e5e5ea; }
    .glossapop-card:not(.glossapop-light) .glossapop-close-btn:hover { color: #ffffff; }
    .glossapop-card:not(.glossapop-light) .glossapop-title {
      background: linear-gradient(135deg, #0a84ff, #64d2ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .glossapop-card:not(.glossapop-light) .glossapop-cefr-badge.cefr-a1 { --cefr-color: #30d158; --cefr-bg: rgba(48, 209, 88, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-cefr-badge.cefr-a2 { --cefr-color: #40e0d0; --cefr-bg: rgba(64, 224, 208, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-cefr-badge.cefr-b1 { --cefr-color: #64d2ff; --cefr-bg: rgba(100, 210, 255, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-cefr-badge.cefr-b2 { --cefr-color: #bf5af2; --cefr-bg: rgba(191, 90, 242, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-cefr-badge.cefr-c1 { --cefr-color: #da8fff; --cefr-bg: rgba(218, 143, 255, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-cefr-badge.cefr-c2 { --cefr-color: #ff375f; --cefr-bg: rgba(255, 55, 95, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-phonetic { color: #64d2ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-badge-tag { background: linear-gradient(135deg, #0a84ff, #5e5ce6); border: 1px solid rgba(255, 255, 255, 0.3); color: #ffffff; box-shadow: 0 3px 10px rgba(10, 132, 255, 0.55); }
    .glossapop-card:not(.glossapop-light) .glossapop-segment-btn { color: #e5e5ea; }
    .glossapop-card:not(.glossapop-light) .glossapop-segment-btn.active { background: rgba(10, 132, 255, 0.22); border: 1px solid rgba(10, 132, 255, 0.4); color: #64d2ff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-content { color: #ffffff; }
    .glossapop-card:not(.glossapop-light) .glossapop-meaning-item { color: #ffffff; border-left-color: #0a84ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-speak-btn { background: rgba(10, 132, 255, 0.15); color: #0a84ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-speak-btn:hover { background: rgba(10, 132, 255, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-example-box { background: rgba(255, 255, 255, 0.04); color: #ffffff; border-left-color: #ff9f0a; }
    .glossapop-card:not(.glossapop-light) .glossapop-example-header { color: #ff9f0a; }
    .glossapop-card:not(.glossapop-light) .glossapop-example-speak-btn { background: rgba(255, 159, 10, 0.15); color: #ff9f0a; }
    .glossapop-card:not(.glossapop-light) .glossapop-example-speak-btn:hover { background: rgba(10, 132, 255, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-example-text { color: #ffffff; }
    .glossapop-card:not(.glossapop-light) .glossapop-example-translation { color: #e5e5ea; }
    .glossapop-card:not(.glossapop-light) .glossapop-external-links { color: #e5e5ea; }
    .glossapop-card:not(.glossapop-light) .glossapop-external-links a { color: #64d2ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-external-links a:hover { color: #9cdbff; }
    .glossapop-card:not(.glossapop-light) .glossapop-conj-item strong { color: #ffffff; }
    .glossapop-card:not(.glossapop-light) .glossapop-conj-item span { color: #c7c7cc; }
    .glossapop-card:not(.glossapop-light) .glossapop-conj-item:hover { background-color: rgba(10, 132, 255, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-tense-tab { color: #c7c7cc; }
    .glossapop-card:not(.glossapop-light) .glossapop-tense-tab.active { background: #0a84ff; color: #ffffff; }
    .glossapop-card:not(.glossapop-light) .glossapop-tense-tab:hover:not(.active) { background: rgba(10, 132, 255, 0.15); color: #0a84ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-synonyms-title { color: #c7c7cc; }
    .glossapop-card:not(.glossapop-light) .glossapop-chip { color: #64d2ff; background: rgba(10, 132, 255, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-chip:hover { background: rgba(10, 132, 255, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-chip.antonym { color: #ff453a; background: rgba(255, 69, 58, 0.15); }
    .glossapop-card:not(.glossapop-light) .glossapop-chip.antonym:hover { background: rgba(255, 69, 58, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-lemma-row { background: rgba(48, 209, 88, 0.15); color: #ffffff; border-left-color: #30d158; }
    .glossapop-card:not(.glossapop-light) .glossapop-lemma-text { color: #e5e5ea; }
    .glossapop-card:not(.glossapop-light) .glossapop-lemma-text strong { color: #30d158; }
    .glossapop-card:not(.glossapop-light) .glossapop-lemma-speak-btn { background: rgba(48, 209, 88, 0.15); color: #30d158; }
    .glossapop-card:not(.glossapop-light) .glossapop-lemma-speak-btn:hover { background: rgba(48, 209, 88, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-french-tip { color: #c7c7cc; }
    .glossapop-card:not(.glossapop-light) .glossapop-french-tip strong { color: #30d158; }
    .glossapop-card:not(.glossapop-light) .glossapop-conjugation-box { background: rgba(10, 132, 255, 0.08); color: #ffffff; border-left-color: #0a84ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-conj-title { color: #64d2ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-highlight { background-color: rgba(255, 159, 10, 0.25); color: #ff9f0a; }
    .glossapop-card:not(.glossapop-light) .glossapop-save-btn { border-color: rgba(100, 210, 255, 0.4); background: rgba(100, 210, 255, 0.15); color: #64d2ff; }
    .glossapop-card:not(.glossapop-light) .glossapop-save-btn:hover { background: rgba(100, 210, 255, 0.3); }
    .glossapop-card:not(.glossapop-light) .glossapop-save-btn.saved { border-color: rgba(48, 209, 88, 0.45); background: rgba(48, 209, 88, 0.2); color: #30d158; }
    .glossapop-card:not(.glossapop-light) .glossapop-toast-notice { background: rgba(255, 255, 255, 0.95); color: #1c1c1e; }
    .glossapop-card:not(.glossapop-light) .glossapop-separator { color: rgba(255, 255, 255, 0.35); }
    .glossapop-card:not(.glossapop-light) .glossapop-segment { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.05); }
  }
`;

/**
 * UI Renderer Component System
 */
const UIComponents = {
  /**
   * Binds smooth mouse dragging handlers to the popup card
   */
  makeCardDraggable(card, headerEl) {
    if (!card || !headerEl || !headerEl.style) return;
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    headerEl.style.cursor = 'grab';

    const onMouseDown = (e) => {
      if (e.target && e.target.closest && e.target.closest('button, select, input, a')) {
        return;
      }

      isDragging = true;
      headerEl.style.cursor = 'grabbing';
      headerEl.classList.add('dragging');

      startX = e.clientX;
      startY = e.clientY;

      const rect = card.getBoundingClientRect();
      const scrollX = (typeof window !== 'undefined' && window.scrollX) ? window.scrollX : 0;
      const scrollY = (typeof window !== 'undefined' && window.scrollY) ? window.scrollY : 0;
      initialLeft = parseFloat(card.style.left) || rect.left + scrollX;
      initialTop = parseFloat(card.style.top) || rect.top + scrollY;

      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();

      const doc = (card.ownerDocument && card.ownerDocument.defaultView) ? card.ownerDocument : document;
      doc.addEventListener('mousemove', onMouseMove);
      doc.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;

      card.style.left = `${newLeft}px`;
      card.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        headerEl.style.cursor = 'grab';
        headerEl.classList.remove('dragging');
        const doc = (card.ownerDocument && card.ownerDocument.defaultView) ? card.ownerDocument : document;
        doc.removeEventListener('mousemove', onMouseMove);
        doc.removeEventListener('mouseup', onMouseUp);
      }
    };

    headerEl.addEventListener('mousedown', onMouseDown);
  },

  /**
   * Renders the popup card's container frame and binds segmented toggle events
   */
  renderFrame(shadowRoot, word, activeTargetLang, activeExplainLang, hideAll, onTargetChange, onExplainChange, onWordEdit) {
    const wordCount = word.split(/\s+/).filter(Boolean).length;
    const isSentence = wordCount > 4;
    const displayWord = isSentence ? (word.length > 30 ? word.substring(0, 27) + '...' : word) : word;
    const cefr = isSentence ? null : getCEFRLevel(word, activeTargetLang);
    const cefrBadge = cefr ? `<span class="glossapop-cefr-badge cefr-${cefr.text.toLowerCase()}" title="${escapeHtml(cefr.label)}">${cefr.text}</span>` : '';

    const eLangA = (typeof settings !== 'undefined' && settings.explainLangA) ? settings.explainLangA : 'zh-TW';
    const eLangB = (typeof settings !== 'undefined' && settings.explainLangB) ? settings.explainLangB : 'en';

    const card = shadowRoot.querySelector('.glossapop-card');
    card.innerHTML = `
      <div class="glossapop-header">
        <div class="glossapop-brand">
          <img class="glossapop-brand-logo" src="${chrome.runtime.getURL('icons/logo-cat.png')}" alt="Logo">
          <span class="glossapop-title">GlossaPop</span>
        </div>
        <div class="glossapop-header-actions">
          <button class="glossapop-save-btn" id="glossapop-save-word" title="Save to Google Sheets">☆ Save</button>
          <button class="glossapop-theme-toggle" id="glossapop-theme-cycle" title="Toggle theme: Auto / Light / Dark">🌗</button>
          <button class="glossapop-close-btn" title="Close Popup">&times;</button>
        </div>
      </div>
      <div class="glossapop-toggles">
        <div class="glossapop-source-select-wrapper" id="target-lang-group" title="Source Language (Click to switch)">
          <select class="glossapop-source-select" id="glossapop-source-select" title="Source Language (Click to switch)">
            <option value="en" ${activeTargetLang === 'en' ? 'selected' : ''}>EN</option>
            <option value="fr" ${activeTargetLang === 'fr' ? 'selected' : ''}>FR</option>
            <option value="es" ${activeTargetLang === 'es' ? 'selected' : ''}>ES</option>
            <option value="de" ${activeTargetLang === 'de' ? 'selected' : ''}>DE</option>
            <option value="ja" ${activeTargetLang === 'ja' ? 'selected' : ''}>JA</option>
            <option value="ko" ${activeTargetLang === 'ko' ? 'selected' : ''}>KO</option>
            <option value="it" ${activeTargetLang === 'it' ? 'selected' : ''}>IT</option>
            <option value="pt" ${activeTargetLang === 'pt' ? 'selected' : ''}>PT</option>
            <option value="zh-TW" ${activeTargetLang === 'zh-TW' ? 'selected' : ''}>繁中</option>
            <option value="zh-CN" ${activeTargetLang === 'zh-CN' ? 'selected' : ''}>簡中</option>
          </select>
        </div>
        <div class="glossapop-segment" id="explain-lang-group">
          <button class="glossapop-segment-btn ${activeExplainLang === eLangA ? 'active' : ''}" data-val="${eLangA}">${getLanguageLabel(eLangA)}</button>
          <button class="glossapop-segment-btn ${activeExplainLang === eLangB ? 'active' : ''}" data-val="${eLangB}">${getLanguageLabel(eLangB)}</button>
        </div>
      </div>
      <div class="glossapop-quick-pills-bar">
        <span class="glossapop-pills-label">Switch:</span>
        <button class="glossapop-source-pill ${activeTargetLang === 'fr' ? 'active' : ''}" data-val="fr">FR</button>
        <button class="glossapop-source-pill ${activeTargetLang === 'es' ? 'active' : ''}" data-val="es">ES</button>
        <button class="glossapop-source-pill ${activeTargetLang === 'de' ? 'active' : ''}" data-val="de">DE</button>
        <button class="glossapop-source-pill ${activeTargetLang === 'ja' ? 'active' : ''}" data-val="ja">JA</button>
        <button class="glossapop-source-pill ${activeTargetLang === 'en' ? 'active' : ''}" data-val="en">EN</button>
      </div>
      <div class="glossapop-word-info">
        <div class="glossapop-word-title-container">
          <h3 class="glossapop-word" contenteditable="true" spellcheck="false" title="Click to edit word/sentence and press Enter to re-query">${escapeHtml(displayWord)}</h3>
          <button class="glossapop-edit-btn" title="Edit and re-query word">✏️</button>
          ${cefrBadge}
        </div>
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

    // Bind Event Handlers via Delegation
    card.querySelector('.glossapop-close-btn').addEventListener('click', hideAll);

    // Make popup card draggable via header drag handle
    const headerEl = card.querySelector('.glossapop-header');
    this.makeCardDraggable(card, headerEl);

    // Word Title Inline Editing Event Handler (Enter or Blur auto-query)
    const wordTitleEl = card.querySelector('.glossapop-word');
    const editBtn = card.querySelector('.glossapop-edit-btn');

    let initialEditingWord = (word || '').trim();

    const triggerWordReQuery = () => {
      if (!wordTitleEl) return;
      let editedWord = (wordTitleEl.textContent || '').trim();
      editedWord = editedWord.replace(/\s*(A1|A2|B1|B2|C1|C2)$/i, '').trim();
      if (editedWord && editedWord !== initialEditingWord && onWordEdit) {
        initialEditingWord = editedWord;
        wordTitleEl.blur();
        onWordEdit(editedWord);
      }
    };

    if (wordTitleEl) {
      wordTitleEl.addEventListener('focus', () => {
        let current = (wordTitleEl.textContent || '').trim();
        initialEditingWord = current.replace(/\s*(A1|A2|B1|B2|C1|C2)$/i, '').trim();
      });

      wordTitleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          triggerWordReQuery();
        }
      });

      wordTitleEl.addEventListener('blur', () => {
        triggerWordReQuery();
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (wordTitleEl) {
          wordTitleEl.focus();
        }
      });
    }

    // Theme Mode Cycle Toggle: auto → light → dark → auto
    const themeBtn = card.querySelector('#glossapop-theme-cycle');
    const themeIcons = { auto: '🌗', light: '☀️', dark: '🌙' };
    const themeCycle = ['auto', 'light', 'dark'];
    // Set initial icon from current settings
    themeBtn.textContent = themeIcons[settings.themeMode] || '🌗';
    themeBtn.addEventListener('click', () => {
      const currentIndex = themeCycle.indexOf(settings.themeMode);
      const nextMode = themeCycle[(currentIndex + 1) % 3];
      settings.themeMode = nextMode;
      themeBtn.textContent = themeIcons[nextMode];
      // Apply theme class on card
      card.classList.remove('glossapop-dark', 'glossapop-light');
      if (nextMode === 'dark') {
        card.classList.add('glossapop-dark');
      } else if (nextMode === 'light') {
        card.classList.add('glossapop-light');
      } else {
        // Auto: detect Dark Reader or defer to OS
        const isDarkReaderActive = document.documentElement.hasAttribute('data-darkreader-mode')
          || document.documentElement.hasAttribute('data-darkreader-scheme')
          || !!document.querySelector('meta[name="darkreader"]');
        if (isDarkReaderActive) card.classList.add('glossapop-dark');
      }
      // Persist to chrome.storage.sync
      chrome.storage.sync.set({ themeMode: nextMode });
    });

    // Source Language Select Listener
    const sourceSelect = card.querySelector('#glossapop-source-select');
    if (sourceSelect) {
      sourceSelect.addEventListener('change', (e) => {
        onTargetChange(e.target.value);
      });
    }

    // Source Language Pill Buttons Listener
    const pillBar = card.querySelector('.glossapop-quick-pills-bar');
    if (pillBar) {
      pillBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.glossapop-source-pill');
        if (btn && !btn.classList.contains('active')) {
          pillBar.querySelectorAll('.glossapop-source-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (sourceSelect) sourceSelect.value = btn.dataset.val;
          onTargetChange(btn.dataset.val);
        }
      });
    }

    card.querySelector('#explain-lang-group').addEventListener('click', (e) => {
      const btn = e.target.closest('.glossapop-segment-btn');
      if (btn && !btn.classList.contains('active')) {
        card.querySelectorAll('#explain-lang-group .glossapop-segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onExplainChange(btn.dataset.val);
      }
    });
  },

  /**
   * Renders Lemma Row & Feminine Form Information
   */
  renderLemma(lemmaRow, data, activeTargetLang) {
    if (data.lemmaInfo && data.lemmaInfo.lemma && !(activeTargetLang === 'fr' && data.isVerb)) {
      const lemma = data.lemmaInfo.lemma;
      const description = data.lemmaInfo.description || '';
      const isAdj = data.isAdjective || (data.definitions && data.definitions.some(d => d.includes('[Adjective]')));
      const femForm = (activeTargetLang === 'fr' && !data.isVerb && isAdj) ? (data.apiFeminineForm || getFrenchFeminineForm(lemma)) : null;
      
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
      
      lemmaRow.querySelectorAll('.glossapop-lemma-speak-btn').forEach(btn => {
        btn.onclick = () => {
          playPronunciation(btn.dataset.word, activeTargetLang, null);
        };
      });
      lemmaRow.style.display = 'flex';
    } else {
      lemmaRow.style.display = 'none';
    }
  },

  /**
   * Renders French Verb Conjugations with 5 Tenses
   */
  renderConjugations(conjBox, data, activeTargetLang, queryWord, activeTense = null, currentPage = null) {
    if (activeTargetLang === 'fr' && data.isVerb) {
      const verbToConjugate = data.lemmaInfo ? data.lemmaInfo.lemma : (data.word || queryWord);
      
      if (!activeTense && !currentPage) {
        activeTense = (typeof detectFrenchQueryTense === 'function')
          ? detectFrenchQueryTense(queryWord, data)
          : 'present';
      }

      const tensePageInfo = (typeof getTensePageInfo === 'function') ? getTensePageInfo(activeTense) : { pageIndex: 1 };
      if (!currentPage) {
        currentPage = tensePageInfo.pageIndex;
      }

      // Define 5 pages corresponding to screenshot rows
      const pages = [
        {
          pageIndex: 1,
          category: 'Indicatif (常用)',
          tenses: [
            { id: 'present', label: 'Présent' },
            { id: 'passe_compose', label: 'Passé C.' },
            { id: 'imparfait', label: 'Imparfait' },
            { id: 'plus_que_parfait', label: 'Plus-que-p.' }
          ]
        },
        {
          pageIndex: 2,
          category: 'Indicatif (進階)',
          tenses: [
            { id: 'passe_simple', label: 'Passé S.' },
            { id: 'passe_anterieur', label: 'Passé Ant.' },
            { id: 'futur_simple', label: 'Futur' },
            { id: 'futur_anterieur', label: 'Futur Ant.' }
          ]
        },
        {
          pageIndex: 3,
          category: 'Subjonctif',
          tenses: [
            { id: 'subjonctif_present', label: 'Subj. Prés.' },
            { id: 'subjonctif_passe', label: 'Subj. Passé' },
            { id: 'subjonctif_imparfait', label: 'Subj. Imp.' },
            { id: 'subjonctif_plus_que_parfait', label: 'Subj. P.Q.P.' }
          ]
        },
        {
          pageIndex: 4,
          category: 'Conditionnel & Impératif',
          tenses: [
            { id: 'conditionnel_present', label: 'Conditionnel' },
            { id: 'conditionnel_passe', label: 'Cond. Passé' },
            { id: 'imperatif_present', label: 'Impératif' },
            { id: 'imperatif_passe', label: 'Impér. Passé' }
          ]
        },
        {
          pageIndex: 5,
          category: 'Participe',
          tenses: [
            { id: 'participe_present', label: 'Part. Prés.' },
            { id: 'participe_passe', label: 'Part. Passé' }
          ]
        }
      ];

      const activePageObj = pages.find(p => p.pageIndex === currentPage) || pages[0];
      
      if (!activeTense || !activePageObj.tenses.some(t => t.id === activeTense)) {
        activeTense = activePageObj.tenses[0].id;
      }

      let conj = null;
      if (data.apiConjugations) {
        conj = (data.apiConjugations[activeTense] && Object.keys(data.apiConjugations[activeTense]).length > 0)
          ? data.apiConjugations[activeTense]
          : null;
      }
      if (!conj) {
        conj = getFrenchConjugations(verbToConjugate, activeTense);
      }
      if (!conj) {
        conj = getFrenchConjugations(verbToConjugate, 'present');
      }
      
      if (conj) {
        const tabsHtml = activePageObj.tenses.map(t => `<button class="glossapop-tense-tab ${activeTense === t.id ? 'active' : ''}" data-tense="${t.id}">${t.label}</button>`).join('');

        conjBox.innerHTML = `
          <div class="glossapop-conj-header">
            <div class="glossapop-conj-title">CONJUGAISON: ${escapeHtml(verbToConjugate.toUpperCase())}</div>
            <div class="glossapop-conj-pager">
              <button class="glossapop-pager-btn glossapop-prev-page" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
              <span class="glossapop-pager-info">${currentPage}/5</span>
              <button class="glossapop-pager-btn glossapop-next-page" ${currentPage === 5 ? 'disabled' : ''}>›</button>
            </div>
          </div>
          <div class="glossapop-tense-tabs">${tabsHtml}</div>
          <div class="glossapop-conj-grid">
            <div class="glossapop-conj-item" title="${escapeHtml(conj.je)}" data-speak="${escapeHtml(conj.je)}"><strong>${escapeHtml(conj.je)}</strong></div>
            <div class="glossapop-conj-item" title="${escapeHtml(conj.nous)}" data-speak="${escapeHtml(conj.nous)}"><strong>${escapeHtml(conj.nous)}</strong></div>
            <div class="glossapop-conj-item" title="${escapeHtml(conj.tu)}" data-speak="${escapeHtml(conj.tu)}"><strong>${escapeHtml(conj.tu)}</strong></div>
            <div class="glossapop-conj-item" title="${escapeHtml(conj.vous)}" data-speak="${escapeHtml(conj.vous)}"><strong>${escapeHtml(conj.vous)}</strong></div>
            <div class="glossapop-conj-item" title="${escapeHtml(conj.il)}" data-speak="${escapeHtml(conj.il)}"><strong>${escapeHtml(conj.il)}</strong></div>
            <div class="glossapop-conj-item" title="${escapeHtml(conj.ils)}" data-speak="${escapeHtml(conj.ils)}"><strong>${escapeHtml(conj.ils)}</strong></div>
          </div>
        `;

        // Bind pager events
        const prevBtn = conjBox.querySelector('.glossapop-prev-page');
        const nextBtn = conjBox.querySelector('.glossapop-next-page');
        if (prevBtn) {
          prevBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentPage > 1) {
              this.renderConjugations(conjBox, data, activeTargetLang, queryWord, null, currentPage - 1);
            }
          };
        }
        if (nextBtn) {
          nextBtn.onclick = (e) => {
            e.stopPropagation();
            if (currentPage < 5) {
              this.renderConjugations(conjBox, data, activeTargetLang, queryWord, null, currentPage + 1);
            }
          };
        }

        // Bind tense tab events
        conjBox.querySelectorAll('.glossapop-tense-tab').forEach(tab => {
          tab.onclick = (e) => {
            e.stopPropagation();
            this.renderConjugations(conjBox, data, activeTargetLang, queryWord, tab.dataset.tense, currentPage);
          };
        });

        // Click to play pronunciation
        conjBox.querySelectorAll('.glossapop-conj-item').forEach(item => {
          item.onclick = (e) => {
            e.stopPropagation();
            playPronunciation(item.dataset.speak, activeTargetLang, null);
          };
        });

        conjBox.style.display = 'block';
        return;
      }
    }
    conjBox.style.display = 'none';
  },

  /**
   * Renders Synonyms and Antonyms Chips
   */
  renderSynonyms(synonymsBox, data, onChipClick) {
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
  },

  /**
   * Renders Example Sentence & Highlight Target Word context (supports webpage context capture)
   */
  /**
   * Renders Example Sentence & Highlight Target Word
   */
  renderExample(exampleBox, data, activeTargetLang) {
    if (data && data.example && data.example.text) {
      const exampleText = data.example.text;
      const exampleTranslation = data.example.translation || '';
      const wordToHighlight = data.word || (data.lemmaInfo ? data.lemmaInfo.lemma : '');
      
      let textHtml = escapeHtml(exampleText);
      if (wordToHighlight) {
        const stem = wordToHighlight.length > 4 ? wordToHighlight.slice(0, -2) : wordToHighlight;
        const regexStr = `\\b(${wordToHighlight}|${stem}[a-z]{0,4})\\b`;
        try {
          const regex = new RegExp(regexStr, 'gi');
          textHtml = textHtml.replace(regex, (match) => `<mark class="glossapop-highlight">${match}</mark>`);
        } catch (e) {
          const index = textHtml.toLowerCase().indexOf(wordToHighlight.toLowerCase());
          if (index !== -1) {
            textHtml = textHtml.substring(0, index) + `<mark class="glossapop-highlight">` + textHtml.substring(index, index + wordToHighlight.length) + `</mark>` + textHtml.substring(index + wordToHighlight.length);
          }
        }
      }

      exampleBox.innerHTML = `
        <div class="glossapop-example-header">
          <span>EXAMPLE SENTENCE</span>
          <button class="glossapop-example-speak-btn" title="Pronounce example sentence">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
        </div>
        <div class="glossapop-example-text">"${textHtml}"</div>
        ${exampleTranslation ? `<div class="glossapop-example-translation">${escapeHtml(exampleTranslation)}</div>` : ''}
      `;
      const speakBtn = exampleBox.querySelector('.glossapop-example-speak-btn');
      if (speakBtn) {
        speakBtn.onclick = () => {
          playPronunciation(exampleText, activeTargetLang, null);
        };
      }
      exampleBox.style.display = 'block';
    } else {
      exampleBox.style.display = 'none';
    }
  },

  /**
   * Renders External Reference Dictionary Links
   */
  renderLinks(externalLinksBox, data, activeTargetLang, queryWord, activeExplainLang = '') {
    if (!externalLinksBox) return;
    const lookupWord = data.lemmaInfo ? data.lemmaInfo.lemma : (data.word || queryWord);
    const links = (typeof getDynamicReferenceLinks === 'function') 
      ? getDynamicReferenceLinks(lookupWord, activeTargetLang, activeExplainLang) 
      : [];

    if (links && links.length > 0) {
      let html = `<span>Read more:</span>`;
      links.forEach((link, idx) => {
        if (idx > 0) html += `<span class="glossapop-separator">|</span>`;
        html += `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name)}</a>`;
      });
      externalLinksBox.innerHTML = html;
      externalLinksBox.style.display = 'flex';
    } else {
      externalLinksBox.style.display = 'none';
    }
  },

  /**
   * Shows a temporary toast notice banner at bottom of card
   */
  showToast(shadowRoot, message) {
    const card = shadowRoot.querySelector('.glossapop-card');
    if (!card) return;
    let toast = card.querySelector('.glossapop-toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'glossapop-toast-notice';
      card.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
};

// Aliases for Backward Compatibility
function renderPopupFrame(shadowRoot, word, activeTargetLang, activeExplainLang, hideAll, onTargetChange, onExplainChange, onWordEdit) {
  UIComponents.renderFrame(shadowRoot, word, activeTargetLang, activeExplainLang, hideAll, onTargetChange, onExplainChange, onWordEdit);
}
function renderLemma(lemmaRow, data, activeTargetLang) {
  UIComponents.renderLemma(lemmaRow, data, activeTargetLang);
}
function renderConjugations(conjBox, data, activeTargetLang, queryWord, activeTense = null) {
  UIComponents.renderConjugations(conjBox, data, activeTargetLang, queryWord, activeTense);
}
function renderSynonyms(synonymsBox, data, onChipClick) {
  UIComponents.renderSynonyms(synonymsBox, data, onChipClick);
}
function renderExample(exampleBox, data, activeTargetLang) {
  UIComponents.renderExample(exampleBox, data, activeTargetLang);
}
function renderLinks(externalLinksBox, data, activeTargetLang, queryWord, activeExplainLang = '') {
  UIComponents.renderLinks(externalLinksBox, data, activeTargetLang, queryWord, activeExplainLang);
}
function showToastNotice(shadowRoot, message) {
  UIComponents.showToast(shadowRoot, message);
}
