import { TAU, rand, randi, clamp, lerp, pick, weightedPick, angleLerp, SpatialHash } from './util.js';
import { ENEMIES, BOSSES, PASSIVES, PASSIVE_MAX, SHIPS, xpFor, stageIndex } from './data.js';
import { WEAPONS, WEAPON_MAX, weaponStats } from './weapons.js';
import {
  shipSprite, enemySprite, bossLayer, boltSprite, missileSprite, orbSprite, gemSprite,
  glowDot, mineSprite, pickupSprite,
} from './sprites.js';

const MAX_WEAPONS = 4;
const MAX_PASSIVES = 4;
const DRAG_SENS = 1.5;
const MAX_LAG = 150;

let nextId = 1;

export class Game {
  constructor(app, stage) {
    this.app = app;
    this.ui = app.ui;
    this.stage = stage;
    this.save = app.save;
    this.ship = SHIPS[this.save.ship] || SHIPS.striker;
    const { vw, vh } = this.viewSize();
    this.arena = { w: Math.max(900, vw * 1.8), h: Math.max(1300, vh * 1.45) };
    this.time = 0;
    this.state = 'play';
    this.enemies = []; this.proj = []; this.ebullets = []; this.gems = []; this.pickups = [];
    this.particles = []; this.rings = []; this.fx = []; this.bolts = []; this.mines = []; this.texts = [];
    this.hash = new SpatialHash(64);
    this.tmp = [];
    this.kills = 0; this.coinsRun = 0;
    this.level = 1; this.xp = 0; this.xpNext = xpFor(1); this.pendingLevels = 0; this.pendingChests = 0;
    this.weapons = []; this.passives = {};
    this.spawnAcc = 0; this.eventsDone = new Set(); this.surge = null;
    this.boss = null; this.bossDefeated = false;
    this.shake = 0; this.slowmo = 1; this.flash = 0; this.endTimer = 0;
    this.cam = { x: 0, y: 0 };
    const shop = this.save.shop;
    this.rerolls = shop.reroll || 0;
    this.reviveAvail = (shop.revive || 0) > 0;
    this.player = { x: 0, y: 0, tx: 0, ty: 0, r: 10, hp: 1, maxHp: 1, inv: 0, facing: -Math.PI / 2, moving: 0 };
    this.recompute();
    this.player.hp = this.player.maxHp;
    this.addWeapon(this.ship.weapon);
    this.ui.banner(`STAGE ${stage.id}`, stage.name.toUpperCase());
  }

  viewSize() {
    return { vw: this.app.W / this.app.zoom, vh: this.app.H / this.app.zoom };
  }

  recompute() {
    const p = this.player, sh = this.save.shop, P = this.passives, s = this.ship;
    const oldMax = p.maxHp;
    p.maxHp = s.hp + (sh.hull || 0) * 15 + (P.armor || 0) * 20;
    if (oldMax > 1 && p.maxHp > oldMax) p.hp += p.maxHp - oldMax;
    p.speed = s.speed * (1 + (sh.thrust || 0) * 0.05 + (P.thrusters || 0) * 0.08);
    p.dmgMult = s.dmg * (1 + (sh.power || 0) * 0.08 + (P.power || 0) * 0.12);
    p.cdMult = 1 - (P.overclock || 0) * 0.08;
    p.areaMult = 1 + (P.amplifier || 0) * 0.12;
    p.magnet = 105 * (1 + (sh.magnet || 0) * 0.15 + (P.tractor || 0) * 0.3);
    p.regen = (sh.regen || 0) * 0.25 + (P.armor || 0) * 0.15;
    p.armor = s.armor || 0;
    p.xpMult = 1 + (sh.growth || 0) * 0.08;
    p.coinMult = 1 + (sh.greed || 0) * 0.15;
  }

  addWeapon(id) {
    this.weapons.push({ id, level: 1, evolved: false, t: 0.3 });
  }

