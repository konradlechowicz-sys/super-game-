// Void Blaster 2.0 teaser: a 15-second promo built in the game engine (PixiJS) from art/2.0, to show the 2.0 look,
// cut to the music (the shot times are in teaser/timeline.js).
// Five shots, as in the storyboard of the 2.0 concept doc: Earth falls to the Collective, the Striker launches,
// gameplay with a combo, the boss arrives, the title. It runs on a fixed 60 Hz clock with a seeded random, so every
// run is the same: in a browser it plays in real time (tap to replay); with ?record, teaser/record.mjs steps it frame
// by frame and encodes an MP4. Built into one file by teaser/build.mjs.
import { Application, Container, Graphics, Sprite, Texture, Text, Rectangle, TilingSprite } from 'pixi.js';
import ASSETS from './assets.gen.js';
import { renderSoundtrack, wavBase64 } from './audio.js';
import { T } from './timeline.js';

const W = 1080, H = 1920, STEP = 1 / 60, LENGTH = T.end;
const RECORD = new URLSearchParams(location.search).has('record');
const TAU = Math.PI * 2;
let seed = 20261025;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = (a, b) => a + rnd() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeIn = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
const bump = (t, c, w) => clamp(1 - Math.abs(t - c) / w, 0, 1);

if (RECORD) document.documentElement.classList.add('record');
await Promise.all(ASSETS.fonts.map(async ([family, url, weight]) => {
  const f = new FontFace(family, `url(${url})`, { weight });
  await f.load();
  document.fonts.add(f);
}));

const app = new Application();
await app.init({ width: W, height: H, background: 0x05010f, antialias: true, resolution: 1, autoStart: !RECORD, preserveDrawingBuffer: RECORD });
document.getElementById('stage').appendChild(app.canvas);

const tex = {};
await Promise.all(Object.entries(ASSETS.images).map(async ([name, url]) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  tex[name] = Texture.from(img);
}));
const canvasTex = (w, h, draw) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  return Texture.from(c);
};
// soft round dot for shots, sparks, glows and stars
const dot = canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
});
// dark band behind captions
const shade = canvasTex(4, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, 'rgba(5,1,15,0)');
  gr.addColorStop(1, 'rgba(5,1,15,0.92)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
});
const glowDot = (color, size, alpha = 1) => {
  const s = new Sprite(dot);
  s.anchor.set(0.5); s.tint = color; s.width = s.height = size; s.alpha = alpha; s.blendMode = 'add';
  return s;
};
const label = (text, size, color, family = 'Orbitron', weight = '800', glow = color) => {
  const t = new Text({
    text,
    style: {
      fontFamily: family, fontSize: size, fontWeight: weight, fill: color, letterSpacing: Math.round(size * 0.08), align: 'center',
      dropShadow: { color: glow, blur: size * 0.3, distance: 0, alpha: 0.85, angle: 0 },
    },
  });
  t.anchor.set(0.5);
  return t;
};

// ---------- the Striker, built from its parts (same assembly as proto2) ----------
const SHIP = ASSETS.ship;
function makeShip(height) {
  const part = (name) => { const s = new Sprite(tex[`ship-${name}`]); s.anchor.set(0.5); return s; };
  const P = SHIP.pos, Z = SHIP.size, k = SHIP.k;
  const at = (key, name) => ({ x: P[key][0] * k + Z[name][0] / 2, y: P[key][1] * k + Z[name][1] / 2 });
  const hullAt = at('hull', 'hull');
  const cx = hullAt.x, cy = 633 * k;
  const engAt = at('engR', 'engine-right');
  const engDX = engAt.x - cx, engY = engAt.y - 40 * k;
  const flames = [part('flame'), part('flame')];
  const wings = [part('wing-left'), part('wing-right')];
  const engines = [part('engine-left'), part('engine-right')];
  const guns = [part('gun'), part('gun')];
  const glass = part('glass'), hull = part('hull');
  const wl = at('wingL', 'wing-left'), wr = at('wingR', 'wing-right');
  wings[0].position.set(wl.x - cx, wl.y - cy);
  wings[1].position.set(wr.x - cx, wr.y - cy);
  engines.forEach((e, i) => { e.scale.set(1.15); e.position.set((i ? 1 : -1) * engDX, engY - cy); });
  const gunX = 398 * k - cx, gunY = 455 * k - cy + (Z.gun[1] * 0.95) / 2;
  guns.forEach((g, i) => { g.scale.set(0.95); g.position.set((i ? -1 : 1) * gunX, gunY); });
  const flameTop = engY - cy + (Z['engine-right'][1] * 1.15) / 2 - 40 * k;
  flames.forEach((f, i) => { f.anchor.set(0.5, 0); f.position.set((i ? 1 : -1) * engDX, flameTop); f.blendMode = 'add'; });
  hull.position.set(0, hullAt.y - cy);
  const gl = at('glass', 'glass');
  glass.position.set(0, gl.y - cy);
  const glow = glowDot(0x2ff3ff, Z.hull[1] * 1.6, 0.22);
  const body = new Container();
  body.addChild(glow, ...flames, ...guns, ...wings, ...engines, hull, glass);
  body.scale.set(height / (k * 1201));
  const s = { body, flames, wings, guns, glow, gunY, recoil: [0, 0], side: 0, engDX, flameTop };
  // boost: flame length; bank: -1..1, the wing on the inside of the turn looks shorter
  s.animate = (time, boost, bank = 0) => {
    wings[0].scale.x = 1 - 0.18 * Math.max(0, bank);
    wings[1].scale.x = 1 - 0.18 * Math.max(0, -bank);
    flames.forEach((f, i) => {
      f.scale.set(0.9 + 0.1 * Math.min(1, boost), boost * (1 + 0.16 * Math.sin(time * 31 + i * 1.7) + 0.08 * Math.sin(time * 53)));
      f.alpha = 0.85 + 0.15 * Math.sin(time * 40 + i);
    });
    guns.forEach((g, i) => { s.recoil[i] = Math.max(0, s.recoil[i] - STEP * 9); g.y = gunY + s.recoil[i] * 22; });
    glow.alpha = 0.18 + 0.06 * Math.sin(time * 6);
  };
  // a point on the ship (in its own units) in the coordinates of the ship's parent
  s.toParent = (px, py) => {
    const r = body.rotation, k2 = body.scale.x;
    return { x: body.x + (px * Math.cos(r) - py * Math.sin(r)) * k2, y: body.y + (px * Math.sin(r) + py * Math.cos(r)) * k2 };
  };
  return s;
}

