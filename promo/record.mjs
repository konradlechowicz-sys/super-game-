// Records the 2.0 social-media videos (plan approved by Konrad 2026-11-02; shot lists in promo/shots.mjs) from the
// real game: opens the built TEST page (dist/void-blaster-test.html, npm run build:web first) in headless Chromium,
// stops its own clock (app.timeScale = 0, and requestAnimationFrame held back: a page that redraws non-stop makes
// every screenshot wait seconds in the software renderer), then for every video frame steps the game by 1/30 s
// itself, sets every CSS animation to the same time, runs the page's frame callbacks once and takes a screenshot.
// So the video runs at a steady 30 fps however slow the renderer is (about 1 s per frame here). Captions and
// the end card are HTML laid over the game in its own fonts; the music is a track of the game, cut with ffmpeg.
// Writes appstore/2.0/video/<file>.mp4 (1080x1920, H.264 + AAC, -14 LUFS) and a cover picture <file>.jpg.
// Needs Playwright with Chromium and ffmpeg. Run from the repo root:
//   npm run promo:video -- <invasion|swarm|bosses|worlds> [seconds: record only the start, for a test]
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { VIDEOS, CODEX_KEYS } from './shots.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const FPS = 30, DT = 1 / FPS;
const name = process.argv[2], limit = +process.argv[3] || Infinity;
const video = VIDEOS[name];
if (!video) { console.error(`Which video? ${Object.keys(VIDEOS).join(', ')}`); process.exit(1); }
if (!existsSync('dist/void-blaster-test.html')) { console.error('Run npm run build:web first.'); process.exit(1); }
const OUT_DIR = 'appstore/2.0/video', FRAMES = `dist/promo-frames-${name}`;
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// what the page gets: setting up a recording session, stepping the game, captions, story scenes, the end card
const LIB = String.raw`
window.__promo = (() => {
  const app = window.__app, ui = app.ui;
  const P = {};
  P.keyArt = ${JSON.stringify('file://' + resolve('appstore/2.0/key-art-2048.jpg'))};
  P.codexKeys = ${JSON.stringify(CODEX_KEYS)};
  // session: no test labels, no tutorial, drag control (no joystick on screen), the game advanced only by step()
  P.init = () => {
    const css = document.createElement('style');
    css.textContent = '.test-btn,.version.test,.build-tag,.tip-box,.coach{display:none!important}' +
      '#pcap{position:fixed;left:0;right:0;z-index:90;text-align:center;pointer-events:none;padding:0 20px}' +
      '#pcap .t{font:800 30px/1.15 Orbitron,sans-serif;letter-spacing:.08em;color:#ffb02e;text-shadow:0 2px 14px rgba(0,0,0,.9),0 0 2px #000}' +
      '#pcap .s{margin-top:8px;font:600 15px/1.3 Rajdhani,sans-serif;letter-spacing:.24em;color:#dfe5ee;text-shadow:0 2px 10px #000}' +
      '#pcap.void .t{color:#ff4fa8;text-shadow:0 0 14px rgba(255,45,149,.6),0 2px 10px #000}' +
      '#pcap .row{font:700 20px/1.6 Orbitron,sans-serif;letter-spacing:.06em;color:#dfe5ee;text-shadow:0 2px 10px #000}' +
      '#pcap .row b{color:#ffb02e;display:inline-block;min-width:2.2em;text-align:right;margin-right:.4em}' +
      '#pend{position:fixed;inset:0;z-index:95;background:#000 center/cover no-repeat;display:none;pointer-events:none}' +
      '#pend .sh{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(2,3,8,.15),rgba(2,3,8,.55) 45%,rgba(2,3,8,.95))}' +
      '#pend .in{position:absolute;left:0;right:0;bottom:16%;text-align:center}' +
      '#pend h1{font:900 40px Orbitron,sans-serif;letter-spacing:.14em;color:#eef2f8;margin:0 0 6px;text-shadow:0 0 20px rgba(0,0,0,.8)}' +
      '#pend .two{font:600 13px Orbitron,sans-serif;letter-spacing:.5em;color:#ff4fa8;margin-bottom:34px}' +
      '#pend .cs{font:800 26px Orbitron,sans-serif;letter-spacing:.2em;color:#ffb02e}' +
      '#pend .pl{margin-top:12px;font:600 18px Rajdhani,sans-serif;letter-spacing:.3em;color:#dfe5ee}' +
      '#pfade{position:fixed;inset:0;z-index:99;background:#000;opacity:0;pointer-events:none}';
    document.head.appendChild(css);
    for (const id of ['pcap', 'pend', 'pfade']) { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); }
    document.getElementById('pend').innerHTML = '<div class="sh"></div><div class="in"><h1>VOID BLASTER</h1><div class="two">2.0</div><div class="cs">COMING SOON</div><div class="pl">iPHONE &amp; ANDROID</div></div>';
    document.getElementById('pend').style.backgroundImage = 'url(' + P.keyArt + ')';
    const s = app.save;
    s.settings.control = 'drag'; s.settings.sfx = false; s.settings.music = false; s.settings.dmgNums = false;
    s.tipsOff = true; s.story = { intro: 1, w1: 1, w2: 1, w3: 1, w4: 1, w5: 1, w6: 1, w7: 1, w8: 1, w9: 1, outro: 1 };
    s.veteran = true; s.skins = ['gold']; s.ships = ['striker', 'phantom', 'titan'];
    app.god = true; app.timeScale = 0;
    ui.closeModal();
  };
  P.clear = () => {
    document.querySelectorAll('.story').forEach((e) => e.remove());
    ui.closeModal();
    if (app.game) { app.game = null; app.endRun(); ui.hideHud(); }
    P.cap(null); P.end(0);
    P.path = null;
  };
  // a sector with the ship flying a slow loop; the level-up cards picked by themselves (off camera)
  P.stage = (id, o = {}) => {
    app.save.ship = o.ship || 'striker';
    app.save.skin = o.skin || null;
    app.startStage(id);
    const g = app.game;
    g.tut?.close?.(false);
    g.openCards = function () { this.pendingLevels = 0; this.pendingChests = 0; };
    if (o.at != null) { g.stage.events.forEach((e, i) => { if (e.t < o.at) g.eventsDone.add(i); }); g.time = o.at; }
    if (o.boss) { const t = g.stage.bossAt - 0.2; g.stage.events.forEach((e, i) => { if (e.t < t) g.eventsDone.add(i); }); g.time = t; }
    for (const [id, lv, evo] of o.weapons || []) P.weapon(id, lv, evo);
    P.path = { r: o.r ?? 70, w: o.w ?? 0.9, ph: 0 };
    return g;
  };
  P.weapon = (id, lv = 5, evo = false) => {
    const g = app.game;
    let w = g.weapons.find((x) => x.id === id);
    if (!w) { if (g.weapons.length >= 4) g.weapons.shift(); g.addWeapon(id); w = g.weapons[g.weapons.length - 1]; }
    w.level = Math.max(w.level, lv);
    if (evo) g.applyCard({ kind: 'evo', id });
    g.checkCombos?.();
  };
  P.stress = (n) => {
    const g = app.game, st = g.stage;
    const pool = st.enemies.map((e) => e[0]);
    const hw = g.arena.w / 2 - 40, hh = g.arena.h / 2 - 40;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 150 + Math.random() * 420;
      g.spawnEnemy(pool[i % pool.length], Math.max(-hw, Math.min(hw, g.player.x + Math.cos(a) * d)), Math.max(-hh, Math.min(hh, g.player.y + Math.sin(a) * d)));
    }
  };
  // one video frame of game time
  P.step = (dt) => {
    app.time += dt;
    const g = app.game;
    if (!g) return;
    if (P.path && g.player) {
      const p = g.player, c = P.path;
      c.ph += dt * c.w;
      p.tx = Math.cos(c.ph) * c.r + (c.cx || 0); p.ty = Math.sin(c.ph * 1.3) * c.r * 0.6 + (c.cy || 0);
    }
    if (g.state === 'play' || g.state === 'winning') { g.update(dt / 2); if (app.game) app.game.update(dt / 2); }
  };
  // a caption: { t: title, s: sub, y: 0..1 from the top, void: magenta, rows: [[number, label], ...] }; a = alpha
  P.cap = (c, a = 1, k = 1) => {
    const el = document.getElementById('pcap');
    if (!c) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.className = c.void ? 'void' : '';
    el.style.top = ((c.y ?? 0.2) * 100) + '%';
    el.style.opacity = a;
    el.style.transform = 'scale(' + (0.92 + 0.08 * Math.min(1, a)) + ')';
    const rows = c.rows ? '<div style="margin-top:14px">' + c.rows.map(([n, l], i) => i < Math.ceil(k * c.rows.length) ? '<div class="row"><b>' + n + '</b>' + l + '</div>' : '').join('') + '</div>' : '';
    el.innerHTML = (c.t ? '<div class="t">' + c.t + '</div>' : '') + (c.s ? '<div class="s">' + c.s + '</div>' : '') + rows;
  };
  P.end = (a) => { const e = document.getElementById('pend'); e.style.display = a > 0 ? 'block' : 'none'; e.style.opacity = a; };
  P.fade = (a) => { document.getElementById('pfade').style.opacity = a; };
  // a story scene: its picture and the given transmission (who: cmd | void | lost), typed out by tTyped seconds
  P.story = (key, panel, say) => {
    app.playStory(key, () => {});
    const st = () => document.querySelector('.story');
    st().style.animation = 'none'; // a hard cut from the previous shot, no fade over the menu behind
    for (let i = 0; i < panel * 2 + 1; i++) st().dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    if (say) st().querySelector('.story-text').innerHTML = say.map((b) => '<div class="story-block ' + b.who + '"><div class="story-head">' + b.head + '</div>' + b.lines.map((l) => '<p data-t="' + l + '"></p>').join('') + '</div>').join('');
    st().querySelector('.story-skip').style.display = 'none';
  };
  P.type = (t, cps = 38) => {
    let n = Math.floor(t * cps);
    for (const p of document.querySelectorAll('.story-text p')) {
      const full = p.dataset.t || '';
      p.textContent = full.slice(0, Math.max(0, n));
      n -= full.length + 6;
    }
  };
  // menus
  P.codex = () => { app.save.codex = Object.fromEntries(P.codexKeys.map((k) => [k, 1])); ui.codex(() => ui.menu()); };
  P.scroll = (sel, f) => { const el = document.querySelector(sel); if (el) el.scrollTop = (el.scrollHeight - el.clientHeight) * f; };
  P.hangar = () => { app.save.ship = 'striker'; app.save.skin = 'veteran'; ui.hangar(() => ui.menu()); };
  // every CSS animation set to the time since it first showed up (the page's own clock does not count)
  const seen = new WeakMap();
  P.anims = (vt) => {
    for (const a of document.getAnimations()) {
      if (!seen.has(a)) seen.set(a, vt);
      a.pause();
      a.currentTime = (vt - seen.get(a)) * 1000;
    }
  };
  return P;
})();`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// requestAnimationFrame held in a queue once recording starts; __tick runs the queued callbacks once
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
await page.waitForTimeout(1500); // fonts and pictures
await page.evaluate(() => window.__manual());
await page.waitForTimeout(200);

