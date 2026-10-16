import { Game } from './game.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';
import { Background } from './background.js';
import { loadSave, writeSave, resetSave } from './save.js';
import { setSpriteScale, shipSprite, glowDot } from './sprites.js';
import { ALL_STAGES, DAILY, SHIPS, WORLDS, stageIndex } from './data.js';
import { clamp, todayStr } from './util.js';

const params = new URLSearchParams(location.search);
const DEV = params.has('dev');
const TIME_SCALE = DEV ? Math.max(1, +params.get('ts') || 1) : 1;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

// ---------------- input: relative drag + keyboard ----------------
const input = {
  dx: 0, dy: 0, down: false, lx: 0, ly: 0, pid: null,
  keys: new Set(),
  keyX() { return (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0); },
  keyY() { return (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0); },
  resetDrag() { this.dx = this.dy = 0; this.down = false; this.pid = null; },
};

const app = {
  canvas, ctx, input, W: 0, H: 0, dpr: 1, zoom: 1, time: 0,
  save: loadSave(),
  audio: new AudioEngine(),
  game: null,
  god: DEV && params.has('god'),
  persist() { writeSave(this.save); },
};
app.bg = new Background(app);
app.ui = new UI(app);

canvas.addEventListener('pointerdown', (e) => {
  app.audio.unlock();
  if (input.pid !== null) return;
  input.pid = e.pointerId;
  input.down = true;
  input.lx = e.clientX;
  input.ly = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== input.pid) return;
  input.dx += e.clientX - input.lx;
  input.dy += e.clientY - input.ly;
  input.lx = e.clientX;
  input.ly = e.clientY;
});
const up = (e) => { if (e.pointerId === input.pid) { input.pid = null; input.down = false; } };
canvas.addEventListener('pointerup', up);
canvas.addEventListener('pointercancel', up);
document.addEventListener('pointerdown', () => app.audio.unlock(), { capture: true });
window.addEventListener('keydown', (e) => {
  app.audio.unlock();
  input.keys.add(e.code);
  if (e.code === 'Escape' || e.code === 'KeyP') app.game?.pause();
});
window.addEventListener('keyup', (e) => input.keys.delete(e.code));
// Block iOS rubber-banding, double-tap zoom and pinch zoom.
document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    app.game?.pause();
    app.audio.ctx?.suspend();
  } else if (app.audio.ctx) {
    app.audio.ctx.resume();
  }
});

// ---------------- sizing ----------------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  app.W = window.innerWidth;
  app.H = window.innerHeight;
  app.dpr = dpr;
  canvas.width = Math.round(app.W * dpr);
  canvas.height = Math.round(app.H * dpr);
  canvas.style.width = app.W + 'px';
  canvas.style.height = app.H + 'px';
  app.zoom = clamp(Math.min(app.W, app.H) / 410, 0.85, 1.6);
  setSpriteScale(dpr * app.zoom);
  app.bg.resize();
}
window.addEventListener('resize', resize);
resize();

// ---------------- progression helpers ----------------
app.isUnlocked = (id) => {
  if (DEV) return true;
  const i = stageIndex(id);
  if (i <= 0) return true;
  return !!app.save.cleared[ALL_STAGES[i - 1].id];
};

app.dailyStatus = () => {
  const d = app.save.daily;
  const today = todayStr();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = todayStr(y);
  const claimable = d.last !== today;
  let streak = d.streak;
  if (claimable && d.last !== yesterday) streak = 0;
  const dayIndex = claimable ? streak % DAILY.length : (streak - 1) % DAILY.length;
  return { claimable, dayIndex, streak };
};

app.claimDaily = () => {
  const st = app.dailyStatus();
  if (!st.claimable) return 0;
  const v = DAILY[st.dayIndex];
  app.save.coins += v;
  app.save.daily = { last: todayStr(), streak: st.streak + 1 };
  app.persist();
  return v;
};

app.applySettings = () => {
  const s = app.save.settings;
  app.audio.sfxOn = s.sfx;
  app.audio.setMusicOn(s.music);
};

app.resetProgress = () => {
  app.save = resetSave();
  app.applySettings();
};

app.startStage = (id) => {
  const st = ALL_STAGES.find((s) => s.id === id);
  const stage = DEV && params.get('fast') ? { ...st, duration: st.duration / 6, bossAt: st.bossAt && st.bossAt / 6, events: st.events.map((e) => ({ ...e, t: e.t / 6 })) } : st;
  app.bg.setTheme(st.world.theme);
  input.resetDrag();
  app.ui.showHud();
  app.game = new Game(app, stage);
  app.audio.setTrack('game');
};

app.endRun = () => {
  app.game = null;
  app.audio.setTrack('menu');
  app.bg.setTheme(WORLDS[0].theme);
};

app.quitRun = () => {
  app.endRun();
  app.ui.hideHud();
  app.ui.map();
};

// ---------------- main loop ----------------
let last = performance.now();
let menuCam = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  app.time += dt;
  if (app.game) {
    for (let i = 0; i < TIME_SCALE && app.game; i++) app.game.update(dt);
    if (app.game) app.game.render(ctx);
  } else {
    renderMenu(dt);
  }
  requestAnimationFrame(frame);
}

function renderMenu(dt) {
  menuCam += dt * 40;
  app.bg.draw(ctx, menuCam * 0.3, -menuCam, app.time);
  const onMenu = !!document.querySelector('.screen.menu');
  if (!onMenu) return;
  const { W, H, dpr } = app;
  const ship = SHIPS[app.save.ship] || SHIPS.striker;
  const x = W / 2, y = H * 0.47 + Math.sin(app.time * 1.6) * 8;
  const sc = 2.6;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  const fl = glowDot(ship.color, 14);
  const f = sc * (1 + Math.random() * 0.25);
  ctx.drawImage(fl.canvas, x - fl.half * f, y + 30 - fl.half * f, fl.half * 2 * f, fl.half * 2 * f);
  ctx.globalCompositeOperation = 'source-over';
  const spr = shipSprite(ship.shape, ship.color);
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(spr.canvas, -spr.half * sc, -spr.half * sc, spr.half * 2 * sc, spr.half * 2 * sc);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ---------------- boot ----------------
app.applySettings();
if (DEV && params.get('coins')) app.save.coins = +params.get('coins');
app.audio.setTrack('menu');
app.ui.menu();
if (app.dailyStatus().claimable && app.save.stats.runs > 0) app.ui.daily();
requestAnimationFrame(frame);
window.__app = app;

if ('serviceWorker' in navigator && location.protocol === 'https:' && !DEV) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