// what happened when, for the soundtrack (teaser/audio.js): [time, kind]
const events = [];
let time = 0;
const logEvent = (kind) => events.push([Math.round(time * 1000) / 1000, kind]);

// ---------- particles, rings, lightning (shared by all shots) ----------
const fx = [];
function spark(layer, x, y, color, n, speed, life, size, dir = null, spread = TAU) {
  for (let i = 0; i < n && fx.length < 1400; i++) {
    const s = glowDot(color, rand(size * 0.5, size));
    layer.addChild(s);
    const a = dir === null ? rand(0, TAU) : dir + rand(-spread / 2, spread / 2), v = rand(speed * 0.3, speed);
    const l = rand(life * 0.5, life);
    fx.push({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: l, max: l, s });
  }
}
function ring(layer, x, y, color, R, life = 0.35, width = 4) {
  const g = new Graphics();
  g.blendMode = 'add';
  layer.addChild(g);
  fx.push({ kind: 'ring', x, y, life, max: life, s: g, color, R, width });
}
function arc(layer, points, color, width = 3, life = 0.18) {
  const g = new Graphics();
  g.blendMode = 'add';
  g.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) {
    const x0 = points[i - 2], y0 = points[i - 1], x1 = points[i], y1 = points[i + 1];
    for (let s = 1; s <= 5; s++) {
      const t = s / 5, j = s < 5 ? rand(-12, 12) : 0;
      g.lineTo(x0 + (x1 - x0) * t + j, y0 + (y1 - y0) * t + j);
    }
  }
  g.stroke({ width: width * 3, color, alpha: 0.25 });
  g.stroke({ width, color: 0xffffff, alpha: 0.95 });
  layer.addChild(g);
  fx.push({ kind: 'arc', life, max: life, s: g });
}
function updateFx() {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.life -= STEP;
    if (f.life <= 0) { f.s.destroy(); fx[i] = fx[fx.length - 1]; fx.pop(); continue; }
    const t = 1 - f.life / f.max;
    if (f.kind === 'spark') {
      f.x += f.vx * STEP; f.y += f.vy * STEP; f.vx *= 0.93; f.vy *= 0.93;
      f.s.position.set(f.x, f.y); f.s.alpha = 1 - t;
    } else if (f.kind === 'ring') {
      f.s.clear().circle(f.x, f.y, f.R * (0.25 + easeOut(t) * 0.75)).stroke({ width: f.width * (1 - t) + 1, color: f.color, alpha: 1 - t });
    } else {
      f.s.alpha = 1 - t;
    }
  }
}

// ---------- layers ----------
const scenes = new Container();
const overlay = new Container();
const captions = new Container();
app.stage.addChild(scenes, overlay, captions);
const alarm = new Graphics().rect(0, 0, W, H).fill(0xff1030);
alarm.blendMode = 'add'; alarm.alpha = 0;
const flashWhite = new Graphics().rect(0, 0, W, H).fill(0xffffff);
const flashMagenta = new Graphics().rect(0, 0, W, H).fill(0xff3df0);
flashWhite.alpha = flashMagenta.alpha = 0;
overlay.addChild(alarm, flashMagenta, flashWhite);

