import { TAU, rand, pick } from './util.js';
import { bladeSprite, wingmanSprite } from './sprites.js';

// Every weapon: per-level stats (index = level-1), level descriptions, optional evolution.
// update(w, g, dt) runs each frame; render(w, g, R) draws persistent visuals (blades, drones).
export const WEAPONS = {
  blaster: {
    name: 'Pulse Blaster', color: '#2ff3ff', icon: 'blaster',
    desc: ['Fires energy bolts at the nearest enemy.', '+1 bolt', '+35% damage', '+1 bolt, faster fire', 'Bolts pierce 1 enemy, +25% damage'],
    stats: [
      { dmg: 12, cd: 0.55, n: 1, pierce: 0 },
      { dmg: 12, cd: 0.55, n: 2, pierce: 0 },
      { dmg: 16, cd: 0.55, n: 2, pierce: 0 },
      { dmg: 16, cd: 0.48, n: 3, pierce: 0 },
      { dmg: 20, cd: 0.48, n: 3, pierce: 1 },
    ],
    evo: { with: 'overclock', name: 'Photon Storm', desc: 'Rapid-fire piercing photon lances.', stats: { dmg: 26, cd: 0.2, n: 3, pierce: 3 } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      const tgt = g.nearestEnemy(p.x, p.y, 650);
      if (!tgt) { w.t = 0.1; return; }
      w.t = s.cd * p.cdMult;
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      for (let i = 0; i < s.n; i++) {
        const off = (i - (s.n - 1) / 2) * (w.evolved ? 0.09 : 0.14);
        g.shoot({
          x: p.x, y: p.y, a: a + off, speed: w.evolved ? 980 : 650, dmg: s.dmg * p.dmgMult,
          pierce: s.pierce, r: w.evolved ? 6 : 5, life: 1.1,
          look: w.evolved ? 'photon' : 'bolt', color: w.evolved ? '#c8ffff' : '#2ff3ff', knock: 60,
        });
      }
      g.sfx(w.evolved ? 'laser' : 'shoot');
    },
  },

  spread: {
    name: 'Scatter Gun', color: '#ff8a2a', icon: 'spread',
    desc: ['Blasts a cone of pellets. Deadly up close.', '+1 pellet', '+30% damage', '+1 pellet, faster fire', '+2 pellets, longer range'],
    stats: [
      { dmg: 9, cd: 0.9, n: 4, life: 0.42 },
      { dmg: 9, cd: 0.9, n: 5, life: 0.42 },
      { dmg: 12, cd: 0.9, n: 5, life: 0.42 },
      { dmg: 12, cd: 0.75, n: 6, life: 0.45 },
      { dmg: 13, cd: 0.75, n: 8, life: 0.55 },
    ],
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      const tgt = g.nearestEnemy(p.x, p.y, 380);
      if (!tgt) { w.t = 0.1; return; }
      w.t = s.cd * p.cdMult;
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      const spreadA = 0.75;
      for (let i = 0; i < s.n; i++) {
        const off = (i / (s.n - 1) - 0.5) * spreadA + rand(-0.05, 0.05);
        g.shoot({
          x: p.x, y: p.y, a: a + off, speed: rand(520, 600), dmg: s.dmg * p.dmgMult, pierce: 0, r: 5,
          life: s.life * p.areaMult, look: 'pellet', color: '#ff8a2a', knock: 140,
        });
      }
      g.sfx('shotgun');
    },
  },

  missiles: {
    name: 'Seeker Missiles', color: '#ff3d6e', icon: 'missiles',
    desc: ['Launches homing missiles that explode on impact.', '+1 missile', '+30% damage', '+1 missile', 'Bigger explosions, +1 missile'],
    stats: [
      { dmg: 22, cd: 1.6, n: 1, rad: 45 },
      { dmg: 22, cd: 1.6, n: 2, rad: 45 },
      { dmg: 29, cd: 1.6, n: 2, rad: 48 },
      { dmg: 29, cd: 1.45, n: 3, rad: 50 },
      { dmg: 32, cd: 1.45, n: 4, rad: 62 },
    ],
    evo: { with: 'thrusters', name: 'Swarm Barrage', desc: 'A relentless storm of micro-missiles.', stats: { dmg: 34, cd: 0.8, n: 6, rad: 70 } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      const near = g.enemiesNear(p.x, p.y, 520);
      if (!near.length) { w.t = 0.15; return; }
      w.t = s.cd * p.cdMult;
      for (let i = 0; i < s.n; i++) {
        const a = p.facing + Math.PI + (i - (s.n - 1) / 2) * 0.5 + rand(-0.2, 0.2);
        g.shoot({
          x: p.x, y: p.y, a, speed: w.evolved ? 420 : 360, dmg: s.dmg * p.dmgMult, pierce: 0, r: 6, life: 2.6,
          look: 'missile', color: w.evolved ? '#ffd23d' : '#ff3d6e', kind: 'missile', rad: s.rad * p.areaMult,
          target: pick(near), turn: 6,
        });
      }
      g.sfx('missile');
    },
  },

  orbit: {
    name: 'Orbit Blades', color: '#c46bff', icon: 'orbit',
    desc: ['Energy blades circle your ship, slicing enemies.', '+1 blade', '+35% damage', '+1 blade, wider orbit', '+1 blade, faster spin'],
    stats: [
      { dmg: 10, n: 2, rad: 68, spd: 3.0 },
      { dmg: 10, n: 3, rad: 68, spd: 3.0 },
      { dmg: 14, n: 3, rad: 72, spd: 3.2 },
      { dmg: 14, n: 4, rad: 84, spd: 3.2 },
      { dmg: 16, n: 5, rad: 88, spd: 4.0 },
    ],
    evo: { with: 'amplifier', name: 'Plasma Halo', desc: 'Six plasma blades plus a burning aura.', stats: { dmg: 24, n: 6, rad: 100, spd: 4.2, aura: 12 } },
    update(w, g, dt, s) {
      const p = g.player;
      w.a = (w.a || 0) + s.spd * dt;
      const rad = s.rad * p.areaMult;
      const br = (w.evolved ? 15 : 11) * p.areaMult;
      for (let i = 0; i < s.n; i++) {
        const a = w.a + (i / s.n) * TAU;
        const bx = p.x + Math.cos(a) * rad, by = p.y + Math.sin(a) * rad;
        for (const e of g.enemiesNear(bx, by, br + 30)) {
          if (g.time - (e.orbitHit || -9) < 0.35) continue;
          const dx = e.x - bx, dy = e.y - by;
          if (dx * dx + dy * dy < (br + e.r) ** 2) {
            e.orbitHit = g.time;
            const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
            g.damage(e, s.dmg * p.dmgMult, ((e.x - p.x) / d) * 160, ((e.y - p.y) / d) * 160);
          }
        }
      }
      if (s.aura) {
        w.auraT = (w.auraT || 0) - dt;
        if (w.auraT <= 0) {
          w.auraT = 0.5;
          for (const e of g.enemiesNear(p.x, p.y, rad + 20)) {
            if (Math.hypot(e.x - p.x, e.y - p.y) < rad + 20 + e.r) g.damage(e, s.aura * p.dmgMult, 0, 0, true);
          }
        }
      }
    },
    render(w, g, R, s) {
      const p = g.player;
      const rad = s.rad * p.areaMult;
      if (s.aura) {
        const ctx = R.ctx;
        ctx.globalAlpha = 0.18 + Math.sin(g.time * 6) * 0.05;
        ctx.fillStyle = '#c46bff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad + 20, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#e9c4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const spr = bladeSprite(w.evolved ? '#f0d0ff' : '#c46bff', w.evolved ? 15 : 11);
      for (let i = 0; i < s.n; i++) {
        const a = w.a + (i / s.n) * TAU;
        R.rot(spr, p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, a + Math.PI / 2, p.areaMult);
      }
    },
  },

  lightning: {
    name: 'Arc Coil', color: '#7df9ff', icon: 'lightning',
    desc: ['Lightning strikes an enemy and chains to others.', '+1 chain', '+30% damage', '+1 chain, faster', '+2 chains, +20% damage'],
    stats: [
      { dmg: 18, cd: 1.4, chains: 2, strikes: 1 },
      { dmg: 18, cd: 1.4, chains: 3, strikes: 1 },
      { dmg: 24, cd: 1.4, chains: 3, strikes: 1 },
      { dmg: 24, cd: 1.15, chains: 4, strikes: 1 },
      { dmg: 29, cd: 1.15, chains: 6, strikes: 1 },
    ],
    evo: { with: 'power', name: 'Tempest', desc: 'A raging storm: double strikes, endless chains.', stats: { dmg: 40, cd: 0.7, chains: 8, strikes: 2 } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      const near = g.enemiesNear(p.x, p.y, 430);
      if (!near.length) { w.t = 0.15; return; }
      w.t = s.cd * p.cdMult;
      for (let k = 0; k < s.strikes; k++) {
        let cur = pick(near);
        const hit = new Set([cur]);
        const pts = [p.x, p.y, cur.x, cur.y];
        g.damage(cur, s.dmg * p.dmgMult, 0, 0);
        for (let c = 0; c < s.chains; c++) {
          let best = null, bd = (150 * p.areaMult) ** 2;
          for (const e of g.enemiesNear(cur.x, cur.y, 150 * p.areaMult)) {
            if (hit.has(e) || e.dead) continue;
            const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;
            if (d < bd) { bd = d; best = e; }
          }
          if (!best) break;
          hit.add(best);
          pts.push(best.x, best.y);
          g.damage(best, s.dmg * p.dmgMult * 0.85, 0, 0);
          cur = best;
        }
        g.addBolt(pts, w.evolved ? '#fff27d' : '#7df9ff');
      }
      g.sfx('zap');
    },
  },

  pulse: {
    name: 'Nova Pulse', color: '#3dffc8', icon: 'pulse',
    desc: ['Emits a shockwave that damages and repels enemies.', '+25% radius', '+35% damage', 'Pulses more often', '+25% radius, +25% damage'],
    stats: [
      { dmg: 20, cd: 3.0, rad: 110 },
      { dmg: 20, cd: 3.0, rad: 135 },
      { dmg: 27, cd: 3.0, rad: 135 },
      { dmg: 27, cd: 2.3, rad: 140 },
      { dmg: 34, cd: 2.3, rad: 170 },
    ],
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      w.t = s.cd * p.cdMult;
      g.addRing({ x: p.x, y: p.y, max: s.rad * p.areaMult, dmg: s.dmg * p.dmgMult, dur: 0.4, color: '#3dffc8', knock: 380, follow: true });
      g.sfx('pulse');
    },
  },

  drone: {
    name: 'Wingman Drone', color: '#9dff3d', icon: 'drone',
    desc: ['A combat drone escorts you and shoots enemies.', 'Faster fire rate', '+1 drone', '+40% damage', '+1 drone'],
    stats: [
      { dmg: 9, cd: 0.7, n: 1 },
      { dmg: 9, cd: 0.5, n: 1 },
      { dmg: 9, cd: 0.5, n: 2 },
      { dmg: 13, cd: 0.5, n: 2 },
      { dmg: 13, cd: 0.45, n: 3 },
    ],
    update(w, g, dt, s) {
      const p = g.player;
      w.a = (w.a || 0) + 1.7 * dt;
      w.cds = w.cds || [];
      for (let i = 0; i < s.n; i++) {
        const a = w.a + (i / s.n) * TAU;
        const dx = p.x + Math.cos(a) * 44, dy = p.y + Math.sin(a) * 44;
        w.cds[i] = (w.cds[i] ?? i * 0.2) - dt;
        if (w.cds[i] > 0) continue;
        const tgt = g.nearestEnemy(dx, dy, 460);
        if (!tgt) { w.cds[i] = 0.1; continue; }
        w.cds[i] = s.cd * p.cdMult;
        g.shoot({
          x: dx, y: dy, a: Math.atan2(tgt.y - dy, tgt.x - dx), speed: 600, dmg: s.dmg * p.dmgMult,
          pierce: 0, r: 4, life: 0.9, look: 'dronebolt', color: '#9dff3d', knock: 40,
        });
      }
    },
    render(w, g, R, s) {
      const p = g.player;
      const spr = wingmanSprite('#9dff3d');
      for (let i = 0; i < s.n; i++) {
        const a = (w.a || 0) + (i / s.n) * TAU;
        R.rot(spr, p.x + Math.cos(a) * 44, p.y + Math.sin(a) * 44, p.facing, 1);
      }
    },
  },

  mines: {
    name: 'Proximity Mines', color: '#ffd23d', icon: 'mines',
    desc: ['Drops mines that explode when enemies approach.', '+30% damage', 'Drops mines faster', '+1 mine per drop', 'Bigger blasts, +30% damage'],
    stats: [
      { dmg: 35, cd: 1.3, n: 1, rad: 60 },
      { dmg: 45, cd: 1.3, n: 1, rad: 60 },
      { dmg: 45, cd: 1.0, n: 1, rad: 62 },
      { dmg: 45, cd: 1.0, n: 2, rad: 62 },
      { dmg: 58, cd: 1.0, n: 2, rad: 78 },
    ],
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      w.t = s.cd * p.cdMult;
      for (let i = 0; i < s.n; i++) {
        if (g.mines.length >= 40) g.mines.shift();
        g.mines.push({ x: p.x + rand(-14, 14), y: p.y + rand(-14, 14), life: 8, arm: 0.5, dmg: s.dmg * p.dmgMult, rad: s.rad * p.areaMult });
      }
    },
  },
};

export const WEAPON_MAX = 5;

export function weaponStats(w) {
  const def = WEAPONS[w.id];
  return w.evolved ? def.evo.stats : def.stats[w.level - 1];
}

