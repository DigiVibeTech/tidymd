// Pure helpers without DOM libraries (used by background, options, tests).
/** Template rendering, e.g. "---\ntitle: {{title}}\nsource: {{url}}\n---\n\n# {{title}}\n\n{{content}}" */
export function renderTemplate(tpl, vars) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => (vars[k] ?? '').toString());
}
export const DEFAULT_TEMPLATE = '# {{title}}\n\nSource: {{url}}\n\n{{content}}\n';
export const FRONTMATTER_TEMPLATE = '---\ntitle: "{{title_yaml}}"\nsource: {{url}}\nclipped: {{date}}\n---\n\n# {{title}}\n\n{{content}}\n';

export function buildVars(res, date = new Date()) {
  return { ...res, content: res.markdown, title_yaml: res.title.replace(/"/g, '\\"'), date: date.toISOString().slice(0, 10) };
}

export function safeFilename(title, max = 80) {
  const s = (title || 'page').normalize('NFKD').replace(/[\\/:*?"<>|#^[\]\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim();
  return (s || 'page') + '.md';
}

/** Merge several pages into one document (Pro: "all tabs"). */
export function mergePages(pages, tpl = DEFAULT_TEMPLATE, date = new Date()) {
  return pages.map((p) => renderTemplate(tpl, buildVars(p, date)).trim()).join('\n\n---\n\n') + '\n';
}

export function obsidianUri(vault, file, content) {
  return `obsidian://new?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file.replace(/\.md$/, ''))}&content=${encodeURIComponent(content)}`;
}