const drawn = () => page.evaluate((dt) => window.__tick(dt), DT);
let frame = 0, vt = 0;
const total = Math.min(limit, video.shots.reduce((a, s) => a + s.dur, 0));
for (const shot of video.shots) {
  if (vt >= total) break;
  await page.evaluate(() => window.__promo.clear());
  if (shot.setup) await page.evaluate(shot.setup);
  // run the game a while off camera (enemies arrive, the boss appears)
  for (let w = 0; w < (shot.warm || 0) * FPS; w++) await page.evaluate((dt) => window.__promo.step(dt), DT);
  const n = Math.round(shot.dur * FPS);
  for (let i = 0; i < n && vt < total; i++) {
    const t = i / FPS;
    await page.evaluate(({ dt, t, vt, dur, each, cap, fadeOut, fadeIn }) => {
      const P = window.__promo;
      P.step(dt);
      if (each) new Function('P', 't', 'dur', each)(P, t, dur);
      if (cap) {
        const a0 = cap.at ?? 0.15, a1 = cap.until ?? dur;
        const a = t < a0 ? 0 : Math.min(1, (t - a0) / 0.25, (a1 - t) / 0.2);
        P.cap(a > 0 ? cap : null, Math.max(0, a), cap.rows ? Math.min(1, (t - a0) / Math.max(0.1, (cap.rowsIn || 1.5))) : 1);
      }
      P.fade(Math.max(fadeIn ? Math.max(0, 1 - t / fadeIn) : 0, fadeOut ? Math.max(0, (t - (dur - fadeOut)) / fadeOut) : 0));
      P.anims(vt);
    },{ dt: DT, t, vt, dur: shot.dur, each: shot.each || null, cap: shot.cap || null, fadeOut: shot.fadeOut || 0, fadeIn: shot.fadeIn || 0 });
    await drawn();
    await page.screenshot({ path: `${FRAMES}/${String(frame).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
    frame++; vt += DT;
    if (frame % 60 === 0) process.stdout.write(`${name}: ${frame}/${Math.round(total * FPS)} frames\n`);
  }
}
await browser.close();
if (errors.length) { console.error('Page errors:', errors); process.exit(1); }

// the music: a stretch of one of the game's tracks, faded at the end; loudness for social media
const out = `${OUT_DIR}/${video.file}`, len = frame / FPS;
const m = video.music;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FRAMES}/%05d.jpg`,
  '-ss', String(m.start), '-t', String(len), '-i', m.file,
  '-filter_complex', `[1:a]afade=t=in:d=0.05,afade=t=out:st=${Math.max(0, len - 1.8)}:d=1.8,loudnorm=I=-14:TP=-1:LRA=11[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', `${out}.mp4`], { stdio: 'inherit' });
// the cover: the frame the video names (its most telling moment)
const cover = Math.min(frame - 1, Math.round((video.cover || 1) * FPS));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${FRAMES}/${String(cover).padStart(5, '0')}.jpg`, '-q:v', '2', `${out}.jpg`]);
rmSync(FRAMES, { recursive: true, force: true });
console.log(`${out}.mp4: ${len.toFixed(1)} s`);
