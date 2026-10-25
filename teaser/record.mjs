// Records the 2.0 teaser to dist/void-blaster-2-teaser.mp4 (1080x1920, 30 fps, H.264): opens the built page in
// headless Chromium with ?record, steps the animation frame by frame and encodes the frames with ffmpeg.
// Needs Playwright with Chromium (npm i -g playwright && npx playwright install chromium) and ffmpeg.
// Run from the repo root after npm run teaser: npm run teaser:video
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
await browser.close();
if (errors.length) { console.error('Page errors:', errors); process.exit(1); }
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FRAMES}/%04d.png`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
rmSync(FRAMES, { recursive: true, force: true });
console.log(`Recorded ${OUT} (${total} frames)`);
