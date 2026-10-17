// Pre-rendered neon sprites. Glow (shadowBlur) is expensive, so every shape is drawn once
// into an offscreen canvas and then blitted with drawImage each frame.
import { TAU, mix, rgba } from './util.js';

let SCALE = 2;
const cache = new Map();

export function setSpriteScale(s) {
  s = Math.min(3, Math.max(1, s));
  if (Math.abs(s - SCALE) > 0.01) {
    SCALE = s;
    cache.clear();
  }
}

export function sprite(key, half, draw, pad = 12) {
  let s = cache.get(key);
  if (s) return s;
  const full = half + pad;
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(full * 2 * SCALE);
  const g = c.getContext('2d');
  g.scale(SCALE, SCALE);
  g.translate(full, full);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  draw(g);
  s = { canvas: c, half: full };
  cache.set(key, s);
  return s;
}

// Neon tube: blurred coloured stroke plus a hot, whitish core.
export function neon(g, color, lw = 2.5, blur = 10, fillAlpha = 0) {
  if (fillAlpha) {
    g.fillStyle = rgba(color, fillAlpha);
    g.fill();
  }
  g.shadowColor = color;
  g.shadowBlur = blur * SCALE;
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.stroke();
  g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = mix(color, '#ffffff', 0.65);
  g.lineWidth = lw * 0.45;
  g.stroke();
}

export function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
}

export function ngon(g, n, r, rot = 0) {
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
}

export function circle(g, r, x = 0, y = 0) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
}

export function glowDot(color, r = 6) {
  return sprite(`dot:${color}:${r}`, r, (g) => {
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.25, color);
    grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd;
    circle(g, r);
    g.fill();
  }, 0);
}

// ---------- Ships (pointing +x) ----------
const SHIP_SHAPES = {
  striker: [20, 0, 2, 6, -12, 15, -7, 4, -11, 0, -7, -4, -12, -15, 2, -6],
  phantom: [22, 0, -4, 5, -16, 17, -9, 0, -16, -17, -4, -5],
  titan: [17, 0, 9, 9, 0, 11, -5, 17, -15, 11, -11, 0, -15, -11, -5, -17, 0, -11, 9, -9],
};

export function shipSprite(shape, color, flash = false) {
  return sprite(`ship:${shape}:${color}:${flash}`, 24, (g) => {
    const c = flash ? '#ffffff' : color;
    poly(g, SHIP_SHAPES[shape]);
    neon(g, c, 2.6, 12, 0.22);
    // cockpit
    g.beginPath();
    g.moveTo(9, 0);
    g.lineTo(-2, 0);
    neon(g, '#ffffff', 2, 6);
  });
}

