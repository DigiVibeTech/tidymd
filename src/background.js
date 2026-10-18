import ExtPay from 'extpay';
import { renderTemplate, buildVars, DEFAULT_TEMPLATE, safeFilename, mergePages, obsidianUri } from './template.js';

const extpay = ExtPay('tidymd'); // ExtensionPay extension id
extpay.startBackground();

const api = globalThis.browser || globalThis.chrome;

async function convertTab(tabId, mode) {
  await api.scripting.executeScript({ target: { tabId }, func: (m) => { window.__tidymdMode = m; }, args: [mode] });
  await api.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  const [{ result }] = await api.scripting.executeScript({ target: { tabId }, func: () => window.__tidymdResult });
  return result;
}

async function settings() {
  const s = await api.storage.sync.get({ template: DEFAULT_TEMPLATE, vault: '' });
  return s;
}

async function isPro() { try { return (await extpay.getUser()).paid; } catch { return false; } }

async function deliver(text, filename, how) {
  if (how === 'download') {
    const url = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(text);
    await api.downloads.download({ url, filename, saveAs: false });
  }
  return text;
}

api.runtime.onMessage.addListener((msg, _sender, reply) => {
  (async () => {
    const pro = await isPro();
    const s = await settings();
    if (msg.type === 'status') return reply({ pro });
    if (msg.type === 'upgrade') { extpay.openPaymentPage(); return reply({}); }
    if (msg.type === 'convert') {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      const res = await convertTab(tab.id, msg.mode || 'article');
      const tpl = pro ? s.template : DEFAULT_TEMPLATE; // custom templates are Pro
      const text = renderTemplate(tpl, buildVars(res));
      if (msg.how === 'obsidian') {
        if (!pro) return reply({ needPro: true });
        await api.tabs.create({ url: obsidianUri(s.vault, safeFilename(res.title), text) });
      }
      await deliver(text, safeFilename(res.title), msg.how);
      return reply({ text });
    }
    if (msg.type === 'allTabs') {
      if (!pro) return reply({ needPro: true });
      const tabs = await api.tabs.query({ currentWindow: true });
      const pages = [];
      for (const t of tabs) {
        if (!/^https?:/.test(t.url || '')) continue;
        try { pages.push(await convertTab(t.id, 'article')); } catch { /* restricted page */ }
      }
      const text = mergePages(pages, s.template);
      await deliver(text, `tabs-${new Date().toISOString().slice(0, 10)}.md`, msg.how);
      return reply({ text, count: pages.length });
    }
  })();
  return true;
});

api.runtime.onInstalled.addListener(() => {
  api.contextMenus.create({ id: 'sel', title: 'Copy selection as Markdown', contexts: ['selection'] });
});
api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'sel') return;
  const res = await convertTab(tab.id, 'selection');
  await api.scripting.executeScript({ target: { tabId: tab.id }, func: (t) => navigator.clipboard.writeText(t), args: [res.markdown] });
});
