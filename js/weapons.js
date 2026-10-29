import { TAU, rand, pick } from './util.js';
import { bladeSprite, wingmanSprite } from './sprites.js';
import { ignite, launchHole, addFire, fireBeam } from './arsenal.js';

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
      const ion = g.combos.has('ionbolts');
      for (let i = 0; i < s.n; i++) {
        const off = (i - (s.n - 1) / 2) * (w.evolved ? 0.09 : 0.14);
        g.shoot({
          x: p.x, y: p.y, a: a + off, speed: w.evolved ? 980 : 650, dmg: s.dmg * p.dmgMult,
          pierce: s.pierce, r: w.evolved ? 6 : 5, life: 1.1, ion,
          look: w.evolved ? 'photon' : 'bolt', color: w.evolved ? '#c8ffff' : '#2ff3ff', knock: 60,
        });
      }
      // Twin Link combo: every drone fires a bolt at the same target, at half the blaster's damage
      const dw = g.combos.has('twinlink') && g.weapons.find((x) => x.id === 'drone');
      if (dw) {
        const ds = weaponStats(dw);
        for (let i = 0; i < ds.n; i++) {
          const da = (dw.a || 0) + (i / ds.n) * TAU;
          const dx = p.x + Math.cos(da) * 44, dy = p.y + Math.sin(da) * 44;
          g.shoot({
            x: dx, y: dy, a: Math.atan2(tgt.y - dy, tgt.x - dx), speed: 650, dmg: s.dmg * p.dmgMult * 0.5,
            pierce: 0, r: 4, life: 1.0, look: 'dronebolt', color: '#9dff3d', knock: 40,
          });
        }
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
    evo: { with: 'armor', name: 'Flak Cannon', desc: 'Heavy flak: every pellet bursts on impact.', stats: { dmg: 15, cd: 0.62, n: 9, life: 0.6, flak: 34 } },
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
          x: p.x, y: p.y, a: a + off, speed: rand(520, 600), dmg: s.dmg * p.dmgMult, pierce: 0, r: w.evolved ? 6 : 5,
          life: s.life * p.areaMult, look: 'pellet', color: w.evolved ? '#ffd23d' : '#ff8a2a', knock: 140,
          // Flak Cannon: the pellet bursts on impact, hitting everything around for 60% of its damage
          flak: s.flak ? s.flak * p.areaMult : 0,
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
      // Blade Nova combo: a pulse flings the blades out (up to +60% orbit) and they hit 50% harder while out there
      w.flare = Math.max(0, (w.flare || 0) - dt);
      const out = Math.min(1, w.flare / 0.3);
      const rad = s.rad * p.areaMult * (1 + 0.6 * out);
      const br = (w.evolved ? 15 : 11) * p.areaMult;
      const dmg = s.dmg * p.dmgMult * (w.flare > 0 ? 1.5 : 1);
      // Fire Blades combo: the blades set what they cut on fire, at the Flamethrower's heat
      const fl = g.combos.has('fireblades') && g.wstats('flame');
      for (let i = 0; i < s.n; i++) {
        const a = w.a + (i / s.n) * TAU;
        const bx = p.x + Math.cos(a) * rad, by = p.y + Math.sin(a) * rad;
        for (const e of g.enemiesNear(bx, by, br + 30)) {
          if (g.time - (e.orbitHit || -9) < 0.35) continue;
          const dx = e.x - bx, dy = e.y - by;
          if (dx * dx + dy * dy < (br + e.r) ** 2) {
            e.orbitHit = g.time;
            const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
            g.damage(e, dmg, ((e.x - p.x) / d) * 160, ((e.y - p.y) / d) * 160);
            if (fl) ignite(e, fl.burn * p.dmgMult * (p.fireMult || 1), 3);
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
      const rad = s.rad * p.areaMult * (1 + 0.6 * Math.min(1, (w.flare || 0) / 0.3));
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
    evo: { with: 'amplifier', name: 'Supernova', desc: 'A colossal shockwave that slows everything it hits.', stats: { dmg: 48, cd: 2.0, rad: 230, slow: 2 } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      w.t = s.cd * p.cdMult;
      g.addRing({ x: p.x, y: p.y, max: s.rad * p.areaMult, dmg: s.dmg * p.dmgMult, dur: w.evolved ? 0.5 : 0.4, color: w.evolved ? '#e0fff6' : '#3dffc8', knock: 380, follow: true, slow: s.slow || 0 });
      g.sfx('pulse');
      // Collapse combo: the pulse collapses every open black hole into a blast at once
      if (g.combos.has('collapse')) {
        for (const h of g.holes.splice(0)) {
          if (h.t < h.fly) { g.holes.push(h); continue; }
          g.explode(h.x, h.y, h.r * 1.1, Math.max(h.collapse, h.dps * 1.5), '#c46bff');
        }
      }
      // Supernova Core (super combo): every 4th pulse pulls enemies in and leaves a ring of fire
      if (g.combos.has('supernovacore') && (w.count = (w.count || 0) + 1) % 4 === 0) {
        const fs = g.wstats('flame'), rad = s.rad * p.areaMult;
        launchHole(g, p.x, p.y, 0, { speed: 0, fly: 0, dur: 1.2, r: rad * 1.4, dps: s.dmg * p.dmgMult, color: '#ffd23d' });
        for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; addFire(g, p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, 40, fs.burn * p.dmgMult * (p.fireMult || 1), 3.5); }
        g.addFx(p.x, p.y, rad * 1.6, '#ffd23d', 0.6, 6);
        g.shake = Math.max(g.shake, 8);
      }
      // Blade Nova combo: the pulse flings the orbit blades out for a second
      const ow = g.combos.has('bladenova') && g.weapons.find((x) => x.id === 'orbit');
      if (ow) ow.flare = 1.2;
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
    evo: { with: 'overclock', name: 'Drone Squadron', desc: 'Five rapid-fire drones with piercing shots.', stats: { dmg: 20, cd: 0.32, n: 5, pierce: 1 } },
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
          x: dx, y: dy, a: Math.atan2(tgt.y - dy, tgt.x - dx), speed: w.evolved ? 720 : 600, dmg: s.dmg * p.dmgMult,
          pierce: s.pierce || 0, r: 4, life: 0.9, look: 'dronebolt', color: w.evolved ? '#e4ff7d' : '#9dff3d', knock: 40,
        });
      }
    },
    render(w, g, R, s) {
      const p = g.player;
      const spr = wingmanSprite(w.evolved ? '#e4ff7d' : '#9dff3d');
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
    evo: { with: 'tractor', name: 'Gravity Mines', desc: 'Mines drag enemies in before they blow.', stats: { dmg: 62, cd: 0.9, n: 2, rad: 84, pull: 150 } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      w.t = s.cd * p.cdMult;
      for (let i = 0; i < s.n; i++) {
        if (g.mines.length >= 40) g.mines.shift();
        g.mines.push({ x: p.x + rand(-14, 14), y: p.y + rand(-14, 14), life: 8, arm: 0.5, dmg: s.dmg * p.dmgMult, rad: s.rad * p.areaMult, pull: (s.pull || 0) * p.areaMult });
      }
    },
  },

  // ---- 2.0 arsenal (PLAN-2.0-ARSENAL.md; mechanics in js/arsenal.js) ----
  rail: {
    name: 'Railgun', color: '#c8f0ff', icon: 'rail',
    desc: ['Charges, then fires a beam through every enemy in your flight path.', '+30% damage', 'Charges faster', 'Wider beam, +25% damage', 'Charges faster, +25% damage'],
    stats: [
      { dmg: 46, cd: 2.2, w: 14 },
      { dmg: 60, cd: 2.2, w: 14 },
      { dmg: 60, cd: 1.85, w: 14 },
      { dmg: 75, cd: 1.85, w: 20 },
      { dmg: 94, cd: 1.6, w: 20 },
    ],
    evo: { with: 'targeting', name: 'Gauss Lance', desc: 'Twin beams that blast at the end of the line; crits break shields.', stats: { dmg: 120, cd: 1.4, w: 22, twin: true, blast: 90 } },
    update(w, g, dt, s) {
      w.t -= dt;
      const p = g.player;
      if (w.t > 0) return;
      if (!g.nearestEnemy(p.x, p.y, 700)) { w.t = 0.1; return; }
      w.t = s.cd * p.cdMult;
      const a = p.facing, len = 760 * p.areaMult;
      const color = w.evolved ? '#fff2a8' : '#c8f0ff';
      const sg = g.combos.has('shrapnelrail') && g.wstats('spread'), fl = g.combos.has('phoenixrail') && g.wstats('flame');
      for (const off of s.twin ? [-12, 12] : [0]) {
        const x = p.x + Math.cos(a + Math.PI / 2) * off, y = p.y + Math.sin(a + Math.PI / 2) * off;
        const { x1, y1, hits } = fireBeam(g, x, y, a, len, s.w * p.areaMult, s.dmg * p.dmgMult, color, s.twin ? { breakShield: true } : undefined);
        if (s.blast) g.explode(x1, y1, s.blast * p.areaMult, s.dmg * p.dmgMult * 0.5, color);
        // Ion Rail combo: every enemy the beam pierces sparks lightning to its nearest neighbour
        if (g.combos.has('ionrail')) {
          for (const e of hits.slice(0, 10)) {
            if (e.prop) continue;
            let best = null, bd = 140 * 140;
            for (const o of g.enemiesNear(e.x, e.y, 140)) {
              if (o === e || o.dead || o.prop) continue;
              const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
              if (d < bd) { bd = d; best = o; }
            }
            if (!best) continue;
            g.damage(best, s.dmg * p.dmgMult * 0.4, 0, 0, true);
            if (g.bolts.length < 40) g.addBolt([e.x, e.y, best.x, best.y], '#c8f0ff');
          }
        }
        // Shrapnel Rail combo: the end of the beam bursts into a fan of pellets
        if (sg) {
          for (let i = 0; i < 8; i++) {
            g.shoot({ x: x1, y: y1, a: a + (i / 7 - 0.5) * 1.2, speed: rand(460, 540), dmg: sg.dmg * p.dmgMult, pierce: 0, r: 5,
              life: 0.4 * p.areaMult, look: 'pellet', color: '#ff8a2a', knock: 120 });
          }
        }
        // Phoenix Rail (super combo): the beam leaves a line of fire
        if (fl) {
          for (let d = 60; d < len; d += 110) addFire(g, x + Math.cos(a) * d, y + Math.sin(a) * d, 32, fl.burn * p.dmgMult * p.fireMult, 2.5);
        }
      }
      g.shake = Math.max(g.shake, 3);
      g.sfx('laser');
    },
  },

  flame: {
    name: 'Flamethrower', color: '#ff8a2a', icon: 'flame',
    desc: ['Sprays fire at close range; enemies burn for 3 s.', '+30% damage', 'Wider cone', '+30% damage, longer reach', 'Hotter fire: burning +50%'],
    stats: [
      { dmg: 4, cd: 0.12, range: 140, cone: 0.42, burn: 8 },
      { dmg: 5.2, cd: 0.12, range: 140, cone: 0.42, burn: 10 },
      { dmg: 5.2, cd: 0.12, range: 140, cone: 0.55, burn: 10 },
      { dmg: 6.8, cd: 0.12, range: 165, cone: 0.55, burn: 13 },
      { dmg: 6.8, cd: 0.12, range: 165, cone: 0.55, burn: 20 },
    ],
    evo: { with: 'thermal', name: 'Inferno', desc: 'A wide blue flame that leaves the ground burning.', stats: { dmg: 9, cd: 0.1, range: 200, cone: 0.7, burn: 26, pools: true } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player, range = s.range * p.areaMult;
      const tgt = g.nearestEnemy(p.x, p.y, range + 40);
      if (!tgt) { w.t = 0.1; return; }
      w.t = s.cd * p.cdMult;
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      const fire = s.burn * p.dmgMult * (p.fireMult || 1);
      for (const e of g.enemiesNear(p.x, p.y, range)) {
        let da = Math.atan2(e.y - p.y, e.x - p.x) - a;
        while (da > Math.PI) da -= TAU;
        while (da < -Math.PI) da += TAU;
        if (Math.abs(da) > s.cone) continue;
        g.damage(e, s.dmg * p.dmgMult, Math.cos(a) * 30, Math.sin(a) * 30, true);
        ignite(e, fire, 3);
      }
      // the flame itself: a spray of embers along the cone
      const blue = w.evolved;
      for (let i = 0; i < 5 && g.particles.length < 680; i++) {
        const pa = a + rand(-s.cone, s.cone), v = range * rand(2.2, 3.2);
        g.particles.push({ x: p.x + Math.cos(a) * 12, y: p.y + Math.sin(a) * 12, vx: Math.cos(pa) * v, vy: Math.sin(pa) * v, life: 0.3, max: 0.3, size: rand(6, 10),
          color: blue ? (Math.random() < 0.5 ? '#7db8ff' : '#e0f0ff') : (Math.random() < 0.5 ? '#ff8a2a' : '#ffd23d') });
      }
      // Inferno: the ground at the end of the flame keeps burning
      if (s.pools && (w.poolT = (w.poolT || 0) - s.cd) <= 0) {
        w.poolT = 0.5;
        addFire(g, p.x + Math.cos(a) * range * 0.75, p.y + Math.sin(a) * range * 0.75, 48 * p.areaMult, fire, 3);
      }
      if ((w.sfxT = (w.sfxT || 0) - s.cd) <= 0) { w.sfxT = 0.4; g.sfx('shotgun'); }
    },
  },

  singularity: {
    name: 'Singularity Cannon', color: '#b06bff', icon: 'singularity',
    desc: ['Fires a slow orb that becomes a black hole, pulling enemies in.', '+30% damage', 'Bigger hole', 'Fires faster', '+1 orb, +25% damage'],
    stats: [
      { dmg: 34, cd: 3.6, n: 1, r: 100, dur: 2 },
      { dmg: 44, cd: 3.6, n: 1, r: 100, dur: 2 },
      { dmg: 44, cd: 3.6, n: 1, r: 125, dur: 2.2 },
      { dmg: 44, cd: 2.9, n: 1, r: 125, dur: 2.2 },
      { dmg: 55, cd: 2.9, n: 2, r: 130, dur: 2.4 },
    ],
    evo: { with: 'tractor', name: 'Event Horizon', desc: 'Huge black holes that collapse in a blast.', stats: { dmg: 70, cd: 2.8, n: 2, r: 170, dur: 2.6, collapse: 140 } },
    update(w, g, dt, s) {
      w.t -= dt;
      if (w.t > 0) return;
      const p = g.player;
      const tgt = g.nearestEnemy(p.x, p.y, 520);
      if (!tgt) { w.t = 0.15; return; }
      w.t = s.cd * p.cdMult;
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      for (let i = 0; i < s.n; i++) {
        launchHole(g, p.x, p.y, a + (i - (s.n - 1) / 2) * 0.6, {
          speed: 230, fly: 1, dur: s.dur, r: s.r * p.areaMult, dps: s.dmg * p.dmgMult, color: w.evolved ? '#e9c4ff' : '#b06bff',
          collapse: s.collapse ? s.collapse * p.dmgMult : 0,
        });
      }
      g.sfx('missile');
    },
  },
};

export const WEAPON_MAX = 5;

export function weaponStats(w) {
  const def = WEAPONS[w.id];
  return w.evolved ? def.evo.stats : def.stats[w.level - 1];
}

