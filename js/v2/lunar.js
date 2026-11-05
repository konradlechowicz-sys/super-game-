// World 3 "Lunar Bridgehead" in the 2.0 look, as the Art Bible describes it: just above the Moon's surface, where the
// Void Collective built its forward base. The arena: gray regolith with rover tracks (W3 P3), the big craters that are
// the world's cover (P5, placed by the game: js/cover.js), the Collective's conduits running over the ground like roots
// with magenta pulses moving along them, ruins of the human lunar base (domes, a rover, antennas, solar panels), and
// crater rims and rock ridges along the edge (P6). Over everything: drifting dust and small glints (P4). No far layer
// (no P2): the ground fills the screen; outside the arena it goes on, darker. Textures: proto2/make-world3.py.
import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { buildEdge } from './edge.js';

const TAU = Math.PI * 2;
const GROUND_SCALE = 0.75; // world units per pixel of the regolith tile
const EDGE_SCALE = 1.2, EDGE_IN = 100; // the rock ridge: world units per pixel, depth of the arena edge in the strip
const CRATER_SIZE = 3.1; // a crater's picture, in radii of its cover (the bowl is about 60% of the picture)
const SEG_LEN = 64; // one conduit segment along a chain, in world units

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function makeLunarBridgehead(tex, halo) {
  const ok = !!tex['w3-ground'];
  const far = new Container(); // nothing far away: the ground fills the screen

  // ---- arena layer (world space) ----
  const arena = new Container();
  const ground = new TilingSprite({ texture: tex['w3-ground'] || Texture.EMPTY, width: 10, height: 10 });
  ground.tileScale.set(GROUND_SCALE);
  ground.tint = 0xa9a7b4; // a little darker than the art: the action must stay on top
  const outside = new Graphics();
  const decor = new Container(), craters = new Container(), conduits = new Container();
  const pulses = new Container();
  pulses.blendMode = 'add';
  const edge = new Container();
  arena.addChild(ground, outside, craters, conduits, decor, pulses, edge);
  let chains = [];

  // ---- near layer (screen space, over everything): drifting dust and glints ----
  const near = new Container();
  const dust = new TilingSprite({ texture: tex['w3-near'] || Texture.EMPTY, width: 10, height: 10 });
  dust.blendMode = 'add';
  dust.alpha = 0.55;
  near.addChild(dust);

  const sprite = (name, size, x, y, rot, into = decor) => {
    const t = tex[name];
    if (!t) return null;
    const s = new Sprite(t);
    s.anchor.set(0.5);
    s.scale.set(size / Math.max(t.width, t.height));
    s.rotation = rot;
    s.position.set(x, y);
    into.addChild(s);
    return s;
  };

  // cover: the game's craters ({ x, y, r, art, rot }, js/cover.js)
  function setArena(w, h, seed, cover = []) {
    const r = rng(seed * 7919 + 5);
    ground.width = w + 1200; ground.height = h + 1200; ground.position.set(-w / 2 - 600, -h / 2 - 600);
    outside.clear()
      .rect(-w / 2 - 600, -h / 2 - 600, w + 1200, 600).rect(-w / 2 - 600, h / 2, w + 1200, 600)
      .rect(-w / 2 - 600, -h / 2, 600, h).rect(w / 2, -h / 2, 600, h)
      .fill({ color: 0x050409, alpha: 0.55 });
    for (const c of [decor, craters, conduits, pulses]) c.removeChildren().forEach((o) => o.destroy());
    chains = [];
    for (const c of cover) sprite(`w3-prop-crater-${c.art}`, c.r * CRATER_SIZE, c.x, c.y, c.rot, craters);
    const clear = (x, y, m) => !cover.some((c) => Math.hypot(c.x - x, c.y - y) < c.r * 1.6 + m) && Math.hypot(x, y) > 160;
    const spot = (m) => {
      for (let k = 0; k < 30; k++) {
        const x = (r() - 0.5) * (w - 2 * m), y = (r() - 0.5) * (h - 2 * m);
        if (clear(x, y, m)) return [x, y];
      }
      return [(r() - 0.5) * (w - 2 * m), (r() - 0.5) * (h - 2 * m)];
    };
    // the Collective's conduits: from a junction, chains of pipe crawl toward the nearest crater like roots
    for (let i = 0; i < 3; i++) {
      const [x, y] = spot(220);
      sprite('w3-prop-conduit-junction', 200, x, y, r() * TAU, conduits);
      const target = cover.length ? cover.reduce((a, c) => (Math.hypot(c.x - x, c.y - y) < Math.hypot(a.x - x, a.y - y) ? c : a)) : { x: 0, y: 0, r: 0 };
      for (let arm = 0; arm < 2; arm++) {
        let a = Math.atan2(target.y - y, target.x - x) + (arm ? r() * 2 - 1 : 0) * 1.4, px = x + Math.cos(a) * 70, py = y + Math.sin(a) * 70;
        const segs = [];
        const n = 6 + Math.floor(r() * 6);
        for (let k = 0; k < n; k++) {
          a += (r() - 0.5) * 0.5;
          const cx = px + Math.cos(a) * SEG_LEN / 2, cy = py + Math.sin(a) * SEG_LEN / 2;
          if (Math.abs(cx) > w / 2 - 40 || Math.abs(cy) > h / 2 - 40) break;
          if (cover.some((c) => Math.hypot(c.x - cx, c.y - cy) < c.r * 1.2)) break;
          sprite('w3-prop-conduit-segment', SEG_LEN * 1.1, cx, cy, a, conduits);
          segs.push([cx, cy]);
          px += Math.cos(a) * SEG_LEN; py += Math.sin(a) * SEG_LEN;
        }
        if (segs.length < 2) continue;
        // a magenta pulse that runs along the chain, out from the junction
        const g = new Sprite(halo);
        g.anchor.set(0.5); g.tint = 0xff2d95; g.scale.set(0.9);
        pulses.addChild(g);
        chains.push({ segs, g, off: r() * 10, speed: 0.35 + r() * 0.25 });
      }
    }
    // ruins of the human lunar base: broken domes, a rover, antennas, solar panels
    for (const [name, size, n] of [['habitat-dome-broken', 210, 2], ['lunar-rover-wreck', 150, 2], ['comms-antenna-array', 170, 2], ['solar-panel', 80, 5]]) {
      for (let i = 0; i < n; i++) { const [x, y] = spot(160); sprite(`w3-prop-${name}`, size, x, y, r() * TAU); }
    }
    buildEdge(tex, 'w3', w, h, EDGE_SCALE, EDGE_IN, edge);
  }

  // time: game seconds; cx, cy: camera; z: zoom; W, H: screen
  function update(time, cx, cy, z, W, H) {
    dust.width = W; dust.height = H;
    dust.tilePosition.set(-cx * z * 1.25 + time * 8, -cy * z * 1.25 + time * 3);
    for (const c of chains) {
      const k = ((time * c.speed + c.off) % 1.4) / 1.4 * (c.segs.length + 2) - 1; // a pause between runs
      const i = Math.max(0, Math.min(c.segs.length - 1, Math.floor(k))), f = k - Math.floor(k);
      const [x0, y0] = c.segs[i], [x1, y1] = c.segs[Math.min(c.segs.length - 1, i + 1)];
      c.g.position.set(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
      c.g.alpha = k < 0 || k > c.segs.length - 1 ? 0 : 0.55;
    }
  }

  return { ok, far, arena, near, setArena, update };
}
