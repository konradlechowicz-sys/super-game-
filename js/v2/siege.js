// World 2 "Siege of Earth" in the 2.0 look, as the Art Bible describes it: low orbit at night, right above a storm.
// Far below: the night side of Earth with city lights (W2 P2), drifting slowly under us. At the arena level: a
// see-through cloud layer we fly over (P3), the wreckage of the defense and the Collective's glowing tether nodes
// (P5), and walls of storm cloud along the edge (P6). Above the action: banks of cloud that hide enemies, so only
// their magenta cores show through (the world's mechanic), and the near layer of cloud shreds, sparks and rain (P4).
// Lightning strikes every few seconds: the screen flashes, the storm walls light up and the cloud banks thin out
// for a moment, showing everything under them. Textures: proto2/make-world2.py.
import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { buildEdge } from './edge.js';

const TAU = Math.PI * 2;
const EDGE_SCALE = 1.2, EDGE_IN = 110; // the storm wall: world units per pixel, depth of the arena edge in the strip
const BANK_ALPHA = 0.88; // cloud banks between strikes (they hide what is under them)

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// a soft-edged bank of cloud cut out of the cloud tile
function bankTexture(cloudTex, r, size) {
  const img = cloudTex.source.resource;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const sx = r() * (img.width - size), sy = r() * (img.height - size);
  g.drawImage(img, sx, sy, size, size, 0, 0, size, size);
  g.globalCompositeOperation = 'destination-in';
  const gr = g.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}

