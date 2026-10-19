import { Game } from './game.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';
import { Background } from './background.js';
import { loadSave, writeSave, resetSave, hasLocalSave, importSave, SAVE_KEY } from './save.js';
import { setSpriteScale, shipSprite, glowDot } from './sprites.js';
import { ALL_STAGES, DAILY, SHIPS, WORLDS, stageIndex } from './data.js';
import { clamp, todayStr } from './util.js';
import { createStore, shipLook } from './store.js';

const params = new URLSearchParams(location.search);
const DEV = params.has('dev');
const TIME_SCALE = DEV ? Math.max(1, +params.get('ts') || 1) : 1;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

// ---------------- input: joystick / relative drag + keyboard ----------------
const JOY_R = 52; // knob travel radius in CSS px
const input = {
  dx: 0, dy: 0, down: false, lx: 0, ly: 0, pid: null,
  // joystick: base centre (bx, by), knob offset (kx, ky), normalised output (jx, jy)
  joy: false, bx: 0, by: 0, kx: 0, ky: 0, jx: 0, jy: 0,
  keys: new Set(),
  keyX() { return (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0); },
  keyY() { return (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0); },
  resetDrag() { this.dx = this.dy = 0; this.down = false; this.pid = null; this.joy = false; this.kx = this.ky = this.jx = this.jy = 0; },
};

const app = {
  canvas, ctx, input, W: 0, H: 0, dpr: 1, zoom: 1, time: 0,
  save: loadSave(),
  audio: new AudioEngine(),
  game: null,
  god: DEV && params.has('god'),
  // Set by js/native-entry.js inside the iOS app (Capacitor plugins); null in the browser.
  native: window.__native || null,
  persist() {
    writeSave(this.save);
    // iOS may purge WebView storage, so the app also keeps a native copy of the save.
    this.native?.Preferences.set({ key: SAVE_KEY, value: JSON.stringify(this.save) }).catch(() => {});
  },
};
app.bg = new Background(app);
app.ui = new UI(app);

const control = () => app.save.settings.control || 'joystick';
const safeProbe = document.createElement('div');
safeProbe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px)';
document.body.appendChild(safeProbe);
const safeBottom = () => parseFloat(getComputedStyle(safeProbe).paddingBottom) || 0;
// Fixed joystick sits centred near the bottom edge; the floating one appears under the thumb.
app.joyHome = () => ({ x: app.W / 2, y: app.H - safeBottom() - Math.max(90, Math.min(130, app.H * 0.13)) });
app.joyZoneTop = () => app.H * 0.58;

function setKnob(x, y) {
  let ox = x - input.bx, oy = y - input.by;
  const l = Math.hypot(ox, oy);
  if (l > JOY_R) { ox = (ox / l) * JOY_R; oy = (oy / l) * JOY_R; }
  input.kx = ox; input.ky = oy;
  // dead zone, then linear 0..1 output along the knob direction
  const m = Math.min(1, l / JOY_R);
  const out = m < 0.12 ? 0 : (m - 0.12) / 0.88;
  const kl = Math.hypot(ox, oy) || 1;
  input.jx = (ox / kl) * out;
  input.jy = (oy / kl) * out;
}

canvas.addEventListener('pointerdown', (e) => {
  app.audio.unlock();
  if (input.pid !== null) return;
  const mode = control();
  if (mode !== 'drag') {
    // joystick modes only react to touches in the lower part of the screen
    if (e.clientY < app.joyZoneTop()) return;
    input.joy = true;
    if (mode === 'float') { input.bx = e.clientX; input.by = Math.min(e.clientY, app.H - safeBottom() - JOY_R - 8); }
    else { const h = app.joyHome(); input.bx = h.x; input.by = h.y; }
    setKnob(e.clientX, e.clientY);
  }
  input.pid = e.pointerId;
  input.down = true;
  input.lx = e.clientX;
  input.ly = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== input.pid) return;
  if (input.joy) {
    setKnob(e.clientX, e.clientY);
    return;
  }
  input.dx += e.clientX - input.lx;
  input.dy += e.clientY - input.ly;
  input.lx = e.clientX;
  input.ly = e.clientY;
});
const up = (e) => { if (e.pointerId === input.pid) input.resetDrag(); };
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
// Worlds 2-4 are part of the full game.
app.needsFullGame = (id) => ALL_STAGES.find((s) => s.id === id)?.world.id > 1 && !app.store.isFull();

app.isUnlocked = (id) => {
  if (app.needsFullGame(id)) return false;
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
  if (app.needsFullGame(id)) { app.ui.paywall(); return; }
  const st = ALL_STAGES.find((s) => s.id === id);
  const stage = DEV && params.get('fast') ? { ...st, duration: st.duration / 6, bossAt: st.bossAt && st.bossAt / 6, events: st.events.map((e) => ({ ...e, t: e.t / 6 })) } : st;
  app.bg.setTheme(st.world.theme);
  input.resetDrag();
  app.ui.showHud();
  app.game = new Game(app, stage);
  app.audio.setTrack(st.world.music || 'game');
};

