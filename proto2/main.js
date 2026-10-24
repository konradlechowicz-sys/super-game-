// Void Blaster 2.0 prototype: one arena ("technological ruin") on PixiJS (WebGL), to judge the new look and how
// smoothly it runs on a phone. Not the real game: no XP, no cards, the ship cannot die. Art: art/2.0, prepared for
// this page by proto2/make-assets.py; built into one file by proto2/build.mjs.
import { Application, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import ASSETS from './assets.gen.js';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const app = new Application();
await app.init({
  resizeTo: window, background: 0x05010f, antialias: true,
  resolution: Math.min(window.devicePixelRatio || 1, 3), autoDensity: true, powerPreference: 'high-performance',
});
document.body.appendChild(app.canvas);

// ---------- textures ----------
const tex = {};
await Promise.all(Object.entries(ASSETS.images).map(async ([name, url]) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  tex[name] = Texture.from(img);
}));
const SHIP = ASSETS.ship;
// soft round dot for bullets, sparks and flashes
const dot = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return Texture.from(c);
})();

// ---------- world ----------
const world = new Container();
app.stage.addChild(world);
const FLOOR_SCALE = 1.5;
const floor = new Sprite(tex['floor-tech-ruin']);
floor.scale.set(FLOOR_SCALE);
world.addChild(floor);
const AW = floor.width, AH = floor.height;
// the flyable area: inside the rubble frame of the floor image
const ARENA = { x0: AW * 0.09, x1: AW * 0.91, y0: AH * 0.07, y1: AH * 0.93 };

const glowLayer = new Container(); glowLayer.blendMode = 'add';
const enemyLayer = new Container();
const shotLayer = new Container(); shotLayer.blendMode = 'add';
const shipLayer = new Container();
const fxLayer = new Container(); fxLayer.blendMode = 'add';
world.addChild(glowLayer, enemyLayer, shotLayer, shipLayer, fxLayer);

// ---------- the Striker, built from its parts ----------
const SHIP_H = 86; // on-screen height in points
const ship = { x: AW / 2, y: AH * 0.6, vx: 0, vy: 0, a: -Math.PI / 2, bank: 0, gunT: 0, recoil: [0, 0], side: 0 };
const shipBody = new Container();
shipLayer.addChild(shipBody);
const part = (name) => {
  const s = new Sprite(tex[`ship-${name}`]);
  s.anchor.set(0.5);
  return s;
};
const P = SHIP.pos, Z = SHIP.size, k = SHIP.k;
const at = (key, name) => ({ x: P[key][0] * k + Z[name][0] / 2, y: P[key][1] * k + Z[name][1] / 2 });
const hullAt = at('hull', 'hull');
const cx = hullAt.x;
const cy = 633 * k; // the ship's middle (in striker.webp pixels: 633), its turning point
const engAt = at('engR', 'engine-right');
const engDX = engAt.x - cx, engY = engAt.y - 40 * k;
const flames = [part('flame'), part('flame')];
const wings = [part('wing-left'), part('wing-right')];
const engines = [part('engine-left'), part('engine-right')];
const guns = [part('gun'), part('gun')];
const glass = part('glass');
const hull = part('hull');
const wl = at('wingL', 'wing-left'), wr = at('wingR', 'wing-right');
wings[0].position.set(wl.x - cx, wl.y - cy);
wings[1].position.set(wr.x - cx, wr.y - cy);
engines.forEach((e, i) => { e.scale.set(1.15); e.position.set((i ? 1 : -1) * engDX, engY - cy); });
const gunX = (398 * k) - cx, gunY = (455 * k) - cy + (Z.gun[1] * 0.95) / 2;
guns.forEach((g, i) => { g.scale.set(0.95); g.position.set((i ? -1 : 1) * gunX, gunY); });
// a flame hangs from the back of each engine: its top just inside the nozzle
const flameTop = engY - cy + (Z['engine-right'][1] * 1.15) / 2 - 40 * k;
flames.forEach((f, i) => { f.anchor.set(0.5, 0); f.position.set((i ? 1 : -1) * engDX, flameTop); f.blendMode = 'add'; });
hull.position.set(0, hullAt.y - cy);
const gl = at('glass', 'glass');
glass.position.set(0, gl.y - cy);
const shipGlow = new Sprite(dot);
shipGlow.anchor.set(0.5); shipGlow.tint = 0x2ff3ff; shipGlow.alpha = 0.22; shipGlow.blendMode = 'add';
shipGlow.width = shipGlow.height = SHIP.size.hull[1] * 1.6;
shipBody.addChild(shipGlow, ...flames, ...guns, ...wings, ...engines, hull, glass);
shipBody.scale.set(SHIP_H / (SHIP.k * 1201));