// ---------- Enemies (pointing +x) ----------
export function enemySprite(shape, color, r, variant = '') {
  return sprite(`enemy:${shape}:${color}:${r}:${variant}`, r * 1.3, (g) => {
    const c = variant === 'flash' ? '#ffffff' : color;
    const fa = variant === 'flash' ? 0.6 : 0.2;
    switch (shape) {
      case 'tri':
        poly(g, [r, 0, -r * 0.75, r * 0.8, -r * 0.35, 0, -r * 0.75, -r * 0.8]);
        neon(g, c, 2.2, 9, fa);
        break;
      case 'dart':
        poly(g, [r * 1.1, 0, -r, r * 0.65, -r * 0.45, 0, -r, -r * 0.65]);
        neon(g, c, 2, 8, fa);
        break;
      case 'diamond':
        poly(g, [r * 1.15, 0, 0, r * 0.7, -r * 0.9, 0, 0, -r * 0.7]);
        neon(g, c, 2.2, 9, fa);
        g.beginPath();
        g.moveTo(r * 0.5, 0);
        g.lineTo(-r * 0.4, 0);
        neon(g, c, 1.6, 4);
        break;
      case 'hex':
        ngon(g, 6, r, 0);
        neon(g, c, 2.2, 9, fa);
        circle(g, r * 0.35);
        neon(g, c, 2, 6, 0.5);
        break;
      case 'square':
        ngon(g, 4, r * 1.15, Math.PI / 4);
        neon(g, c, 3, 10, fa);
        ngon(g, 4, r * 0.55, 0);
        neon(g, c, 2, 6, 0.3);
        break;
      case 'circle':
        circle(g, r);
        neon(g, c, 2.2, 9, fa);
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU;
          circle(g, r * 0.28, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
          neon(g, c, 1.5, 4, 0.4);
        }
        break;
      case 'shard':
        poly(g, [r * 1.4, 0, 0, r * 0.45, -r * 1.1, 0, 0, -r * 0.45]);
        neon(g, c, 2, 9, fa);
        g.beginPath(); g.moveTo(r * 1.4, 0); g.lineTo(-r * 1.1, 0);
        neon(g, c, 1.2, 4);
        break;
      case 'prism':
        ngon(g, 3, r * 1.1, 0);
        neon(g, c, 2.2, 10, fa);
        ngon(g, 3, r * 0.5, Math.PI);
        neon(g, c, 1.6, 6, 0.4);
        break;
      case 'rock':
        poly(g, [r, 0, r * 0.6, r * 0.75, -r * 0.1, r * 0.95, -r * 0.8, r * 0.55, -r, -r * 0.1, -r * 0.55, -r * 0.85, r * 0.25, -r * 0.95, r * 0.8, -r * 0.5]);
        neon(g, c, 2.4, 9, fa);
        circle(g, r * 0.22, r * 0.25, r * 0.2); neon(g, c, 1.4, 4);
        circle(g, r * 0.15, -r * 0.35, -r * 0.3); neon(g, c, 1.4, 4);
        break;
      case 'bomb':
        circle(g, r * 0.85);
        neon(g, c, 2.2, 10, fa);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU;
          g.beginPath(); g.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
          neon(g, c, 2, 6);
        }
        circle(g, r * 0.3); g.fillStyle = variant === 'flash' ? '#fff' : '#ffd23d'; g.fill();
        break;
      case 'turret':
        ngon(g, 8, r, 0);
        neon(g, c, 2.2, 9, fa);
        g.beginPath();
        for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; g.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4); g.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2); }
        neon(g, c, 3, 6);
        circle(g, r * 0.4); neon(g, c, 1.8, 6, 0.5);
        break;
      case 'wraith':
        g.beginPath();
        g.moveTo(r * 1.1, 0);
        g.quadraticCurveTo(r * 0.2, r * 1.1, -r, r * 0.8);
        g.lineTo(-r * 0.5, r * 0.25); g.lineTo(-r * 1.05, 0); g.lineTo(-r * 0.5, -r * 0.25); g.lineTo(-r, -r * 0.8);
        g.quadraticCurveTo(r * 0.2, -r * 1.1, r * 1.1, 0);
        neon(g, c, 2, 10, fa);
        circle(g, r * 0.16, r * 0.35, -r * 0.2); g.fillStyle = '#fff'; g.fill();
        circle(g, r * 0.16, r * 0.35, r * 0.2); g.fill();
        break;
      case 'eye':
        g.beginPath(); g.ellipse(0, 0, r * 1.15, r * 0.7, 0, 0, TAU);
        neon(g, c, 2.2, 10, fa);
        circle(g, r * 0.42); neon(g, c, 2, 6, 0.4);
        circle(g, r * 0.18, r * 0.12, 0); g.fillStyle = '#fff'; g.fill();
        break;
    }
    if (variant === 'elite') {
      circle(g, r * 1.25);
      neon(g, '#ffd23d', 2, 10);
    }
  }, 14);
}

// ---------- Boss: Hive Mother, drawn in layers so they can spin independently ----------
export function bossLayer(layer, color, r, flash = false, sides = 6) {
  return sprite(`boss:${layer}:${color}:${r}:${flash}:${sides}`, r * 1.2, (g) => {
    const c = flash ? '#ffffff' : color;
    if (layer === 'outer') {
      ngon(g, sides, r, 0);
      neon(g, c, 4, 16, 0.12);
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * TAU + TAU / (sides * 2);
        g.beginPath();
        g.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
        g.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
        neon(g, c, 3, 8);
      }
    } else if (layer === 'inner') {
      const n = sides === 4 ? 4 : 3;
      ngon(g, n, r * 0.62, 0);
      neon(g, c, 3, 10, 0.1);
      ngon(g, n, r * 0.62, Math.PI / n * (n === 4 ? 1 : 3));
      neon(g, c, 3, 10);
    } else {
      circle(g, r * 0.26);
      neon(g, '#ffffff', 3, 18, 0.5);
      circle(g, r * 0.12);
      g.fillStyle = c;
      g.fill();
    }
  }, 20);
}