  // ---------------- queries used by weapons ----------------
  nearestEnemy(x, y, maxR) {
    let best = null, bd = maxR * maxR;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  enemiesNear(x, y, r) {
    const out = [];
    this.hash.query(x, y, r, this.tmp);
    for (const e of this.tmp) {
      if (e.dead || e.spawnT > 0) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.r) ** 2) out.push(e);
    }
    return out;
  }

  shoot(o) {
    if (this.proj.length > 500) return;
    o.vx = Math.cos(o.a) * o.speed;
    o.vy = Math.sin(o.a) * o.speed;
    o.hit = [];
    this.proj.push(o);
  }

  addRing(o) {
    o.t = 0; o.r = 0; o.hit = new Set();
    this.rings.push(o);
  }

  addFx(x, y, max, color, dur = 0.35, width = 3) {
    if (this.fx.length < 60) this.fx.push({ x, y, max, color, t: 0, dur, width });
  }

  addBolt(pts, color) {
    const jag = [];
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3];
      const segs = 5;
      const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
      for (let s = 0; s < segs; s++) {
        const t = s / segs, off = s === 0 ? 0 : rand(-12, 12);
        jag.push(lerp(x0, x1, t) + (nx / nl) * off, lerp(y0, y1, t) + (ny / nl) * off);
      }
    }
    jag.push(pts[pts.length - 2], pts[pts.length - 1]);
    this.bolts.push({ pts: jag, color, t: 0.2 });
  }

  sfx(n) { this.app.audio.sfx(n); }

  burst(x, y, color, n = 10, spd = 160, life = 0.5, size = 6) {
    for (let i = 0; i < n && this.particles.length < 700; i++) {
      const a = rand(0, TAU), s = rand(spd * 0.3, spd);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(life * 0.5, life), max: life, size: rand(size * 0.6, size), color });
    }
  }

  text(x, y, str, color = '#ffffff') {
    if (!this.save.settings.dmgNums) return;
    if (this.texts.length > 45) this.texts.shift();
    this.texts.push({ x: x + rand(-6, 6), y, str, color, t: 0.55 });
  }

  // ---------------- combat ----------------
  damage(e, dmg, kx = 0, ky = 0, quiet = false) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.07;
    if (!e.boss) { e.kx += kx * e.kbRes; e.ky += ky * e.kbRes; }
    this.text(e.x, e.y - e.r, Math.round(dmg));
    if (!quiet) this.sfx('hit');
    if (e.hp <= 0) this.kill(e);
  }

  explode(x, y, rad, dmg, color) {
    for (const e of this.enemiesNear(x, y, rad)) {
      const d = Math.hypot(e.x - x, e.y - y) || 1;
      this.damage(e, dmg, ((e.x - x) / d) * 220, ((e.y - y) / d) * 220, true);
    }
    this.addFx(x, y, rad, color, 0.3, 4);
    this.burst(x, y, color, 10, 220, 0.4, 7);
    this.sfx('boom');
  }

  kill(e) {
    e.dead = true;
    this.kills++;
    this.burst(e.x, e.y, e.color, e.boss ? 80 : e.elite ? 30 : 9, e.boss ? 500 : 200, e.boss ? 1.4 : 0.5, e.boss ? 12 : 6);
    this.addFx(e.x, e.y, e.r * (e.boss ? 6 : 2.4), e.color, e.boss ? 0.9 : 0.3);
    if (e.boss) {
      this.onBossDeath(e);
      return;
    }
    this.sfx('boom');
    this.dropGem(e.x, e.y, e.xp);
    if (e.elite) {
      this.shake = Math.max(this.shake, 10);
      this.pickups.push({ x: e.x, y: e.y, kind: 'chest', v: 1 });
      for (let i = 0; i < 6; i++) this.pickups.push({ x: e.x + rand(-25, 25), y: e.y + rand(-25, 25), kind: 'coin', v: 2 });
    } else {
      const r = Math.random();
      if (r < 0.035) this.pickups.push({ x: e.x, y: e.y, kind: 'coin', v: 1 });
      else if (r < 0.041) this.pickups.push({ x: e.x, y: e.y, kind: 'heal', v: 1 });
      else if (r < 0.0435) this.pickups.push({ x: e.x, y: e.y, kind: 'magnet', v: 1 });
      else if (r < 0.0455) this.pickups.push({ x: e.x, y: e.y, kind: 'bomb', v: 1 });
    }
    if (e.def.split) {
      for (let i = 0; i < 3; i++) {
        const c = this.spawnEnemy(e.def.split, e.x + rand(-12, 12), e.y + rand(-12, 12));
        c.spawnT = 0;
        const a = rand(0, TAU);
        c.kx = Math.cos(a) * 200; c.ky = Math.sin(a) * 200;
      }
    }
  }

  dropGem(x, y, v) {
    if (this.gems.length >= 350) {
      const g = this.gems[randi(0, this.gems.length - 1)];
      g.v += v;
      return;
    }
    this.gems.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), v, mag: false, sp: 0 });
  }

  hurtPlayer(dmg, src = '?') {
    const p = this.player;
    if (p.inv > 0 || this.state !== 'play' || this.app.god) return;
    dmg = Math.max(1, dmg - p.armor);
    p.hp -= dmg;
    (this.dmgLog ||= {})[src] = (this.dmgLog[src] || 0) + dmg;
    p.inv = 0.6;
    this.shake = Math.max(this.shake, 9);
    this.flash = 0.25;
    this.sfx('hurt');
    this.burst(p.x, p.y, '#ff3d6e', 12, 220, 0.4, 6);
    if (p.hp <= 0) {
      p.hp = 0;
      this.die();
    }
  }

  die() {
    if (this.reviveAvail) {
      this.state = 'revive';
      this.ui.revive(() => this.revive(), () => this.startDeath());
    } else {
      this.startDeath();
    }
  }

  revive() {
    const p = this.player;
    this.reviveAvail = false;
    p.hp = p.maxHp * 0.6;
    p.inv = 2.5;
    this.state = 'play';
    this.addRing({ x: p.x, y: p.y, max: 420, dmg: 200, dur: 0.6, color: '#ffd23d', knock: 600, follow: false });
    this.sfx('evolve');
  }

  startDeath() {
    const p = this.player;
    this.state = 'dying';
    this.endTimer = 1.6;
    this.slowmo = 0.35;
    this.burst(p.x, p.y, this.ship.color, 60, 400, 1.2, 9);
    this.addFx(p.x, p.y, 160, this.ship.color, 0.8, 5);
    this.shake = 20;
    this.sfx('bigboom');
  }

  onBossDeath(b) {
    this.boss = null;
    this.bossDefeated = true;
    this.ui.bossBar(null);
    this.sfx('bigboom');
    this.shake = 28;
    this.slowmo = 0.3;
    for (let i = 0; i < 30; i++) this.pickups.push({ x: b.x + rand(-80, 80), y: b.y + rand(-80, 80), kind: 'coin', v: 3 });
    for (let i = 0; i < 12; i++) this.dropGem(b.x + rand(-60, 60), b.y + rand(-60, 60), 10);
    // clear the field
    for (const e of this.enemies) if (!e.dead) { e.dead = true; this.burst(e.x, e.y, e.color, 6, 200, 0.5); }
    this.state = 'winning';
    this.endTimer = 2.8;
  }

  // ---------------- spawning ----------------
  spawnEnemy(type, x, y, elite = false) {
    const d = ENEMIES[type], st = this.stage;
    // Enemy toughness ramps from 1x to the stage's peak, since every run starts with a fresh build.
    const hpMul = lerp(1, st.hp, clamp(this.time / st.duration, 0, 1));
    const e = {
      id: nextId++, type, def: d, x, y, kx: 0, ky: 0, color: d.color, shape: d.shape,
      hp: d.hp * hpMul * (elite ? 7 : 1), r: d.r * (elite ? 1.6 : 1), speed: d.speed * st.speed * (elite ? 0.9 : 1),
      dmg: d.dmg * (elite ? 1.5 : 1), xp: d.xp * (elite ? 12 : 1), elite, flash: 0, spawnT: 0.35,
      rot: 0, state: 'chase', t: 0, cd: rand(0.5, 2), kbRes: elite ? 0.25 : d.r > 18 ? 0.4 : 1,
    };
    e.maxHp = e.hp;
    this.enemies.push(e);
    return e;
  }

  spawnPos() {
    const p = this.player, { vw, vh } = this.viewSize();
    const R = Math.hypot(vw, vh) / 2 + 30;
    const hw = this.arena.w / 2 - 20, hh = this.arena.h / 2 - 20;
    for (let i = 0; i < 10; i++) {
      const a = rand(0, TAU);
      const x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R;
      if (Math.abs(x) < hw && Math.abs(y) < hh) return { x, y };
    }
    const a = rand(0, TAU);
    return { x: clamp(p.x + Math.cos(a) * R, -hw, hw), y: clamp(p.y + Math.sin(a) * R, -hh, hh) };
  }

  spawnOne() {
    const pool = this.stage.enemies.filter((e) => this.time >= e[1]);
    const [type] = weightedPick(pool, (e) => e[2]);
    const d = ENEMIES[type];
    const pos = this.spawnPos();
    if (d.pack) {
      const n = randi(d.pack[0], d.pack[1]);
      for (let i = 0; i < n; i++) this.spawnEnemy(type, pos.x + rand(-30, 30), pos.y + rand(-30, 30));
    } else {
      this.spawnEnemy(type, pos.x, pos.y);
    }
  }

  runEvent(ev) {
    const p = this.player;
    if (ev.msg) { this.ui.banner(ev.msg, ''); this.sfx('warn'); }
    if (ev.type === 'ring') {
      const R = 380;
      const hw = this.arena.w / 2 - 20, hh = this.arena.h / 2 - 20;
      for (let i = 0; i < ev.count; i++) {
        const a = (i / ev.count) * TAU;
        this.spawnEnemy(ev.enemy, clamp(p.x + Math.cos(a) * R, -hw, hw), clamp(p.y + Math.sin(a) * R, -hh, hh));
      }
    } else if (ev.type === 'elite') {
      const pos = this.spawnPos();
      this.spawnEnemy(ev.enemy, pos.x, pos.y, true);
    } else if (ev.type === 'surge') {
      this.surge = { until: this.time + ev.dur, mul: ev.mul };
    }
  }

  spawnBoss() {
    const def = BOSSES[this.stage.boss];
    const p = this.player;
    const { vh } = this.viewSize();
    const hh = this.arena.h / 2 - 80;
    const b = {
      id: nextId++, boss: true, def, name: def.name, x: p.x, y: clamp(p.y - vh * 0.4, -hh, hh), kx: 0, ky: 0,
      hp: def.hp * this.stage.hp, r: def.r, speed: def.speed, dmg: def.dmg, color: def.color, flash: 0, spawnT: 1.2,
      rot: 0, rot2: 0, phase: 1, atk: 0, atkT: 2.5, mode: 'idle', modeT: 0, spin: 0, kbRes: 0,
    };
    b.maxHp = b.hp;
    this.boss = b;
    this.enemies.push(b);
    this.ui.banner('WARNING', `${def.name} APPROACHES`);
    this.ui.bossBar(def.name, 1);
    this.app.audio.setTrack('boss');
    this.sfx('boss');
    this.shake = 14;
  }

  directSpawns(dt) {
    const st = this.stage;
    const prog = clamp(this.time / st.duration, 0, 1);
    let rate = lerp(st.rate[0], st.rate[1], prog);
    if (this.surge && this.time < this.surge.until) rate *= this.surge.mul;
    if (this.boss) rate *= 0.35;
    if (this.bossDefeated) rate = 0;
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.length < st.max) this.spawnOne();
    }
    for (let i = 0; i < st.events.length; i++) {
      if (!this.eventsDone.has(i) && this.time >= st.events[i].t) {
        this.eventsDone.add(i);
        this.runEvent(st.events[i]);
      }
    }
    if (st.boss) {
      if (!this.boss && !this.bossDefeated && this.time >= st.bossAt) this.spawnBoss();
    } else if (this.time >= st.duration) {
      this.win();
    }
  }

  win() {
    this.state = 'winning';
    this.endTimer = 1.4;
    this.slowmo = 0.5;
    for (const e of this.enemies) if (!e.dead) { e.dead = true; this.burst(e.x, e.y, e.color, 6, 200, 0.5); }
    for (const g of this.gems) g.mag = true;
    for (const pk of this.pickups) pk.mag = true;
    this.sfx('bigboom');
    this.ui.banner('STAGE CLEAR', '');
  }

  // ---------------- level up / cards ----------------
  gainXp(v) {
    this.xp += v * this.player.xpMult;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpFor(this.level);
      this.pendingLevels++;
    }
  }

  rollCards(n, chest) {
    const opts = [];
    const P = this.passives;
    for (const w of this.weapons) {
      const def = WEAPONS[w.id];
      if (!w.evolved && def.evo && w.level >= WEAPON_MAX && P[def.evo.with]) opts.push({ kind: 'evo', id: w.id, wt: chest ? 200 : 8 });
      else if (!w.evolved && w.level < WEAPON_MAX) opts.push({ kind: 'wlvl', id: w.id, wt: 10 });
    }
    if (this.weapons.length < MAX_WEAPONS) {
      for (const id in WEAPONS) if (!this.weapons.some((w) => w.id === id)) opts.push({ kind: 'wnew', id, wt: 7 });
    }
    const pc = Object.keys(P).length;
    for (const id in PASSIVES) {
      const l = P[id] || 0;
      if (l > 0 && l < PASSIVE_MAX) opts.push({ kind: 'plvl', id, wt: 7 });
      else if (l === 0 && pc < MAX_PASSIVES) opts.push({ kind: 'pnew', id, wt: 5 });
    }
    const out = [];
    while (out.length < n && opts.length) {
      const o = weightedPick(opts, (x) => x.wt);
      opts.splice(opts.indexOf(o), 1);
      out.push(o);
    }
    if (out.length < n) out.push({ kind: 'heal' });
    if (out.length < n) out.push({ kind: 'coins' });
    return out.map((c) => this.describeCard(c));
  }

  describeCard(c) {
    if (c.kind === 'heal') return { ...c, name: 'Repair Kit', tag: 'HEAL', desc: 'Restore 40% hull.', icon: 'heal', color: '#3dff8a' };
    if (c.kind === 'coins') return { ...c, name: 'Salvage', tag: 'BONUS', desc: '+25 coins.', icon: 'coins', color: '#ffd23d' };
    if (c.kind === 'evo') {
      const def = WEAPONS[c.id];
      return { ...c, name: def.evo.name, tag: 'EVOLUTION', desc: def.evo.desc, icon: def.icon, color: '#ffd23d', evo: true };
    }
    if (c.kind === 'wnew' || c.kind === 'wlvl') {
      const def = WEAPONS[c.id];
      const w = this.weapons.find((x) => x.id === c.id);
      const lvl = w ? w.level + 1 : 1;
      let desc = def.desc[lvl - 1];
      if (lvl === WEAPON_MAX && def.evo) desc += ` · Evolves with ${PASSIVES[def.evo.with].name}`;
      return { ...c, name: def.name, tag: w ? `LV ${lvl}` : 'NEW', desc, icon: def.icon, color: def.color };
    }
    const def = PASSIVES[c.id];
    const lvl = (this.passives[c.id] || 0) + 1;
    return { ...c, name: def.name, tag: lvl === 1 ? 'NEW' : `LV ${lvl}`, desc: def.desc, icon: def.icon, color: def.color };
  }

  applyCard(c) {
    const p = this.player;
    switch (c.kind) {
      case 'wnew': this.addWeapon(c.id); break;
      case 'wlvl': this.weapons.find((w) => w.id === c.id).level++; break;
      case 'evo': {
        this.weapons.find((w) => w.id === c.id).evolved = true;
        this.addFx(p.x, p.y, 260, '#ffd23d', 0.7, 6);
        this.burst(p.x, p.y, '#ffd23d', 50, 380, 1, 8);
        this.sfx('evolve');
        break;
      }
      case 'pnew': case 'plvl':
        this.passives[c.id] = (this.passives[c.id] || 0) + 1;
        this.recompute();
        break;
      case 'heal': p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4); break;
      case 'coins': this.coinsRun += 25; break;
    }
  }

  openCards(chest) {
    this.state = 'levelup';
    if (chest) this.coinsRun += 10;
    this.sfx(chest ? 'chest' : 'levelup');
    const show = () => {
      const cards = this.rollCards(3, chest);
      this.ui.levelUp({
        title: chest ? 'SUPPLY CRATE' : 'LEVEL UP!',
        sub: chest ? 'Choose your reward' : `Level ${this.level - this.pendingLevels + 1}`,
        cards, rerolls: this.rerolls, build: this.buildSummary(),
        onPick: (i) => {
          this.applyCard(cards[i]);
          if (chest) this.pendingChests--; else this.pendingLevels--;
          this.state = 'play';
          this.player.inv = Math.max(this.player.inv, 0.6);
          this.app.input.resetDrag();
        },
        onReroll: () => {
          if (this.rerolls <= 0) return;
          this.rerolls--;
          show();
        },
      });
    };
    show();
  }

  buildSummary() {
    return {
      weapons: this.weapons.map((w) => ({ id: w.id, icon: WEAPONS[w.id].icon, color: w.evolved ? '#ffd23d' : WEAPONS[w.id].color, level: w.evolved ? '★' : w.level, name: w.evolved ? WEAPONS[w.id].evo.name : WEAPONS[w.id].name })),
      passives: Object.entries(this.passives).map(([id, l]) => ({ id, icon: PASSIVES[id].icon, color: PASSIVES[id].color, level: l, name: PASSIVES[id].name })),
    };
  }

  // ---------------- main update ----------------
  update(rawDt) {
    if (this.state === 'levelup' || this.state === 'paused' || this.state === 'revive' || this.state === 'over') return;
    this.slowmo = Math.min(1, this.slowmo + rawDt * (this.state === 'play' ? 1.5 : 0.25));
    const dt = rawDt * this.slowmo;
    this.time += this.state === 'play' ? dt : 0;
    const p = this.player;

    this.updatePlayer(dt);

    this.hash.clear();
    for (const e of this.enemies) if (!e.dead) this.hash.insert(e);

    if (this.state === 'play') {
      for (const w of this.weapons) WEAPONS[w.id].update(w, this, dt, weaponStats(w));
      this.directSpawns(dt);
    }

    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateEnemyBullets(dt);
    this.updateRings(dt);
    this.updateMines(dt);
    this.updatePickups(dt);
    this.updateFx(dt);

    if (this.boss) this.ui.bossBar(this.boss.name, this.boss.hp / this.boss.maxHp);

    // camera
    const k = Math.min(1, rawDt * 7);
    const lift = this.save.settings.control === 'drag' ? 0 : this.viewSize().vh * 0.1;
    this.cam.x += (p.x - this.cam.x) * k;
    this.cam.y += (p.y + lift - this.cam.y) * k;
    const { vw, vh } = this.viewSize();
    const ex = Math.max(0, this.arena.w / 2 - vw / 2 + 60), ey = Math.max(0, this.arena.h / 2 - vh / 2 + 60);
    this.cam.x = clamp(this.cam.x, -ex, ex);
    this.cam.y = clamp(this.cam.y, -ey, ey);
    this.shake = Math.max(0, this.shake - rawDt * 40);
    this.flash = Math.max(0, this.flash - rawDt);

    if (this.state === 'play') {
      if (this.pendingChests > 0) this.openCards(true);
      else if (this.pendingLevels > 0) this.openCards(false);
    }

    if (this.state === 'dying' || this.state === 'winning') {
      this.endTimer -= rawDt;
      if (this.endTimer <= 0) this.finish(this.state === 'winning');
    }

    this.ui.hud(this);
  }

  updatePlayer(dt) {
    const p = this.player, inp = this.app.input;
    const hw = this.arena.w / 2 - p.r, hh = this.arena.h / 2 - p.r;
    if (this.state === 'dying') return;
    if (inp.dx || inp.dy) {
      p.tx += (inp.dx * DRAG_SENS) / this.app.zoom;
      p.ty += (inp.dy * DRAG_SENS) / this.app.zoom;
      inp.dx = inp.dy = 0;
    }
    if (inp.jx || inp.jy) {
      // analog joystick: speed scales with how far the knob is pushed
      p.tx = p.x + inp.jx * p.speed * dt;
      p.ty = p.y + inp.jy * p.speed * dt;
    } else if (inp.joy) {
      p.tx = p.x;
      p.ty = p.y;
    }
    const kx = inp.keyX(), ky = inp.keyY();
    if (kx || ky) {
      const l = Math.hypot(kx, ky);
      p.tx = p.x + (kx / l) * p.speed * 0.12;
      p.ty = p.y + (ky / l) * p.speed * 0.12;
    }
    p.tx = clamp(p.tx, -hw, hw);
    p.ty = clamp(p.ty, -hh, hh);
    let lx = p.tx - p.x, ly = p.ty - p.y;
    let ld = Math.hypot(lx, ly);
    if (ld > MAX_LAG) {
      p.tx = p.x + (lx / ld) * MAX_LAG;
      p.ty = p.y + (ly / ld) * MAX_LAG;
      lx = p.tx - p.x; ly = p.ty - p.y; ld = MAX_LAG;
    }
    const step = p.speed * dt;
    const ox = p.x, oy = p.y;
    if (ld <= step) { p.x = p.tx; p.y = p.ty; } else { p.x += (lx / ld) * step; p.y += (ly / ld) * step; }
    const mv = Math.hypot(p.x - ox, p.y - oy);
    p.moving = dt > 0 ? mv / dt : 0;
    if (mv > 0.3) p.facing = angleLerp(p.facing, Math.atan2(p.y - oy, p.x - ox), Math.min(1, dt * 12));
    p.inv = Math.max(0, p.inv - dt);
    if (p.regen && this.state === 'play') p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    // engine trail
    if (p.moving > 40 && this.particles.length < 700 && Math.random() < 0.8) {
      const a = p.facing + Math.PI + rand(-0.3, 0.3);
      this.particles.push({ x: p.x - Math.cos(p.facing) * 12, y: p.y - Math.sin(p.facing) * 12, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.3, max: 0.3, size: 5, color: this.ship.color });
    }
  }

  updateEnemies(dt) {
    const p = this.player;
    const hw = this.arena.w / 2, hh = this.arena.h / 2;
    const near = this.tmp2 || (this.tmp2 = []);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) { this.enemies[i] = this.enemies[this.enemies.length - 1]; this.enemies.pop(); continue; }
      e.flash -= dt;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      if (e.boss) { this.updateBoss(e, dt); continue; }
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      let mx = (dx / d) * e.speed, my = (dy / d) * e.speed;
      const ai = e.def.ai;
      if (ai === 'dash') {
        e.cd -= dt;
        if (e.state === 'chase' && d < 240 && e.cd <= 0) { e.state = 'wind'; e.t = 0.55; e.dir = Math.atan2(dy, dx); }
        if (e.state === 'wind') {
          mx = my = 0; e.t -= dt; e.flash = Math.max(e.flash, Math.sin(e.t * 40) > 0 ? 0.02 : 0);
          if (e.t <= 0) { e.state = 'dash'; e.t = 0.55; }
        } else if (e.state === 'dash') {
          mx = Math.cos(e.dir) * 390; my = Math.sin(e.dir) * 390; e.t -= dt;
          if (e.t <= 0) { e.state = 'chase'; e.cd = 1.5; }
        }
      } else if (ai === 'shoot') {
        if (d < 200) { mx = -mx; my = -my; } else if (d < 270) { mx = (-dy / d) * e.speed; my = (dx / d) * e.speed; }
        e.cd -= dt;
        if (e.cd < 0.3) e.flash = Math.max(e.flash, 0.02);
        if (e.cd <= 0 && d < 360) {
          e.cd = e.elite ? 1.4 : 3.2;
          const a = Math.atan2(dy, dx);
          const n = e.elite ? 3 : 1;
          for (let k = 0; k < n; k++) this.enemyShoot(e.x, e.y, a + (k - (n - 1) / 2) * 0.25, 165, 6);
        }
      }
      // separation
      this.hash.query(e.x, e.y, e.r * 2, near);
      let sx = 0, sy = 0;
      for (let j = 0; j < near.length && j < 12; j++) {
        const o = near[j];
        if (o === e || o.boss) continue;
        const ox = e.x - o.x, oy = e.y - o.y, rr = e.r + o.r;
        const d2 = ox * ox + oy * oy;
        if (d2 < rr * rr && d2 > 0.01) {
          const dd = Math.sqrt(d2);
          sx += (ox / dd) * (rr - dd);
          sy += (oy / dd) * (rr - dd);
        }
      }
      e.x += (mx + e.kx) * dt + sx * 0.25;
      e.y += (my + e.ky) * dt + sy * 0.25;
      const kd = Math.exp(-7 * dt);
      e.kx *= kd; e.ky *= kd;
      e.x = clamp(e.x, -hw, hw);
      e.y = clamp(e.y, -hh, hh);
      if (e.def.spin) e.rot += e.def.spin * dt;
      else e.rot = angleLerp(e.rot, Math.atan2(my, mx), Math.min(1, dt * 8));
      if (d < e.r + p.r) this.hurtPlayer(e.dmg, e.type);
    }
  }

  enemyShoot(x, y, a, speed, dmg) {
    if (this.ebullets.length > 400) return;
    this.ebullets.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 5, dmg, life: 6 });
    this.sfx('eshoot');
  }

  updateBoss(b, dt) {
    const p = this.player;
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
      b.phase = 2;
      this.ui.banner('HIVE MOTHER ENRAGED', '');
      this.sfx('boss');
      this.shake = 14;
      for (let i = 0; i < 10; i++) this.spawnEnemy('drone', b.x + rand(-60, 60), b.y + rand(-60, 60));
    }
    const p2 = b.phase === 2;
    b.rot += dt * (p2 ? 1.2 : 0.6);
    b.rot2 -= dt * (p2 ? 2 : 1);
    let mx = (dx / d) * b.speed, my = (dy / d) * b.speed;
    if (d < 150) { mx *= -0.3; my *= -0.3; }
    b.modeT -= dt;
    switch (b.mode) {
      case 'idle':
        b.atkT -= dt;
        if (b.atkT <= 0) {
          const pool = ['spiral', 'burst', 'summon', 'charge'];
          b.mode = pool[b.atk++ % pool.length];
          b.modeT = { spiral: 3, burst: 1.6, summon: 0.6, charge: 0.9 }[b.mode];
          b.shotT = 0;
          if (b.mode === 'summon') {
            const n = p2 ? 10 : 7;
            for (let i = 0; i < n; i++) {
              const a = (i / n) * TAU;
              const e = this.spawnEnemy(i % 2 ? 'swarmer' : 'drone', b.x + Math.cos(a) * 80, b.y + Math.sin(a) * 80);
              e.spawnT = 0.2;
            }
            this.addFx(b.x, b.y, 140, b.color, 0.5, 4);
          }
          if (b.mode === 'charge') b.dir = Math.atan2(dy, dx);
        }
        break;
      case 'spiral':
        b.shotT -= dt;
        if (b.shotT <= 0) {
          b.shotT = p2 ? 0.075 : 0.1;
          b.spin += 0.32;
          const arms = p2 ? 3 : 2;
          for (let k = 0; k < arms; k++) this.enemyShoot(b.x, b.y, b.spin + (k / arms) * TAU, p2 ? 190 : 160, 10);
        }
        break;
      case 'burst':
        b.shotT -= dt;
        if (b.shotT <= 0) {
          b.shotT = 0.5;
          const n = p2 ? 26 : 20, off = rand(0, TAU);
          for (let k = 0; k < n; k++) this.enemyShoot(b.x, b.y, off + (k / n) * TAU, p2 ? 180 : 150, 10);
        }
        break;
      case 'charge':
        if (b.modeT > 0.45) { mx = my = 0; b.flash = Math.max(b.flash, Math.sin(b.modeT * 50) > 0 ? 0.03 : 0); b.dir = Math.atan2(dy, dx); }
        else { mx = Math.cos(b.dir) * (p2 ? 640 : 540); my = Math.sin(b.dir) * (p2 ? 640 : 540); }
        break;
    }
    if (b.mode !== 'idle' && b.modeT <= 0) {
      b.mode = 'idle';
      b.atkT = p2 ? 0.8 : 1.4;
    }
    b.x += mx * dt;
    b.y += my * dt;
    const hw = this.arena.w / 2 - b.r, hh = this.arena.h / 2 - b.r;
    b.x = clamp(b.x, -hw, hw);
    b.y = clamp(b.y, -hh, hh);
    if (d < b.r + p.r) this.hurtPlayer(b.dmg, 'boss');
  }

  updateProjectiles(dt) {
    const hw = this.arena.w / 2 + 100, hh = this.arena.h / 2 + 100;
    const near = this.tmp;
    for (let i = this.proj.length - 1; i >= 0; i--) {
      const pr = this.proj[i];
      let remove = false;
      if (pr.kind === 'missile') {
        if (!pr.target || pr.target.dead) pr.target = this.nearestEnemy(pr.x, pr.y, 500);
        if (pr.target) {
          const want = Math.atan2(pr.target.y - pr.y, pr.target.x - pr.x);
          pr.a = angleLerp(pr.a, want, Math.min(1, pr.turn * dt));
        }
        pr.speed = Math.min(pr.speed + 500 * dt, 700);
        pr.vx = Math.cos(pr.a) * pr.speed;
        pr.vy = Math.sin(pr.a) * pr.speed;
        if (Math.random() < 0.6 && this.particles.length < 700) this.particles.push({ x: pr.x, y: pr.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.25, max: 0.25, size: 4, color: '#ff9a3d' });
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.life <= 0 || Math.abs(pr.x) > hw || Math.abs(pr.y) > hh) remove = true;
      else {
        this.hash.query(pr.x, pr.y, pr.r + 30, near);
        for (const e of near) {
          if (e.dead || e.spawnT > 0) continue;
          const rr = pr.r + e.r;
          if ((e.x - pr.x) ** 2 + (e.y - pr.y) ** 2 > rr * rr) continue;
          if (pr.hit.includes(e.id)) continue;
          if (pr.kind === 'missile') {
            this.explode(pr.x, pr.y, pr.rad, pr.dmg, pr.color);
            remove = true;
            break;
          }
          const sp = pr.speed || 1;
          this.damage(e, pr.dmg, (pr.vx / sp) * pr.knock, (pr.vy / sp) * pr.knock);
          pr.hit.push(e.id);
          if (this.particles.length < 700) this.burst(pr.x, pr.y, pr.color, 2, 120, 0.2, 4);
          if (pr.pierce-- <= 0) { remove = true; break; }
        }
      }
      if (remove) { this.proj[i] = this.proj[this.proj.length - 1]; this.proj.pop(); }
    }
  }

  updateEnemyBullets(dt) {
    const p = this.player;
    const hw = this.arena.w / 2 + 50, hh = this.arena.h / 2 + 50;
    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let remove = b.life <= 0 || Math.abs(b.x) > hw || Math.abs(b.y) > hh;
      if (!remove && this.state === 'play' && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (b.r + p.r - 3) ** 2 && p.inv <= 0) {
        this.hurtPlayer(b.dmg, 'bullet');
        remove = true;
      }
      if (remove) { this.ebullets[i] = this.ebullets[this.ebullets.length - 1]; this.ebullets.pop(); }
    }
  }

  updateRings(dt) {
    const p = this.player;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt;
      if (r.follow) { r.x = p.x; r.y = p.y; }
      r.r = r.max * Math.min(1, r.t / r.dur);
      for (const e of this.enemiesNear(r.x, r.y, r.r)) {
        if (r.hit.has(e.id)) continue;
        r.hit.add(e.id);
        const d = Math.hypot(e.x - r.x, e.y - r.y) || 1;
        this.damage(e, r.dmg, ((e.x - r.x) / d) * r.knock, ((e.y - r.y) / d) * r.knock, true);
      }
      if (r.t >= r.dur + 0.15) this.rings.splice(i, 1);
    }
    // destroy enemy bullets touched by the revive nova
    for (const r of this.rings) {
      if (r.max < 400) continue;
      for (let i = this.ebullets.length - 1; i >= 0; i--) {
        const b = this.ebullets[i];
        if ((b.x - r.x) ** 2 + (b.y - r.y) ** 2 < r.r * r.r) this.ebullets.splice(i, 1);
      }
    }
  }

  updateMines(dt) {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      m.life -= dt;
      m.arm -= dt;
      let boom = m.life <= 0;
      if (!boom && m.arm <= 0 && this.enemiesNear(m.x, m.y, 22).length) boom = true;
      if (boom) {
        this.explode(m.x, m.y, m.rad, m.dmg, '#ffd23d');
        this.mines.splice(i, 1);
      }
    }
  }

  updatePickups(dt) {
    const p = this.player;
    const mag2 = p.magnet * p.magnet;
    const collectR = p.r + 10;
    const pull = (o) => {
      const dx = p.x - o.x, dy = p.y - o.y, d2 = dx * dx + dy * dy;
      if (!o.mag && d2 < mag2) o.mag = true;
      if (o.mag) {
        o.sp = Math.min((o.sp || 0) + 1600 * dt, 1100);
        const d = Math.sqrt(d2) || 1;
        const step = Math.min(d, o.sp * dt);
        o.x += (dx / d) * step;
        o.y += (dy / d) * step;
      }
      return d2 < collectR * collectR;
    };
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (pull(g)) {
        this.gainXp(g.v);
        this.sfx('xp');
        this.gems[i] = this.gems[this.gems.length - 1];
        this.gems.pop();
      }
    }
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      if (k.kind !== 'coin' && !k.mag && this.state === 'play') {
        // special pickups only attract when close
        const d2 = (p.x - k.x) ** 2 + (p.y - k.y) ** 2;
        if (d2 > 40 * 40) continue;
      }
      if (pull(k)) {
        this.collect(k);
        this.pickups.splice(i, 1);
      }
    }
  }

  collect(k) {
    const p = this.player;
    switch (k.kind) {
      case 'coin': this.coinsRun += k.v * p.coinMult; this.sfx('coin'); break;
      case 'heal': p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3); this.sfx('pickup'); this.text(p.x, p.y - 20, 'REPAIR', '#3dff8a'); break;
      case 'magnet': for (const g of this.gems) g.mag = true; this.sfx('pickup'); this.text(p.x, p.y - 20, 'MAGNET', '#3dc8ff'); break;
      case 'bomb':
        this.flash = 0.4;
        this.shake = 16;
        this.sfx('bigboom');
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0) continue;
          if (Math.abs(e.x - this.cam.x) < this.app.W && Math.abs(e.y - this.cam.y) < this.app.H) this.damage(e, e.boss ? 300 : 99999, 0, 0, true);
        }
        this.ebullets.length = 0;
        break;
      case 'chest': this.pendingChests++; break;
    }
  }

  updateFx(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) { this.particles[i] = this.particles[this.particles.length - 1]; this.particles.pop(); continue; }
      const f = Math.exp(-3 * dt);
      q.vx *= f; q.vy *= f;
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      this.fx[i].t += dt;
      if (this.fx[i].t >= this.fx[i].dur) this.fx.splice(i, 1);
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].t -= dt;
      if (this.bolts[i].t <= 0) this.bolts.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.t -= dt;
      t.y -= 40 * dt;
      if (t.t <= 0) this.texts.splice(i, 1);
    }
  }

  // ---------------- end of run ----------------
  finish(won) {
    if (this.state === 'over') return;
    const st = this.stage, save = this.save;
    const p = this.player;
    this.state = 'over';
    let stars = 0;
    const goals = [won, this.kills >= st.kills, won && p.hp >= p.maxHp * 0.5];
    if (won) stars = goals.filter(Boolean).length;
    const idx = stageIndex(st.id);
    const collected = Math.round(this.coinsRun);
    const firstClear = won && !save.cleared[st.id];
    const clearBonus = won ? Math.round((40 + idx * 20) * (firstClear ? 1.5 : 1) * p.coinMult) : 0;
    const starBonus = won ? Math.round(stars * 15 * p.coinMult) : 0;
    const total = collected + clearBonus + starBonus;
    save.coins += total;
    save.stats.kills += this.kills;
    save.stats.runs += 1;
    if (won) {
      save.cleared[st.id] = true;
      save.stars[st.id] = Math.max(save.stars[st.id] || 0, stars);
      if (st.boss) save.stats.bossKills += 1;
    }
    this.app.persist();
    this.app.audio.sfx(won ? 'win' : 'lose');
    this.ui.bossBar(null);
    this.ui.results({
      won, stage: st, stars, goals, time: this.time, kills: this.kills, level: this.level,
      collected, clearBonus, starBonus, total, firstClear,
    });
  }

  pause() {
    if (this.state !== 'play') return;
    this.state = 'paused';
    this.ui.pause(this.buildSummary(), () => { this.state = 'play'; this.app.input.resetDrag(); }, () => this.app.quitRun());
  }

  // ---------------- rendering ----------------
  render(ctx) {
    const app = this.app;
    const { W, H, dpr, zoom } = app;
    const shx = this.shake ? rand(-this.shake, this.shake) * 0.5 : 0;
    const shy = this.shake ? rand(-this.shake, this.shake) * 0.5 : 0;
    const cx = this.cam.x + shx, cy = this.cam.y + shy;
    app.bg.draw(ctx, cx * zoom, cy * zoom, app.time);

    const k = dpr * zoom, ox = dpr * W / 2 - cx * k, oy = dpr * H / 2 - cy * k;
    const base = () => ctx.setTransform(k, 0, 0, k, ox, oy);
    const R = {
      ctx,
      rot(spr, x, y, a, sc = 1) {
        const c = Math.cos(a) * k * sc, s = Math.sin(a) * k * sc;
        ctx.setTransform(c, s, -s, c, x * k + ox, y * k + oy);
        ctx.drawImage(spr.canvas, -spr.half, -spr.half, spr.half * 2, spr.half * 2);
        ctx.setTransform(k, 0, 0, k, ox, oy);
      },
      img(spr, x, y, sc = 1) {
        const h = spr.half * sc;
        ctx.drawImage(spr.canvas, x - h, y - h, h * 2, h * 2);
      },
    };
    base();
    const { vw, vh } = this.viewSize();
    const x0 = cx - vw / 2 - 60, x1 = cx + vw / 2 + 60, y0 = cy - vh / 2 - 60, y1 = cy + vh / 2 + 60;
    const vis = (o, m = 0) => o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m;

    this.drawArena(ctx, x0, x1, y0, y1);

    ctx.globalCompositeOperation = 'lighter';
    // mines
    for (const m of this.mines) if (vis(m)) R.img(mineSprite('#ffd23d', m.arm <= 0 && Math.sin(this.time * 12) > 0), m.x, m.y);
    // gems & pickups
    for (const g of this.gems) {
      if (!vis(g)) continue;
      const col = g.v >= 10 ? '#ff4dd8' : g.v >= 3 ? '#3dff8a' : '#2fd2ff';
      R.img(gemSprite(col), g.x, g.y, g.v >= 10 ? 1.4 : g.v >= 3 ? 1.15 : 1);
    }
    for (const pk of this.pickups) {
      if (!vis(pk)) continue;
      const bob = pk.kind === 'coin' ? 1 : 1 + Math.sin(this.time * 5) * 0.1;
      R.img(pickupSprite(pk.kind), pk.x, pk.y, bob);
    }
    // damaging rings
    for (const r of this.rings) {
      const a = 1 - Math.max(0, r.t - r.dur) / 0.15;
      ctx.globalAlpha = 0.85 * a;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(r.x, r.y, Math.max(1, r.r), 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.15 * a;
      ctx.fillStyle = r.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // enemies
    for (const e of this.enemies) {
      if (e.dead || !vis(e, e.r)) continue;
      const sc = e.spawnT > 0 ? Math.max(0.05, 1 - e.spawnT / 0.35) : 1;
      if (e.boss) { this.drawBoss(R, e, sc); continue; }
      const variant = e.flash > 0 ? 'flash' : e.elite ? 'elite' : '';
      let ex = e.x, ey = e.y;
      if (e.state === 'wind') { ex += rand(-2, 2); ey += rand(-2, 2); }
      R.rot(enemySprite(e.shape, e.color, Math.round(e.r), variant), ex, ey, e.rot, sc);
      if (e.elite) this.drawBar(ctx, e.x, e.y + e.r + 10, 34, e.hp / e.maxHp, '#ffd23d');
    }

    // player bullets / enemy bullets
    ctx.globalCompositeOperation = 'lighter';
    for (const pr of this.proj) {
      if (!vis(pr)) continue;
      let spr;
      switch (pr.look) {
        case 'bolt': spr = boltSprite(pr.color, 12, 3); break;
        case 'photon': spr = boltSprite(pr.color, 22, 4); break;
        case 'pellet': spr = orbSprite(pr.color, 4); break;
        case 'missile': spr = missileSprite(pr.color); break;
        default: spr = boltSprite(pr.color, 8, 2.5);
      }
      R.rot(spr, pr.x, pr.y, pr.a, 1);
    }
    const ebs = orbSprite('#ff2d55', 6);
    for (const b of this.ebullets) if (vis(b)) R.img(ebs, b.x, b.y);

    // weapon visuals (blades, drones)
    for (const w of this.weapons) {
      const def = WEAPONS[w.id];
      if (def.render && this.state !== 'dying' && this.state !== 'over') def.render(w, this, R, weaponStats(w));
    }
    ctx.globalCompositeOperation = 'source-over';

    // player
    const p = this.player;
    if (this.state !== 'dying' && this.state !== 'over') {
      const blink = p.inv > 0 && Math.floor(this.time * 20) % 2 === 0;
      ctx.globalAlpha = blink ? 0.35 : 1;
      ctx.globalCompositeOperation = 'lighter';
      const fl = glowDot(this.ship.color, 14);
      R.img(fl, p.x - Math.cos(p.facing) * 14, p.y - Math.sin(p.facing) * 14, 0.7 + Math.random() * 0.4 + Math.min(1, p.moving / 300) * 0.5);
      ctx.globalCompositeOperation = 'source-over';
      R.rot(shipSprite(this.ship.shape, this.ship.color, this.flash > 0.15), p.x, p.y, p.facing, 1);
      ctx.globalAlpha = 1;
      this.drawBar(ctx, p.x, p.y + 26, 40, p.hp / p.maxHp, p.hp / p.maxHp > 0.35 ? '#3dff8a' : '#ff3d6e');
    }

    // particles, explosions, lightning
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this.particles) {
      if (!vis(q)) continue;
      ctx.globalAlpha = q.life / q.max;
      R.img(glowDot(q.color, 8), q.x, q.y, (q.size / 8) * (0.4 + 0.6 * (q.life / q.max)));
    }
    for (const f of this.fx) {
      const t = f.t / f.dur;
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = f.width * (1 - t) + 1;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.max * (0.2 + 0.8 * Math.sqrt(t)), 0, TAU); ctx.stroke();
    }
    for (const b of this.bolts) {
      const a = b.t / 0.2;
      for (const [lw, col, al] of [[7, b.color, 0.35], [2, '#ffffff', 1]]) {
        ctx.globalAlpha = al * a;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(b.pts[0], b.pts[1]);
        for (let i = 2; i < b.pts.length; i += 2) ctx.lineTo(b.pts[i], b.pts[i + 1]);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // damage numbers
    if (this.texts.length) {
      ctx.font = '700 13px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      for (const t of this.texts) {
        ctx.globalAlpha = Math.min(1, t.t * 3);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    }

    // screen-space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.boss && !vis(this.boss, -40)) this.drawOffscreenArrow(ctx, this.boss, cx, cy);
    const low = p.hp / p.maxHp;
    if (low < 0.35 || this.flash > 0) {
      const a = Math.max(this.flash * 1.5, low < 0.35 ? (0.35 - low) * 1.4 * (0.7 + 0.3 * Math.sin(this.time * 6)) : 0);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,30,80,0)');
      g.addColorStop(1, `rgba(255,30,80,${Math.min(0.6, a)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawArena(ctx, x0, x1, y0, y1) {
    const hw = this.arena.w / 2, hh = this.arena.h / 2;
    const grid = this.stage.world.theme.grid;
    const gs = 64;
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.09;
    ctx.beginPath();
    const ax0 = Math.max(-hw, x0), ax1 = Math.min(hw, x1), ay0 = Math.max(-hh, y0), ay1 = Math.min(hh, y1);
    for (let x = Math.ceil(ax0 / gs) * gs; x <= ax1; x += gs) { ctx.moveTo(x, ay0); ctx.lineTo(x, ay1); }
    for (let y = Math.ceil(ay0 / gs) * gs; y <= ay1; y += gs) { ctx.moveTo(ax0, y); ctx.lineTo(ax1, y); }
    ctx.stroke();
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 12;
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = grid;
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.globalAlpha = 1;
  }

  drawBoss(R, b, sc) {
    const fl = b.flash > 0;
    const pulse = 1 + Math.sin(this.time * 4) * 0.04;
    R.rot(bossLayer('outer', b.color, b.r, fl), b.x, b.y, b.rot, sc * pulse);
    R.rot(bossLayer('inner', b.phase === 2 ? '#ffd23d' : '#ff8ad0', b.r, fl), b.x, b.y, b.rot2, sc);
    R.rot(bossLayer('core', b.color, b.r, fl), b.x, b.y, 0, sc * (1 + Math.sin(this.time * 8) * 0.08));
    if (b.mode === 'charge' && b.modeT > 0.45) {
      const ctx = R.ctx;
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#ff2d55';
      ctx.lineWidth = b.r * 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + Math.cos(b.dir) * 500, b.y + Math.sin(b.dir) * 500);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawBar(ctx, x, y, w, frac, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y, w * clamp(frac, 0, 1), 3);
  }

  drawOffscreenArrow(ctx, t, cx, cy) {
    const { W, H } = this.app;
    const a = Math.atan2(t.y - cy, t.x - cx);
    const m = 40;
    const x = clamp(W / 2 + Math.cos(a) * W, m, W - m), y = clamp(H / 2 + Math.sin(a) * H, m + 60, H - m);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = '#ff2d6f';
    ctx.shadowColor = '#ff2d6f';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(-8, 10); ctx.lineTo(-3, 0); ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