// ---------- shot 1: Earth falls to the Collective (0-2 s) ----------
const earthScene = new Container();
earthScene.pivot.set(W / 2, H * 0.45); earthScene.position.set(W / 2, H * 0.45);
earthScene.addChild(new Sprite(tex.earth));
const webBase = new Container(), satLayer = new Container(), webGlow = new Container(), earthFx = new Container();
webGlow.blendMode = 'add';
earthScene.addChild(webBase, satLayer, webGlow, earthFx);
// the web is cut into strips so it can be revealed from the top with a soft, glowing front
const webStrips = [];
for (let y = 0; y < H; y += 24) {
  const t = new Texture({ source: tex.web.source, frame: new Rectangle(0, y, W, Math.min(24, H - y)) });
  const a = new Sprite(t), b = new Sprite(t);
  a.y = b.y = y; a.alpha = b.alpha = 0;
  webBase.addChild(a); webGlow.addChild(b);
  webStrips.push({ y: y + 12, a, b });
}
const SATS = [[205, 430, 0.95, -0.25], [545, 300, 0.8, 0.1], [865, 470, 1.0, 0.22], [430, 650, 0.7, -0.08]].map(([x, y, sc, rot], i) => {
  const c = new Container();
  const n = new Sprite(tex[`sat-${i + 1}`]), r = new Sprite(tex[`sat-${i + 1}-rewritten`]);
  n.anchor.set(0.5); r.anchor.set(0.5); r.alpha = 0;
  c.addChild(n, r); c.scale.set(sc); c.position.set(x, y); c.rotation = rot;
  satLayer.addChild(c);
  return { c, n, r, x, y, rot, at: null, i };
});
const capShade = new Sprite(shade);
capShade.width = W; capShade.height = 560; capShade.y = H - 560;
const cap1 = label('IT DOES NOT CONQUER.', 70, 0xe9e6ff, 'Rajdhani', '700', 0x2ff3ff);
const cap2 = label('IT REWRITES.', 96, 0xff3df0, 'Orbitron', '900');
cap1.position.set(W / 2, H - 330); cap2.position.set(W / 2, H - 210);
captions.addChild(capShade, cap1, cap2);
const webFront = (t) => lerp(-160, 1180, easeInOut(seg(t, 0.1, T.hangar - 0.6)));

function updateEarth(t) {
  earthScene.scale.set(1 + 0.12 * easeOut(seg(t, 0, T.hangar)));
  const front = webFront(t);
  for (const s of webStrips) {
    s.a.alpha = clamp((front - s.y) / 170, 0, 1);
    s.b.alpha = 0.95 * Math.exp(-(((s.y - front) / 80) ** 2)) + 0.18 * s.a.alpha * (0.5 + 0.5 * Math.sin(t * 9 + s.y * 0.013));
  }
  for (const s of SATS) {
    s.c.x = s.x + Math.sin(t * 0.7 + s.i) * 12;
    s.c.rotation = s.rot + t * 0.06 * (s.i % 2 ? 1 : -1);
    if (s.at === null && front > s.y + 40) {
      s.at = t;
      logEvent('sat');
      spark(earthFx, s.c.x, s.c.y, 0xff3df0, 26, 380, 0.6, 26);
      ring(earthFx, s.c.x, s.c.y, 0xff3df0, 190, 0.5, 6);
    }
    const k = s.at === null ? 0 : seg(t, s.at, s.at + 0.3);
    s.n.alpha = 1 - k;
    s.r.alpha = k < 1 ? k * (0.55 + 0.45 * Math.sin(t * 70)) : 1;
  }
  const fade = 1 - seg(t, T.hangar - 0.28, T.hangar - 0.08);
  capShade.alpha = seg(t, 0.3, 0.6) * fade;
  cap1.alpha = seg(t, 0.45, 0.75) * fade;
  cap2.alpha = seg(t, 1.55, 1.75) * fade;
  cap2.scale.set(1 + 0.25 * (1 - easeOut(seg(t, 1.55, 1.8))));
}

// ---------- shot 2: the Striker launches ----------
const hangarScene = new Container();
hangarScene.pivot.set(W / 2, H / 2); hangarScene.position.set(W / 2, H / 2);
hangarScene.addChild(new Sprite(tex.hangar));
const railLights = new Container(), hangarFx = new Container();
railLights.blendMode = 'add';
const lights = [];
for (const x of [459, 621]) for (let i = 0; i < 12; i++) { const d = glowDot(0x2ff3ff, 46); railLights.addChild(d); lights.push({ d, x, i }); }
const ship1 = makeShip(330);
ship1.body.position.set(W / 2, 1480);
hangarScene.addChild(railLights, hangarFx, ship1.body);

