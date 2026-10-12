// E2E smoke: load the unpacked Chrome build in real Chrome, convert a local page via the service worker.
// extensionpay.com is resolved to 127.0.0.1 so no external service is contacted.
const puppeteer = require('/tmp/pp/node_modules/puppeteer-core');
const http = require('http');
const html = `<!doctype html><html><head><title>E2E Page</title></head><body><nav>menu</nav><article><h1>Title</h1>
<p>${'Body text long enough for Readability. '.repeat(20)}</p>
<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>
<pre><code class="language-py">x = 1\ny = 2</code></pre><p>${'More text. '.repeat(30)}</p></article></body></html>`;
(async () => {
  const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(html); }).listen(8765);
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, pipe: true, enableExtensions: true,
    args: ['--no-sandbox', '--host-resolver-rules=MAP extensionpay.com 127.0.0.1'] });
  await browser.installExtension('/tmp/ext-e2e');
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8765/');
  const swTarget = await browser.waitForTarget((t) => t.type() === 'service_worker', { timeout: 15000 });
  const sw = await swTarget.worker();
  const out = await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ url: 'http://127.0.0.1:8765/*' });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.__tidymdMode = 'article'; } });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__tidymdResult });
    return result;
  });
  const checks = { title: out.title === 'E2E Page' || out.title === 'Title', table: /\| A \| B \|/.test(out.markdown), code: /```py\nx = 1\ny = 2\n```/.test(out.markdown), noNav: !/menu/.test(out.markdown) };
  console.log(JSON.stringify(checks));
  await browser.close(); srv.close();
  process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
