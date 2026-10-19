// Builds dist/void-blaster.html: the whole game in one self-contained page (used for the shareable web preview).
// Fonts load from Google Fonts there, so the bundled @font-face block is stripped.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// __PREVIEW__: the shareable preview may simulate the full-game purchase (labelled TEST) so every world can be tested.
// --bosses: a separate test page (dist/void-blaster-bosses.html) with the full game unlocked and a BOSS TEST menu.
const bosses = process.argv.includes('--bosses');
const out = bosses ? 'dist/void-blaster-bosses.html' : 'dist/void-blaster.html';
const define = { __PREVIEW__: 'true', __BOSS_TEST__: String(bosses) };
const js = (await build({ entryPoints: ['js/main.js'], bundle: true, format: 'iife', minify: true, write: false, define })).outputFiles[0].text;
const css = readFileSync('css/style.css', 'utf8').replace(/\/\* fonts:start[\s\S]*?\/\* fonts:end \*\/\n*/, '');
const html = `<title>${bosses ? 'Void Blaster Boss Test' : 'Void Blaster'}</title>
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
mkdirSync('dist', { recursive: true });
writeFileSync(out, html);
console.log(`Built ${out}`);
