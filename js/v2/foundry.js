// World 5 "Foundry Belt" in the 2.0 look, as the Art Bible describes it: over the surface of a hollowed factory asteroid
// where the Collective builds its army. Far below (screen space, slow parallax): deep space with far factory asteroids
// (W5 P2), seen through the chasms of the floor. The arena: dark rock cut into terraces with rails and steel plates
// (P3, its chasms transparent), assembly gantries with half-built hulls, furnace pits that glow and beat, conveyor
// belts, welding arms that throw sparks, ore carts and plates (P5), the drifting asteroids that are the world's moving
// cover (the game's js/cover.js), terrace cliffs with scaffolding and warning lights along the edge (P6). Over
// everything: embers, ash and welding sparks (P4). Textures: proto2/make-world5.py.
import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { buildEdge } from './edge.js';

const TAU = Math.PI * 2;
const FLOOR_SCALE = 0.75; // world units per pixel of the floor tile
const EDGE_SCALE = 1.2, EDGE_IN = 100; // the terrace cliff: world units per pixel, depth of the arena edge in the strip
const ROCK_SIZE = 2.9; // an asteroid's picture, in radii of its cover
const OUT = 600; // how far the floor goes on outside the arena

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function makeFoundryBelt(tex, halo) {
  const ok = !!tex['w5-floor'];
  // ---- far layer (screen space): space and far factory asteroids under the chasms ----
  const far = new Container();
  const space = new TilingSprite({ texture: tex['w5-space'] || Texture.WHITE, width: 10, height: 10 });
  far.addChild(space);

  // ---- arena layer (world space) ----
  const arena = new Container();
  const floor = new TilingSprite({ texture: tex['w5-floor'] || Texture.EMPTY, width: 10, height: 10 });
  floor.tileScale.set(FLOOR_SCALE); floor.tint = 0xc8c2bc;
  const outside = new Graphics();
  const decor = new Container(), rocks = new Container();
  const glow = new Container();
  glow.blendMode = 'add';
  const edge = new Container();
  arena.addChild(floor, outside, decor, glow, rocks, edge);
  let furnaces = [], welders = [], rockSprites = [];

  // ---- near layer (screen space): embers, ash, sparks ----
  const near = new Container();
  const embers = new TilingSprite({ texture: tex['w5-near'] || Texture.EMPTY, width: 10, height: 10 });
  embers.blendMode = 'add'; embers.alpha = 0.7;
  near.addChild(embers);

  const sprite = (name, size, x, y, rot, into = decor) => {
    const t = tex[name];
    if (!t) return null;
    const s = new Sprite(t);
    s.anchor.set(0.5);
    s.scale.set(size / Math.max(t.width, t.height));
    s.rotation = rot; s.position.set(x, y);
    into.addChild(s);
    return s;
  };
  const light = (x, y, size, tint) => {
    const g = new Sprite(halo);
    g.anchor.set(0.5); g.position.set(x, y); g.tint = tint; g.scale.set(size / 64);
    glow.addChild(g);
    return g;
  };

  // cover: the game's drifting asteroids ({ x, y, r, art, rot }, js/cover.js)
  function setArena(w, h, seed, cover = []) {
    const r = rng(seed * 5039 + 17);
    floor.width = w + 2 * OUT; floor.height = h + 2 * OUT; floor.position.set(-w / 2 - OUT, -h / 2 - OUT);
    outside.clear()
      .rect(-w / 2 - OUT, -h / 2 - OUT, w + 2 * OUT, OUT).rect(-w / 2 - OUT, h / 2, w + 2 * OUT, OUT)
      .rect(-w / 2 - OUT, -h / 2, OUT, h).rect(w / 2, -h / 2, OUT, h)
      .fill({ color: 0x060403, alpha: 0.55 });
    for (const c of [decor, glow, rocks]) c.removeChildren().forEach((o) => o.destroy());
    furnaces = []; welders = []; rockSprites = [];
    const spot = (m) => [(r() - 0.5) * (w - 2 * m), (r() - 0.5) * (h - 2 * m)];
    const away = (m) => { for (let k = 0; k < 30; k++) { const p = spot(m); if (Math.hypot(p[0], p[1]) > 220) return p; } return spot(m); };
    // furnace pits: molten metal that glows and beats
    for (let i = 0; i < 3; i++) {
      const [x, y] = away(220);
      sprite('w5-prop-furnace-pit', 230, x, y, r() * TAU);
      furnaces.push({ g: light(x, y, 260, 0xff7a1a), off: r() * TAU });
    }
    for (const [name, size, n] of [['assembly-gantry', 250, 2], ['ore-conveyor', 230, 3], ['ore-cart', 80, 4], ['hull-plates', 90, 4]]) {
      for (let i = 0; i < n; i++) { const [x, y] = away(160); sprite(`w5-prop-${name}`, size, x, y, r() * TAU); }
    }
    // welding arms: a spark flashes at the tip now and then
    for (let i = 0; i < 4; i++) {
      const [x, y] = away(140), a = r() * TAU;
      sprite('w5-prop-welding-arm', 95, x, y, a);
      welders.push({ g: light(x + Math.cos(a - Math.PI / 2) * 30, y + Math.sin(a - Math.PI / 2) * 30, 50, 0xffc070), off: r() * 10 });
    }
    for (const c of cover) {
      const s = sprite(`w5-prop-drifting-asteroid-${c.art}`, c.r * ROCK_SIZE, c.x, c.y, c.rot, rocks);
      const shadow = s && new Sprite(s.texture);
      if (shadow) {
        shadow.anchor.set(0.5); shadow.tint = 0x000000; shadow.alpha = 0.55; shadow.scale.copyFrom(s.scale);
        rocks.addChildAt(shadow, 0);
      }
      rockSprites.push({ c, s, shadow });
    }
    buildEdge(tex, 'w5', w, h, EDGE_SCALE, EDGE_IN, edge);
  }

  // time: game seconds; cx, cy: camera; z: zoom; W, H: screen
  function update(time, cx, cy, z, W, H) {
    space.width = W; space.height = H;
    space.tilePosition.set(-cx * z * 0.2, -cy * z * 0.2);
    // the floor's chasms move against the space below as the camera moves (the floor is in world space)
    embers.width = W; embers.height = H;
    embers.tilePosition.set(-cx * z * 1.3 + time * 6, -cy * z * 1.3 - time * 22);
    for (const f of furnaces) f.g.alpha = 0.32 + 0.12 * Math.sin(time * 1.7 + f.off);
    for (const wl of welders) { const k = (time + wl.off) % 2.6; wl.g.alpha = k < 0.5 ? (Math.random() * 0.6 + 0.4) : 0; }
    // the asteroids drift (the game moves them); their shadows fall toward the lower right
    for (const { c, s, shadow } of rockSprites) {
      if (!s) continue;
      s.position.set(c.x, c.y); s.rotation = c.rot;
      shadow.position.set(c.x + c.r * 0.25, c.y + c.r * 0.35); shadow.rotation = c.rot;
    }
  }

  return { ok, far, arena, near, setArena, update };
}
