// The mechanics of the 2.0 worlds 6-10 (Art Bible, the world cards; art/2.0/CHATGPT-BRIEF.md):
// - world 6 "Storm Relay": gusts of wind push the ship and the enemy shots;
// - world 7 "Abyss of Europa": slippery ice, the ship keeps sliding (Game.updatePlayer reads g.ice); enemies come up
//   from under the ice (the eel's 'blink');
// - world 8 "The Rift Gate": pairs of rifts teleport the ship and the shots that fly into them;
// - world 9 "Brood World": acid pools burn the ship (and nests breed enemies: the nest enemy, the nest-heart prop);
// - world 10 "The Nexus": everything at once (wind, rifts, acid; gravity wells and shelling are sector events).
// js/v2/journey.js draws them from g.wind, g.rifts and g.acid.
import { TAU, rand, clamp } from './util.js';

const FX = {
  6: { wind: 95 },
  7: { ice: true },
  8: { rifts: 2 },
  9: { acid: 5 },
  10: { wind: 60, rifts: 2, acid: 2 },
};
const GUST = [12, 7]; // seconds between gusts, how long a gust blows
const RIFT_R = 42, RIFT_CD = 1.2;
const ACID_TICK = 0.5, ACID_DMG = 6;

export const hasWorldFx = (worldId) => !!FX[worldId];

export function initWorldFx(g) {
  const fx = FX[g.stage.world.id], { w, h } = g.arena;
  g.ice = !!fx.ice;
  g.wind = fx.wind ? { x: 0, y: 0, k: 0, a: rand(0, TAU), max: fx.wind, t: -GUST[0] * 0.6 } : null;
  // places away from the start (the ship begins in the middle) and from each other
  const spots = [];
  const spot = (m, gap) => {
    for (let k = 0; k < 100; k++) {
      const x = rand(-w / 2 + m, w / 2 - m), y = rand(-h / 2 + m, h / 2 - m);
      if (Math.hypot(x, y) < 260 || spots.some((s) => Math.hypot(s[0] - x, s[1] - y) < gap)) continue;
      spots.push([x, y]);
      return [x, y];
    }
    return [rand(-w / 3, w / 3), rand(-h / 3, h / 3)];
  };
  g.rifts = [];
  for (let i = 0; i < (fx.rifts || 0); i++) {
    const a = spot(160, 380), b = spot(160, 380);
    const ra = { x: a[0], y: a[1], r: RIFT_R, cd: 0 }, rb = { x: b[0], y: b[1], r: RIFT_R, cd: 0 };
    ra.pair = rb; rb.pair = ra;
    g.rifts.push(ra, rb);
  }
  g.acid = [];
  for (let i = 0; i < (fx.acid || 0); i++) { const [x, y] = spot(160, 260); g.acid.push({ x, y, r: rand(62, 88), art: (i % 2) + 1, rot: rand(0, TAU) }); }
  g.acidT = 0;
}

export function updateWorldFx(g, dt) {
  const p = g.player, live = g.state === 'play';
  // wind: a gust builds up for 1.5 s, blows, dies down; the ship and the enemy shots drift with it
  const wd = g.wind;
  if (wd) {
    wd.t += dt;
    if (wd.t >= GUST[0]) {
      wd.t = 0; wd.a = rand(0, TAU);
      g.ui.banner('WIND SHEAR', '');
      g.sfx('warn');
    }
    const k = wd.t < GUST[1] ? clamp(Math.min(wd.t, GUST[1] - wd.t) / 1.5, 0, 1) : 0;
    wd.k = k;
    wd.x = Math.cos(wd.a) * wd.max * k; wd.y = Math.sin(wd.a) * wd.max * k;
    if (k > 0 && live) {
      const hw = g.arena.w / 2 - p.r, hh = g.arena.h / 2 - p.r;
      p.x = clamp(p.x + wd.x * dt, -hw, hw); p.y = clamp(p.y + wd.y * dt, -hh, hh);
      p.tx = clamp(p.tx + wd.x * dt, -hw, hw); p.ty = clamp(p.ty + wd.y * dt, -hh, hh);
      for (const b of g.ebullets) { b.x += wd.x * 0.8 * dt; b.y += wd.y * 0.8 * dt; }
    }
  }
  // rifts: the ship and enemy shots that fly into one come out of its pair
  for (const r of g.rifts) {
    r.cd = Math.max(0, r.cd - dt);
    if (live && !r.cd && (p.x - r.x) ** 2 + (p.y - r.y) ** 2 < r.r * r.r) {
      const o = r.pair, dx = p.x - r.x, dy = p.y - r.y;
      p.x = o.x + dx; p.y = o.y + dy; p.tx = p.x + (p.tx - r.x - dx); p.ty = p.y + (p.ty - r.y - dy);
      r.cd = o.cd = RIFT_CD;
      g.addFx(r.x, r.y, 60, '#b9a8ff', 0.35, 3); g.addFx(o.x, o.y, 60, '#b9a8ff', 0.35, 3);
      g.sfx('pulse');
    }
    for (const b of g.ebullets) {
      if (b.rift === r || (b.x - r.x) ** 2 + (b.y - r.y) ** 2 > r.r * r.r) continue;
      b.x = r.pair.x + (b.x - r.x); b.y = r.pair.y + (b.y - r.y);
      b.rift = r.pair; // do not bounce straight back
    }
  }
  // acid pools burn the ship while it is in one
  if (g.acid.length && live && (g.acidT -= dt) <= 0) {
    if (g.acid.some((a) => (p.x - a.x) ** 2 + (p.y - a.y) ** 2 < (a.r * 0.8) ** 2)) {
      g.acidT = ACID_TICK;
      g.hurtPlayer(ACID_DMG, 'acid', 0.2);
    }
  }
}
