// Builds the shareable web previews (normal and TEST): one page each with the whole game's code, and the 2.0 pictures
// and music beside them in dist/assets/ (shared by both pages; publish them with the page as its files).
// Fonts load from Google Fonts there, so the bundled @font-face block is stripped.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Builds two pages: dist/void-blaster.html (the normal preview) and dist/void-blaster-test.html (TEST variant with the
// tester's panel, js/testkit.js). __PREVIEW__: both may simulate the full-game purchase (labelled TEST).
const css = readFileSync('css/style.css', 'utf8').replace(/\/\* fonts:start[\s\S]*?\/\* fonts:end \*\/\n*/, '');
mkdirSync('dist', { recursive: true });
// the 2.0 textures and music (js/v2/), as files in dist/assets
process.env.VB_ASSET_DIR = 'dist/assets';
await import('./v2-assets.mjs');

for (const test of [false, true]) {
  const define = { __PREVIEW__: 'true', __TEST__: String(test) };
  const js = (await build({ entryPoints: ['js/main.js'], bundle: true, format: 'iife', minify: true, write: false, define })).outputFiles[0].text;
  if (!test && js.includes('VB-TESTKIT')) throw new Error('The normal preview contains the TEST panel. Stopping.');
  const html = `<title>${test ? 'Void Blaster TEST' : 'Void Blaster'}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
<style>
${css}
:root { color-scheme: dark; }
body { background: var(--bg); color: var(--text); }
</style>
<canvas id="game"></canvas>
<div id="ui"></div>
<script>
${js.replace(/<\/script/g, '<\\/script')}
</script>
`;
  const out = test ? 'dist/void-blaster-test.html' : 'dist/void-blaster.html';
  writeFileSync(out, html);
  console.log(`Built ${out}`);
}
