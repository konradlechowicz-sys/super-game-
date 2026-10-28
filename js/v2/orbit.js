// World 1 "Orbital Ruins" in the 2.0 look, as the Art Bible describes it (Claude Doc "Void Blaster 2.0 – Art Bible"):
// high orbit, no floor. Far below: black space with stars in two depths and night-side Earth (parallax). At the arena
// level: a sparse field of small wreckage, broken deck fragments of the defense stations, props (masts, solar wings,
// wrecked turrets, pods, cables), dead satellites that drift and keep being "rewritten" by the Collective, and a ring
// of wreckage with the amber hexagonal shield along the arena edge. The art is ChatGPT's (tasks W1 P2, P3a, P3b, P4,
// P5, P6, cut by proto2/make-world1.py); while a texture is missing, a stand-in drawn here or taken from the teaser is used.
import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';
import { buildEdge } from './edge.js';

const TAU = Math.PI * 2;
const SAT_CYCLE = 12; // seconds between two rewrites of one satellite
// the arena edge of W1 P6: world units per pixel of its pieces, and how deep into a 160 px strip (from its outer side)
// the arena's edge runs, so the amber shield sits on the edge and the wreckage lies outside
const EDGE_SCALE = 1.2, EDGE_IN = 135;

// a small seeded random, so every stage keeps the same layout
function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return Texture.from(c);
}

// stars on transparent: tiny points, a few brighter ones
function starTexture(seed, count, bright) {
  const r = rng(seed);
  return canvasTexture(512, (g, n) => {
    for (let i = 0; i < count; i++) {
      const x = r() * n, y = r() * n, big = r() < bright;
      g.globalAlpha = big ? 0.9 : 0.25 + r() * 0.45;
      g.fillStyle = r() < 0.15 ? '#c9bfff' : '#ffffff';
      g.beginPath(); g.arc(x, y, big ? 1.4 : 0.7, 0, TAU); g.fill();
    }
  });
}

// the sparse field of small, dark wreckage (8-40 px shards), on transparent
function debrisTexture() {
  const r = rng(91);
  const cols = ['#262b38', '#2f3646', '#3a4152', '#454d60'];
  return canvasTexture(512, (g, n) => {
    for (let i = 0; i < 70; i++) {
      const x = r() * n, y = r() * n, s = 4 + r() * 16, a = r() * TAU, k = 3 + Math.floor(r() * 3);
      g.save(); g.translate(x, y); g.rotate(a);
      g.globalAlpha = 0.55 + r() * 0.35;
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.beginPath();
      for (let j = 0; j < k; j++) {
        const t = (j / k) * TAU, d = s * (0.5 + r() * 0.5);
        g[j ? 'lineTo' : 'moveTo'](Math.cos(t) * d, Math.sin(t) * d * 0.6);
      }
      g.closePath(); g.fill();
      if (r() < 0.25) { g.strokeStyle = '#6b7a99'; g.globalAlpha *= 0.6; g.lineWidth = 1; g.stroke(); }
      g.restore();
    }
  });
}

