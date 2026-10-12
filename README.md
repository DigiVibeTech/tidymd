# TidyMD: Page to Markdown (Chrome, Edge, Firefox). Built locally, NOT published.

**What it does.** One click turns the current page, or a selection, into clean Markdown. Tables and code blocks survive intact.
- **Free:** copy the article, copy the full page, download a .md file, and a right-click "Copy selection as Markdown".
- **Pro (ExtensionPay):** custom templates and YAML front matter, all open tabs merged into one .md, and Send to Obsidian.

**Why this product (demand evidence).** See `../_evidence/EVIDENCE.md#stream-1`.
- MarkDownload, with about 30k Chrome users and a 4.68 rating from 156 reviews, was removed from the Chrome Web Store on 2026-08-31. Its users are now without it.
- Its top review complaints are broken tables and code blocks losing line breaks. TidyMD's tests target exactly those two problems.

## Build and test
```
npm install
npm test          # 9 unit tests (jsdom): tables, code fences, links, templates, filenames
npm run build     # dist/chrome, dist/edge, dist/firefox (+ zips)
node test/e2e.chrome.cjs   # real Chrome: loads the extension, converts a page (needs /tmp/pp puppeteer-core@24)
npx web-ext lint -s dist/firefox
```

## Notes
- **License: AGPL-3.0-or-later.** The ExtPay library is AGPL, so the extension's source must be public too, e.g. on GitHub. Pro is enforced by ExtensionPay's server-side "paid" status. Forks are possible but rarely a real threat for a USD 3 utility.
- **Permissions:** activeTab, scripting, storage, contextMenus, clipboardWrite, downloads. The only host permission is extensionpay.com, needed for payments. The extension reads no pages in the background; it acts only when you click it.
- **Before upload:** replace `ExtPay('tidymd')` with the extension ID Hugo registers on ExtensionPay, if it differs.
- **Remaining web-ext lint warnings (3):** they come from innerHTML use inside Mozilla Readability and Turndown, which are vendored libraries. Readability is Mozilla's own library and is accepted on AMO.