// ---------- enemies ----------
const TYPES = {
  drone: { size: 34, speed: 95, hp: 30, wt: 10, color: 0xff2d95 },
  swarmer: { size: 26, speed: 150, hp: 12, wt: 8, color: 0xffe23d },
  dasher: { size: 38, speed: 120, hp: 40, wt: 4, color: 0xff3d9a, dash: true },
  shooter: { size: 40, speed: 70, hp: 50, wt: 3, color: 0xff2d95 },
  tank: { size: 66, speed: 45, hp: 260, wt: 1.5, color: 0xb04dff, spin: 0.6 },
  splitter: { size: 62, speed: 60, hp: 120, wt: 1.5, color: 0x9dff3d, spin: 0.9, split: 'swarmer' },
};
const enemies = [];
let glowOn = true;
function spawn(type, x, y, elite = false) {
  const T = TYPES[type];
  const body = new Sprite(tex[elite ? 'enemy-drone-elite' : `enemy-${type}`]);
  body.anchor.set(0.5);
  const size = elite ? 120 : T.size;
  body.scale.set(size / Math.max(body.texture.width, body.texture.height));
  const glow = new Sprite(tex[`glow-${type}`]);
  glow.anchor.set(0.5);
  glow.scale.set(body.scale.x * 1.0 * (elite ? 1.6 : 1));
  glow.alpha = 0.85; glow.visible = glowOn;
  enemyLayer.addChild(body); glowLayer.addChild(glow);
  const e = { type, T, x, y, vx: 0, vy: 0, hp: T.hp * (elite ? 25 : 1), r: size * 0.42, body, glow, flash: 0, elite, rot: rand(0, TAU), t: rand(0, 3) };
  enemies.push(e);
  return e;
}
function removeEnemy(i) {
  const e = enemies[i];
  e.body.destroy(); e.glow.destroy();
  enemies[i] = enemies[enemies.length - 1]; enemies.pop();
}
function spawnAround(n) {
  const types = Object.keys(TYPES);
  for (let i = 0; i < n; i++) {
    let type = types[0], w = Math.random() * types.reduce((s, t) => s + TYPES[t].wt, 0);
    for (const t of types) { w -= TYPES[t].wt; if (w <= 0) { type = t; break; } }
    const a = rand(0, TAU), d = rand(520, 760);
    const x = clamp(ship.x + Math.cos(a) * d, ARENA.x0, ARENA.x1), y = clamp(ship.y + Math.sin(a) * d, ARENA.y0, ARENA.y1);
    if (type === 'swarmer') for (let j = 0; j < 4; j++) spawn(type, x + rand(-30, 30), y + rand(-30, 30));
    else spawn(type, x, y);
  }
}

