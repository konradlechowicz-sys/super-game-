// Builds dist/void-blaster.html: the whole game in one self-contained page (used for the shareable web preview).
// Fonts load from Google Fonts there, so the bundled @font-face block is stripped.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const js = (await build({ entryPoints: ['js/main.js'], bundle: true, format: 'iife', minify: true, write: false })).outputFiles[0].text;
const css = readFileSync('css/style.css', 'utf8').replace(/\/\* fonts:start[\s\S]*?\/\* fonts:end \*\/\n*/, '');
const html = `<title>Void Blaster</title>
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
writeFileSync('dist/void-blaster.html', html);
console.log('Built dist/void-blaster.html');
