// Cover of Void Blaster 2.0 (Art Bible, world 3 "Lunar Bridgehead": craters as cover). A few big craters lie in the
// arena; enemy shots break on them, so the ship can shelter in one from turrets and the boss's cannon. The mortars
// (mortar nodes, barrages) lob over them, and enemies walk in. The ship's own shots fly over.
// g.cover: [{ x, y, r, art }], r is the radius that stops shots, art the crater picture (1-3, js/v2/lunar.js draws it).
import { rand, randi } from './util.js';

const WORLD_COVER = { 3: 6 };

export const hasCover = (worldId) => !!WORLD_COVER[worldId];

export function initCover(g) {
  const { w, h } = g.arena, n = WORLD_COVER[g.stage.world.id];
  g.cover = [];
  for (let k = 0; k < 200 && g.cover.length < n; k++) {
    const r = rand(70, 95), x = rand(-w / 2 + r + 110, w / 2 - r - 110), y = rand(-h / 2 + r + 110, h / 2 - r - 110);
    // away from the start (the ship begins in the middle) and apart from each other
    if (Math.hypot(x, y) < r + 220) continue;
    if (g.cover.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + r + 260)) continue;
    g.cover.push({ x, y, r, art: randi(1, 3), rot: rand(0, Math.PI * 2) });
  }
}

// the crater a point is in, if any
export function coverAt(g, x, y, pad = 0) {
  for (const c of g.cover) if ((x - c.x) ** 2 + (y - c.y) ** 2 < (c.r + pad) ** 2) return c;
  return null;
}
