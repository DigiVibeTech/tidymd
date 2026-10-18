# TidyMD: Page to Markdown (Chrome, Edge, Firefox)

**What it does.** One click turns the current page, or a selection, into clean Markdown. Tables and code blocks survive intact.
- **Free:** copy the article, copy the full page, download a .md file, and a right-click "Copy selection as Markdown".
- **Pro (ExtensionPay):** custom templates and YAML front matter, all open tabs merged into one .md, and Send to Obsidian.

**Why TidyMD.** Tables and code blocks are where most page-to-Markdown tools break. TidyMD's tests target exactly those two cases.

## Build and test
```
npm install
npm test          # 9 unit tests (jsdom): tables, code fences, links, templates, filenames
npm run build     # dist/chrome, dist/edge, dist/firefox (+ zips)
node test/e2e.chrome.cjs   # real Chrome: loads the extension, converts a page (requires puppeteer-core)
npx web-ext lint -s dist/firefox
```

## Details
- **License: AGPL-3.0-or-later.** The ExtPay library is AGPL, so the extension's source must be public too, e.g. on GitHub. Pro is enforced by ExtensionPay's server-side "paid" status.
- **Permissions:** activeTab, scripting, storage, contextMenus, clipboardWrite, downloads. The only host permission is extensionpay.com, needed for payments. The extension reads no pages in the background; it acts only when you click it.
- **Remaining web-ext lint warnings (3):** they come from innerHTML use inside Mozilla Readability and Turndown, which are vendored libraries. Readability is Mozilla's own library and is accepted on AMO.
