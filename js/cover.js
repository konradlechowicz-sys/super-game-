// Cover of Void Blaster 2.0 (Art Bible, world 3 "Lunar Bridgehead": craters as cover). A few big craters lie in the
// arena; enemy shots break on them, so the ship can shelter in one from turrets and the boss's cannon. The mortars
// (mortar nodes, barrages) lob over them, and enemies walk in. The ship's own shots fly over.
// World 5 "Foundry Belt": drifting asteroids are moving cover. They float slowly across the arena, bounce off its edge
// and turn; the ship has to keep moving with them.
// g.cover: [{ x, y, r, art, rot }] (+ vx, vy, spin when it drifts), r is the radius that stops shots, art the picture
// (1-3: js/v2/lunar.js's craters, js/v2/foundry.js's asteroids).
import { rand, randi } from './util.js';

// world -> how many, their radius, whether they drift
const WORLD_COVER = { 3: { n: 6, r: [70, 95] }, 5: { n: 6, r: [55, 72], drift: true } };

export const hasCover = (worldId) => !!WORLD_COVER[worldId];

export function initCover(g) {
  const { w, h } = g.arena, def = WORLD_COVER[g.stage.world.id], n = def.n;
  g.cover = [];
  for (let k = 0; k < 200 && g.cover.length < n; k++) {
    const r = rand(def.r[0], def.r[1]), x = rand(-w / 2 + r + 110, w / 2 - r - 110), y = rand(-h / 2 + r + 110, h / 2 - r - 110);
    // away from the start (the ship begins in the middle) and apart from each other
    if (Math.hypot(x, y) < r + 220) continue;
    if (g.cover.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + r + 260)) continue;
    const c = { x, y, r, art: randi(1, 3), rot: rand(0, Math.PI * 2) };
    if (def.drift) { const a = rand(0, Math.PI * 2), v = rand(14, 30); Object.assign(c, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, spin: rand(-0.25, 0.25) }); }
    g.cover.push(c);
  }
}

// drifting cover moves on, bouncing off the arena's edge
export function updateCover(g, dt) {
  const hw = g.arena.w / 2, hh = g.arena.h / 2;
  for (const c of g.cover) {
    if (!c.vx && !c.vy) continue;
    c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.spin * dt;
    if (Math.abs(c.x) > hw - c.r - 60) { c.x = Math.sign(c.x) * (hw - c.r - 60); c.vx = -c.vx; }
    if (Math.abs(c.y) > hh - c.r - 60) { c.y = Math.sign(c.y) * (hh - c.r - 60); c.vy = -c.vy; }
  }
}

// the crater a point is in, if any
export function coverAt(g, x, y, pad = 0) {
  for (const c of g.cover) if ((x - c.x) ** 2 + (y - c.y) ** 2 < (c.r + pad) ** 2) return c;
  return null;
}
