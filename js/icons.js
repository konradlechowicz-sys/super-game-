// Small neon icons rendered to data URLs for the DOM UI (cards, shop, build list).
import { TAU, mix } from './util.js';

const cache = new Map();

function stroke(g, color, lw = 4) {
  g.shadowColor = color;
  g.shadowBlur = 10;
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = mix(color, '#ffffff', 0.7);
  g.lineWidth = lw * 0.4;
  g.stroke();
}

const DRAW = {
  blaster(g, c) {
    g.beginPath();
    g.moveTo(-20, 8); g.lineTo(4, 8); g.moveTo(-8, -8); g.lineTo(16, -8);
    stroke(g, c, 5);
    g.beginPath(); g.arc(20, -8, 4, 0, TAU); g.arc(8, 8, 4, 0, TAU); g.fillStyle = '#fff'; g.fill();
  },
  spread(g, c) {
    g.beginPath();
    for (const a of [-0.5, -0.17, 0.17, 0.5]) { g.moveTo(-18, 0); g.lineTo(-18 + Math.cos(a) * 38, Math.sin(a) * 38); }
    stroke(g, c, 3.5);
  },
  missiles(g, c) {
    g.beginPath();
    g.moveTo(20, -20); g.lineTo(-6, 6); g.lineTo(-14, 2); g.lineTo(-18, 18); g.lineTo(-2, 14); g.lineTo(-6, 6);
    g.moveTo(20, -20); g.lineTo(2, 14);
    stroke(g, c, 3.5);
  },
  orbit(g, c) {
    g.beginPath(); g.arc(0, 0, 18, 0, TAU); stroke(g, c, 2.5);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      g.beginPath(); g.ellipse(Math.cos(a) * 18, Math.sin(a) * 18, 8, 3, a + Math.PI / 2, 0, TAU); stroke(g, c, 3);
    }
    g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fillStyle = '#fff'; g.fill();
  },
  lightning(g, c) {
    g.beginPath();
    g.moveTo(6, -24); g.lineTo(-10, 2); g.lineTo(4, 2); g.lineTo(-6, 24); g.lineTo(14, -6); g.lineTo(0, -6); g.closePath();
    stroke(g, c, 3.5);
  },
  pulse(g, c) {
    for (const r of [7, 15, 23]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); stroke(g, c, 3); }
  },
  drone(g, c) {
    g.beginPath(); g.moveTo(16, 0); g.lineTo(-10, 12); g.lineTo(-4, 0); g.lineTo(-10, -12); g.closePath(); stroke(g, c, 3.5);
    g.beginPath(); g.moveTo(16, 0); g.lineTo(26, 0); stroke(g, c, 2);
  },
  mines(g, c) {
    g.beginPath(); g.arc(0, 0, 11, 0, TAU); stroke(g, c, 3.5);
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.moveTo(Math.cos(a) * 14, Math.sin(a) * 14); g.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); }
    stroke(g, c, 3);
    g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fillStyle = '#fff'; g.fill();
  },
  power(g, c) {
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; g.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); }
    g.closePath(); stroke(g, c, 3.5);
    g.beginPath(); g.moveTo(3, -12); g.lineTo(-6, 2); g.lineTo(2, 2); g.lineTo(-3, 13); g.lineTo(7, -2); g.lineTo(-1, -2); g.closePath(); stroke(g, c, 2.5);
  },
  overclock(g, c) {
    g.beginPath(); g.arc(0, 2, 20, Math.PI * 0.8, Math.PI * 2.2); stroke(g, c, 3.5);
    g.beginPath(); g.moveTo(0, 2); g.lineTo(12, -10); stroke(g, c, 3.5);
    g.beginPath(); g.arc(0, 2, 4, 0, TAU); g.fillStyle = '#fff'; g.fill();
  },
  thrusters(g, c) {
    g.beginPath();
    for (const y of [-14, -2, 10]) { g.moveTo(-16, y + 10); g.lineTo(0, y); g.lineTo(16, y + 10); }
    stroke(g, c, 4);
  },
  armor(g, c) {
    g.beginPath(); g.moveTo(0, -22); g.lineTo(18, -14); g.lineTo(16, 6); g.quadraticCurveTo(10, 18, 0, 23); g.quadraticCurveTo(-10, 18, -16, 6); g.lineTo(-18, -14); g.closePath();
    stroke(g, c, 3.5);
    g.beginPath(); g.moveTo(0, -12); g.lineTo(0, 12); g.moveTo(-9, 0); g.lineTo(9, 0); stroke(g, c, 2.5);
  },
  tractor(g, c) {
    g.beginPath(); g.moveTo(-14, -18); g.lineTo(-14, 2); g.arc(0, 2, 14, Math.PI, 0, true); g.lineTo(14, -18); stroke(g, c, 6);
    g.beginPath(); g.moveTo(-20, -18); g.lineTo(-8, -18); g.moveTo(8, -18); g.lineTo(20, -18); stroke(g, '#ffffff', 4);
  },
  amplifier(g, c) {
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      g.save();
      g.rotate((i / 4) * TAU + Math.PI / 4);
      g.moveTo(6, 0); g.lineTo(22, 0);
      g.moveTo(15, -7); g.lineTo(22, 0); g.lineTo(15, 7);
      g.restore();
    }
    stroke(g, c, 3.5);
  },
  heal(g, c) {
    g.beginPath(); g.arc(0, 0, 21, 0, TAU); stroke(g, c, 3);
    g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.moveTo(0, -10); g.lineTo(0, 10); stroke(g, c, 5);
  },
  coins(g, c) {
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); }
    g.closePath(); stroke(g, c, 4);
    g.beginPath(); g.arc(0, 0, 6, 0, TAU); stroke(g, c, 3);
  },
  phoenix(g, c) {
    g.beginPath(); g.moveTo(0, 20); g.quadraticCurveTo(-26, 0, -18, -20); g.quadraticCurveTo(-8, -6, 0, -2); g.quadraticCurveTo(8, -6, 18, -20); g.quadraticCurveTo(26, 0, 0, 20);
    stroke(g, c, 3.5);
    g.beginPath(); g.moveTo(0, -2); g.lineTo(0, -20); stroke(g, c, 3);
  },
  lock(g, c) {
    g.beginPath(); g.rect(-14, -4, 28, 22); stroke(g, c, 3.5);
    g.beginPath(); g.arc(0, -4, 10, Math.PI, 0); stroke(g, c, 3.5);
  },
};

export function icon(name, color, evo = false) {
  const key = `${name}:${color}:${evo}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.scale(2, 2);
  g.translate(32, 32);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  (DRAW[name] || DRAW.power)(g, color);
  if (evo) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 4 : 9;
      g.lineTo(22 + Math.cos(a) * r, -22 + Math.sin(a) * r);
    }
    g.closePath();
    g.fillStyle = '#ffd23d';
    g.shadowColor = '#ffd23d';
    g.shadowBlur = 8;
    g.fill();
  }
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
