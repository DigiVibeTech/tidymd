import { pageToMarkdown, selectionToMarkdown } from './convert.js';
// Injected on demand only (activeTab + scripting). Runs locally; nothing is sent anywhere.
(() => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed && window.__tidymdMode === 'selection') {
    const div = document.createElement('div');
    for (let i = 0; i < sel.rangeCount; i++) div.appendChild(sel.getRangeAt(i).cloneContents());
    window.__tidymdResult = { title: document.title, markdown: selectionToMarkdown(div.innerHTML), url: location.href };
  } else {
    window.__tidymdResult = pageToMarkdown(document, location.href, { readable: window.__tidymdMode !== 'full' });
  }
})();