// ---------- shots, particles ----------
const shots = [];
const fx = [];
function shoot(x, y, a) {
  const s = new Sprite(dot);
  s.anchor.set(0.5); s.tint = 0x2ff3ff; s.width = 30; s.height = 9; s.rotation = a;
  shotLayer.addChild(s);
  shots.push({ x, y, vx: Math.cos(a) * 820, vy: Math.sin(a) * 820, life: 0.9, s });
}
function spark(x, y, color, n, speed, life, size) {
  for (let i = 0; i < n && fx.length < 900; i++) {
    const s = new Sprite(dot);
    s.anchor.set(0.5); s.tint = color; s.width = s.height = rand(size * 0.5, size);
    fxLayer.addChild(s);
    const a = rand(0, TAU), v = rand(speed * 0.3, speed);
    fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), max: life, s, kind: 'spark' });
  }
}
function ring(x, y, color, max) {
  const g = new Graphics();
  fxLayer.addChild(g);
  fx.push({ x, y, life: 0.35, max: 0.35, s: g, kind: 'ring', color, R: max });
}
const arcs = [];
function arc(points, color) {
  const g = new Graphics();
  g.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) {
    const x0 = points[i - 2], y0 = points[i - 1], x1 = points[i], y1 = points[i + 1];
    for (let s = 1; s <= 4; s++) {
      const t = s / 4, j = s < 4 ? rand(-10, 10) : 0;
      g.lineTo(x0 + (x1 - x0) * t + j, y0 + (y1 - y0) * t + j);
    }
  }
  g.stroke({ width: 3, color, alpha: 0.95 });
  fxLayer.addChild(g);
  arcs.push({ g, life: 0.18 });
}
let kills = 0, shake = 0;
function kill(i) {
  const e = enemies[i];
  kills++;
  spark(e.x, e.y, e.T.color, e.elite ? 40 : 14, e.elite ? 420 : 260, 0.5, e.elite ? 22 : 14);
  spark(e.x, e.y, 0xffffff, 4, 120, 0.25, 26);
  ring(e.x, e.y, e.T.color, e.r * (e.elite ? 5 : 2.6));
  if (e.elite) shake = 12;
  const split = e.T.split;
  const { x, y } = e;
  removeEnemy(i);
  if (split) for (let j = 0; j < 3; j++) { const c = spawn(split, x + rand(-14, 14), y + rand(-14, 14)); const a = rand(0, TAU); c.vx = Math.cos(a) * 240; c.vy = Math.sin(a) * 240; }
}
function hit(e, dmg) {
  e.hp -= dmg;
  e.flash = 0.08;
  if (e.hp <= 0) kill(enemies.indexOf(e));
}
const nearest = (x, y, maxD) => {
  let best = null, bd = maxD * maxD;
  for (const e of enemies) { const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
};

// ---------- input: drag anywhere, or arrow keys / WASD ----------
const input = { x: 0, y: 0, touch: null };
app.canvas.addEventListener('pointerdown', (ev) => { input.touch = { x0: ev.clientX, y0: ev.clientY }; });
window.addEventListener('pointermove', (ev) => {
  if (!input.touch) return;
  const dx = ev.clientX - input.touch.x0, dy = ev.clientY - input.touch.y0, d = Math.hypot(dx, dy);
  const m = Math.min(1, d / 60);
  input.x = d ? (dx / d) * m : 0; input.y = d ? (dy / d) * m : 0;
});
const release = () => { input.touch = null; input.x = input.y = 0; };
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.key));
window.addEventListener('keyup', (e) => keys.delete(e.key));

// ---------- HUD ----------
const hud = document.getElementById('hud');
const fpsEl = document.getElementById('fps');
let target = 60;
document.getElementById('more').onclick = () => { target = Math.min(480, target * 2); spawnAround(Math.round(target / 3)); };
document.getElementById('less').onclick = () => { target = Math.max(30, Math.round(target / 2)); };
document.getElementById('glow').onclick = (ev) => {
  glowOn = !glowOn;
  for (const e of enemies) e.glow.visible = glowOn;
  ev.target.textContent = glowOn ? 'GLOW ON' : 'GLOW OFF';
};
document.getElementById('elite').onclick = () => {
  const a = rand(0, TAU);
  spawn('drone', ship.x + Math.cos(a) * 420, ship.y + Math.sin(a) * 420, true);
};