function updateHangar(t) {
  const ignite = seg(t, T.hangar + 0.05, T.hangar + 0.5), go = seg(t, T.game - 0.85, T.game - 0.12);
  const y = 1480 - easeIn(go) * 2200;
  ship1.body.y = y;
  ship1.animate(t, 0.15 + 1.1 * ignite + 1.8 * go);
  if (ignite > 0) {
    for (const side of [-1, 1]) {
      const p = ship1.toParent(side * ship1.engDX, ship1.flameTop + 120);
      spark(hangarFx, p.x, p.y, 0x2ff3ff, go > 0 ? 3 : 1, 380 + 600 * go, 0.4, 30, Math.PI / 2, 0.6);
    }
  }
  const on = seg(t, T.hangar + 0.15, T.hangar + 0.35);
  for (const l of lights) {
    l.d.position.set(l.x, H + 80 - (((t - T.hangar - 0.15) * 2600 + l.i * 175) % 2200));
    l.d.alpha = on * 0.9;
  }
  const shake = 3 * ignite + 9 * go;
  hangarScene.scale.set(1.06 - 0.06 * seg(t, T.hangar, T.game));
  hangarScene.position.set(W / 2 + rand(-shake, shake), H / 2 + easeIn(go) * 260 + rand(-shake, shake));
  alarm.alpha = 0.09 + 0.07 * Math.sin(t * 16);
}

// ---------- shots 3-4: gameplay with a combo, then the boss ----------
const gameScene = new Container();
const world = new Container();
gameScene.addChild(world);
const AW = 1800, AH = 3000;
const floor = new TilingSprite({ texture: tex.floor, width: AW, height: AH });
floor.tileScale.set(0.6);
world.addChild(floor);
const glowLayer = new Container(); glowLayer.blendMode = 'add';
const enemyLayer = new Container(), bossLayer = new Container(), shipLayer = new Container();
const shotLayer = new Container(); shotLayer.blendMode = 'add';
const gameFx = new Container();
world.addChild(glowLayer, enemyLayer, shotLayer, shipLayer, bossLayer, gameFx);
const ship2 = makeShip(86);
shipLayer.addChild(ship2.body);

