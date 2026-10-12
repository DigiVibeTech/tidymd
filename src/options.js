import { DEFAULT_TEMPLATE, FRONTMATTER_TEMPLATE } from './template.js';
const api = globalThis.browser || globalThis.chrome;
const $ = (id) => document.getElementById(id);
api.storage.sync.get({ template: DEFAULT_TEMPLATE, vault: '' }, (s) => { $('template').value = s.template; $('vault').value = s.vault; });
$('fm').onclick = () => { $('template').value = FRONTMATTER_TEMPLATE; };
$('save').onclick = () => api.storage.sync.set({ template: $('template').value, vault: $('vault').value }, () => { $('ok').textContent = 'Saved'; });