// ---------- Projectiles & pickups ----------
export function boltSprite(color, len = 12, w = 3) {
  return sprite(`bolt:${color}:${len}:${w}`, len, (g) => {
    g.beginPath();
    g.moveTo(-len * 0.7, 0);
    g.lineTo(len * 0.7, 0);
    g.shadowColor = color;
    g.shadowBlur = 10 * SCALE;
    g.strokeStyle = color;
    g.lineWidth = w;
    g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = '#ffffff';
    g.lineWidth = w * 0.45;
    g.stroke();
  }, 8);
}

export function missileSprite(color) {
  return sprite(`missile:${color}`, 9, (g) => {
    poly(g, [9, 0, -4, 4, -7, 6, -5, 0, -7, -6, -4, -4]);
    neon(g, color, 1.8, 8, 0.5);
  });
}

export function orbSprite(color, r = 6) {
  return sprite(`orb:${color}:${r}`, r, (g) => {
    circle(g, r);
    neon(g, color, 2, 10, 0.5);
    circle(g, r * 0.4);
    g.fillStyle = '#fff';
    g.fill();
  });
}

export function gemSprite(color) {
  return sprite(`gem:${color}`, 7, (g) => {
    poly(g, [0, -7, 5, 0, 0, 7, -5, 0]);
    neon(g, color, 1.6, 8, 0.6);
  });
}

export function bladeSprite(color, size = 12) {
  return sprite(`blade:${color}:${size}`, size, (g) => {
    poly(g, [size, 0, 0, size * 0.32, -size, 0, 0, -size * 0.32]);
    neon(g, color, 2, 10, 0.5);
  });
}

export function wingmanSprite(color) {
  return sprite(`wingman:${color}`, 9, (g) => {
    poly(g, [9, 0, -5, 6, -2, 0, -5, -6]);
    neon(g, color, 1.8, 8, 0.4);
  });
}

export function mineSprite(color, lit) {
  return sprite(`mine:${color}:${lit}`, 10, (g) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      g.beginPath();
      g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      g.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
      neon(g, color, 1.6, 5);
    }
    circle(g, 6);
    neon(g, color, 2, 8, 0.3);
    circle(g, 2.5);
    g.fillStyle = lit ? '#ffffff' : color;
    g.fill();
  });
}

export function pickupSprite(kind) {
  return sprite(`pickup:${kind}`, 14, (g) => {
    switch (kind) {
      case 'coin':
        ngon(g, 6, 6, Math.PI / 6);
        neon(g, '#ffd23d', 1.8, 8, 0.6);
        break;
      case 'heal':
        circle(g, 11);
        neon(g, '#3dff8a', 2, 10, 0.15);
        g.beginPath();
        g.moveTo(-5, 0); g.lineTo(5, 0); g.moveTo(0, -5); g.lineTo(0, 5);
        neon(g, '#3dff8a', 3, 6);
        break;
      case 'magnet':
        circle(g, 11);
        neon(g, '#3dc8ff', 2, 10, 0.15);
        g.beginPath();
        g.arc(0, 0, 5, 0, Math.PI);
        g.moveTo(-5, 0); g.lineTo(-5, -5); g.moveTo(5, 0); g.lineTo(5, -5);
        neon(g, '#3dc8ff', 2.4, 6);
        break;
      case 'bomb':
        circle(g, 11);
        neon(g, '#ff3d3d', 2, 10, 0.15);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          g.beginPath();
          g.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
          g.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
          neon(g, '#ff7a3d', 2, 5);
        }
        break;
      case 'chest':
        g.beginPath();
        g.rect(-11, -8, 22, 16);
        neon(g, '#ffd23d', 2.4, 14, 0.25);
        g.beginPath();
        g.moveTo(-11, -2); g.lineTo(11, -2); g.moveTo(0, -2); g.lineTo(0, 3);
        neon(g, '#ffffff', 1.6, 6);
        break;
    }
  });
}
