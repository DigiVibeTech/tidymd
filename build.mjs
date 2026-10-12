import { build } from 'esbuild';
import fs from 'fs';
const base = JSON.parse(fs.readFileSync('manifest.base.json'));
const targets = {
  chrome: { ...base, background: { service_worker: 'background.js' } },
  edge: { ...base, background: { service_worker: 'background.js' } },
  firefox: { ...base, background: { scripts: ['background.js'] },
    browser_specific_settings: { gecko: { id: 'tidymd@digivibetech.com', strict_min_version: '128.0',
      data_collection_permissions: { required: ['none'] } } } },
};
for (const [t, manifest] of Object.entries(targets)) {
  const out = `dist/${t}`;
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  await build({ entryPoints: ['src/background.js', 'src/content.js', 'src/popup.js', 'src/options.js'], bundle: true, outdir: out, format: 'iife', target: 'es2020', minify: false, logLevel: 'error' });
  for (const f of ['popup.html', 'popup.css', 'options.html']) fs.copyFileSync(`src/${f}`, `${out}/${f}`);
  fs.copyFileSync('node_modules/extpay/dist/ExtPay.js', `${out}/ExtPay.js`);
  fs.copyFileSync('LICENSE', `${out}/LICENSE`);
  fs.cpSync('icons', `${out}/icons`, { recursive: true });
  fs.writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
}
console.log('built', Object.keys(targets).join(', '));