const TYPES = {
  drone: { size: 34, speed: 95, hp: 30, wt: 10, color: 0xff2d95 },
  swarmer: { size: 30, speed: 150, hp: 12, wt: 8, color: 0xffe23d },
  dasher: { size: 38, speed: 120, hp: 40, wt: 4, color: 0xff3d9a, dash: true },
  shooter: { size: 44, speed: 70, hp: 50, wt: 3, color: 0xff2d95 },
  tank: { size: 66, speed: 45, hp: 200, wt: 1.5, color: 0xb04dff, spin: 0.6 },
  splitter: { size: 62, speed: 60, hp: 110, wt: 1.5, color: 0x9dff3d, spin: 0.9, split: 'swarmer' },
};
const enemies = [];
const shots = [];
function spawn(type, x, y) {
  const T = TYPES[type];
  const body = new Sprite(tex[`enemy-${type}`]);
  body.anchor.set(0.5);
  body.scale.set(T.size / Math.max(body.texture.width, body.texture.height));
  const glow = new Sprite(tex[`glow-${type}`]);
  glow.anchor.set(0.5); glow.scale.set(body.scale.x);
  enemyLayer.addChild(body); glowLayer.addChild(glow);
  const e = { type, T, x, y, vx: 0, vy: 0, hp: T.hp, r: T.size * 0.42, body, glow, flash: 0, rot: rand(0, TAU), t: rand(0, 3) };
  enemies.push(e);
  return e;
}
const g = { x: AW / 2, y: AH * 0.74, vx: 0, vy: -70, a: -Math.PI / 2, bank: 0, gunT: 0, arcT: 0.3, spawnT: 0, kills: 0, shake: 0, ion: false, combo: false };
function spawnAround(n, d0, d1) {
  const types = Object.keys(TYPES), total = types.reduce((s, k) => s + TYPES[k].wt, 0);
  for (let i = 0; i < n; i++) {
    let type = types[0], w = rnd() * total;
    for (const k of types) { w -= TYPES[k].wt; if (w <= 0) { type = k; break; } }
    const a = rand(0, TAU), d = rand(d0, d1);
    const x = clamp(g.x + Math.cos(a) * d, 120, AW - 120), y = clamp(g.y + Math.sin(a) * d, 120, AH - 120);
    if (type === 'swarmer') for (let j = 0; j < 4; j++) spawn(type, x + rand(-30, 30), y + rand(-30, 30));
    else spawn(type, x, y);
  }
}
function removeEnemy(e) {
  const i = enemies.indexOf(e);
  if (i < 0) return;
  e.body.destroy(); e.glow.destroy();
  enemies[i] = enemies[enemies.length - 1]; enemies.pop();
}
function kill(e) {
  g.kills++;
  logEvent(e.T.size >= 60 ? 'killbig' : 'kill');
  spark(gameFx, e.x, e.y, e.T.color, 14, 260, 0.5, 14);
  spark(gameFx, e.x, e.y, 0xffffff, 4, 120, 0.25, 26);
  ring(gameFx, e.x, e.y, e.T.color, e.r * 2.6);
  const { x, y } = e;
  removeEnemy(e);
  if (e.T.split) for (let j = 0; j < 3; j++) { const c = spawn(e.T.split, x + rand(-14, 14), y + rand(-14, 14)); const a = rand(0, TAU); c.vx = Math.cos(a) * 240; c.vy = Math.sin(a) * 240; }
}
function hit(e, dmg) {
  if (!enemies.includes(e)) return;
  e.hp -= dmg; e.flash = 0.08;
  if (e.hp <= 0) kill(e);
}
const nearest = (x, y, maxD, skip) => {
  let best = null, bd = maxD * maxD;
  for (const e of enemies) { if (skip && skip.has(e)) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
};
function chain(x, y, from, n, reach, dmg, color, width) {
  const pts = [x, y, from.x, from.y], done = new Set([from]);
  let cur = from;
  for (let c = 0; c < n; c++) {
    const nx = nearest(cur.x, cur.y, reach, done);
    if (!nx) break;
    done.add(nx); pts.push(nx.x, nx.y); cur = nx;
  }
  arc(gameFx, pts, color, width);
  logEvent('arc');
  for (const e of done) hit(e, dmg);
}
function shoot(x, y, a) {
  const s = new Sprite(dot);
  s.anchor.set(0.5); s.tint = g.ion ? 0xc8ffff : 0x2ff3ff; s.width = g.ion ? 46 : 32; s.height = g.ion ? 14 : 9; s.rotation = a;
  shotLayer.addChild(s);
  logEvent(g.ion ? 'ionshot' : 'shot');
  shots.push({ x, y, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 0.8, s });
}

// the world-1 boss, the Harvester (brief task A6): the drawing, with pulsing light on its core and launch bays and
// engine flames; points on it are given in the pixels of its 1254 px sheet
const HK = 640 / 1254, BOSS_SCALE = 0.9;
const at = (x, y) => [(x - 627) * HK, (y - 627) * HK];
const bossC = new Container();
const hBody = new Sprite(tex.harvester);
hBody.anchor.set(0.5);
const hFlames = [455, 790].map((x) => { const f = new Sprite(tex['h-flame']); f.anchor.set(0.5, 0.15); f.position.set(...at(x, 1045)); f.blendMode = 'add'; return f; });
const hHalo = glowDot(0xff2dd0, 900, 0.08);
const hCore = glowDot(0xff3df0, 220);
hCore.position.set(...at(627, 612));
const hPods = [290, 965].map((x) => { const p = glowDot(0xff3df0, 120); p.height = 380; p.position.set(...at(x, 640)); return p; });
bossC.addChild(hHalo, ...hFlames, hBody, hCore, ...hPods);
bossC.scale.set(BOSS_SCALE);
bossLayer.addChild(bossC);
bossLayer.visible = false;
const boss = { x: 0, y: 0, podT: 0, side: 0 };
const hudKills = label('0 KILLS', 54, 0xe9e6ff, 'Rajdhani', '700', 0x2ff3ff);
hudKills.anchor.set(0, 0.5); hudKills.position.set(48, 110);
const comboCard = new Container();
const comboBack = new Graphics().roundRect(-330, -150, 660, 300, 34).fill({ color: 0x05010f, alpha: 0.72 }).stroke({ width: 5, color: 0x3dffc8 });
const comboTitle = label('COMBO!', 128, 0x3dffc8, 'Orbitron', '900');
const comboName = label('ION BOLTS', 66, 0xc8ffff, 'Rajdhani', '700');
comboTitle.y = -40; comboName.y = 78;
comboCard.addChild(comboBack, comboTitle, comboName);
comboCard.position.set(W / 2, 560);
const warning = label('WARNING', 132, 0xff3d6e, 'Orbitron', '900');
warning.position.set(W / 2, 1020);
const warnSub = label('BOSS INBOUND', 60, 0xffb0c0, 'Rajdhani', '700', 0xff3d6e);
warnSub.position.set(W / 2, 1125);
captions.addChild(hudKills, comboCard, warning, warnSub);
let started = false;

function updateGame(t) {
  const k = t - T.game, fight = T.boss - T.game;
  if (!started) { started = true; spawnAround(46, 130, 480); spawnAround(16, 520, 720); }
  const bossK = seg(t, T.boss, T.boss + 1.4);
  // the ship weaves up the arena, then slows to face the boss
  const px = AW / 2 + 150 * Math.sin(k * 1.35);
  const py = AH * 0.74 - Math.min(k, fight) * 75 - Math.max(0, k - fight) * 25;
  g.vx = (px - g.x) / STEP; g.vy = (py - g.y) / STEP;
  g.x = px; g.y = py;
  if (k > 0) {
    let want = Math.atan2(g.vy, g.vx);
    if (bossK > 0) want = lerp(want, -Math.PI / 2, seg(t, T.boss, T.boss + 0.4));
    let d = want - g.a;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    const turn = clamp(d * 8, -7, 7) * STEP;
    g.a += turn;
    g.bank += (clamp(turn / STEP / 5, -1, 1) - g.bank) * 0.12;
  }
  ship2.body.position.set(g.x, g.y);
  ship2.body.rotation = g.a + Math.PI / 2;
  ship2.animate(t, 1.05, g.bank);

  // boss
  bossLayer.visible = bossK > 0;
  if (bossK > 0) {
    boss.x = g.x;
    boss.y = g.y - 480 + (1 - easeOut(bossK)) * -500;
    bossC.position.set(boss.x, boss.y + Math.sin(t * 2.2) * 6);
    const pulse = 0.5 + 0.5 * Math.sin(t * 12), charge = seg(t, T.title - 0.4, T.title - 0.05);
    hCore.width = hCore.height = 200 + 70 * pulse + 900 * charge;
    hCore.alpha = 0.55 + 0.35 * pulse;
    hPods.forEach((p, i) => { p.alpha = 0.3 + 0.3 * Math.sin(t * 9 + i * 2); });
    hHalo.alpha = 0.05 + 0.04 * pulse + 0.4 * charge;
    hFlames.forEach((f, i) => { f.scale.set(1.15, 1.15 * (1 + 0.15 * Math.sin(t * 31 + i * 1.7))); });
    // the launch bays drop drones
    boss.podT -= STEP;
    if (t > T.boss + 0.45 && t < T.title - 0.4 && boss.podT <= 0) {
      boss.podT = 0.12; boss.side ^= 1;
      const [px2, py2] = at(boss.side ? 965 : 290, 760);
      const x = bossC.x + px2 * BOSS_SCALE, y = bossC.y + py2 * BOSS_SCALE;
      const e = spawn('drone', x, y);
      e.vx = rand(-80, 80); e.vy = 340;
      ring(gameFx, x, y, 0xff3df0, 60, 0.3, 4);
      logEvent('pod');
    }
    g.shake = Math.max(g.shake, 2 + 7 * bossK);
  }

  // weapons: twin guns alternate, chain lightning every 0.6 s; after the combo, ion bolts chain on hit
  const target = bossK > 0.35 ? { x: boss.x + rand(-60, 60), y: boss.y + rand(-30, 40), boss: true } : nearest(g.x, g.y, 560);
  g.gunT -= STEP;
  if (target && g.gunT <= 0) {
    g.gunT = g.ion ? 0.07 : 0.1;
    ship2.side ^= 1;
    const gun = ship2.guns[ship2.side];
    const p = ship2.toParent(gun.x, gun.y - 30);
    shoot(p.x, p.y, Math.atan2(target.y - p.y, target.x - p.x) + rand(-0.05, 0.05));
    ship2.recoil[ship2.side] = 1;
  }
  g.arcT -= STEP;
  if (g.arcT <= 0 && !target?.boss) {
    const first = nearest(g.x, g.y, 420);
    if (first) { g.arcT = 0.6; chain(g.x, g.y, first, 4, 190, 45, 0x7df9ff, 3); }
  }
  // the combo moment: a storm of lightning and a shockwave
  if (!g.combo && t >= T.combo) {
    g.combo = true; g.ion = true; g.shake = 16;
    ring(gameFx, g.x, g.y, 0x3dffc8, 330, 0.6, 10);
    ring(gameFx, g.x, g.y, 0xc8ffff, 220, 0.45, 6);
    for (let c = 0; c < 4; c++) { const first = nearest(g.x, g.y, 520); if (first) chain(g.x, g.y, first, 6, 220, 999, 0xc8ffff, 5); }
    for (const e of [...enemies]) if ((e.x - g.x) ** 2 + (e.y - g.y) ** 2 < 230 ** 2) hit(e, 999);
  }

  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * STEP; s.y += s.vy * STEP; s.life -= STEP;
    let gone = s.life <= 0;
    if (!gone && bossK > 0.35 && (s.x - boss.x) ** 2 + (s.y - boss.y) ** 2 < 190 ** 2) {
      spark(gameFx, s.x, s.y, 0xff3df0, 5, 220, 0.25, 16);
      logEvent('bosshit');
      gone = true;
    }
    if (!gone) {
      for (const e of enemies) {
        if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 < (e.r + 7) ** 2) {
          spark(gameFx, s.x, s.y, s.s.tint, 3, 160, 0.18, 10);
          if (g.ion && rnd() < 0.35) chain(s.x, s.y, e, 2, 160, 30, 0xc8ffff, 2);
          hit(e, 18);
          gone = true; break;
        }
      }
    }
    if (gone) { s.s.destroy(); shots[i] = shots[shots.length - 1]; shots.pop(); } else s.s.position.set(s.x, s.y);
  }

  for (const e of enemies) {
    e.t += STEP;
    const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy) || 1;
    let sp = e.T.speed;
    if (e.T.dash) { const ph = e.t % 3; sp = ph > 2.4 ? sp * 3.2 : ph > 2 ? 0 : sp; }
    if (e.type === 'shooter' && d < 240) sp = -sp * 0.5;
    if (d < 70) sp = -60; // the teaser's ship never gets hit: the swarm stops just short of it
    e.vx += ((dx / d) * sp - e.vx) * 0.05;
    e.vy += ((dy / d) * sp - e.vy) * 0.05;
    e.x += e.vx * STEP; e.y += e.vy * STEP;
    e.rot = e.T.spin ? e.rot + e.T.spin * STEP : Math.atan2(dy, dx) + Math.PI / 2;
    e.body.position.set(e.x, e.y); e.body.rotation = e.rot;
    e.glow.position.set(e.x, e.y); e.glow.rotation = e.rot;
    e.glow.alpha = 0.7 + 0.2 * Math.sin(t * 4 + e.t);
    e.flash = Math.max(0, e.flash - STEP);
    e.body.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
  }
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    for (let j = i + 1; j < enemies.length && j < i + 24; j++) {
      const b = enemies[j], dx = a.x - b.x, dy = a.y - b.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < rr * rr) { const d = Math.sqrt(d2), p = (rr - d) / 2; a.x += (dx / d) * p; a.y += (dy / d) * p; b.x -= (dx / d) * p; b.y -= (dy / d) * p; }
    }
  }
  g.spawnT -= STEP;
  if (g.spawnT <= 0 && enemies.length < 75 && bossK === 0) { g.spawnT = 0.2; spawnAround(6, 470, 640); }

  // camera: follows the ship slightly ahead; pulls back for the boss
  g.shake = Math.max(0, g.shake - STEP * 30);
  const zoom = lerp(2.0, 1.55, easeInOut(bossK));
  world.scale.set(zoom);
  const camX = clamp(g.x, W / 2 / zoom, AW - W / 2 / zoom);
  const camY = clamp(lerp(g.y - 90, g.y - 260, easeInOut(bossK)), H / 2 / zoom, AH - H / 2 / zoom);
  world.position.set(W / 2 - camX * zoom + rand(-g.shake, g.shake), H / 2 - camY * zoom + rand(-g.shake, g.shake));

  hudKills.text = `${g.kills} KILLS`;
  hudKills.alpha = 1;
  const ck = seg(t, T.combo, T.combo + 0.25), cOut = 1 - seg(t, T.combo + 1.1, T.combo + 1.35);
  comboCard.alpha = ck * cOut;
  comboCard.scale.set(lerp(0.4, 1, backOut(ck)));
  const blink = Math.sin(t * 18) > -0.3 ? 1 : 0.35;
  const warnOut = 1 - seg(t, T.boss + 0.9, T.boss + 1.05);
  warning.alpha = seg(t, T.boss, T.boss + 0.1) * warnOut * blink;
  warnSub.alpha = seg(t, T.boss + 0.1, T.boss + 0.25) * warnOut;
  alarm.alpha = bossK > 0 ? 0.06 + 0.06 * Math.sin(t * 18) : 0;
}