app.endRun = () => {
  app.game = null;
  app.ui.bannerEl.innerHTML = '';
  app.ui.tip(null);
  app.audio.setTrack('menu');
  app.bg.setTheme(WORLDS[0].theme);
};

app.quitRun = () => {
  app.ui.closeModal();
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
    if (app.game) { app.game.render(ctx); drawJoystick(); }
  } else {
    renderMenu(dt);
  }
  requestAnimationFrame(frame);
}

function drawJoystick() {
  const mode = control();
  const st = app.game.state;
  if (mode === 'drag' || (st !== 'play' && st !== 'winning')) return;
  const { dpr } = app;
  const h = input.joy ? { x: input.bx, y: input.by } : app.joyHome();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // tutorial: pulsing gold ring around the joystick until the player moves
  if (app.game.tut.joyTarget() && !input.joy) {
    const p = 0.5 + 0.5 * Math.sin(app.time * 6);
    ctx.globalAlpha = 0.5 + p * 0.5;
    ctx.strokeStyle = '#ffd23d';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd23d';
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(h.x, h.y, JOY_R + 22 + p * 8, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (mode === 'float' && !input.joy) { ctx.globalAlpha = 1; return; }
  ctx.globalAlpha = input.joy ? 0.9 : 0.45;
  ctx.fillStyle = 'rgba(20, 8, 50, 0.45)';
  ctx.beginPath(); ctx.arc(h.x, h.y, JOY_R + 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2ff3ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#2ff3ff';
  ctx.shadowBlur = 12;
  ctx.stroke();
  // direction ticks
  ctx.shadowBlur = 0;
  ctx.globalAlpha *= 0.6;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(h.x + Math.cos(a) * (JOY_R + 2), h.y + Math.sin(a) * (JOY_R + 2));
    ctx.lineTo(h.x + Math.cos(a) * (JOY_R + 9), h.y + Math.sin(a) * (JOY_R + 9));
    ctx.stroke();
  }
  ctx.globalAlpha = input.joy ? 1 : 0.6;
  const kx = h.x + input.kx, ky = h.y + input.ky;
  const g = ctx.createRadialGradient(kx, ky, 2, kx, ky, 26);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#2ff3ff');
  g.addColorStop(1, 'rgba(47, 243, 255, 0.15)');
  ctx.fillStyle = g;
  ctx.shadowColor = '#2ff3ff';
  ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(kx, ky, 26, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function renderMenu(dt) {
  menuCam += dt * 40;
  app.bg.draw(ctx, menuCam * 0.3, -menuCam, app.time);
  const onMenu = !!document.querySelector('.screen.menu');
  if (!onMenu) return;
  const { W, H, dpr } = app;
  const ship = shipLook(SHIPS[app.save.ship] || SHIPS.striker, app.save);
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

// ---------------- haptics (iOS app only) ----------------
let lastHaptic = 0;
app.haptic = (kind) => {
  const n = app.native;
  if (!n || !app.save.settings.haptics) return;
  const now = performance.now();
  if (now - lastHaptic < 80) return;
  lastHaptic = now;
  const style = { light: n.ImpactStyle.Light, medium: n.ImpactStyle.Medium, heavy: n.ImpactStyle.Heavy }[kind];
  const call = style ? n.Haptics.impact({ style }) : n.Haptics.notification({ type: n.NotificationType.Success });
  call.catch(() => {});
};

// ---------------- boot ----------------
// The private preview build (scripts/build-web.mjs) also allows a simulated purchase; the public web version does not.
/* global __PREVIEW__ */
const PREVIEW = typeof __PREVIEW__ !== 'undefined' && __PREVIEW__;
app.store = createStore(app, DEV || PREVIEW);
// ?dev&full: start with the full game (simulated purchase) for testing worlds 2-4.
if (DEV && params.has('full')) app.store.grant();
// Refresh whatever screen is open when the purchase state changes from outside (refund, Ask to Buy approval).
app.onFullGameChanged = () => { if (!app.game) app.ui.menu(); };
app.store.init().then(() => { if (!app.game && document.querySelector('.screen.menu')) app.ui.menu(); });
app.applySettings();
if (DEV && params.get('coins')) app.save.coins = +params.get('coins');
app.audio.setTrack('menu');
app.ui.menu();
if (app.dailyStatus().claimable && app.save.stats.runs > 0) app.ui.daily();
requestAnimationFrame(frame);
window.__app = app;

// In the app, restore progress from the native copy if WebView storage was cleared.
if (app.native && !hasLocalSave()) {
  app.native.Preferences.get({ key: SAVE_KEY }).then(({ value }) => {
    if (!value || app.game) return;
    app.save = importSave(value);
    app.applySettings();
    app.ui.menu();
  }).catch(() => {});
}

if (!app.native && 'serviceWorker' in navigator && location.protocol === 'https:' && !DEV) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