// ---------- loop ----------
let time = 0, arcT = 0, spawnT = 0, fpsAcc = 0, fpsN = 0, fpsShown = 60;
app.ticker.add((tk) => {
  const dt = Math.min(0.05, tk.deltaMS / 1000);
  time += dt;
  // fps, averaged over half a second
  fpsAcc += tk.deltaMS; fpsN++;
  if (fpsAcc > 500) { fpsShown = Math.round(1000 / (fpsAcc / fpsN)); fpsAcc = fpsN = 0; fpsEl.textContent = `${fpsShown} FPS · ${enemies.length} enemies`; fpsEl.className = fpsShown >= 55 ? 'ok' : fpsShown >= 40 ? 'mid' : 'bad'; }

  // ship movement: accelerate toward the stick, face where it flies, bank in turns
  let ix = input.x, iy = input.y;
  if (keys.has('ArrowLeft') || keys.has('a')) ix = -1;
  if (keys.has('ArrowRight') || keys.has('d')) ix = 1;
  if (keys.has('ArrowUp') || keys.has('w')) iy = -1;
  if (keys.has('ArrowDown') || keys.has('s')) iy = 1;
  const SPEED = 300;
  ship.vx += (ix * SPEED - ship.vx) * Math.min(1, dt * 8);
  ship.vy += (iy * SPEED - ship.vy) * Math.min(1, dt * 8);
  ship.x = clamp(ship.x + ship.vx * dt, ARENA.x0, ARENA.x1);
  ship.y = clamp(ship.y + ship.vy * dt, ARENA.y0, ARENA.y1);
  const moving = Math.hypot(ship.vx, ship.vy);
  let turn = 0;
  if (moving > 30) {
    const want = Math.atan2(ship.vy, ship.vx);
    let d = want - ship.a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    turn = clamp(d * 6, -6, 6) * dt;
    ship.a += turn;
  }
  ship.bank += (clamp(turn / dt / 6, -1, 1) - ship.bank) * Math.min(1, dt * 6);
  shipBody.position.set(ship.x, ship.y);
  shipBody.rotation = ship.a + Math.PI / 2;
  // banking: the wing on the inside of the turn looks shorter
  wings[0].scale.x = 1 - 0.18 * Math.max(0, ship.bank);
  wings[1].scale.x = 1 - 0.18 * Math.max(0, -ship.bank);
  const boost = 0.75 + Math.min(1, moving / SPEED) * 0.45;
  flames.forEach((f, i) => { const fl = boost * (1 + 0.16 * Math.sin(time * 31 + i * 1.7) + 0.08 * Math.sin(time * 53)); f.scale.set(0.9, fl); f.alpha = 0.85 + 0.15 * Math.sin(time * 40 + i); });
  shipGlow.alpha = 0.18 + 0.06 * Math.sin(time * 6);

  // weapons: twin side guns alternate (with recoil), an arc of lightning every 1.2 s
  ship.gunT -= dt;
  const tgt = nearest(ship.x, ship.y, 620);
  if (tgt && ship.gunT <= 0) {
    ship.gunT = 0.14;
    ship.side ^= 1;
    const g = guns[ship.side];
    const gx = ship.x + (g.x * Math.cos(shipBody.rotation) - g.y * Math.sin(shipBody.rotation)) * shipBody.scale.x;
    const gy = ship.y + (g.x * Math.sin(shipBody.rotation) + g.y * Math.cos(shipBody.rotation)) * shipBody.scale.x;
    shoot(gx, gy, Math.atan2(tgt.y - gy, tgt.x - gx) + rand(-0.04, 0.04));
    ship.recoil[ship.side] = 1;
  }
  guns.forEach((g, i) => { ship.recoil[i] = Math.max(0, ship.recoil[i] - dt * 9); g.y = gunY + ship.recoil[i] * 22; });
  arcT -= dt;
  if (arcT <= 0 && tgt) {
    arcT = 1.2;
    let cur = tgt; const pts = [ship.x, ship.y, cur.x, cur.y]; const done = new Set([cur]);
    const hits = [cur];
    for (let c = 0; c < 4; c++) {
      let best = null, bd = 170 * 170;
      for (const e of enemies) { if (done.has(e)) continue; const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if (d < bd) { bd = d; best = e; } }
      if (!best) break;
      done.add(best); hits.push(best); pts.push(best.x, best.y); cur = best;
    }
    arc(pts, 0x9ffcff);
    for (const e of hits) hit(e, 45);
  }

  // shots
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    let gone = s.life <= 0;
    if (!gone) {
      for (const e of enemies) {
        if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 < (e.r + 6) ** 2) { hit(e, 18); spark(s.x, s.y, 0x2ff3ff, 3, 160, 0.18, 10); gone = true; break; }
      }
    }
    if (gone) { s.s.destroy(); shots[i] = shots[shots.length - 1]; shots.pop(); } else s.s.position.set(s.x, s.y);
  }

  // enemies: chase the ship, keep apart, dashers charge
  for (const e of enemies) {
    e.t += dt;
    const dx = ship.x - e.x, dy = ship.y - e.y, d = Math.hypot(dx, dy) || 1;
    let sp = e.T.speed;
    if (e.T.dash) { const ph = e.t % 3; sp = ph > 2.4 ? sp * 3.2 : ph > 2 ? 0 : sp; }
    if (e.type === 'shooter' && d < 260) sp = -sp * 0.5;
    e.vx += ((dx / d) * sp - e.vx) * Math.min(1, dt * 3);
    e.vy += ((dy / d) * sp - e.vy) * Math.min(1, dt * 3);
    e.x = clamp(e.x + e.vx * dt, ARENA.x0 - 60, ARENA.x1 + 60);
    e.y = clamp(e.y + e.vy * dt, ARENA.y0 - 60, ARENA.y1 + 60);
    e.rot = e.T.spin ? e.rot + e.T.spin * dt : Math.atan2(dy, dx) + Math.PI / 2;
    e.body.position.set(e.x, e.y); e.body.rotation = e.rot;
    e.glow.position.set(e.x, e.y); e.glow.rotation = e.rot;
    e.glow.alpha = 0.7 + 0.2 * Math.sin(time * 4 + e.t);
    e.flash = Math.max(0, e.flash - dt);
    e.body.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
  }
  // a cheap push-apart pass so the crowd does not stack into one blob
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    for (let j = i + 1; j < enemies.length && j < i + 24; j++) {
      const b = enemies[j], dx = a.x - b.x, dy = a.y - b.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < rr * rr) { const d = Math.sqrt(d2), p = (rr - d) / 2; a.x += (dx / d) * p; a.y += (dy / d) * p; b.x -= (dx / d) * p; b.y -= (dy / d) * p; }
    }
  }
  // keep the crowd at the chosen size
  spawnT -= dt;
  if (spawnT <= 0 && enemies.length < target) { spawnT = 0.25; spawnAround(Math.min(8, target - enemies.length)); }

  // particles
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.life -= dt;
    if (f.life <= 0) { f.s.destroy(); fx[i] = fx[fx.length - 1]; fx.pop(); continue; }
    const t = 1 - f.life / f.max;
    if (f.kind === 'spark') {
      f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92;
      f.s.position.set(f.x, f.y); f.s.alpha = 1 - t;
    } else {
      f.s.clear().circle(f.x, f.y, f.R * (0.3 + t * 0.7)).stroke({ width: 4 * (1 - t) + 1, color: f.color, alpha: 1 - t });
    }
  }
  for (let i = arcs.length - 1; i >= 0; i--) {
    const a = arcs[i];
    a.life -= dt; a.g.alpha = Math.max(0, a.life / 0.18);
    if (a.life <= 0) { a.g.destroy(); arcs.splice(i, 1); }
  }

  // camera: follow the ship, slightly ahead, with screen shake
  shake = Math.max(0, shake - dt * 30);
  const vw = app.screen.width, vh = app.screen.height;
  const zoom = Math.min(1.15, Math.max(0.75, vw / 430));
  world.scale.set(zoom);
  const camX = clamp(ship.x + ship.vx * 0.25, vw / 2 / zoom, AW - vw / 2 / zoom);
  const camY = clamp(ship.y + ship.vy * 0.25, vh / 2 / zoom, AH - vh / 2 / zoom);
  world.position.set(vw / 2 - camX * zoom + rand(-shake, shake), vh / 2 - camY * zoom + rand(-shake, shake));
  hud.textContent = `${kills} KILLS`;
});

spawnAround(20);
