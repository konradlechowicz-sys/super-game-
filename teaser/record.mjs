// Records the 2.0 teaser to dist/void-blaster-2-teaser.mp4 (1080x1920, 30 fps, H.264 + AAC): opens the built page in
// headless Chromium with ?record, steps the animation frame by frame, renders the soundtrack for this run's events
// (teaser/audio.js) and encodes both with ffmpeg. Keeps the stems in dist/ (the picture alone, the music, the
// effects), so a new music track can be laid under the picture without recording it again. Also saves the events
// to teaser/events.json, which the page uses for its own sound (npm run teaser again after it changes).
// Needs Playwright with Chromium (npm i -g playwright && npx playwright install chromium) and ffmpeg.
// Run from the repo root after npm run teaser: npm run teaser:video
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const FPS = 30, OUT = 'dist/void-blaster-2-teaser.mp4', FRAMES = 'dist/teaser-frames';
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`file://${resolve('dist/void-blaster-2-teaser.html')}?record`);
await page.waitForFunction(() => window.teaser, null, { timeout: 60000 });
const length = await page.evaluate(() => window.teaser.length);
const total = Math.round(length * FPS);
for (let i = 0; i < total; i++) {
  await page.evaluate((n) => window.teaser.advance(n), 60 / FPS);
  writeFileSync(`${FRAMES}/${String(i).padStart(4, '0')}.png`, await page.screenshot({ type: 'png' }));
  if (i % 30 === 0) process.stdout.write(`frame ${i}/${total}\n`);
}
const events = JSON.stringify(await page.evaluate(() => window.teaser.events()));
const sound = await page.evaluate(() => window.teaser.soundtrack());
await browser.close();
if (errors.length) { console.error('Page errors:', errors); process.exit(1); }
const changed = !existsSync('teaser/events.json') || readFileSync('teaser/events.json', 'utf8') !== events;
writeFileSync('teaser/events.json', events);
for (const k of ['mix', 'music', 'sfx']) writeFileSync(`dist/teaser-${k}.wav`, Buffer.from(sound[k], 'base64'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FRAMES}/%04d.png`, '-i', 'dist/teaser-mix.wav',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
  '-af', 'loudnorm=I=-14:TP=-1:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
rmSync(FRAMES, { recursive: true, force: true });
// the picture alone, to lay other music under it later without recording again
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', OUT, '-an', '-c:v', 'copy', 'dist/teaser-video.mp4'], { stdio: 'inherit' });
console.log(`Recorded ${OUT} (${total} frames, with sound); stems: dist/teaser-video.mp4, dist/teaser-music.wav, dist/teaser-sfx.wav`);
if (changed) console.log('teaser/events.json changed: run npm run teaser to give the page the new sound');
