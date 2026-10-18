// Core conversion: DOM document -> clean Markdown. Pure, runs in browser and in Node (jsdom) tests.
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export function makeTurndown() {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*' });
  td.use(gfm);
  // Keep line breaks inside code blocks.
  td.addRule('preCode', {
    filter: (n) => n.nodeName === 'PRE',
    replacement: (_c, node) => {
      const codeEl = node.querySelector('code') || node;
      const cls = (codeEl.getAttribute('class') || '') + ' ' + (node.getAttribute('class') || '');
      const m = cls.match(/(?:language|lang)-([\w+#-]+)/);
      // innerHTML <br> -> newline, then textContent
      const clone = codeEl.cloneNode(true);
      Array.from(clone.querySelectorAll('br')).forEach((br) => br.parentNode.replaceChild(br.ownerDocument.createTextNode('\n'), br));
      const text = clone.textContent.replace(/\n$/, '');
      const fence = text.includes('```') ? '~~~~' : '```';
      return `\n\n${fence}${m ? m[1] : ''}\n${text}\n${fence}\n\n`;
    },
  });
  // Tables without <thead>: promote first row so GFM plugin keeps them as tables.
  td.addRule('stripEmptyLinks', { filter: (n) => n.nodeName === 'A' && !n.textContent.trim() && !n.querySelector('img'), replacement: () => '' });
  return td;
}

export function normalizeTables(doc) {
  doc.querySelectorAll('table').forEach((t) => {
    if (t.querySelector('thead') || !t.rows.length) return;
    const first = t.rows[0];
    [...first.cells].forEach((c) => {
      if (c.nodeName === 'TD') { const th = doc.createElement('th'); while (c.firstChild) th.appendChild(c.firstChild); c.replaceWith(th); }
    });
    const thead = doc.createElement('thead'); thead.appendChild(first); t.insertBefore(thead, t.firstChild);
  });
  // flatten block content inside cells so rows stay on one line
  doc.querySelectorAll('td, th').forEach((c) => {
    c.querySelectorAll('br').forEach((b) => b.replaceWith(' '));
    c.querySelectorAll('p,div').forEach((p) => p.replaceWith(...p.childNodes, ' '));
  });
}

export function absolutize(doc, baseUrl) {
  for (const [sel, attr] of [['a[href]', 'href'], ['img[src]', 'src']]) {
    doc.querySelectorAll(sel).forEach((el) => {
      try { el.setAttribute(attr, new URL(el.getAttribute(attr), baseUrl).href); } catch { /* keep */ }
    });
  }
}

/** Convert a full page. Returns {title, markdown, byline, excerpt, url}. */
export function pageToMarkdown(doc, url, { readable = true } = {}) {
  const work = doc.cloneNode(true);
  absolutize(work, url);
  normalizeTables(work);
  let title = doc.title || '';
  let html = work.body ? work.body.innerHTML : '';
  let byline = '', excerpt = '';
  if (readable) {
    const art = new Readability(work, { keepClasses: true }).parse();
    if (art && art.content) { html = art.content; title = art.title || title; byline = art.byline || ''; excerpt = art.excerpt || ''; }
  }
  const td = makeTurndown();
  const body = td.turndown(html).replace(/\n{3,}/g, '\n\n').trim();
  return { title: title.trim(), markdown: body, byline, excerpt, url };
}

export function selectionToMarkdown(html) { return makeTurndown().turndown(html).trim(); }

export { renderTemplate, DEFAULT_TEMPLATE, FRONTMATTER_TEMPLATE, buildVars, safeFilename, mergePages, obsidianUri } from './template.js';
