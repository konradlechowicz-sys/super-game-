// Store screenshots of the real game (2.0 release, 2026-11-05): the same 8 scenes in the three sizes the stores need,
// App Store 6.9" (1320x2868), App Store 6.5" (1284x2778) and Google Play (1080x1920), with a caption in the game's
// style. Uses the video recorder's toolkit (promo/record.mjs: window.__promo, the page's clock held, one frame drawn
// per screenshot). Needs npm run build:web first. Writes appstore/2.0/screenshots/<size>/NN-<scene>.jpg.
// Run from the repo root: node promo/screens.mjs [6.9|6.5|play|iap]
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CODEX_KEYS } from './shots.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
if (!existsSync('dist/void-blaster-test.html')) { console.error('Run npm run build:web first.'); process.exit(1); }
// the recorder's in-page toolkit, taken from promo/record.mjs so both stay the same
const src = readFileSync('promo/record.mjs', 'utf8');
const body = src.match(/const LIB = String\.raw`([\s\S]*?)`;\n/)[1];
const LIB = new Function('resolve', 'CODEX_KEYS', `return String.raw\`${body}\`;`)(resolve, CODEX_KEYS);

const SIZES = { '6.9': [440, 956, 3], '6.5': [428, 926, 3], play: [360, 640, 3] };
const DT = 1 / 30;
// name, setup (in the page), seconds of game run before the picture, caption
const SCENES = [
  ['swarm', () => { const P = window.__promo; P.stage('2-4', { at: 60, weapons: [['singularity', 5, true], ['pulse', 5], ['flame', 5], ['blaster', 5]] }); P.stress(260); }, 2.2,
    { t: 'SURVIVE THE SWARM', s: '300+ ENEMIES ON SCREEN', y: 0.17 }],
  ['boss', () => { const P = window.__promo; const g = P.stage('4-6', { boss: true, r: 80, weapons: [['rail', 5], ['missiles', 5, true], ['lightning', 5]] }); window.__bossFury = g; }, 4.5,
    { t: '10 DEADLY BOSSES', s: 'FURY PHASES · SPECIAL ATTACKS', y: 0.17 }],
  ['levelup', () => { const P = window.__promo; const g = P.stage('3-3', { at: 40, weapons: [['blaster', 3], ['spread', 2]] }); delete g.openCards; g.gainXp((g.xpNext - g.xp) / g.player.xpMult + 1, true); }, 0.6,
    { t: 'BUILD YOUR ARSENAL', s: 'EVOLVE · COMBINE · SURVIVE', y: 0.82 }],
  ['map', () => { window.__app.ui.map(); }, 0.3, { t: '10 WORLDS', s: 'FROM EARTH TO THE NEXUS', y: 0.87, box: true }],
  ['story', () => window.__promo.story('intro', 3, [{ who: 'cmd', head: 'EARTH COMMAND // ADMIRAL HALE', lines: ["One ship. That's all we have left.", 'Take back our sky.'] }]), 0.3,
    { t: 'AN ILLUSTRATED STORY', y: 0.08 }],
  ['europa', () => { const P = window.__promo; P.stage('7-3', { at: 55, ship: 'phantom', weapons: [['flame', 5], ['orbit', 5], ['mines', 4]] }); P.stress(120); }, 2.5,
    { t: 'EVERY WORLD IS DIFFERENT', s: 'ICE · STORMS · RIFTS · ACID', y: 0.17 }],
  ['codex', () => window.__promo.codex(), 0.3,
    { t: '54 WAYS TO FIGHT', y: 0.36, box: true, rows: [[11, 'WEAPONS'], [11, 'EVOLUTIONS'], [9, 'PERKS'], [12, 'COMBOS'], [8, 'PERK SETS'], [3, 'SUPER COMBOS']] }],
  ['hangar', () => window.__promo.hangar(), 0.3, { t: '3 SHIPS', s: 'SKINS · WEAPON MODULES ON YOUR HULL', y: 0.42, box: true }],
];

const only = process.argv[2];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
for (const [size, [w, h, dpr]] of Object.entries(SIZES)) {
  if (only && only !== size) continue;
  const out = `appstore/2.0/screenshots/${size}`;
  mkdirSync(out, { recursive: true });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    let q = [], ts = 0, manual = false;
    const real = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => { if (!manual) return real(cb); q.push(cb); return q.length; };
    window.__manual = () => { manual = true; };
    window.__tick = (dt) => { ts += dt * 1000; const run = q; q = []; run.forEach((cb) => cb(ts)); };
  });
  await page.goto(`file://${resolve('dist/void-blaster-test.html')}?dev&full&god`);
  await page.waitForFunction(() => window.__app?.v2r, null, { timeout: 90000 });
  await page.evaluate(LIB);
  await page.evaluate(() => window.__promo.init());
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__manual());
  let n = 0, vt = 0;
  for (const [name, setup, warm, cap] of SCENES) {
    n++;
    await page.evaluate(() => window.__promo.clear());
    await page.evaluate(setup);
    for (let i = 0; i < warm / DT; i++) {
      vt += DT;
      await page.evaluate(({ dt, vt, i, warm }) => {
        const P = window.__promo;
        P.step(dt); P.type(9); P.anims(vt);
        // the boss scene: the fury and the special attack's warning in the picture
        const g = window.__bossFury;
        if (g && g === window.__app.game && g.boss) { g.boss.hp = Math.min(g.boss.hp, g.boss.maxHp * 0.45); if (i >= Math.round(warm / dt) - 40 && !g.__spec) { if (g.boss.mode === 'idle') { g.boss.specT = 0; g.__spec = 1; } } }
        if (document.querySelector('.codex .scroll')) P.scroll('.codex .scroll', 0.35);
      }, { dt: DT, vt, i, warm });
      await page.evaluate((dt) => window.__tick(dt), DT);
    }
    await page.evaluate((cap) => { window.__promo.cap(cap, 1, 1); window.__bossFury = null; }, cap);
    await page.evaluate((dt) => window.__tick(dt), DT);
    await page.screenshot({ path: `${out}/${String(n).padStart(2, '0')}-${name}.jpg`, type: 'jpeg', quality: 92 });
    console.log(`${size}: ${n}-${name}`);
  }
  if (errors.length) console.error(size, 'page errors:', errors);
  await page.close();
}
// the in-app purchase's review screenshot (App Store Connect): the paywall on the normal page, at the store price
if (!only || only === 'iap') {
  const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
  await page.goto(`file://${resolve('dist/void-blaster.html')}`);
  await page.waitForFunction(() => window.__app?.ui, null, { timeout: 90000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const a = window.__app; a.save.tipsOff = true; a.ui.closeModal?.(); a.ui.paywall();
    for (const e of document.querySelectorAll('button, .btn')) if (/\(TEST\)/.test(e.textContent)) e.textContent = e.textContent.replace(/\s*\(TEST\)/, '');
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'appstore/2.0/screenshots/iap-review-fullgame.jpg', type: 'jpeg', quality: 92 });
  console.log('iap: paywall');
  await page.close();
}
await browser.close();
