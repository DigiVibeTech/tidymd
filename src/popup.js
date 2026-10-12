const api = globalThis.browser || globalThis.chrome;
const msg = (t) => { document.getElementById('msg').textContent = t; };
api.runtime.sendMessage({ type: 'status' }, (r) => {
  document.getElementById('badge').textContent = r && r.pro ? '(active)' : '';
  if (r && r.pro) document.getElementById('upgrade').hidden = true;
});
document.getElementById('upgrade').onclick = () => api.runtime.sendMessage({ type: 'upgrade' });
document.querySelectorAll('button[data-act],button[data-pro="allTabs"]').forEach((b) => {
  b.onclick = () => {
    const how = b.dataset.act === 'download' ? 'download' : b.dataset.act === 'obsidian' ? 'obsidian' : 'copy';
    const type = b.dataset.pro === 'allTabs' ? 'allTabs' : 'convert';
    api.runtime.sendMessage({ type, mode: b.dataset.mode, how: type === 'allTabs' ? 'download' : how }, async (r) => {
      if (!r) return msg('This page cannot be read (browser page).');
      if (r.needPro) return msg('That is a Pro feature.');
      if (how === 'copy' && type === 'convert') { await navigator.clipboard.writeText(r.text); msg('Copied.'); }
      else msg(type === 'allTabs' ? `Saved ${r.count} tabs.` : 'Done.');
    });
  };
});