export function makeOrbitalRuins(tex) {
  // ---- far layer (screen space, under the arena) ----
  const far = new Container();
  const starsFar = new TilingSprite({ texture: starTexture(7, 260, 0.02), width: 10, height: 10 });
  const starsNear = new TilingSprite({ texture: starTexture(13, 90, 0.08), width: 10, height: 10 });
  starsNear.alpha = 0.8;
  // the dark crescent of Earth: the lower part of the teaser's Earth (horizon and night side)
  // ChatGPT's night-side Earth (W1 P2) in the lower left corner, else the lower part of the teaser's Earth
  const earthArt = tex['w1-earth'];
  const earth = new Sprite(earthArt || new Texture({ source: tex.earth.source, frame: new Rectangle(0, 700, 1080, 1220) }));
  earth.anchor.set(earthArt ? 0 : 0.5, earthArt ? 1 : 0);
  earth.alpha = earthArt ? 0.75 : 0.32; // far below and dark: it must never compete with the action
  far.addChild(starsFar, earth, starsNear);

  // ---- near layer (screen space, over the action): dust and small shards close to the camera (W1 P4), added as
  // light and moving faster than the arena ----
  const near = new TilingSprite({ texture: tex['w1-near'] || Texture.EMPTY, width: 10, height: 10 });
  near.blendMode = 'add';
  near.alpha = 0.85;
  near.visible = !!tex['w1-near'];

  // ---- arena layer (world space, above the floor) ----
  const arena = new Container();
  // the field of small wreckage: ChatGPT's tile (W1 P3a, proto2/make-world1.py), else one drawn here
  const debris = new TilingSprite({ texture: tex['w1-debris'] || debrisTexture(), width: 10, height: 10 });
  if (tex['w1-debris']) debris.tileScale.set(1024 / 768);
  debris.alpha = tex['w1-debris'] ? 0.7 : 0.45; // background: well below the enemies' metal
  const islands = new Container();
  const decor = new Container();
  const sats = new Container();
  const barrier = new Graphics();
  // ChatGPT's arena edge (W1 P6), and an amber copy of it added as light, breathing like a live shield
  const edge = new Container(), edgeGlow = new Container();
  edgeGlow.blendMode = 'add';
  arena.addChild(debris, islands, decor, sats, barrier, edge, edgeGlow);
  let satList = [], floaters = [];

  function island(r, size) {
    const c = new Container();
    const pts = [];
    const n = 12 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU, notch = r() < 0.25 ? 0.62 : 1;
      const d = size * 0.5 * (0.78 + r() * 0.22) * notch;
      pts.push(Math.cos(t) * d, Math.sin(t) * d * (0.7 + r() * 0.3));
    }
    const plate = new TilingSprite({ texture: tex.floor, width: size * 1.2, height: size * 1.2 });
    plate.tileScale.set(0.5);
    plate.position.set(-size * 0.6, -size * 0.6);
    plate.tint = 0xb8c0d0;
    const mask = new Graphics().poly(pts).fill(0xffffff);
    plate.mask = mask;
    // a dark, torn rim and a few dead amber lights
    const rim = new Graphics().poly(pts).stroke({ width: 10, color: 0x14161e, alpha: 0.95 }).poly(pts).stroke({ width: 2, color: 0x4a5266, alpha: 0.9 });
    for (let i = 0; i < 3; i++) {
      const k = Math.floor(r() * n) * 2;
      rim.rect(pts[k] * 0.8 - 5, pts[k + 1] * 0.8 - 2, 10, 4).fill({ color: 0xffb02e, alpha: 0.45 });
    }
    c.addChild(mask, plate, rim);
    c.rotation = r() * TAU;
    return c;
  }

  function setArena(w, h, seed) {
    const r = rng(seed * 7919 + 17);
    debris.width = w; debris.height = h; debris.position.set(-w / 2, -h / 2);
    islands.removeChildren().forEach((c) => c.destroy({ children: true }));
    sats.removeChildren().forEach((c) => c.destroy({ children: true }));
    decor.removeChildren().forEach((c) => c.destroy({ children: true }));
    floaters = [];
    // a prop of W1 P5 (world units across), on a deck fragment or floating free
    const prop = (name, size, x, y, spin = 0) => {
      const t = tex[`w1-prop-${name}`];
      if (!t) return;
      const s = new Sprite(t);
      s.anchor.set(0.5);
      s.scale.set(size / Math.max(t.width, t.height));
      s.rotation = r() * TAU;
      s.position.set(x, y);
      decor.addChild(s);
      if (spin) floaters.push({ s, spin: (r() - 0.5) * spin });
    };
    // 3-5 deck fragments, away from the start point in the middle
    const count = 3 + Math.floor(r() * 3);
    for (let i = 0; i < count; i++) {
      const size = 380 + r() * 260;
      let x, y;
      do { x = (r() - 0.5) * (w - size); y = (r() - 0.5) * (h - size); } while (Math.hypot(x, y) < 320);
      // ChatGPT's deck fragments (W1 P3b), else a jagged cut of the station floor tile
      const art = tex[`w1-island-${(i % 4) + 1}`];
      let c;
      if (art) {
        c = new Sprite(art);
        c.anchor.set(0.5);
        c.scale.set(size / Math.max(art.width, art.height));
        c.rotation = r() * TAU;
      } else c = island(r, size);
      c.position.set(x, y);
      islands.addChild(c);
      // a wrecked defense turret or a sparking cable bundle on some of the decks
      const on = r();
      if (on < 0.45) prop('turret', size * 0.38, x + (r() - 0.5) * size * 0.2, y + (r() - 0.5) * size * 0.2);
      else if (on < 0.75) prop('cables', 70, x + (r() - 0.5) * size * 0.3, y + (r() - 0.5) * size * 0.3);
    }
    // floating free: snapped masts and solar wings, then dead satellites, escape pods and cable bundles
    for (let i = 0; i < 3; i++) prop(i % 2 ? 'solar' : 'mast', 220 + r() * 80, (r() - 0.5) * (w - 300), (r() - 0.5) * (h - 300), 0.04);
    for (let i = 0; i < 7; i++) {
      const name = ['sat', 'pod', 'cables'][i % 3];
      prop(name, name === 'sat' ? 80 : 55, (r() - 0.5) * (w - 120), (r() - 0.5) * (h - 120), 0.3);
    }
    // dead satellites that drift and flicker into the Collective's version
    satList = [];
    for (let i = 0; i < 6; i++) {
      const k = 1 + (i % 4);
      const c = new Container();
      const a = new Sprite(tex[`sat-${k}`]), b = new Sprite(tex[`sat-${k}-rewritten`]);
      a.anchor.set(0.5); b.anchor.set(0.5); b.alpha = 0;
      c.addChild(a, b);
      c.scale.set(0.32 + r() * 0.16);
      const x = (r() - 0.5) * (w - 200), y = (r() - 0.5) * (h - 200);
      c.position.set(x, y);
      sats.addChild(c);
      satList.push({ c, a, b, x, y, spin: (r() - 0.5) * 0.2, drift: r() * TAU, off: r() * SAT_CYCLE });
    }
    // the arena edge: 4 strips repeating along the sides and 4 corners (W1 P6), else a broken amber line
    barrier.clear();
    if (buildEdge(tex, 'w1', w, h, EDGE_SCALE, EDGE_IN, edge)) {
      buildEdge(tex, 'w1', w, h, EDGE_SCALE, EDGE_IN, edgeGlow);
      edgeGlow.children.forEach((c) => { c.tint = 0xffb02e; });
      return;
    }
    barrier.rect(-w / 2, -h / 2, w, h).stroke({ width: 48, color: 0x0b0920, alpha: 0.55 });
    const dash = 26, gap = 18;
    const side = (x0, y0, x1, y1) => {
      const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      for (let s = 0; s < len; s += dash + gap) {
        if (r() < 0.12) continue; // broken segments
        const e = Math.min(len, s + dash);
        barrier.moveTo(x0 + ux * s, y0 + uy * s).lineTo(x0 + ux * e, y0 + uy * e);
      }
    };
    side(-w / 2, -h / 2, w / 2, -h / 2); side(w / 2, -h / 2, w / 2, h / 2);
    side(w / 2, h / 2, -w / 2, h / 2); side(-w / 2, h / 2, -w / 2, -h / 2);
    barrier.stroke({ width: 3, color: 0xffb02e, alpha: 0.85 });
  }

  function update(time, cx, cy, z, W, H) {
    // far layer: stars and Earth move much slower than the arena (depth)
    starsFar.width = starsNear.width = W; starsFar.height = starsNear.height = H;
    starsFar.tilePosition.set(-cx * z * 0.08, -cy * z * 0.08);
    starsNear.tilePosition.set(-cx * z * 0.2, -cy * z * 0.2);
    near.width = W; near.height = H;
    near.tilePosition.set(-cx * z * 1.35, -cy * z * 1.35);
    const ew = Math.max(W, H) * 1.5;
    if (earthArt) {
      earth.scale.set((Math.max(W, H) * 0.95) / earthArt.width);
      earth.position.set(-W * 0.06 - cx * z * 0.04, H * 1.05 - cy * z * 0.04);
    } else {
      earth.scale.set(ew / 1080);
      earth.rotation = 0.42;
      earth.position.set(-W * 0.05 - cx * z * 0.04, H * 0.72 - cy * z * 0.04);
    }
    for (const f of floaters) f.s.rotation += f.spin / 60;
    // satellites drift, turn and get rewritten for a while every cycle
    for (const s of satList) {
      s.c.x = s.x + Math.sin(time * 0.15 + s.drift) * 30;
      s.c.y = s.y + Math.cos(time * 0.12 + s.drift) * 24;
      s.c.rotation += s.spin / 60;
      const p = (time + s.off) % SAT_CYCLE;
      let k = 0;
      if (p > 6 && p < 9) k = p < 6.3 ? ((p - 6) / 0.3) * (0.5 + 0.5 * Math.sin(time * 70)) : 1;
      else if (p >= 9 && p < 9.3) k = (1 - (p - 9) / 0.3) * (0.5 + 0.5 * Math.sin(time * 70));
      s.b.alpha = k; s.a.alpha = 1 - k;
    }
    barrier.alpha = 0.7 + 0.2 * Math.sin(time * 2.1);
    edgeGlow.alpha = 0.12 + 0.12 * Math.sin(time * 2.1);
  }

  return { far, arena, near, setArena, update };
}
