// The 2.0 arsenal's mechanics (PLAN-2.0-ARSENAL.md), shared by the new weapons (js/weapons.js) and perks:
// - crits (Targeting Matrix): a hit has the ship's crit chance to deal double damage;
// - burning (Flamethrower, Thermal Core): a burning enemy takes damage over time for a few seconds;
// - burning ground (Inferno): patches of fire that burn whatever stands in them;
// - black holes (Singularity Cannon): a slow dark orb that stops and pulls enemies in, hurting them;
// - beams (Railgun): an instant line through every enemy on it, drawn for a moment;
// - the ship's Phase Shield: blocks one hit, then recharges.
// The game keeps the lists (g.holes, g.fires, g.beams) and calls updateArsenal every frame.
import { TAU, rand } from './util.js';

const BURN_TICK = 0.25; // seconds between burn damage ticks

// Sets an enemy on fire: `dps` damage per second for `dur` seconds (the stronger fire wins, the longer one lasts).
export function ignite(e, dps, dur = 3) {
  if (e.dead || e.prop) return;
  e.burnDps = Math.max(e.burnDps || 0, dps);
  e.burnT = Math.max(e.burnT || 0, dur);
}

// A black hole: flies `fly` seconds, then holds for `dur` seconds pulling enemies within `r` toward it.
export function launchHole(g, x, y, a, o) {
  if (g.holes.length >= 12) g.holes.shift();
  g.holes.push({ x, y, vx: Math.cos(a) * o.speed, vy: Math.sin(a) * o.speed, t: 0, fly: o.fly, dur: o.dur, r: o.r, dps: o.dps,
    collapse: o.collapse || 0, tick: 0, color: o.color });
}

export function addFire(g, x, y, r, dps, dur) {
  if (g.fires.length >= 40) g.fires.shift();
  g.fires.push({ x, y, r, dps, dur, t: 0, tick: 0 });
}

// An instant beam from (x, y) along `a`, `len` long and `w` wide: hits every enemy on it once (opt: Game.damage's).
export function fireBeam(g, x, y, a, len, w, dmg, color, opt) {
  const c = Math.cos(a), s = Math.sin(a);
  const x1 = x + c * len, y1 = y + s * len;
  const hits = [];
  for (const e of g.enemies) {
    if (e.dead || e.spawnT > 0 || e.ghost || e.seg) continue;
    const t = Math.max(0, Math.min(len, (e.x - x) * c + (e.y - y) * s));
    const px = x + c * t, py = y + s * t;
    if ((e.x - px) ** 2 + (e.y - py) ** 2 < (w / 2 + e.r) ** 2) hits.push(e);
  }
  for (const o of g.props) {
    if (o.dead) continue;
    const t = Math.max(0, Math.min(len, (o.x - x) * c + (o.y - y) * s));
    if ((o.x - x - c * t) ** 2 + (o.y - y - s * t) ** 2 < (w / 2 + o.r) ** 2) hits.push(o);
  }
  for (const e of hits) g.damage(e, dmg, c * 120, s * 120, true, opt);
  if (g.beams.length < 20) g.beams.push({ x0: x, y0: y, x1, y1, w, color, t: 0, dur: 0.18 });
  return { x1, y1, hits };
}

export function updateArsenal(g, dt) {
  const p = g.player;
  // burning enemies
  for (const e of g.enemies) {
    if (!(e.burnT > 0) || e.dead) continue;
    e.burnT -= dt;
    e.burnTick = (e.burnTick || 0) + dt;
    if (e.burnTick >= BURN_TICK) {
      e.burnTick -= BURN_TICK;
      g.damage(e, e.burnDps * BURN_TICK, 0, 0, true, { fire: true, noCrit: true });
    }
    if (e.burnT <= 0) e.burnDps = 0;
    if (Math.random() < 0.25 && g.particles.length < 650) {
      g.particles.push({ x: e.x + rand(-e.r, e.r) * 0.6, y: e.y + rand(-e.r, e.r) * 0.6, vx: rand(-20, 20), vy: rand(-60, -20), life: 0.35, max: 0.35, size: 5, color: Math.random() < 0.5 ? '#ff8a2a' : '#ffd23d' });
    }
  }
  // burning ground
  for (let i = g.fires.length - 1; i >= 0; i--) {
    const f = g.fires[i];
    f.t += dt; f.tick += dt;
    if (f.tick >= BURN_TICK) {
      f.tick -= BURN_TICK;
      for (const e of g.enemiesNear(f.x, f.y, f.r)) ignite(e, f.dps, 1.5);
    }
    if (f.t > f.dur) g.fires.splice(i, 1);
  }
  // black holes
  for (let i = g.holes.length - 1; i >= 0; i--) {
    const h = g.holes[i];
    h.t += dt;
    if (h.t < h.fly) { h.x += h.vx * dt; h.y += h.vy * dt; h.vx *= Math.exp(-1.5 * dt); h.vy *= Math.exp(-1.5 * dt); continue; }
    for (const e of g.enemiesNear(h.x, h.y, h.r)) {
      if (e.boss || e.seg || e.prop || e.def.speed === 0) continue;
      const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1;
      const pull = (190 * (1 - d / (h.r + e.r)) + 50) * dt * (e.kbRes ?? 1);
      e.x += (dx / d) * Math.min(pull, d); e.y += (dy / d) * Math.min(pull, d);
    }
    h.tick += dt;
    if (h.tick >= BURN_TICK) {
      h.tick -= BURN_TICK;
      for (const e of g.enemiesNear(h.x, h.y, h.r * 0.6)) g.damage(e, h.dps * BURN_TICK, 0, 0, true);
    }
    if (Math.random() < 0.5 && g.particles.length < 650) {
      const a = rand(0, TAU), R = h.r * rand(0.6, 1);
      g.particles.push({ x: h.x + Math.cos(a) * R, y: h.y + Math.sin(a) * R, vx: -Math.cos(a) * R * 2, vy: -Math.sin(a) * R * 2, life: 0.4, max: 0.4, size: 4, color: h.color });
    }
    if (h.t > h.fly + h.dur) {
      // Event Horizon: the hole collapses into a blast
      if (h.collapse) { g.explode(h.x, h.y, h.r * 1.2, h.collapse, '#c46bff'); g.shake = Math.max(g.shake, 6); }
      g.holes.splice(i, 1);
    }
  }
  // beams fade
  for (let i = g.beams.length - 1; i >= 0; i--) if ((g.beams[i].t += dt) > g.beams[i].dur) g.beams.splice(i, 1);
  // the Phase Shield recharges
  if (p.shieldCd && !p.shieldUp) {
    p.shieldT -= dt;
    if (p.shieldT <= 0) { p.shieldUp = true; g.addFx(p.x, p.y, 40, '#7df9ff', 0.3, 2); }
  }
}

// The Phase Shield takes the hit instead of the hull. Returns true when it did.
export function shieldHit(g) {
  const p = g.player;
  if (!p.shieldUp) return false;
  p.shieldUp = false;
  p.shieldT = p.shieldCd;
  p.inv = Math.max(p.inv, 0.6);
  g.addFx(p.x, p.y, 70, '#7df9ff', 0.4, 4);
  g.burst(p.x, p.y, '#7df9ff', 18, 260, 0.4, 5);
  g.text(p.x, p.y - 26, 'SHIELD', '#7df9ff', true);
  g.sfx('pulse');
  return true;
}