export function makeSiegeOfEarth(tex) {
  const ok = !!tex['w2-earth'];
  // ---- far layer (screen space): Earth at night, slowly drifting under us ----
  const far = new Container();
  const earth = new TilingSprite({ texture: tex['w2-earth'] || Texture.WHITE, width: 10, height: 10 });
  earth.tint = 0xb4bccc; // a little darker than the art: the action must stay on top
  far.addChild(earth);

  // ---- arena layer (world space) ----
  const arena = new Container();
  const clouds = new TilingSprite({ texture: tex['w2-clouds'] || Texture.EMPTY, width: 10, height: 10 });
  clouds.alpha = 0.75;
  const decor = new Container();
  const nodeGlow = new Container();
  nodeGlow.blendMode = 'add';
  const edge = new Container(), edgeFlash = new Container();
  edgeFlash.blendMode = 'add';
  arena.addChild(clouds, decor, nodeGlow, edge, edgeFlash);
  let nodes = [];

  // ---- cover layer (world space, over the enemies): the cloud banks ----
  const cover = new Container();
  let banks = [];
  const bankTex = [];

  // ---- near layer (screen space, over everything): cloud shreds, sparks and rain, plus the lightning flash ----
  const near = new Container();
  const overlay = new TilingSprite({ texture: tex['w2-near'] || Texture.EMPTY, width: 10, height: 10 });
  overlay.blendMode = 'add';
  overlay.alpha = 0.8;
  const flash = new Graphics();
  flash.blendMode = 'add';
  near.addChild(overlay, flash);

  let strikeAt = 4, strikeT = -1; // seconds until the next lightning, time since the last one

  function setArena(w, h, seed) {
    const r = rng(seed * 4241 + 3);
    clouds.width = w + 400; clouds.height = h + 400; clouds.position.set(-w / 2 - 200, -h / 2 - 200);
    decor.removeChildren().forEach((c) => c.destroy());
    nodeGlow.removeChildren().forEach((c) => c.destroy());
    cover.removeChildren().forEach((c) => c.destroy());
    nodes = []; banks = [];
    const prop = (name, size, x, y) => {
      const t = tex[`w2-prop-${name}`];
      if (!t) return null;
      const s = new Sprite(t);
      s.anchor.set(0.5);
      s.scale.set(size / Math.max(t.width, t.height));
      s.rotation = r() * TAU;
      s.position.set(x, y);
      decor.addChild(s);
      return s;
    };
    const spot = (m) => [(r() - 0.5) * (w - m), (r() - 0.5) * (h - m)];
    // the Collective's tethers come down through the clouds: glowing nodes that pulse
    for (let i = 0; i < 3; i++) {
      const [x, y] = spot(500);
      prop('tether-node', 230, x, y);
      const g = new Sprite(tex['glow-skymine'] || Texture.WHITE);
      g.anchor.set(0.5); g.position.set(x, y); g.scale.set(1.3); g.tint = 0xff2d95;
      nodeGlow.addChild(g);
      nodes.push({ g, off: r() * TAU });
    }
    // wrecks of the defense: a crashed lander, an anti-air platform, fighters, drones, burning debris
    for (const [name, size, n] of [['crashed-lander', 240, 2], ['anti-air-platform-wreck', 230, 2], ['fighter-wreck', 90, 3], ['drone-wreck', 80, 3], ['burning-debris', 80, 4]]) {
      for (let i = 0; i < n; i++) { const [x, y] = spot(200); prop(name, size, x, y); }
    }
    // the storm wall along the edge, and its copy that lights up with each strike
    buildEdge(tex, 'w2', w, h, EDGE_SCALE, EDGE_IN, edge);
    buildEdge(tex, 'w2', w, h, EDGE_SCALE, EDGE_IN, edgeFlash);
    edgeFlash.alpha = 0;
    // cloud banks over the arena, away from the start point
    if (!bankTex.length && tex['w2-clouds']) for (let i = 0; i < 4; i++) bankTex.push(bankTexture(tex['w2-clouds'], r, 512));
    for (let i = 0; i < 6 && bankTex.length; i++) {
      let x, y;
      do { [x, y] = spot(300); } while (Math.hypot(x, y) < 380);
      const s = new Sprite(bankTex[i % bankTex.length]);
      s.anchor.set(0.5); s.position.set(x, y);
      s.scale.set((520 + r() * 300) / 512);
      s.rotation = r() * TAU;
      cover.addChild(s);
      banks.push({ s, x, y, drift: r() * TAU });
    }
  }

  // time: game seconds; cx, cy: camera; z: zoom; W, H: screen
  function update(time, cx, cy, z, W, H, dt) {
    earth.width = W; earth.height = H;
    earth.tilePosition.set(-cx * z * 0.3 - time * 6, -cy * z * 0.3 - time * 3);
    clouds.tilePosition.set(time * 9, time * 4);
    overlay.width = W; overlay.height = H;
    overlay.tilePosition.set(-cx * z * 1.35 + time * 30, -cy * z * 1.35 + time * 140);
    for (const n of nodes) n.g.alpha = 0.22 + 0.14 * Math.sin(time * 2.4 + n.off);
    for (const b of banks) { b.s.x = b.x + Math.sin(time * 0.05 + b.drift) * 60; b.s.y = b.y + Math.cos(time * 0.04 + b.drift) * 40; }
    // lightning: a strike every 5-9 s, a quick double flash; the banks thin out and the storm wall lights up
    strikeAt -= dt;
    if (strikeAt <= 0) { strikeAt = 5 + Math.random() * 4; strikeT = 0; }
    let k = 0;
    if (strikeT >= 0) {
      strikeT += dt;
      k = strikeT < 0.08 ? 1 : strikeT < 0.16 ? 0.3 : strikeT < 0.24 ? 0.8 : Math.max(0, 1 - (strikeT - 0.24) / 0.6);
      if (strikeT > 0.9) strikeT = -1;
    }
    flash.clear().rect(0, 0, W, H).fill({ color: 0xe8f0ff, alpha: 0.16 * k });
    edgeFlash.alpha = k;
    cover.alpha = BANK_ALPHA * (1 - 0.8 * k);
    return k;
  }

  return { ok, far, arena, cover, near, setArena, update, strike: () => strikeT >= 0 && strikeT < 0.9 };
}
