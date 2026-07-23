// events.js - Listens for mouseup selections, dblclicks, and page clicks

// Listen for mouseup selection event (to show the trigger bubble)
document.addEventListener('mouseup', (e) => {
  // Skip if clicks are placed inside the Shadow DOM container
  if (hostElement && e.composedPath().includes(hostElement)) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  const wordCount = selectedText.split(/\s+/).filter(Boolean).length;
  const isSentence = wordCount > 4;
  const maxLength = isSentence ? 2000 : 50;

  // Check boundary sizes (support paragraph selections up to 2000 chars)
  if (!selectedText || selectedText.length > maxLength || (!isSentence && /[\r\n]/.test(selectedText))) {
    hideAll();
    return;
  }

  currentWord = selectedText;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  initShadowDOM();

  if (settings.triggerMode === 'icon') {
    const triggerIcon = shadowRoot.querySelector('.glossapop-trigger-icon');
    
    // Calculate float icon coordinates (bounded within visible viewport)
    const viewportWidth = window.innerWidth;
    const iconX = Math.min(rect.right + window.scrollX + 6, window.scrollX + viewportWidth - 36);
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

  const wordCount = selectedText.split(/\s+/).filter(Boolean).length;
  const isSentence = wordCount > 4;
  const maxLength = isSentence ? 2000 : 50;

  if (!selectedText || selectedText.length > maxLength || (!isSentence && /[\r\n]/.test(selectedText))) {
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