// ---------- shot 5: the title ----------
const titleScene = new Container();
titleScene.addChild(new Graphics().rect(0, 0, W, H).fill(0x05010f));
const titleWeb = new Sprite(tex.web);
titleWeb.alpha = 0.22;
const stars = new Container();
const starList = [];
for (let i = 0; i < 140; i++) { const s = glowDot(0xffffff, rand(4, 11), rand(0.3, 0.9)); s.position.set(rand(0, W), rand(0, H)); stars.addChild(s); starList.push({ s, v: rand(20, 90) }); }
// the logo emblem (brief task E3), with its engine glows pulsing; points on it in the pixels of its 1254 px sheet
const EK = 760 / 1254, EY = 720;
const emblemGlow = glowDot(0x2ff3ff, 1000, 0);
const emblem = new Sprite(tex.emblem);
emblem.anchor.set(0.5); emblem.position.set(W / 2, EY);
const emblemFlames = [480, 772].map(() => glowDot(0x2ff3ff, 110, 0));
const title = label('VOID BLASTER', 92, 0xffffff, 'Orbitron', '900', 0x2ff3ff);
const version = label('2.0', 170, 0xff3df0, 'Orbitron', '900');
const tagline = label('THE COLLECTIVE IS COMING', 54, 0xe9e6ff, 'Rajdhani', '700', 0xff3df0);
title.position.set(W / 2, 1180); version.position.set(W / 2, 1345); tagline.position.set(W / 2, 1510);
titleScene.addChild(stars, titleWeb, emblemGlow, emblem, ...emblemFlames, title, version, tagline);

