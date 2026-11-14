// Swaps the end card of the four finished social videos (appstore/2.0/video/*.mp4) for the one promo/record.mjs draws
// now, without recording the game again (the game is random, so a new recording would show other fights).
// The end card fades in over the game in 0.4 s and the video fades to black in the last 0.8 s, so every frame of
// the end shot is   game * (1 - a) * (1 - f) + card * a * (1 - f);   swapping the card is adding
// a * (1 - f) * (newCard - oldCard), which leaves the game and the key art untouched. Both cards are drawn by the
// game page with the recorder's toolkit, as in the recording. Needs npm run build:web first, Playwright and ffmpeg.
// Run from the repo root: node promo/recard.mjs [invasion|swarm|bosses|worlds]
// (2026-11-14: "COMING SOON · iPHONE & ANDROID" became "OUT NOW ON iPHONE · ANDROID COMING SOON".)
import { createRequire } from 'node:module';
import { readFileSync, existsSync, renameSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { VIDEOS, CODEX_KEYS } from './shots.mjs';

const OLD = '<div class="sh"></div><div class="in"><h1>VOID BLASTER</h1><div class="two">2.0</div><div class="cs">COMING SOON</div><div class="pl">iPHONE &amp; ANDROID</div></div>';
const W = 1080, H = 1920, FPS = 30, SIZE = W * H * 3;

const { chromium } = createRequire(import.meta.url)('playwright');
if (!existsSync('dist/void-blaster-test.html')) { console.error('Run npm run build:web first.'); process.exit(1); }
const src = readFileSync('promo/record.mjs', 'utf8');
const body = src.match(/const LIB = String\.raw`([\s\S]*?)`;\n/)[1];
const LIB = new Function('resolve', 'CODEX_KEYS', `return String.raw\`${body}\`;`)(resolve, CODEX_KEYS);

// the two cards, drawn by the page and turned into raw RGB
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
await page.goto(`file://${resolve('dist/void-blaster-test.html')}?dev&full&god`);
await page.waitForFunction(() => window.__app?.v2r, null, { timeout: 90000 });
await page.evaluate(LIB);
await page.evaluate(() => window.__promo.init());
await page.evaluate(() => { window.__promo.end(1); window.__promo.fade(0); document.getElementById('pcap').innerHTML = ''; });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
const NEW = await page.evaluate(() => document.getElementById('pend').innerHTML);
const shoot = async (html) => {
  await page.evaluate((h) => { document.getElementById('pend').innerHTML = h; }, html);
  await page.waitForTimeout(300);
  const png = await page.screenshot({ type: 'png' });
  return execFileSync('ffmpeg', ['-loglevel', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: png, maxBuffer: SIZE * 2 });
};
const oldCard = await shoot(OLD), newCard = await shoot(NEW);
await browser.close();
const delta = new Int16Array(SIZE);
for (let i = 0; i < SIZE; i++) delta[i] = newCard[i] - oldCard[i];

const only = process.argv[2];
for (const [name, v] of Object.entries(VIDEOS)) {
  if (only && only !== name) continue;
  const file = `appstore/2.0/video/${v.file}.mp4`;
  const frames = v.shots.map((s) => Math.round(s.dur * FPS));
  const endShot = v.shots[v.shots.length - 1];
  const start = frames.slice(0, -1).reduce((a, b) => a + b, 0);
  const tmp = `dist/${v.file}.recard.mp4`;
  const dec = spawn('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
  const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
    '-i', file, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-maxrate', '8M', '-bufsize', '16M',
    '-preset', 'slow', '-c:a', 'copy', '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  let buf = Buffer.alloc(0), n = 0, residual = 0, checked = 0;
  const frame = (f) => {
    const i = n - start;
    if (i >= 0) {
      const t = i / FPS;
      const a = Math.min(1, t / 0.4), fo = endShot.fadeOut ? Math.max(0, (t - (endShot.dur - endShot.fadeOut)) / endShot.fadeOut) : 0;
      const k = a * (1 - fo);
      // a check that the old card is really the one in the video: on fully shown frames they must match closely
      if (a === 1 && fo === 0) { let d = 0; for (let j = 0; j < SIZE; j += 97) d += Math.abs(f[j] - oldCard[j]); residual += d / (SIZE / 97); checked++; }
      for (let j = 0; j < SIZE; j++) { const x = f[j] + k * delta[j]; f[j] = x < 0 ? 0 : x > 255 ? 255 : x; }
    }
    n++;
    return f;
  };
  await new Promise((done, fail) => {
    dec.stdout.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= SIZE) { const f = Buffer.from(buf.subarray(0, SIZE)); buf = buf.subarray(SIZE); if (!enc.stdin.write(frame(f))) { dec.stdout.pause(); enc.stdin.once('drain', () => dec.stdout.resume()); } }
    });
    dec.on('close', () => enc.stdin.end());
    enc.on('close', (code) => (code === 0 ? done() : fail(new Error(`ffmpeg ${code}`))));
  });
  const res = residual / Math.max(1, checked);
  console.log(`${v.file}: ${n} frames, end card from frame ${start}, old card difference ${res.toFixed(1)} / 255`);
  if (res > 12) { console.error(`${v.file}: the end card in the video does not match the old card, file left unchanged`); continue; }
  renameSync(tmp, file);
  // the cover is an earlier frame of the video, so it stays as it is
}
