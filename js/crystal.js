// The black crystal of Void Blaster 2.0 (Art Bible, world 4 "Red Conversion": the crystal network grows during the
// sector, dust storms cut visibility). The Collective converts Mars: from a few growth nodes the crystal spreads over
// the ground through the sector, and Spreaders lay fresh crystal where they walk (it fades after a while). The ship is
// slowed on crystal. Every so often a dust storm blows over the arena: the view closes in around the ship and Dust
// Stalkers fade into the dust (js/v2/mars.js draws both).
// g.crystal: { nodes: [{ x, y }], patches: [{ x, y, r, max, grow, until }], ver }, ver changes when patches change
// shape, so the look only redraws its mask then. g.storm: { t, dur } while a storm blows.
import { rand, lerp, clamp } from './util.js';

const WORLD_CRYSTAL = { 4: 4 }; // world -> growth nodes
const NODE_R = [70, 250]; // a node's crystal: radius at the start and at the end of the sector
const LAID_R = 70, LAID_LIFE = 25, MAX_LAID = 50; // crystal laid by a Spreader (or the boss): radius, seconds, how many
const SLOW = 0.6; // the ship's speed on crystal

export const hasCrystal = (worldId) => !!WORLD_CRYSTAL[worldId];

export function initCrystal(g) {
  const { w, h } = g.arena, n = WORLD_CRYSTAL[g.stage.world.id];
  g.crystal = { nodes: [], patches: [], ver: 0 };
  for (let k = 0; k < 200 && g.crystal.nodes.length < n; k++) {
    const x = rand(-w / 2 + 200, w / 2 - 200), y = rand(-h / 2 + 200, h / 2 - 200);
    if (Math.hypot(x, y) < 420) continue; // away from the start (the ship begins in the middle)
    if (g.crystal.nodes.some((o) => Math.hypot(o.x - x, o.y - y) < 600)) continue;
    g.crystal.nodes.push({ x, y });
    g.crystal.patches.push({ x, y, r: NODE_R[0], max: NODE_R[1] * rand(0.85, 1.15), node: true });
  }
}

// fresh crystal at (x, y): it grows in over a second and a half and fades after `life` seconds
export function layCrystal(g, x, y, r = LAID_R, life = LAID_LIFE) {
  const c = g.crystal;
  if (!c) return;
  const laid = c.patches.filter((p) => !p.node);
  if (laid.length >= MAX_LAID) c.patches.splice(c.patches.indexOf(laid[0]), 1);
  c.patches.push({ x, y, r: 0, max: r, grow: r / 1.5, until: g.time + life });
  c.ver++;
}

export function onCrystal(g, x, y) {
  for (const p of g.crystal.patches) if ((x - p.x) ** 2 + (y - p.y) ** 2 < (p.r * 0.85) ** 2) return true;
  return false;
}

export function updateCrystal(g, dt) {
  const c = g.crystal, k = g.progress();
  let changed = false;
  for (let i = c.patches.length - 1; i >= 0; i--) {
    const p = c.patches[i];
    if (p.node) {
      const r = lerp(NODE_R[0], p.max, k);
      if (Math.abs(r - p.r) > 2) { p.r = r; changed = true; }
    } else if (g.time > p.until) {
      // fading out: it shrinks back into the dust
      p.r -= LAID_R * dt;
      changed = true;
      if (p.r <= 0) c.patches.splice(i, 1);
    } else if (p.r < p.max) {
      p.r = Math.min(p.max, p.r + p.grow * dt);
      changed = true;
    }
  }
  if (changed) c.ver++;
  if (g.state === 'play' && onCrystal(g, g.player.x, g.player.y)) g.slowNext = Math.min(g.slowNext ?? 1, SLOW);
  // dust storms: stage field `storms` = [first, every, duration] in seconds
  const st = g.stage;
  if (st.storms && !g.bossDefeated) {
    g.stormAt ??= st.storms[0];
    if (!g.storm && g.time >= g.stormAt) {
      g.storm = { t: 0, dur: st.storms[2] };
      g.stormAt = g.time + st.storms[1] * rand(0.85, 1.15);
      g.ui.banner('DUST STORM', '');
      g.sfx('warn');
    }
  }
  if (g.storm) {
    g.storm.t += dt;
    if (g.storm.t > g.storm.dur) g.storm = null;
  }
}

// how thick the storm is now, 0..1 (it rolls in and out over 2 s)
export function stormLevel(g) {
  const s = g.storm;
  return s ? clamp(Math.min(s.t, s.dur - s.t) / 2, 0, 1) : 0;
}
