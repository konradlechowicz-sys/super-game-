// The 2.0 look of worlds 6-10, one scene driven by each world's settings (CFG), since their art came in one format
// (proto2/make-worlds.py): a far layer (P2) in screen space, tiled or one big picture, drifting with parallax; a floor
// tile (P3, its alpha shows the far layer through) or floating islands (P3 pieces: world 6's platforms, world 8's
// reality shards); the world's props as decor (P5), some of them glowing; the edge (P6); the near overlay (P4). On
// top, the world's mechanic as the game holds it (js/worldfx.js): the wind drives the clouds and the overlay, rifts
// turn, acid pools bubble.
import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { buildEdge } from './edge.js';

const TAU = Math.PI * 2;
const OUT = 600; // how far the arena's dark surround goes past its edge

// far: tile = repeats, cover = one picture filling the screen; floor: tile scale; islands: how many pieces, how many
// laid, their size; decor: [prop art, size, how many]; glow: prop art -> glow colour; near: overlay alpha, drift
export const CFG = {
  6: {
    far: { mode: 'tile', parallax: 0.3, drift: [10, 0], tint: 0xb8a890, tileScale: 1.4 },
    islands: { n: 3, count: 6, size: [300, 460] },
    decor: [['relay-antenna', 200, 3], ['lightning-rod', 110, 4], ['cable-tissue-tangle', 150, 3], ['gas-mine-balloon', 90, 4], ['coil-node', 140, 3], ['broken-bronze-panel', 120, 3]],
    glow: { 'coil-node': 0xff2d95, 'lightning-rod': 0xffd27a },
    near: { alpha: 0.65, drift: [26, 6] },
  },
  7: {
    far: { mode: 'tile', parallax: 0.22, drift: [3, 5], tint: 0xb0c0d0, tileScale: 1 },
    floor: { scale: 0.8, tint: 0xc8d0e0 },
    decor: [['ice-spire-cluster', 210, 3], ['frozen-hybrid-carcass', 190, 2], ['green-lit-crevasse', 220, 3], ['steaming-vent', 110, 4], ['circuit-vine-knot', 120, 3], ['ice-boulder', 120, 4]],
    glow: { 'green-lit-crevasse': 0x3dff8a, 'steaming-vent': 0x8fb4ff },
    near: { alpha: 0.55, drift: [4, 10] },
  },
  8: {
    far: { mode: 'cover', parallax: 0.06, spin: 0.004, tint: 0xd0c8e0 },
    islands: { n: 6, count: 9, size: [170, 300], tint: 0xd0c8e8 },
    decor: [['gate-ring-segment', 230, 2], ['guardian-pylon', 170, 3], ['floating-ring-fragment', 200, 2], ['shard-cluster', 120, 4], ['dormant-sentinel-eye', 110, 3]],
    glow: { 'dormant-sentinel-eye': 0xff2d95, 'guardian-pylon': 0xb9a8ff },
    near: { alpha: 0.5, drift: [8, 4] },
  },
  9: {
    floor: { scale: 0.8, tint: 0xc4c0b8 },
    decor: [['metal-rib-arch', 260, 2], ['nest', 230, 2], ['egg-sac-cluster', 190, 3], ['bioluminescent-fungi', 140, 4], ['vein-knot', 140, 3], ['small-egg', 80, 5]],
    glow: { 'bioluminescent-fungi': 0x9dff3d, 'egg-sac-cluster': 0xff2d95 },
    near: { alpha: 0.5, drift: [3, 6] },
  },
  10: {
    far: { mode: 'cover', parallax: 0.06, spin: 0.003, tint: 0xd8c8d8 },
    floor: { scale: 0.8, tint: 0xc8bcc8 },
    decor: [['impossible-floating-frame', 230, 2], ['broken-ring-fragment', 220, 2], ['neuron-node', 180, 3], ['synapse-knot', 140, 3], ['eye-bud', 120, 4], ['circuit-shard', 120, 4]],
    glow: { 'neuron-node': 0xff2d95, 'eye-bud': 0xff4dd8, 'synapse-knot': 0xb04dff },
    near: { alpha: 0.5, drift: [6, 3] },
  },
};

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function makeJourney(w, tex, halo) {
  const c = CFG[w], p = `w${w}`;
  const ok = !!c && !!(tex[`${p}-floor`] || tex[`${p}-far`]);
  const far = new Container(), arena = new Container(), near = new Container();
  if (!ok) return { ok, far, arena, near, setArena() {}, update() {} };

  // ---- far layer (screen space) ----
  let farSprite = null;
  if (c.far) {
    farSprite = c.far.mode === 'tile'
      ? new TilingSprite({ texture: tex[`${p}-far`], width: 10, height: 10 })
      : new Sprite(tex[`${p}-far`]);
    if (c.far.mode === 'tile') farSprite.tileScale.set(c.far.tileScale || 1); else farSprite.anchor.set(0.5);
    farSprite.tint = c.far.tint ?? 0xffffff;
    far.addChild(farSprite);
  }

  // ---- arena layer (world space) ----
  const floor = c.floor !== undefined || tex[`${p}-floor`] ? new TilingSprite({ texture: tex[`${p}-floor`] || Texture.EMPTY, width: 10, height: 10 }) : null;
  if (floor) { floor.tileScale.set(c.floor?.scale ?? 0.75); floor.tint = c.floor?.tint ?? 0xc0bcc8; floor.alpha = c.floor?.alpha ?? 1; }
  const outside = new Graphics();
  const islands = new Container(), mech = new Container(), decor = new Container(), glows = new Container(), edge = new Container();
  glows.blendMode = 'add';
  arena.addChild(...(floor ? [floor] : []), outside, islands, mech, decor, glows, edge);
  let lights = [], rifts = [], pools = [];
  let wox = 0, woy = 0; // how far the wind has carried the clouds

  // ---- near layer (screen space) ----
  const overlay = new TilingSprite({ texture: tex[`${p}-near`] || Texture.EMPTY, width: 10, height: 10 });
  overlay.blendMode = 'add'; overlay.alpha = c.near?.alpha ?? 0.6;
  near.addChild(overlay);

  const sprite = (name, size, x, y, rot, into = decor) => {
    const t = tex[name];
    if (!t) return null;
    const s = new Sprite(t);
    s.anchor.set(0.5); s.scale.set(size / Math.max(t.width, t.height)); s.rotation = rot; s.position.set(x, y);
    into.addChild(s);
    return s;
  };

  // game: the game's state for the world's mechanic (g.rifts, g.acid)
  function setArena(aw, ah, seed, game) {
    const r = rng(seed * 7121 + w);
    if (floor) { floor.width = aw + 2 * OUT; floor.height = ah + 2 * OUT; floor.position.set(-aw / 2 - OUT, -ah / 2 - OUT); }
    outside.clear()
      .rect(-aw / 2 - OUT, -ah / 2 - OUT, aw + 2 * OUT, OUT).rect(-aw / 2 - OUT, ah / 2, aw + 2 * OUT, OUT)
      .rect(-aw / 2 - OUT, -ah / 2, OUT, ah).rect(aw / 2, -ah / 2, OUT, ah)
      .fill({ color: 0x030206, alpha: 0.55 });
    for (const k of [islands, mech, decor, glows]) k.removeChildren().forEach((o) => o.destroy());
    lights = []; rifts = []; pools = [];
    const busy = [...(game.rifts || []), ...(game.acid || [])];
    const spot = (m) => {
      for (let k = 0; k < 30; k++) {
        const x = (r() - 0.5) * (aw - 2 * m), y = (r() - 0.5) * (ah - 2 * m);
        if (Math.hypot(x, y) > 180 && !busy.some((b) => Math.hypot(b.x - x, b.y - y) < (b.r || 60) + 90)) return [x, y];
      }
      return [(r() - 0.5) * (aw - 2 * m), (r() - 0.5) * (ah - 2 * m)];
    };
    if (c.islands) {
      for (let i = 0; i < c.islands.count; i++) {
        const [x, y] = spot(200);
        const s = sprite(`${p}-island-${(i % c.islands.n) + 1}`, c.islands.size[0] + r() * (c.islands.size[1] - c.islands.size[0]), x, y, r() * TAU, islands);
        if (s) s.tint = c.islands.tint ?? 0xa8a0a0; // a little darker, so the enemies stand out
      }
    }
    for (const [name, size, n] of c.decor) {
      for (let i = 0; i < n; i++) {
        const [x, y] = spot(140);
        sprite(`${p}-prop-${name}`, size, x, y, r() * TAU);
        const col = c.glow?.[name];
        if (col !== undefined) {
          const g = new Sprite(halo);
          g.anchor.set(0.5); g.position.set(x, y); g.tint = col; g.scale.set((size * 1.2) / 64);
          glows.addChild(g);
          lights.push({ g, off: r() * TAU });
        }
      }
    }
    // the world's mechanic: rifts (world 8's rift art) and acid pools (world 9's)
    for (const rf of game.rifts || []) {
      const s = sprite('w8-prop-rift', rf.r * 3.2, rf.x, rf.y, r() * TAU, mech);
      const g = new Sprite(halo);
      g.anchor.set(0.5); g.position.set(rf.x, rf.y); g.tint = 0xb9a8ff; g.scale.set((rf.r * 4) / 64);
      glows.addChild(g);
      rifts.push({ s, g, rf });
    }
    for (const a of game.acid || []) {
      sprite(`w9-prop-acid-pool-${a.art}`, a.r * 2.6, a.x, a.y, a.rot, mech);
      const g = new Sprite(halo);
      g.anchor.set(0.5); g.position.set(a.x, a.y); g.tint = 0x9dff3d; g.scale.set((a.r * 2.4) / 64);
      glows.addChild(g);
      pools.push({ g, off: r() * TAU });
    }
    buildEdge(tex, p, aw, ah, 1.2, 100, edge);
  }

  // time: game seconds; cx, cy: camera; z: zoom; W, H: screen; game: for the wind
  function update(time, cx, cy, z, W, H, game) {
    const wind = game.wind;
    if (wind) { wox += wind.x * 0.016; woy += wind.y * 0.016; }
    if (farSprite && c.far.mode === 'tile') {
      farSprite.width = W; farSprite.height = H;
      farSprite.tilePosition.set(-cx * z * c.far.parallax + time * c.far.drift[0] + wox, -cy * z * c.far.parallax + time * c.far.drift[1] + woy);
    } else if (farSprite) {
      farSprite.position.set(W / 2 - cx * z * c.far.parallax, H / 2 - cy * z * c.far.parallax);
      farSprite.scale.set((Math.max(W, H) * 1.35) / farSprite.texture.width);
      farSprite.rotation = time * (c.far.spin || 0);
    }
    overlay.width = W; overlay.height = H;
    const nd = c.near?.drift || [0, 0];
    overlay.tilePosition.set(-cx * z * 1.25 + time * nd[0] + wox * 4, -cy * z * 1.25 + time * nd[1] + woy * 4);
    for (const l of lights) l.g.alpha = 0.28 + 0.16 * Math.sin(time * 2.3 + l.off);
    for (const rf of rifts) {
      if (rf.s) rf.s.rotation = time * 0.8;
      rf.g.alpha = (rf.rf.cd > 0 ? 0.9 : 0.4) + 0.15 * Math.sin(time * 5);
    }
    for (const pl of pools) pl.g.alpha = 0.22 + 0.1 * Math.sin(time * 3 + pl.off);
  }

  return { ok, far, arena, near, setArena, update };
}
