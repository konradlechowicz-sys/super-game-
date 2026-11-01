// The atmosphere of worlds 3-10 (decided by Konrad, 2026-11-01: world 2's see-through clouds make its mood, the
// other worlds should have that too): soft banks of the world's own air drifting over the arena, a low haze under
// the enemies and a few thin banks over them, as in world 2 (js/v2/siege.js). Lunar dust, Martian dust, factory
// smoke, Jupiter's storm clouds (driven by world 6's wind), mist over Europa's ice, light veils at the Rift Gate,
// spore fog on the Brood World, the Nexus's neural haze. The banks are ChatGPT's atmosphere art (Art Bible Wn-P9,
// textures wN-atmos-1..4 by proto2/make-atmos.py, already in the world's colours); a world without it gets soft cloud
// shapes drawn here in code, tinted.
import { Container, Sprite, Texture } from 'pixi.js';

const TAU = Math.PI * 2;

// per world: tint, how many banks low (under the enemies) and high (over them), their alpha, size (world units),
// drift speed (units/s), whether the world's wind carries them, and pulse (a slow breathing of the alpha)
export const ATMOS = {
  3: { tint: 0xb8b0d0, low: 6, high: 2, lowA: 0.22, highA: 0.12, size: [600, 1000], drift: 6 },
  4: { tint: 0xd9774a, low: 7, high: 3, lowA: 0.26, highA: 0.16, size: [600, 1100], drift: 14 },
  5: { tint: 0x9a8a78, low: 6, high: 3, lowA: 0.24, highA: 0.14, size: [500, 900], drift: 10 },
  6: { tint: 0xd6b080, low: 7, high: 4, lowA: 0.28, highA: 0.2, size: [700, 1200], drift: 12, wind: true },
  7: { tint: 0xa8dcea, low: 7, high: 3, lowA: 0.26, highA: 0.14, size: [600, 1100], drift: 5 },
  8: { tint: 0xc0aaff, low: 5, high: 3, lowA: 0.2, highA: 0.14, size: [700, 1200], drift: 8, pulse: true },
  9: { tint: 0x9edc6a, low: 7, high: 3, lowA: 0.24, highA: 0.14, size: [500, 900], drift: 6, pulse: true },
  10: { tint: 0xd070d0, low: 6, high: 3, lowA: 0.22, highA: 0.14, size: [700, 1200], drift: 7, pulse: true },
};

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// a soft white cloud shape: overlapping soft blobs, faded out towards the edge (tinted per world when drawn)
function cloudTexture(r, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = r() * size * 0.28, rad = size * (0.1 + r() * 0.2);
    const x = size / 2 + Math.cos(a) * d, y = size / 2 + Math.sin(a) * d;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(255,255,255,${0.18 + r() * 0.2})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
  }
  g.globalCompositeOperation = 'destination-in';
  const m = g.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size / 2);
  m.addColorStop(0, 'rgba(0,0,0,1)');
  m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}

export function makeAtmosphere(tex) {
  const low = new Container(), high = new Container();
  let banks = [], cfg = null, wox = 0, woy = 0;
  const made = [];
  const shapes = () => {
    if (!made.length) { const r = rng(4242); for (let i = 0; i < 5; i++) made.push(cloudTexture(r)); }
    return made;
  };

  // worldId: the world (no atmosphere for 1-2 or when it has none); aw, ah: the arena
  function setArena(worldId, aw, ah, seed) {
    for (const k of [low, high]) k.removeChildren().forEach((o) => o.destroy());
    banks = [];
    cfg = ATMOS[worldId] || null;
    if (!cfg) return;
    const r = rng(seed * 977 + worldId);
    const own = [1, 2, 3, 4].map((k) => tex[`w${worldId}-atmos-${k}`]).filter(Boolean);
    const pics = own.length ? own : shapes();
    const put = (into, n, alpha) => {
      for (let i = 0; i < n; i++) {
        const s = new Sprite(pics[i % pics.length]);
        s.anchor.set(0.5);
        const size = cfg.size[0] + r() * (cfg.size[1] - cfg.size[0]);
        s.scale.set(size / s.texture.width);
        s.rotation = r() * TAU;
        s.tint = own.length ? 0xffffff : cfg.tint;
        s.alpha = alpha;
        into.addChild(s);
        // they wrap around a field bigger than the arena by a bank's size, so the jump is never seen inside it
        banks.push({ s, x: (r() - 0.5) * aw, y: (r() - 0.5) * ah, a0: alpha, ph: r() * TAU, aw: aw + cfg.size[1] * 1.2, ah: ah + cfg.size[1] * 1.2 });
      }
    };
    put(low, cfg.low, cfg.lowA);
    put(high, cfg.high, cfg.highA);
  }

  // time: game seconds; game: for the wind (world 6, js/worldfx.js)
  function update(time, game, dt) {
    if (!cfg) return;
    if (cfg.wind && game.wind) { wox += game.wind.x * 0.5 * dt; woy += game.wind.y * 0.5 * dt; }
    for (const b of banks) {
      // a slow drift, wrapping around the arena so the air never runs out
      let x = b.x + time * cfg.drift * Math.cos(b.ph) + wox, y = b.y + time * cfg.drift * 0.6 * Math.sin(b.ph) + woy;
      x = ((x + b.aw / 2) % b.aw + b.aw) % b.aw - b.aw / 2;
      y = ((y + b.ah / 2) % b.ah + b.ah) % b.ah - b.ah / 2;
      b.s.position.set(x, y);
      b.s.rotation += 0.004 * dt * (b.ph > Math.PI ? 1 : -1);
      b.s.alpha = cfg.pulse ? b.a0 * (0.75 + 0.25 * Math.sin(time * 0.5 + b.ph)) : b.a0;
    }
  }

  return { low, high, setArena, update };
}