function updateTitle(t) {
  for (const s of starList) { s.s.y += s.v * STEP; if (s.s.y > H + 10) s.s.y = -10; }
  const p = easeOut(seg(t, T.title, T.title + 0.45)), sc = lerp(0.6, 1, p);
  emblem.alpha = seg(t, T.title, T.title + 0.12);
  emblem.scale.set(sc);
  emblemGlow.alpha = 0.22 * p + 0.06 * Math.sin(t * 6);
  emblemFlames.forEach((f, i) => {
    f.position.set(W / 2 + ([480, 772][i] - 627) * EK * sc, EY + (1050 - 627) * EK * sc);
    f.alpha = emblem.alpha * (0.6 + 0.3 * Math.sin(t * 31 + i * 1.7));
  });
  const tk = easeOut(seg(t, T.title + 0.25, T.title + 0.6));
  title.alpha = tk; title.scale.set(lerp(1.25, 1, tk));
  const vk = seg(t, T.title + 0.45, T.title + 0.7);
  version.alpha = vk; version.scale.set(lerp(1.6, 1, backOut(vk)));
  tagline.alpha = seg(t, T.title + 0.7, T.title + 1.0);
}

scenes.addChild(earthScene, hangarScene, gameScene, titleScene);

// ---------- the clock ----------
function step() {
  time += STEP;
  const t = time;
  earthScene.visible = t < T.hangar;
  hangarScene.visible = t >= T.hangar && t < T.game;
  gameScene.visible = t >= T.game && t < T.title;
  titleScene.visible = t >= T.title;
  for (const c of [cap1, cap2, capShade]) c.visible = earthScene.visible;
  for (const c of [hudKills, comboCard, warning, warnSub]) c.visible = gameScene.visible;
  if (earthScene.visible) updateEarth(t);
  if (hangarScene.visible) updateHangar(t);
  if (gameScene.visible) updateGame(t);
  if (titleScene.visible) updateTitle(t);
  if (!hangarScene.visible && !gameScene.visible) alarm.alpha = 0;
  updateFx();
  flashMagenta.alpha = 0.85 * bump(t, T.hangar - 0.02, 0.14);
  flashWhite.alpha = Math.max(bump(t, T.game - 0.03, 0.12), bump(t, T.title - 0.03, 0.18));
}

