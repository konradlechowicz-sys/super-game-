// Builds the iOS app's web assets into www/ (Capacitor's webDir):
// one bundled script with the native bridge, plus CSS, fonts and icons. No network access needed at runtime.
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const out = 'www';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// --release: the app shows the public version ("v1.0.0") instead of the test label ("date · build N").
const channel = process.argv.includes('--release') ? 'release' : 'dev';

await build({
  define: { __CHANNEL__: JSON.stringify(channel) },
  entryPoints: ['js/native-main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['safari15'],
  outfile: `${out}/app.js`,
  logLevel: 'warning',
});

for (const dir of ['css', 'fonts', 'icons']) cpSync(dir, `${out}/${dir}`, { recursive: true });

let html = readFileSync('index.html', 'utf8');
html = html
  .replace('<link rel="manifest" href="manifest.webmanifest">\n', '')
  .replace('<script type="module" src="js/main.js"></script>', '<script src="app.js"></script>');
if (!html.includes('src="app.js"')) throw new Error('index.html: could not find the main script tag');
writeFileSync(`${out}/index.html`, html);
console.log(`Built www/ for iOS (${channel})`);
