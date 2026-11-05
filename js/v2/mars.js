// World 4 "Red Conversion" in the 2.0 look, as the Art Bible describes it: low above a Mars plain that the Collective
// is rewriting. The arena: matte red dust with low dunes (W4 P3a) and, where the black crystal network has grown (the
// game's patches, js/crystal.js), the same ground under crystal (P3b): each patch a soft-edged disc cut out of that
// tile (like world 2's cloud banks; a mask would need a shader that some GPUs fail to build); the growth nodes the
// crystal spreads from, crystal spires, a half-converted habitat, buried rovers (P5); red canyon walls with black
// crystal cliffs along the edge (P6). Over everything: wind-blown dust (P4), which thickens in a dust storm while the
// view closes in around the ship. No far layer (no P2): the ground fills the screen. Textures: proto2/make-world4.py.
import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { buildEdge } from './edge.js';

const TAU = Math.PI * 2;
const GROUND_SCALE = 0.75; // world units per pixel of the ground tiles
const EDGE_SCALE = 1.2, EDGE_IN = 100; // the canyon wall: world units per pixel, depth of the arena edge in the strip
const OUT = 600; // how far the ground goes on outside the arena
const PATCH = 512, PATCH_VARIANTS = 4; // crystal patch pictures: size in px, how many different ones

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// the storm's vignette: clear in the middle, thick dust at the edges
function vignette() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.75)');
  gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return Texture.from(c);
}

// a disc of the crystal tile: solid most of the way out, then a soft edge
function patchTexture(src, r, size) {
  const img = src.source.resource;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.drawImage(img, r() * (img.width - size), r() * (img.height - size), size, size, 0, 0, size, size);
  g.globalCompositeOperation = 'destination-in';
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(0,0,0,1)');
  gr.addColorStop(0.62, 'rgba(0,0,0,1)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}

export function makeRedConversion(tex, halo) {
  const ok = !!tex['w4-ground'];
  const far = new Container();

  // ---- arena layer (world space) ----
  const arena = new Container();
  const ground = new TilingSprite({ texture: tex['w4-ground'] || Texture.EMPTY, width: 10, height: 10 });
  ground.tileScale.set(GROUND_SCALE); ground.tint = 0xb8aaa6;
  const crystal = new Container(); // the patches
  const patchTex = [];
  const patchSprites = new Map(); // game patch -> sprite
  const outside = new Graphics();
  const decor = new Container(), nodes = new Container();
  const nodeGlow = new Container();
  nodeGlow.blendMode = 'add';
  const edge = new Container();
  arena.addChild(ground, crystal, outside, nodes, nodeGlow, decor, edge);
  let glows = [], netVer = -1, area = { x: 0, y: 0 };

  // ---- near layer (screen space): wind-blown dust, the storm's dust and vignette ----
  const near = new Container();
  const dust = new TilingSprite({ texture: tex['w4-near'] || Texture.EMPTY, width: 10, height: 10 });
  dust.blendMode = 'add';
  const shade = new Graphics();
  const vig = new Sprite(vignette());
  vig.anchor.set(0.5); vig.tint = 0x1a0805;
  near.addChild(shade, dust, vig);

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

  // crystal: the game's network ({ nodes, patches }, js/crystal.js)
  function setArena(w, h, seed, net) {
    const r = rng(seed * 6007 + 11);
    const W = w + 2 * OUT, H = h + 2 * OUT;
    area = { x: -w / 2 - OUT, y: -h / 2 - OUT };
    ground.width = W; ground.height = H; ground.position.set(area.x, area.y);
    if (!patchTex.length && tex['w4-crystal']) for (let i = 0; i < PATCH_VARIANTS; i++) patchTex.push(patchTexture(tex['w4-crystal'], r, PATCH));
    crystal.removeChildren().forEach((o) => o.destroy());
    patchSprites.clear();
    netVer = -1;
    outside.clear()
      .rect(area.x, area.y, W, OUT).rect(area.x, h / 2, W, OUT).rect(area.x, -h / 2, OUT, h).rect(w / 2, -h / 2, OUT, h)
      .fill({ color: 0x0c0403, alpha: 0.55 });
    for (const c of [decor, nodes, nodeGlow]) c.removeChildren().forEach((o) => o.destroy());
    glows = [];
    // the growth nodes, each with a magenta heart that beats
    for (const n of net?.nodes || []) {
      sprite('w4-prop-growth-node', 230, n.x, n.y, r() * TAU, nodes);
      const g = new Sprite(halo);
      g.anchor.set(0.5); g.position.set(n.x, n.y); g.tint = 0xff2d95; g.scale.set(1.4);
      nodeGlow.addChild(g);
      glows.push({ g, off: r() * TAU });
    }
    const spot = (m) => {
      for (let k = 0; k < 30; k++) {
        const x = (r() - 0.5) * (w - 2 * m), y = (r() - 0.5) * (h - 2 * m);
        if (Math.hypot(x, y) > 200 && !(net?.nodes || []).some((n) => Math.hypot(n.x - x, n.y - y) < 260)) return [x, y];
      }
      return [(r() - 0.5) * (w - 2 * m), (r() - 0.5) * (h - 2 * m)];
    };
    for (const [name, size, n] of [['crystal-spires', 190, 4], ['half-converted-habitat', 220, 2], ['buried-rover', 90, 3], ['crystal-shards', 80, 6]]) {
      for (let i = 0; i < n; i++) { const [x, y] = spot(150); sprite(`w4-prop-${name}`, size, x, y, r() * TAU); }
    }
    buildEdge(tex, 'w4', w, h, EDGE_SCALE, EDGE_IN, edge);
  }

  // the crystal patches follow the game's network (only when it changed): a sprite per patch, sized to it
  let nextVariant = 0;
  function syncPatches(net) {
    if (!net || net.ver === netVer || !patchTex.length) return;
    netVer = net.ver;
    const live = new Set(net.patches);
    for (const [p, s] of patchSprites) if (!live.has(p)) { s.destroy(); patchSprites.delete(p); }
    for (const p of net.patches) {
      let s = patchSprites.get(p);
      if (!s) {
        s = new Sprite(patchTex[nextVariant++ % patchTex.length]);
        s.anchor.set(0.5); s.position.set(p.x, p.y); s.rotation = Math.random() * TAU; s.tint = 0xb8aaa6;
        crystal.addChild(s);
        patchSprites.set(p, s);
      }
      s.scale.set((p.r * 2.2) / PATCH);
    }
  }

  // time: game seconds; cx, cy: camera; z: zoom; W, H: screen; storm: 0..1
  function update(time, cx, cy, z, W, H, net, storm) {
    syncPatches(net);
    for (const g of glows) g.g.alpha = 0.35 + 0.2 * Math.sin(time * 2.2 + g.off);
    dust.width = W; dust.height = H;
    dust.tilePosition.set(-cx * z * 1.25 + time * (40 + storm * 260), -cy * z * 1.25 + time * (16 + storm * 110));
    dust.alpha = 0.5 + storm * 0.5;
    shade.clear().rect(0, 0, W, H).fill({ color: 0x5a2a1f, alpha: 0.35 * storm });
    vig.position.set(W / 2, H / 2);
    vig.scale.set((Math.max(W, H) * (2.4 - storm * 1.1)) / 256);
    vig.alpha = storm;
  }

  return { ok, far, arena, near, setArena, update };
}