// the music, cut to the teaser by teaser/build.mjs (MP3 inside the page)
const musicBytes = async () => (ASSETS.music ? (await fetch(ASSETS.music)).arrayBuffer() : null);

if (RECORD) {
  // teaser/record.mjs: advance(n) moves the clock n steps of 1/60 s and draws one frame; at the end, soundtrack()
  // renders the music and effects for the events of this run: the mix and each stem as a WAV (base64)
  window.teaser = {
    length: LENGTH,
    advance(n) { for (let i = 0; i < n; i++) step(); app.render(); return time; },
    events: () => events,
    soundtrack: async () => { const s = await renderSoundtrack(events, LENGTH, await musicBytes()); return { mix: wavBase64(s.mix), music: wavBase64(s.music), sfx: wavBase64(s.sfx) }; },
  };
} else {
  // the soundtrack is rendered from the events of the recorded run (teaser/events.json), so it matches this run
  const hint = document.getElementById('replay');
  hint.textContent = 'TAP TO PLAY WITH SOUND';
  hint.classList.add('on');
  step();
  const buffer = ASSETS.events ? (await renderSoundtrack(ASSETS.events, LENGTH, await musicBytes(), { rate: 44100 })).mix : null;
  let audio = null, start = 0, playing = false;
  window.addEventListener('pointerdown', () => {
    if (playing && time < LENGTH) return;
    if (time >= LENGTH) { location.reload(); return; }
    playing = true;
    hint.classList.remove('on');
    if (buffer) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const src = audio.createBufferSource();
      src.buffer = buffer;
      src.connect(audio.destination);
      start = audio.currentTime + 0.05;
      src.start(start);
    }
  });
  let clock = 0;
  app.ticker.add((tk) => {
    if (!playing) return;
    if (time >= LENGTH) { hint.textContent = 'TAP TO REPLAY'; hint.classList.add('on'); return; }
    // follow the audio clock when there is sound, so picture and sound stay together
    clock = audio ? Math.max(0, audio.currentTime - start) : clock + Math.min(0.1, tk.deltaMS / 1000);
    while (time + STEP <= clock && time < LENGTH) step();
  });
}
