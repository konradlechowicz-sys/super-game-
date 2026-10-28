// The arena edge of a 2.0 world (Art Bible task P6): 4 strips that repeat along the sides (1024 x 160 px) and 4
// corners (256 px), named `<prefix>-edge-top|bottom|left|right|top-left|...`. `scale` = world units per pixel;
// `inset` = how deep into a strip (from its outer side) the arena's edge runs, so the world's barrier sits on the edge
// and the rest lies outside. Fills `into` and returns true, or false when the world has no edge art.
import { Sprite, TilingSprite } from 'pixi.js';

export function buildEdge(tex, prefix, w, h, scale, inset, into) {
  if (!tex[`${prefix}-edge-top`]) return false;
  into.removeChildren().forEach((s) => s.destroy());
  const s = scale, o = inset * s, t = 160 * s, k = 256 * s;
  const L = -w / 2 - o, T = -h / 2 - o, R = w / 2 + o, B = h / 2 + o; // outer bounds of the ring
  for (const [name, x, y, pw, ph] of [
    ['top', L + k, T, R - L - 2 * k, t], ['bottom', L + k, B - t, R - L - 2 * k, t],
    ['left', L, T + k, t, B - T - 2 * k], ['right', R - t, T + k, t, B - T - 2 * k],
  ]) {
    const strip = new TilingSprite({ texture: tex[`${prefix}-edge-${name}`], width: pw / s, height: ph / s });
    strip.scale.set(s); strip.position.set(x, y);
    into.addChild(strip);
  }
  for (const [name, x, y] of [['top-left', L, T], ['top-right', R - k, T], ['bottom-left', L, B - k], ['bottom-right', R - k, B - k]]) {
    const corner = new Sprite(tex[`${prefix}-edge-${name}`]);
    corner.scale.set(s); corner.position.set(x, y);
    into.addChild(corner);
  }
  return true;
}

