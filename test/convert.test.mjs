import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { pageToMarkdown, selectionToMarkdown, renderTemplate, buildVars, FRONTMATTER_TEMPLATE, safeFilename, mergePages, obsidianUri } from '../src/convert.js';

const page = (body, title = 'Test Page') => new JSDOM(`<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`, { url: 'https://example.com/blog/post' }).window.document;
const article = (inner) => `<nav><a href="/">Home</a> <a href="/x">X</a></nav><article><h1>Hello world</h1><p>${'Intro text that is long enough for readability to score it as content. '.repeat(8)}</p>${inner}<p>${'More body text to keep the article dominant. '.repeat(8)}</p></article><footer>Footer junk</footer>`;

test('table without thead stays a GFM table', () => {
  const r = pageToMarkdown(page(article('<table><tr><td>Name</td><td>Price</td></tr><tr><td>A</td><td>1</td></tr></table>')), 'https://example.com/blog/post');
  assert.match(r.markdown, /\| Name \| Price \|/);
  assert.match(r.markdown, /\| --- \| --- \|/);
  assert.match(r.markdown, /\| A \| 1 \|/);
});

test('multi-paragraph cells do not break table rows', () => {
  const r = pageToMarkdown(page(article('<table><thead><tr><th>K</th><th>V</th></tr></thead><tbody><tr><td><p>line1</p><p>line2</p></td><td>x<br>y</td></tr></tbody></table>')), 'https://example.com/a');
  const row = r.markdown.split('\n').find((l) => l.includes('line1'));
  assert.ok(row.includes('line2') && row.includes('x') && row.includes('y'), row);
});

test('code blocks keep line breaks and language', () => {
  const r = pageToMarkdown(page(article('<pre><code class="language-js">const a = 1;\nconst b = 2;<br>return a+b;</code></pre>')), 'https://example.com/a');
  assert.match(r.markdown, /```js\nconst a = 1;\nconst b = 2;\nreturn a\+b;\n```/);
});

test('code containing backticks uses tilde fence', () => {
  const md = selectionToMarkdown('<pre><code>x = ```y```</code></pre>');
  assert.match(md, /^~~~~\nx = ```y```\n~~~~$/);
});

test('relative links and images become absolute; nav/footer removed', () => {
  const r = pageToMarkdown(page(article('<p><a href="../docs">docs</a> <img src="/img.png" alt="pic"></p>')), 'https://example.com/blog/post');
  assert.match(r.markdown, /\(https:\/\/example\.com\/docs\)/);
  assert.match(r.markdown, /!\[pic\]\(https:\/\/example\.com\/img\.png\)/);
  assert.doesNotMatch(r.markdown, /Footer junk/);
});

test('full-page mode keeps everything', () => {
  const r = pageToMarkdown(page(article('')), 'https://example.com/a', { readable: false });
  assert.match(r.markdown, /Footer junk/);
});

test('front matter template escapes quotes', () => {
  const out = renderTemplate(FRONTMATTER_TEMPLATE, buildVars({ title: 'He said "hi"', url: 'https://x.y', markdown: 'body' }, new Date('2026-10-11T00:00:00Z')));
  assert.match(out, /title: "He said \\"hi\\""/);
  assert.match(out, /clipped: 2026-10-11/);
  assert.match(out, /\n\nbody\n$/);
});

test('safe filenames', () => {
  assert.equal(safeFilename('A/B: C? <D> | E #1'), 'A B C D E 1.md');
  assert.equal(safeFilename(''), 'page.md');
  assert.ok(safeFilename('x'.repeat(300)).length <= 83);
});

test('merge pages and obsidian uri', () => {
  const m = mergePages([{ title: 'A', url: 'u1', markdown: 'a' }, { title: 'B', url: 'u2', markdown: 'b' }]);
  assert.match(m, /# A[\s\S]*\n---\n[\s\S]*# B/);
  assert.equal(obsidianUri('My Vault', 'Note.md', 'x y'), 'obsidian://new?vault=My%20Vault&file=Note&content=x%20y');
});
