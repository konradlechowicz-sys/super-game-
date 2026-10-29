import { TAU, rand, randi, clamp, lerp, pick, weightedPick, angleLerp, SpatialHash } from './util.js';
import { ENEMIES, BOSSES, PASSIVES, PASSIVE_MAX, SHIPS, TRAITS, WORLD_TUNING, ENDLESS, xpFor, stageIndex, shopBonus } from './data.js';
import { WEAPONS, WEAPON_MAX, weaponStats } from './weapons.js';
import { COMBOS, COMBO_LEVEL, comboActive, combosFor } from './combos.js';
import { shipLook } from './store.js';
import { Tutorial, tipsOn, tipSeen, markTip } from './tutorial.js';
import { renderGame } from './render-canvas.js';
import { EDITION } from './edition.js';
import { initProps, updateProps, breakProp, hasProps } from './props.js';
import { initCover, hasCover, coverAt, updateCover } from './cover.js';
import { initCrystal, hasCrystal, updateCrystal, layCrystal } from './crystal.js';
import { ignite, updateArsenal, shieldHit } from './arsenal.js';

const MAX_WEAPONS = 4;
const MAX_PASSIVES = 4;
const DRAG_SENS = 1.5;
const MAX_LAG = 150;
const ARENA_SCALE = 1.5;
// Crowd damage (v1.1): invulnerability after touching an enemy (shots and hazards keep 0.6 s), and the squeeze bonus.
const CONTACT_INV = 0.3;
const CROWD_EXTRA = 0.3;
const CROWD_MAX = 2.5;

let nextId = 1;

export class Game {
  constructor(app, stage) {
    this.app = app;
    this.ui = app.ui;
    this.stage = stage;
    this.tune = WORLD_TUNING[stage.world?.id] || WORLD_TUNING[1];
    this.save = app.save;
    this.ship = shipLook(SHIPS[this.save.ship] || SHIPS.striker, this.save);
    const { vw, vh } = this.viewSize();
    // v1.1: the arena is 1.5x larger in both directions (was max(900, 1.8 view) x max(1300, 1.45 view)), for more room to manoeuvre
    this.arena = { w: Math.max(900, vw * 1.8) * ARENA_SCALE, h: Math.max(1300, vh * 1.45) * ARENA_SCALE };
    this.time = 0;
    this.state = 'play';
    this.enemies = []; this.proj = []; this.ebullets = []; this.gems = []; this.pickups = [];
    this.holes = []; this.fires = []; this.beams = []; // the 2.0 arsenal's black holes, burning ground, beams (js/arsenal.js)
    this.particles = []; this.hazards = []; this.rings = []; this.fx = []; this.bolts = []; this.mines = []; this.texts = [];
    this.hash = new SpatialHash(64);
    this.tmp = [];
    this.kills = 0; this.coinsRun = 0;
    this.elitesKilled = 0;
    this.level = 1; this.xp = 0; this.xpNext = xpFor(1); this.pendingLevels = 0; this.pendingChests = 0;
    this.weapons = []; this.passives = {};
    // weapon combos active this run, and the ones still to announce once the level-up cards close
    this.combos = new Set(); this.comboQueue = []; this.comboBannerT = 0;
    // Codex entries found for the first time in this run
    this.newEntries = [];
    this.spawnAcc = 0; this.eventsDone = new Set(); this.surge = null;
    this.boss = null; this.bossDefeated = false;
    // Endless mode: when the next wave, elite and boss come, and how many have come so far
    if (stage.endless) this.endless = { nextWave: ENDLESS.wave, nextElite: ENDLESS.elite, nextBoss: ENDLESS.boss, waves: 0, bosses: 0 };
    this.shake = 0; this.slowmo = 1; this.flash = 0; this.endTimer = 0;
    this.cam = { x: 0, y: 0 };
    const shop = this.save.shop;
    this.rerolls = shop.reroll || 0;
    this.reviveAvail = (shop.revive || 0) > 0;
    this.player = { x: 0, y: 0, tx: 0, ty: 0, r: 10, hp: 1, maxHp: 1, inv: 0, facing: -Math.PI / 2, moving: 0 };
    this.recompute();
    this.player.hp = this.player.maxHp;
    this.addWeapon(this.ship.weapon);
    // 2.0: world 3's craters, cover from enemy shots (js/cover.js), then each world's props to shoot (js/props.js)
    this.cover = [];
    if (EDITION === 2 && hasCover(stage.world?.id)) initCover(this);
    // world 4's black crystal network and dust storms (js/crystal.js)
    this.crystal = null; this.storm = null;
    if (EDITION === 2 && hasCrystal(stage.world?.id)) initCrystal(this);
    this.props = [];
    if (EDITION === 2 && hasProps(stage.world?.id)) initProps(this);
    this.tut = new Tutorial(this);
    if (stage.endless) this.ui.banner('ENDLESS', stage.world.name.toUpperCase());
    else this.ui.banner(`STAGE ${stage.id}`, stage.name.toUpperCase());
  }

  // How far into the sector the run is, 0 to 1; Endless keeps going past 1, so enemies keep getting tougher.
  progress() {
    const t = this.time / this.stage.duration;
    return this.stage.endless ? t : clamp(t, 0, 1);
  }

  viewSize() {
    return { vw: this.app.W / this.app.zoom, vh: this.app.H / this.app.zoom };
  }

  recompute() {
    const p = this.player, P = this.passives, s = this.ship;
    const B = (id) => shopBonus(this.save, id);
    const oldMax = p.maxHp;
    p.maxHp = s.hp + B('hull') + (P.armor || 0) * 20;
    if (oldMax > 1 && p.maxHp > oldMax) p.hp += p.maxHp - oldMax;
    p.speed = s.speed * (1 + B('thrust') + (P.thrusters || 0) * 0.08);
    p.baseDmg = s.dmg * (1 + B('power') + (P.power || 0) * 0.12);
    p.baseCd = 1 - (P.overclock || 0) * 0.08;
    p.dmgMult = p.baseDmg; p.cdMult = p.baseCd;
    p.areaMult = 1 + (P.amplifier || 0) * 0.12;
    p.magnet = 105 * (1 + B('magnet') + (P.tractor || 0) * 0.3);
    p.regen = B('regen') + (P.armor || 0) * 0.15;
    p.armor = s.armor || 0;
    p.xpMult = 1 + B('growth');
    p.coinMult = 1 + B('greed');
    // 2.0 arsenal perks: crits, setting enemies on fire, the Phase Shield (it comes up charged when taken)
    p.crit = (P.targeting || 0) * 0.06;
    p.ignite = (P.thermal || 0) * 0.08;
    p.fireMult = 1 + (P.thermal || 0) * 0.2;
    const hadShield = !!p.shieldCd;
    p.shieldCd = P.phase ? 16 - 2 * (P.phase - 1) : 0;
    if (p.shieldCd && !hadShield) { p.shieldUp = true; p.shieldT = 0; }
  }

  addWeapon(id) {
    this.weapons.push({ id, level: 1, evolved: false, t: 0.3 });
    this.discover(`w:${id}`);
  }

  // Marks a Codex entry as discovered (saved when the run ends).
  discover(key) {
    const codex = (this.save.codex ||= {});
    if (codex[key]) return;
    codex[key] = 1;
    this.newEntries.push(key);
  }

  // Stats of an owned weapon, or null.
  wstats(id) {
    const w = this.weapons.find((x) => x.id === id);
    return w ? weaponStats(w) : null;
  }

  // Turns on every combo whose two weapons have reached the combo level.
  checkCombos() {
    const p = this.player;
    for (const id in COMBOS) {
      if (this.combos.has(id) || !comboActive(this, id)) continue;
      this.combos.add(id);
      this.comboQueue.push(id);
      this.discover(`c:${id}`);
      this.addFx(p.x, p.y, 220, COMBOS[id].color, 0.6, 5);
      this.burst(p.x, p.y, COMBOS[id].color, 36, 340, 0.9, 7);
      this.sfx('evolve');
      this.app.haptic('success');
    }
  }

  // Chain lightning from (x, y): strikes `first`, then jumps to up to `chains` more enemies nearby.
  chainLightning(x, y, first, dmg, chains, color, range = 150) {
    const hit = new Set([first]);
    const pts = [x, y, first.x, first.y];
    this.damage(first, dmg, 0, 0, true);
    let cur = first;
    for (let c = 0; c < chains; c++) {
      let best = null, bd = range * range;
      for (const e of this.enemiesNear(cur.x, cur.y, range)) {
        if (hit.has(e) || e.dead) continue;
        const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) break;
      hit.add(best);
      pts.push(best.x, best.y);
      this.damage(best, dmg * 0.85, 0, 0, true);
      cur = best;
    }
    if (this.bolts.length < 40) this.addBolt(pts, color);
  }

  // Perk sets that change the ship from moment to moment: Overdrive, Hit & Run, Last Stand, Singularity.
  updatePerkSets(dt) {
    const p = this.player, C = this.combos;
    let dmg = 1, cd = 1;
    if (C.has('overdrive')) {
      // a 12 s cycle: the last 4 s fire 50% faster
      this.overdriveT = ((this.overdriveT || 0) + dt) % 12;
      const on = this.overdriveT >= 8;
      if (on && !p.overdrive) { this.text(p.x, p.y - 34, 'OVERDRIVE', COMBOS.overdrive.color, true); this.addFx(p.x, p.y, 90, COMBOS.overdrive.color, 0.4, 3); }
      p.overdrive = on;
      if (on) cd /= 1.5;
    }
    if (C.has('hitrun') && p.moving > 40) dmg *= 1.15;
    p.laststand = C.has('laststand') && p.hp < p.maxHp * 0.5;
    if (p.laststand) dmg *= 1.25;
    p.dmgMult = p.baseDmg * dmg;
    p.cdMult = p.baseCd * cd;
    if (C.has('singularity')) {
      this.singT = (this.singT ?? 0) + dt;
      if (this.singT >= 25) {
        this.singT = 0;
        for (const gm of this.gems) gm.mag = true;
        this.addFx(p.x, p.y, 320, COMBOS.singularity.color, 0.7, 4);
        this.text(p.x, p.y - 34, 'SINGULARITY', COMBOS.singularity.color, true);
        this.sfx('pickup');
      }
    }
  }

  // Combo effects of an exploding missile: Cluster Missiles (a ring of pellets) and Minelayer (a mine left behind).
  missileCombos(x, y) {
    const p = this.player;
    const sg = this.combos.has('cluster') && this.wstats('spread');
    if (sg) {
      for (let i = 0; i < 8; i++) {
        this.shoot({ x, y, a: (i / 8) * TAU + rand(-0.2, 0.2), speed: rand(420, 500), dmg: sg.dmg * p.dmgMult, pierce: 0, r: 5,
          life: 0.32 * p.areaMult, look: 'pellet', color: '#ff8a2a', knock: 120 });
      }
    }
    const mn = this.combos.has('minelayer') && this.wstats('mines');
    if (mn && Math.random() < 0.5) {
      if (this.mines.length >= 40) this.mines.shift();
      this.mines.push({ x, y, life: 6, arm: 0.3, dmg: mn.dmg * p.dmgMult, rad: mn.rad * p.areaMult });
    }
  }

  // ---------------- queries used by weapons ----------------
  nearestEnemy(x, y, maxR) {
    let best = null, bd = maxR * maxR;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  enemiesNear(x, y, r) {
    const out = [];
    this.hash.query(x, y, r, this.tmp);
    for (const e of this.tmp) {
      if (e.dead || e.spawnT > 0 || e.ghost) continue;
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

  // Floating text. Damage numbers follow the setting; gameplay cues (always = true) show regardless.
  text(x, y, str, color = '#ffffff', always = false) {
    if (!always && !this.save.settings.dmgNums) return;
    if (this.texts.length > 45) this.texts.shift();
    this.texts.push({ x: x + rand(-6, 6), y, str, color, t: 0.55 });
  }

  // ---------------- combat ----------------
  // opt: { fire } burn damage (no crit, never sets on fire again), { noCrit }, { breakShield } a crit breaks a shield
  damage(e, dmg, kx = 0, ky = 0, quiet = false, opt) {
    if (e.dead) return;
    if (e.parent) {
      // boss body segment: the boss takes reduced damage through its body
      e.flash = 0.07;
      this.damage(e.parent, dmg * 0.6, 0, 0, quiet, opt);
      return;
    }
    // 2.0 arsenal: Targeting Matrix crits (double damage), Thermal Core sets enemies on fire
    const p = this.player;
    const crit = p.crit > 0 && !opt?.noCrit && Math.random() < p.crit;
    if (crit) dmg *= 2;
    if (p.ignite > 0 && !opt?.fire && !e.prop && Math.random() < p.ignite) ignite(e, 8 * p.dmgMult * p.fireMult, 3);
    // Gauss Lance: a critical hit breaks a shield outright
    if (crit && opt?.breakShield && e.shield > 0) e.shield = 0.001;
    if (e.shield > 0) {
      // a shielded elite's shield soaks damage first and regrows after 4 s without hits
      const soak = Math.min(e.shield, dmg);
      e.shield -= soak; dmg -= soak; e.lastHit = this.time;
      if (e.shield <= 0 && e.maxShield) { this.text(e.x, e.y - e.r - 12, 'SHIELD DOWN', TRAITS.shielded.color, true); this.burst(e.x, e.y, TRAITS.shielded.color, 14, 220, 0.4); }
    }
    if (e.traits) e.lastHit = this.time;
    e.hp -= dmg;
    e.flash = 0.07;
    if (!e.boss) { e.kx += kx * e.kbRes; e.ky += ky * e.kbRes; }
    if (crit) this.text(e.x, e.y - e.r, `${Math.round(dmg)}!`, '#ffd23d');
    else this.text(e.x, e.y - e.r, Math.round(dmg), opt?.fire ? '#ff8a2a' : '#ffffff');
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
    if (e.prop) { breakProp(this, e); return; }
    e.dead = true;
    this.kills++;
    if (e.stageElite) this.elitesKilled++;
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
      // a trait elite's crate holds two rewards and it drops more coins (12 plain, 20 with one trait, 28 with two)
      const nt = e.traits ? e.traits.size : 0;
      this.pickups.push({ x: e.x, y: e.y, kind: 'chest', v: nt ? 2 : 1 });
      for (let i = 0; i < 6 + nt * 4; i++) this.pickups.push({ x: e.x + rand(-25, 25), y: e.y + rand(-25, 25), kind: 'coin', v: 2 });
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

  // inv = invulnerability after the hit: 0.6 s for shots and hazards, shorter for touching enemies (see CONTACT_INV)
  hurtPlayer(dmg, src = '?', inv = 0.6) {
    const p = this.player;
    if (p.inv > 0 || this.state !== 'play' || this.app.god) return;
    if (shieldHit(this)) return;
    // the world's damage level, rising towards the end of the sector
    const T = this.tune;
    dmg *= T.dmg * (1 + T.ramp * this.progress());
    dmg = Math.max(1, dmg - p.armor);
    p.hp -= dmg;
    (this.dmgLog ||= {})[src] = (this.dmgLog[src] || 0) + dmg;
    p.inv = inv;
    this.app.haptic('medium');
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
    this.app.haptic('heavy');
  }

  onBossDeath(b) {
    this.boss = null;
    if (this.endless) return this.onEndlessBossDeath(b);
    this.bossDefeated = true;
    this.ui.bossBar(null);
    this.sfx('bigboom');
    this.app.haptic('heavy');
    this.shake = 28;
    this.slowmo = 0.3;
    for (let i = 0; i < 30; i++) this.pickups.push({ x: b.x + rand(-80, 80), y: b.y + rand(-80, 80), kind: 'coin', v: 3 });
    for (let i = 0; i < 12; i++) this.dropGem(b.x + rand(-60, 60), b.y + rand(-60, 60), 10);
    // clear the field
    for (const e of this.enemies) if (!e.dead) { e.dead = true; this.burst(e.x, e.y, e.color, 6, 200, 0.5); }
    this.hazards.length = 0;
    this.state = 'winning';
    this.endTimer = 2.8;
  }

  // Endless: the boss drops its rewards and the run goes on; the next one comes 5 minutes later.
  onEndlessBossDeath(b) {
    this.ui.bossBar(null);
    this.sfx('bigboom');
    this.app.haptic('heavy');
    this.shake = 20;
    for (let i = 0; i < 30; i++) this.pickups.push({ x: b.x + rand(-80, 80), y: b.y + rand(-80, 80), kind: 'coin', v: 3 });
    for (let i = 0; i < 12; i++) this.dropGem(b.x + rand(-60, 60), b.y + rand(-60, 60), 10);
    this.hazards.length = 0;
    this.endless.nextBoss = this.time + ENDLESS.boss;
    this.endless.nextWave = Math.max(this.endless.nextWave, this.time + 10);
    this.ui.banner('BOSS DESTROYED', 'THE SWARM KEEPS COMING');
    this.app.audio.setTrack(this.stage.world.music || 'game');
  }

  // ---------------- spawning ----------------
  spawnEnemy(type, x, y, elite = false, traits = []) {
    const d = ENEMIES[type], st = this.stage;
    // Enemy toughness ramps from 1x to the stage's peak, since every run starts with a fresh build.
    const hpMul = lerp(st.hp0 || 1, st.hp, this.progress()) * this.tune.hp * (elite ? this.tune.elite : 1);
    const e = {
      id: nextId++, type, def: d, x, y, kx: 0, ky: 0, color: d.color, shape: d.shape,
      hp: d.hp * hpMul * (elite ? 7 : 1), r: d.r * (elite ? 1.6 : 1), speed: d.speed * st.speed * (elite ? 0.9 : 1),
      dmg: d.dmg * (elite ? 1.5 : 1), xp: d.xp * (elite ? 12 : 1), elite, flash: 0, spawnT: 0.35,
      rot: 0, state: 'chase', t: 0, cd: rand(0.5, 2), kbRes: d.speed === 0 ? 0 : elite ? 0.25 : d.r > 18 ? 0.4 : 1, alpha: 1,
    };
    e.maxHp = e.hp;
    if (traits.length) this.applyTraits(e, traits);
    if (d.ai === 'drift') {
      const p = this.player;
      const a = Math.atan2(p.y - y, p.x - x) + rand(-0.35, 0.35);
      const sp = e.speed * rand(0.9, 1.3);
      e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp;
    }
    this.enemies.push(e);
    return e;
  }

  spawnElite(type, x, y, traits = []) {
    const e = this.spawnEnemy(type, x, y, true, traits);
    if (e.traits?.has('commander')) {
      // an escort of six; a stationary commander (turret) brings the sector's first enemy type instead
      const esc = ENEMIES[type].speed === 0 ? this.stage.enemies[0][0] : type;
      e.escort = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        e.escort.push(this.spawnEnemy(esc, x + Math.cos(a) * 70, y + Math.sin(a) * 70));
      }
    }
    return e;
  }

  // Elite traits (v1.1): stat changes at spawn; behaviour lives in updateTraits, drawing in drawTraits.
  applyTraits(e, traits) {
    e.traits = new Set(traits);
    const d = e.def;
    // tougher than a plain elite, more so later in the sector: x10 health at the start, up to x14 at the end;
    // heavy enemies (tank, golem...) x8 to x11, or they take minutes to bring down
    const late = clamp(this.progress(), 0, 1);
    e.hp *= (d.hp >= 100 ? 8 + 3 * late : 10 + 4 * late) / 7;
    if (e.traits.has('swift') && d.speed > 0) { e.speed = (e.speed / 0.9) * 1.7; e.sw = { cd: 2, t: 0, phase: 'run' }; }
    if (e.traits.has('bulwark')) { e.hp *= 1.2; e.r *= 1.25; e.kbRes = 0; }
    if (e.traits.has('berserker')) e.slamT = 0;
    if (e.traits.has('commander')) e.callT = 10;
    if (e.traits.has('shielded')) e.wardT = 3;
    if (e.traits.has('berserker')) e.dmg = (e.dmg / 1.5) * 2.5;
    if (e.traits.has('shielded')) { e.shield = e.maxShield = e.hp * 0.35; e.lastHit = -9; }
    e.maxHp = e.hp;
  }

  // Damage an enemy deals: berserker rage and a commander's aura. Shots of a berserker hit harder too (its contact
  // damage is already raised at spawn).
  dmgMul(e) {
    return (e.enraged ? 1.25 : 1) * (e.buffT > 0 ? 1.2 : 1);
  }

  shotDmg(e, base) {
    return base * this.dmgMul(e) * (e.traits?.has('berserker') ? 1.6 : 1);
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

  fixedCount() {
    let n = 0;
    for (const e of this.enemies) if (!e.dead && !e.boss && !e.prop && e.def?.speed === 0) n++;
    return n;
  }

  // Stationary enemies are placed near the player, everything else just off-screen.
  posFor(type) {
    if (ENEMIES[type].speed > 0) return this.spawnPos();
    // not inside a crater (world 3): its own shots would break on it
    let pos = this.nearPos(rand(190, 280));
    for (let k = 0; k < 8 && this.cover.length && coverAt(this, pos.x, pos.y, 20); k++) pos = this.nearPos(rand(190, 280));
    return pos;
  }

  nearPos(R) {
    const p = this.player, a = rand(0, TAU);
    const hw = this.arena.w / 2 - 30, hh = this.arena.h / 2 - 30;
    return { x: clamp(p.x + Math.cos(a) * R, -hw, hw), y: clamp(p.y + Math.sin(a) * R, -hh, hh) };
  }

  spawnOne() {
    let pool = this.stage.enemies.filter((e) => this.time >= e[1]);
    // enemies set in the ground (world 3's turrets and mortar nodes) are capped (stage `fixed`, 5 by default), so they
    // never wall in the ship or fill the sky with shells
    if (pool.some((e) => ENEMIES[e[0]].speed === 0) && this.fixedCount() >= (this.stage.fixed ?? 5)) pool = pool.filter((e) => ENEMIES[e[0]].speed > 0);
    const [type] = weightedPick(pool, (e) => e[2]);
    const d = ENEMIES[type];
    const pos = this.posFor(type);
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
      // a stationary elite (turret) is placed in sight, closer than a normal turret
      const pos = ENEMIES[ev.enemy].speed > 0 ? this.posFor(ev.enemy) : this.nearPos(150);
      // only the sector's own elites count for the 3rd star (not the ones the tester's panel spawns)
      this.spawnElite(ev.enemy, pos.x, pos.y, ev.traits || []).stageElite = true;
    } else if (ev.type === 'surge') {
      this.surge = { until: this.time + ev.dur, mul: ev.mul };
    } else if (ev.type === 'mortar') {
      this.mortars(ev.count, 1.3);
    } else if (ev.type === 'well') {
      this.wells(ev.count);
    } else if (ev.type === 'flare') {
      this.flares(ev.count);
    } else if (ev.type === 'asteroids') {
      const { vw, vh } = this.viewSize();
      const a = rand(0, TAU), R = Math.hypot(vw, vh) / 2 + 60;
      const cx = p.x + Math.cos(a) * R, cy = p.y + Math.sin(a) * R;
      for (let i = 0; i < ev.count; i++) {
        const off = (i - (ev.count - 1) / 2) * 95;
        const e = this.spawnEnemy('asteroid', cx - Math.sin(a) * off, cy + Math.cos(a) * off);
        const sp = e.speed * rand(0.9, 1.4);
        e.vx = Math.cos(a + Math.PI) * sp; e.vy = Math.sin(a + Math.PI) * sp;
      }
    }
  }

  // ---------------- hazards: telegraphed beams, mortar strikes, gravity wells ----------------
  addHazard(h) {
    h.t = 0;
    this.hazards.push(h);
  }

  mortars(n, warn) {
    const p = this.player;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), R = i === 0 ? 0 : rand(50, 230);
      this.addHazard({ kind: 'mortar', x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R, r: 62, warn: warn + i * 0.12, dmg: 14 });
    }
    this.sfx('warn');
  }

  wells(n) {
    const p = this.player;
    const hw = this.arena.w / 2 - 60, hh = this.arena.h / 2 - 60;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), R = rand(180, 260);
      this.addHazard({ kind: 'well', x: clamp(p.x + Math.cos(a) * R, -hw, hw), y: clamp(p.y + Math.sin(a) * R, -hh, hh), r: 26, pullR: 320, dur: 7, dmg: 10, warn: 0.6 });
    }
  }

  flares(n) {
    const p = this.player;
    const len = Math.max(this.arena.w, this.arena.h);
    for (let i = 0; i < n; i++) {
      const vert = Math.random() < 0.5;
      const off = rand(-160, 160);
      this.addHazard({ kind: 'beam', centered: true, x: vert ? p.x + off : 0, y: vert ? 0 : p.y + off, a: vert ? Math.PI / 2 : 0, len, w: 38, warn: 1.4 + i * 0.4, dur: 0.55, dmg: 16, rot: 0 });
    }
  }

  // World 1 "Orbital Ruins" (Art Bible): a big fragment of a station falls through the arena. First a shadowed amber
  // corridor warns for `warn` seconds, then the wreck crosses it in `dur` seconds, crushing enemies (and props: fuel
  // tanks go off) and hurting the ship if it is still inside. Aimed at a point near the ship, from off-screen.
  fallingWreck() {
    const p = this.player, { vw, vh } = this.viewSize();
    const a = rand(0, TAU), L = Math.hypot(vw, vh) / 2 + 260;
    const tx = p.x + rand(-160, 160), ty = p.y + rand(-160, 160);
    const c = Math.cos(a), s = Math.sin(a);
    this.addHazard({ kind: 'wreck', x0: tx - c * L, y0: ty - s * L, x1: tx + c * L, y1: ty + s * L, a, w: 96, warn: 1.8, dur: 1.1,
      art: randi(1, 4), spin: rand(-2.5, 2.5), hit: new Set(), x: tx - c * L, y: ty - s * L });
    this.sfx('warn');
  }

  beamEnds(h) {
    const c = Math.cos(h.a), s = Math.sin(h.a);
    return h.centered ? [h.x - c * h.len, h.y - s * h.len, h.x + c * h.len, h.y + s * h.len] : [h.x, h.y, h.x + c * h.len, h.y + s * h.len];
  }

  updateHazards(dt) {
    const p = this.player;
    const live = this.state === 'play';
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.t += dt;
      let done = false;
      if (h.kind === 'beam') {
        if (h.owner) {
          if (h.owner.dead) done = true;
          h.x = h.owner.x; h.y = h.owner.y;
        }
        if (h.t > h.warn) {
          h.a += h.rot * dt;
          if (!h.fired) { h.fired = true; this.sfx('laser'); if (h.centered) this.shake = Math.max(this.shake, 6); }
          if (live) {
            const [x0, y0, x1, y1] = this.beamEnds(h);
            const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1;
            const t = clamp(((p.x - x0) * vx + (p.y - y0) * vy) / l2, 0, 1);
            if (Math.hypot(p.x - (x0 + vx * t), p.y - (y0 + vy * t)) < h.w / 2 + p.r - 3) this.hurtPlayer(h.dmg, 'beam');
          }
        }
        if (h.t > h.warn + h.dur) done = true;
      } else if (h.kind === 'wreck') {
        const k = (h.t - h.warn) / h.dur;
        if (k >= 0) {
          if (!h.fired) { h.fired = true; this.sfx('boom'); this.shake = Math.max(this.shake, 7); }
          h.x = lerp(h.x0, h.x1, Math.min(1, k)); h.y = lerp(h.y0, h.y1, Math.min(1, k));
          // crushes what it passes, once each, and throws it along its way
          const st = this.stage, tough = lerp(st.hp0 || 1, st.hp, this.progress()) * this.tune.hp;
          for (const e of this.enemiesNear(h.x, h.y, h.w / 2)) {
            if (h.hit.has(e)) continue;
            h.hit.add(e);
            this.damage(e, 90 * tough, Math.cos(h.a) * 500, Math.sin(h.a) * 500, true);
          }
          if (live && !h.hit.has(p) && Math.hypot(p.x - h.x, p.y - h.y) < h.w * 0.42 + p.r) { h.hit.add(p); this.hurtPlayer(16, 'wreck'); }
          if (this.particles.length < 600) this.burst(h.x, h.y, '#ffb02e', 3, 200, 0.4, 5);
          if (k >= 1) done = true;
        }
      } else if (h.kind === 'mortar') {
        if (h.t >= h.warn) {
          done = true;
          this.addFx(h.x, h.y, h.r, h.color || '#ff8a2a', 0.35, 5);
          this.burst(h.x, h.y, h.color || '#ffb52e', 12, 260, 0.45, 7);
          this.sfx('boom');
          this.shake = Math.max(this.shake, 5);
          if (live && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r) this.hurtPlayer(h.dmg, 'mortar');
        }
      } else if (h.kind === 'well') {
        if (h.t > h.warn && live) {
          const dx = h.x - p.x, dy = h.y - p.y, d = Math.hypot(dx, dy) || 1;
          if (d < h.pullR) {
            const f = 165 * (1 - d / h.pullR) + 40;
            const mx = (dx / d) * f * dt, my = (dy / d) * f * dt;
            p.x += mx; p.y += my; p.tx += mx; p.ty += my;
          }
          if (d < h.r + p.r) this.hurtPlayer(h.dmg, 'well');
          for (const g of this.gems) {
            const gx = h.x - g.x, gy = h.y - g.y, gd = Math.hypot(gx, gy) || 1;
            if (gd < h.pullR && !g.mag) { g.x += (gx / gd) * 60 * dt; g.y += (gy / gd) * 60 * dt; }
          }
        }
        if (h.t > h.dur) done = true;
      }
      if (done) this.hazards.splice(i, 1);
    }
  }

  spawnBoss() {
    const def = BOSSES[this.stage.boss];
    const p = this.player;
    const { vh } = this.viewSize();
    const hh = this.arena.h / 2 - 80;
    const b = {
      id: nextId++, boss: true, def, name: def.name, x: p.x, y: clamp(p.y - vh * (def.move === 'anchor' ? 0.27 : 0.4), -hh, hh), kx: 0, ky: 0,
      hp: def.hp * this.tune.boss * (this.endless ? 1 + ENDLESS.bossGrowth * this.endless.bosses++ : 1), r: def.r, speed: def.speed, dmg: def.dmg, color: def.color, flash: 0, spawnT: 1.2,
      rot: 0, rot2: 0, phase: 1, atk: 0, atkT: 2.5, mode: 'idle', modeT: 0, spin: 0, kbRes: 0, alpha: 1,
      heading: Math.PI / 2, lunge: 0,
    };
    b.maxHp = b.hp;
    if (def.segments) {
      // Serpent body: segments follow the head's recorded path.
      b.trail = [];
      for (let i = 0; i < 400; i++) b.trail.push({ x: b.x, y: b.y - i * 3 });
      b.segs = [];
      for (let i = 0; i < def.segments; i++) {
        const seg = {
          id: nextId++, seg: true, parent: b, def: {}, x: b.x, y: b.y - (i + 1) * def.segSpacing, r: def.segR * (1 - i * 0.025),
          color: def.color, hp: 1, maxHp: 1, dmg: def.dmg * 0.7, flash: 0, spawnT: 1.2, rot: -Math.PI / 2, kx: 0, ky: 0, kbRes: 0, alpha: 1,
        };
        b.segs.push(seg);
        this.enemies.push(seg);
      }
    }
    this.boss = b;
    this.enemies.push(b);
    this.pickups.push({ x: p.x + rand(-40, 40), y: p.y + 60, kind: 'heal', v: 1 });
    // Boss entrance: a shockwave clears the small fry and the player gets a breather.
    for (const e of this.enemies) {
      if (e.dead || e.boss || e.seg || e.elite) continue;
      e.dead = true;
      this.burst(e.x, e.y, e.color, 5, 180, 0.4);
    }
    this.ebullets.length = 0;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.5);
    p.inv = Math.max(p.inv, 1.5);
    this.addFx(p.x, p.y, 500, '#ffffff', 0.7, 6);
    this.text(p.x, p.y - 24, 'HULL RESTORED', '#3dff8a');
    this.ui.banner('WARNING', `${def.name} APPROACHES`);
    this.ui.bossBar(def.name, 1);
    this.app.audio.setTrack(this.stage.world.bossMusic || 'boss');
    this.sfx('boss');
    this.app.haptic('heavy');
    this.shake = 14;
  }

  directSpawns(dt) {
    const st = this.stage;
    let rate = lerp(st.rate[0], st.rate[1], this.progress());
    if (this.surge && this.time < this.surge.until) rate *= this.surge.mul;
    if (this.boss) rate *= this.boss.def.bgSpawn ?? 0.35;
    if (this.bossDefeated) rate = 0;
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.length < st.max) this.spawnOne();
    }
    // world 1 (2.0): a falling wreck every `wrecks[1]` seconds (±20%), the first at `wrecks[0]`
    if (st.wrecks && !this.bossDefeated) {
      this.wreckAt ??= st.wrecks[0];
      if (this.time >= this.wreckAt) { this.wreckAt = this.time + st.wrecks[1] * rand(0.8, 1.2); this.fallingWreck(); }
    }
    for (let i = 0; i < st.events.length; i++) {
      if (!this.eventsDone.has(i) && this.time >= st.events[i].t) {
        this.eventsDone.add(i);
        this.runEvent(st.events[i]);
      }
    }
    if (st.endless) {
      this.endlessEvents();
    } else if (st.boss) {
      if (!this.boss && !this.bossDefeated && this.time >= st.bossAt) this.spawnBoss();
    } else if (this.time >= st.duration) {
      this.win();
    }
  }

  // Endless mode: a wave every minute (a ring, a surge or one of the world's hazards, growing), an elite every
  // 2.5 minutes and the boss every 5 minutes, counted from the last boss's death; no waves while a boss is up.
  endlessEvents() {
    const E = ENDLESS, k = this.endless, st = this.stage, t = this.time;
    if (!this.boss && t >= k.nextBoss) { this.spawnBoss(); return; }
    if (this.boss) { k.nextWave = Math.max(k.nextWave, t + 20); return; }
    if (t >= k.nextWave) {
      k.nextWave += E.wave;
      const n = k.waves++;
      const kinds = ['ring', 'surge', ...st.hazards];
      const kind = kinds[n % kinds.length];
      const min = Math.floor(t / 60);
      if (kind === 'ring') {
        const pool = st.enemies.filter((e) => t >= e[1] && !ENEMIES[e[0]].pack && ENEMIES[e[0]].speed > 0);
        this.runEvent({ type: 'ring', enemy: pick(pool)[0], count: 16 + 4 * min, msg: `WAVE ${n + 1}` });
      } else if (kind === 'surge') this.runEvent({ type: 'surge', dur: 25, mul: 2, msg: `WAVE ${n + 1}` });
      else {
        // flares and gravity wells are dangerous in numbers, so they grow slower than asteroids and mortars
        const count = kind === 'flare' ? Math.min(5, 2 + (min >> 1)) : kind === 'well' ? Math.min(4, 1 + Math.floor(min / 3)) : Math.min(12, 4 + min);
        this.runEvent({ type: kind, count, msg: `WAVE ${n + 1}` });
      }
    }
    if (t >= k.nextElite) {
      k.nextElite += E.elite;
      const pool = st.enemies.filter((e) => t >= e[1] && !ENEMIES[e[0]].pack);
      const names = Object.keys(TRAITS);
      const traits = [pick(names)];
      if (t >= E.twoTraits) traits.push(pick(names.filter((x) => x !== traits[0])));
      this.runEvent({ type: 'elite', enemy: pick(pool)[0], traits, msg: `${traits.map((x) => TRAITS[x].name).join(' ')} ELITE` });
    }
  }

  win() {
    this.hazards.length = 0;
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
      else if (!w.evolved && w.level < WEAPON_MAX) opts.push({ kind: 'wlvl', id: w.id, wt: 10 + (combosFor(this, false, w.id, w.level + 1).length ? 4 : 0) });
    }
    if (this.weapons.length < MAX_WEAPONS) {
      // a weapon that pairs into a combo with one already owned comes up a little more often
      for (const id in WEAPONS) if (!this.weapons.some((w) => w.id === id)) opts.push({ kind: 'wnew', id, wt: combosFor(this, false, id, 1).length ? 10 : 7 });
    }
    const pc = Object.keys(P).length;
    for (const id in PASSIVES) {
      const l = P[id] || 0;
      // a perk that builds a perk set with one already owned comes up a little more often
      const set = combosFor(this, true, id, l + 1).length ? 3 : 0;
      if (l > 0 && l < PASSIVE_MAX) opts.push({ kind: 'plvl', id, wt: 7 + set });
      else if (l === 0 && pc < MAX_PASSIVES) opts.push({ kind: 'pnew', id, wt: 5 + set });
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
      return { ...c, name: def.name, tag: w ? `LV ${lvl}` : 'NEW', desc, ...this.comboHint(false, c.id, lvl), icon: def.icon, color: def.color };
    }
    const def = PASSIVES[c.id];
    const lvl = (this.passives[c.id] || 0) + 1;
    return { ...c, name: def.name, tag: lvl === 1 ? 'NEW' : `LV ${lvl}`, desc: def.desc, ...this.comboHint(true, c.id, lvl), icon: def.icon, color: def.color };
  }

  // Combo hint on a card: only for a partner the player already has, so the rest stays a discovery.
  comboHint(perk, id, lvl) {
    const combos = combosFor(this, perk, id, lvl);
    const done = combos.find((x) => x.done);
    const what = perk ? 'perk set' : 'combo';
    const comboHint = done ? `Unlocks ${what}: ${COMBOS[done.id].name}`
      : combos.length ? `${perk ? 'Set' : 'Combo'} with ${combos.map((x) => x.partner).join(' / ')} at LV ${COMBO_LEVEL}` : '';
    return { comboHint, combo: !!done };
  }

  applyCard(c) {
    const p = this.player;
    switch (c.kind) {
      case 'wnew': this.addWeapon(c.id); break;
      case 'wlvl': this.weapons.find((w) => w.id === c.id).level++; break;
      case 'evo': {
        this.weapons.find((w) => w.id === c.id).evolved = true;
        this.discover(`e:${c.id}`);
        this.addFx(p.x, p.y, 260, '#ffd23d', 0.7, 6);
        this.burst(p.x, p.y, '#ffd23d', 50, 380, 1, 8);
        this.sfx('evolve');
        this.app.haptic('success');
        break;
      }
      case 'pnew': case 'plvl':
        this.passives[c.id] = (this.passives[c.id] || 0) + 1;
        this.discover(`p:${c.id}`);
        this.recompute();
        break;
      case 'heal': p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4); break;
      case 'coins': this.coinsRun += 25; break;
    }
    this.checkCombos();
  }

  openCards(chest) {
    this.state = 'levelup';
    this.tut.interrupt();
    if (chest) this.coinsRun += 10;
    this.sfx(chest ? 'chest' : 'levelup');
    this.app.haptic('light');
    // Count level-ups that arrive together so the player sees "2/3" and knows the previous pick registered.
    const left = chest ? this.pendingChests : this.pendingLevels;
    if (!this.batch || this.batch.chest !== chest || this.batch.left < left) this.batch = { chest, total: left, left };
    this.batch.left = left;
    let hint = null;
    const show = () => {
      const cards = this.rollCards(3, chest);
      hint ??= this.cardHint(chest, cards);
      this.ui.levelUp({
        hint,
        step: this.batch.total - left + 1, steps: this.batch.total,
        title: chest ? 'SUPPLY CRATE' : 'LEVEL UP!',
        sub: chest ? 'Choose your reward' : `Level ${this.level - this.pendingLevels + 1}`,
        cards, rerolls: this.rerolls, build: this.buildSummary(),
        onPick: (i) => {
          this.applyCard(cards[i]);
          if (chest) this.pendingChests--; else this.pendingLevels--;
          if ((chest ? this.pendingChests : this.pendingLevels) === 0) this.batch = null;
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

  // First-time explanation shown above the cards (tutorial).
  cardHint(chest, cards) {
    if (!tipsOn(this.save)) return '';
    const tips = [
      ['evo', cards.some((c) => c.kind === 'evo'), 'Evolution! A max-level weapon plus its partner upgrade becomes a super weapon.'],
      ['combo', cards.some((c) => c.comboHint), 'Two matching weapons (or perks) at level 3 unlock a COMBO. Watch for the ⚡ line on cards.'],
      ['crate', chest, 'A free pick. Crates are the surest way to evolve a weapon.'],
      ['level', !chest, 'Pick one card. New weapons and upgrades last until the end of this run.'],
    ];
    const t = tips.find(([id, when]) => when && !tipSeen(this.save, id));
    if (!t) return '';
    markTip(this.app, t[0]);
    return t[2];
  }

  buildSummary() {
    return {
      weapons: this.weapons.map((w) => ({ id: w.id, icon: WEAPONS[w.id].icon, color: w.evolved ? '#ffd23d' : WEAPONS[w.id].color, level: w.evolved ? '★' : w.level, name: w.evolved ? WEAPONS[w.id].evo.name : WEAPONS[w.id].name })),
      passives: Object.entries(this.passives).map(([id, l]) => ({ id, icon: PASSIVES[id].icon, color: PASSIVES[id].color, level: l, name: PASSIVES[id].name })),
      combos: [...this.combos].map((id) => ({ id, name: COMBOS[id].name, color: COMBOS[id].color, desc: COMBOS[id].desc })),
    };
  }

  // ---------------- main update ----------------
  update(rawDt) {
    if (this.state === 'levelup' || this.state === 'paused' || this.state === 'revive' || this.state === 'over') return;
    this.slowmo = Math.min(1, this.slowmo + rawDt * (this.state === 'play' ? 1.5 : 0.25));
    // a tutorial hint waiting for the player slows the action down
    if (this.state === 'play') this.slowmo = Math.min(this.slowmo, this.tut.update(rawDt));
    else if (this.tut.tip) this.tut.close(false);
    const dt = rawDt * this.slowmo;
    this.time += this.state === 'play' ? dt : 0;
    const p = this.player;

    this.updatePlayer(dt);

    this.hash.clear();
    for (const e of this.enemies) if (!e.dead) this.hash.insert(e);
    for (const o of this.props) if (!o.dead) this.hash.insert(o);

    if (this.state === 'play') {
      // announce new combos one at a time once the cards are closed
      this.comboBannerT -= rawDt;
      if (this.comboQueue.length && this.comboBannerT <= 0) {
        const c = COMBOS[this.comboQueue.shift()];
        this.ui.banner(c.perk ? 'PERK SET!' : 'COMBO!', c.name.toUpperCase());
        this.comboBannerT = 2.2;
      }
      this.updatePerkSets(dt);
      for (const w of this.weapons) WEAPONS[w.id].update(w, this, dt, weaponStats(w));
      this.directSpawns(dt);
      if (this.props.length) updateProps(this, dt);
      if (this.crystal) updateCrystal(this, dt);
      if (this.cover.length) updateCover(this, dt);
    }

    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateEnemyBullets(dt);
    this.updateHazards(dt);
    this.updateRings(dt);
    this.updateMines(dt);
    updateArsenal(this, dt);
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
    // a bulwark elite's aura (measured last frame) slows the ship
    const slow = this.slowNow = this.slowNext ?? 1;
    this.slowNext = 1;
    const speed = p.speed * slow;
    const hw = this.arena.w / 2 - p.r, hh = this.arena.h / 2 - p.r;
    if (this.state === 'dying') return;
    if (inp.dx || inp.dy) {
      p.tx += (inp.dx * DRAG_SENS) / this.app.zoom;
      p.ty += (inp.dy * DRAG_SENS) / this.app.zoom;
      inp.dx = inp.dy = 0;
    }
    if (inp.jx || inp.jy) {
      // analog joystick: speed scales with how far the knob is pushed
      p.tx = p.x + inp.jx * speed * dt;
      p.ty = p.y + inp.jy * speed * dt;
    } else if (inp.joy) {
      p.tx = p.x;
      p.ty = p.y;
    }
    const kx = inp.keyX(), ky = inp.keyY();
    if (kx || ky) {
      const l = Math.hypot(kx, ky);
      p.tx = p.x + (kx / l) * speed * 0.12;
      p.ty = p.y + (ky / l) * speed * 0.12;
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
    const step = speed * dt;
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
    const contacts = this.contacts || (this.contacts = []);
    contacts.length = 0;
    const hw = this.arena.w / 2, hh = this.arena.h / 2;
    const near = this.tmp2 || (this.tmp2 = []);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) { this.enemies[i] = this.enemies[this.enemies.length - 1]; this.enemies.pop(); continue; }
      e.flash -= dt;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      if (e.boss) { this.updateBoss(e, dt); continue; }
      if (e.seg) {
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r) this.hurtPlayer(e.dmg, 'boss');
        continue;
      }
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      // a stationary enemy left far behind is taken away (no kill), so new ones can come up near the ship
      if (e.def.speed === 0 && !e.elite && d > 1100) { e.dead = true; continue; }
      let mx = (dx / d) * e.speed, my = (dy / d) * e.speed;
      const ai = e.def.ai;
      let bounded = true, separate = true;
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
          e.cd = (e.def.fire || 3.2) * (e.elite ? 0.45 : 1);
          const a = Math.atan2(dy, dx);
          const n = (e.def.shots || 1) + (e.elite ? 2 : 0);
          for (let k = 0; k < n; k++) this.enemyShoot(e.x, e.y, a + (k - (n - 1) / 2) * 0.25, 165, this.shotDmg(e, 6));
        }
      } else if (ai === 'orbit') {
        // circle the player, then lunge in
        if (e.state === 'chase') {
          if (d < 320) {
            e.oa ??= Math.atan2(-dy, -dx);
            e.oa += dt * 1.3 * (e.id % 2 ? 1 : -1);
            const ex = p.x + Math.cos(e.oa) * 170 - e.x, ey = p.y + Math.sin(e.oa) * 170 - e.y, el = Math.hypot(ex, ey) || 1;
            mx = (ex / el) * e.speed; my = (ey / el) * e.speed;
          }
          e.cd -= dt;
          if (e.cd <= 0 && d < 260) { e.state = 'wind'; e.t = 0.35; e.dir = Math.atan2(dy, dx); }
        } else if (e.state === 'wind') {
          mx = my = 0; e.t -= dt; e.flash = Math.max(e.flash, Math.sin(e.t * 40) > 0 ? 0.02 : 0);
          if (e.t <= 0) { e.state = 'dash'; e.t = 0.45; }
        } else {
          mx = Math.cos(e.dir) * 430; my = Math.sin(e.dir) * 430; e.t -= dt;
          if (e.t <= 0) { e.state = 'chase'; e.cd = rand(2.5, 4); e.oa = undefined; }
        }
      } else if (ai === 'drift') {
        mx = e.vx; my = e.vy; bounded = false; separate = false;
        if (Math.abs(e.x) > hw + 90 || Math.abs(e.y) > hh + 90) { e.dead = true; continue; }
      } else if (ai === 'fuse') {
        if (e.state === 'chase' && d < 70) { e.state = 'fuse'; e.t = 0.8; }
        if (e.state === 'fuse') {
          mx *= 0.25; my *= 0.25; e.t -= dt;
          e.flash = Math.max(e.flash, Math.sin(e.t * 30) > 0 ? 0.03 : 0);
          if (e.t <= 0) { this.detonate(e); continue; }
        }
      } else if (ai === 'turret') {
        mx = my = 0; separate = false;
        // aim: turns its gun after the ship and fires a short fan at it (world 3's crater turret)
        if (e.def.aim) e.rot = angleLerp(e.rot, Math.atan2(dy, dx), Math.min(1, dt * 2.2));
        e.cd -= dt;
        if (e.cd < 0.3) e.flash = Math.max(e.flash, 0.02);
        if (e.cd <= 0 && d < 430) {
          e.cd = e.elite ? 1.4 : 2.6;
          if (e.def.aim) {
            const n = e.elite ? 5 : 3;
            for (let k = 0; k < n; k++) this.enemyShoot(e.x, e.y, e.rot + (k - (n - 1) / 2) * 0.2, 175, this.shotDmg(e, 6));
          } else {
            const n = e.elite ? 8 : 4;
            for (let k = 0; k < n; k++) this.enemyShoot(e.x, e.y, e.rot + (k / n) * TAU, 150, this.shotDmg(e, 6));
          }
        }
      } else if (ai === 'lob') {
        // a mortar set in the ground (world 3): every few seconds a shell lands where the ship is, after a warning
        // circle; craters do not stop it
        mx = my = 0; separate = false;
        e.rot = angleLerp(e.rot, Math.atan2(dy, dx), Math.min(1, dt * 2));
        e.cd -= dt;
        if (e.cd < 0.4) e.flash = Math.max(e.flash, 0.02);
        if (e.cd <= 0 && d < 520) {
          e.cd = e.elite ? 2.2 : 4.2;
          const n = e.elite ? 3 : 1;
          for (let k = 0; k < n; k++) {
            const a = rand(0, TAU), R = k ? rand(60, 120) : rand(0, 30);
            this.addHazard({ kind: 'mortar', x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R, r: 54, warn: 1.25 + k * 0.15, dmg: this.shotDmg(e, 10), color: '#ff2d95', from: e });
          }
          this.sfx('warn');
        }
      } else if (ai === 'lay') {
        // world 4's Spreader: walks at the ship and lays black crystal where it goes
        e.cd -= dt;
        if (e.cd <= 0) { e.cd = e.elite ? 1.2 : 2.4; layCrystal(this, e.x, e.y, e.elite ? 95 : 70); }
      } else if (ai === 'hop') {
        // moves in leaps (world 3's lunar hopper): creeps, crouches, then jumps at where the ship is
        if (e.state === 'chase') {
          mx *= 0.3; my *= 0.3;
          e.cd -= dt;
          if (e.cd <= 0 && d < 560) { e.state = 'wind'; e.t = 0.28; }
        } else if (e.state === 'wind') {
          mx = my = 0; e.t -= dt;
          if (e.t <= 0) { e.state = 'leap'; e.t = 0.45; e.dir = Math.atan2(dy, dx) + rand(-0.12, 0.12); e.leapV = Math.min(430, d / 0.45 + 40); }
        } else {
          mx = Math.cos(e.dir) * e.leapV; my = Math.sin(e.dir) * e.leapV; e.t -= dt;
          if (e.t <= 0) { e.state = 'chase'; e.cd = e.elite ? rand(0.4, 0.6) : rand(0.8, 1.2); }
        }
      } else if (ai === 'blink') {
        // fade out, reappear next to the player
        e.cd -= dt;
        if (e.state === 'chase' && e.cd <= 0 && d < 520) { e.state = 'fade'; e.t = 0.35; e.ghost = true; }
        if (e.state === 'fade') {
          mx = my = 0; e.t -= dt; e.alpha = Math.max(0, e.t / 0.35);
          if (e.t <= 0) {
            const a = rand(0, TAU), R = rand(160, 210);
            e.x = clamp(p.x + Math.cos(a) * R, -hw, hw);
            e.y = clamp(p.y + Math.sin(a) * R, -hh, hh);
            e.state = 'appear'; e.t = 0.75;
          }
        } else if (e.state === 'appear') {
          // materialise, then hold still briefly so the player can react
          mx = my = 0; e.t -= dt; e.alpha = 1 - Math.max(0, (e.t - 0.4) / 0.35);
          if (e.t <= 0.4) { e.ghost = false; e.flash = Math.max(e.flash, Math.sin(e.t * 40) > 0 ? 0.02 : 0); }
          if (e.t <= 0) { e.state = 'chase'; e.alpha = 1; e.cd = rand(4, 6); }
        }
      } else if (ai === 'seeker') {
        if (d < 220) { mx = -mx; my = -my; } else if (d < 300) { mx = (-dy / d) * e.speed; my = (dx / d) * e.speed; }
        e.cd -= dt;
        if (e.cd < 0.4) e.flash = Math.max(e.flash, 0.02);
        if (e.cd <= 0 && d < 430) {
          e.cd = e.elite ? 1.6 : 3.4;
          const a = Math.atan2(dy, dx);
          const n = e.elite ? 3 : 1;
          for (let k = 0; k < n; k++) this.enemyShoot(e.x, e.y, a + (k - (n - 1) / 2) * 0.5, 120, this.shotDmg(e, 7), true);
        }
      }
      if (e.traits || e.buffT > 0) {
        const tm = this.updateTraits(e, dt, dx, dy, d);
        if (tm) { mx = tm[0]; my = tm[1]; }
        else { const k = (e.enraged ? 1.5 : 1) * (e.buffT > 0 ? 1.3 : 1); mx *= k; my *= k; }
        e.buffT = Math.max(0, (e.buffT || 0) - dt);
      }
      // Supernova: slowed to half speed for a while
      if (e.slowT > 0) { e.slowT -= dt; mx *= 0.5; my *= 0.5; }
      // separation
      let sx = 0, sy = 0;
      if (separate) this.hash.query(e.x, e.y, e.r * 2, near); else near.length = 0;
      for (let j = 0; j < near.length && j < 12; j++) {
        const o = near[j];
        if (o === e || o.boss || o.seg) continue;
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
      if (bounded) {
        e.x = clamp(e.x, -hw, hw);
        e.y = clamp(e.y, -hh, hh);
      }
      if (e.def.spin) e.rot += e.def.spin * dt;
      else if (mx || my) e.rot = angleLerp(e.rot, Math.atan2(my, mx), Math.min(1, dt * 8));
      if (!e.ghost && d < e.r + p.r) {
        // collected and applied once per frame below: the more enemies touch the ship at once, the more it hurts
        contacts.push(e);
        if (e.traits?.has('bulwark')) {
          // solid: push the ship out instead of letting it fly through
          const ox = p.x - e.x, oy = p.y - e.y, od = Math.hypot(ox, oy) || 1, push = e.r + p.r - od + 1;
          if (push > 0) { p.x += (ox / od) * push; p.y += (oy / od) * push; p.tx = p.x; p.ty = p.y; }
        }
      }
    }
    this.crowdHit(contacts);
  }

  // Crowd damage (v1.1): the strongest touching enemy's damage, +30% for each other enemy touching the ship at the
  // same moment (at most x2.5), and only CONTACT_INV seconds of invulnerability, so ploughing through a swarm hurts.
  crowdHit(contacts) {
    const p = this.player;
    if (!contacts.length || p.inv > 0) return;
    let top = contacts[0], best = 0;
    for (const e of contacts) { const v = e.dmg * this.dmgMul(e); if (v > best) { best = v; top = e; } }
    const mul = Math.min(CROWD_MAX, 1 + CROWD_EXTRA * (contacts.length - 1));
    // Ram Plating perk set: 30% less contact damage, and whatever touches the ship is knocked away
    const ram = this.combos.has('ramplating');
    if (ram) {
      for (const e of contacts) {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
        e.kx += (dx / d) * 320 * e.kbRes; e.ky += (dy / d) * 320 * e.kbRes;
      }
    }
    this.hurtPlayer(best * mul * (ram ? 0.7 : 1), contacts.length > 1 ? 'crowd' : top.type, CONTACT_INV);
    if (contacts.length >= 4) { this.flash = Math.max(this.flash, 0.45); this.text(p.x, p.y - 30, `CRUSHED x${mul.toFixed(1)}`, '#ff3d6e', true); }
  }

  // Per-frame trait behaviour. Returns a movement override [mx, my] while a swift elite winds up or charges.
  updateTraits(e, dt, dx, dy, d) {
    const t = e.traits;
    if (!t) return null;
    const p = this.player;
    if (t.has('berserker') && !e.enraged && e.hp < e.maxHp * 0.5) {
      e.enraged = true;
      this.text(e.x, e.y - e.r - 14, 'ENRAGED', TRAITS.berserker.color, true);
      this.sfx('warn');
      e.slamT = 0;
    }
    if (e.enraged && (e.slamT -= dt) <= 0) {
      // ground slam: a red warning circle, then a blast around where it stood
      e.slamT = 4;
      this.addHazard({ kind: 'mortar', x: e.x, y: e.y, r: e.r + 110, warn: 0.75, dmg: 18, color: TRAITS.berserker.color });
    }
    if (t.has('commander') && (e.callT -= dt) <= 0) {
      // calls reinforcements every 10 s while fewer than 12 of them are alive
      e.callT = 10;
      e.escort = (e.escort || []).filter((o) => !o.dead);
      const type = e.def.speed === 0 ? this.stage.enemies[0][0] : e.type;
      for (let i = 0; i < 4 && e.escort.length < 12; i++) {
        const a = rand(0, TAU);
        e.escort.push(this.spawnEnemy(type, e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80));
      }
      this.text(e.x, e.y - e.r - 14, 'REINFORCEMENTS', TRAITS.commander.color, true);
    }
    if (t.has('shielded') && (e.wardT -= dt) <= 0) {
      // shields the enemies around it (30% of their health) every 5 s
      e.wardT = 5;
      const near = this.tmp4 || (this.tmp4 = []);
      this.hash.query(e.x, e.y, 180, near);
      for (const o of near) if (o !== e && !o.boss && !o.seg && !o.prop && !o.dead && !(o.shield > 0)) { o.shield = o.maxHp * 0.3; o.warded = true; }
      this.addFx(e.x, e.y, 180, TRAITS.shielded.color, 0.35, 3);
    }
    if (t.has('shielded') && e.maxShield && this.time - e.lastHit > 4) e.shield = Math.min(e.maxShield, e.shield + e.maxShield * 0.1 * dt);
    if (t.has('commander')) {
      // speeds up and strengthens nearby enemies while it lives
      const near = this.tmp3 || (this.tmp3 = []);
      this.hash.query(e.x, e.y, 220, near);
      e.led = 0;
      for (const o of near) if (o !== e && !o.boss && !o.seg && !o.prop && !o.elite && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 220 * 220) { o.buffT = 0.25; e.led++; }
    }
    if (t.has('bulwark') && d < e.r + 160) this.slowNext = Math.min(this.slowNext ?? 1, 0.5);
    // a commander stays in sight: a ranged one does not back off past 190 px like a plain shooter
    if (t.has('commander') && e.def.speed > 0 && d > 190 && !e.sw) return [(dx / d) * e.speed, (dy / d) * e.speed];
    if (e.sw && !e.def.ai) {
      const s = e.sw;
      if (s.phase === 'run') {
        s.cd -= dt;
        if (s.cd <= 0 && d < 420) { s.phase = 'wind'; s.t = 0.6; s.dir = Math.atan2(dy, dx); }
      } else if (s.phase === 'wind') {
        s.t -= dt; e.flash = Math.max(e.flash, Math.sin(s.t * 40) > 0 ? 0.02 : 0);
        if (s.t <= 0) { s.phase = 'charge'; s.t = 0.5; }
        return [0, 0];
      } else {
        s.t -= dt;
        if (s.t <= 0) { s.phase = 'run'; s.cd = 2.5; }
        const v = e.speed * 4;
        return [Math.cos(s.dir) * v, Math.sin(s.dir) * v];
      }
    }
    return null;
  }

  enemyShoot(x, y, a, speed, dmg, homing = false, r = homing ? 6 : 5) {
    if (this.ebullets.length > 400) return;
    // from: the crater it was fired in, if any (world 3's cover stops shots that fly into a crater, not out of one)
    const from = this.cover.length ? coverAt(this, x, y) : null;
    this.ebullets.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r, dmg, life: homing ? 4.5 : 6, homing, a, speed, from });
    this.sfx('eshoot');
  }

  // Self-destruct of a fused bomber: hurts the player and nearby enemies, no reward.
  detonate(e) {
    e.dead = true;
    const p = this.player, R = 68;
    this.addFx(e.x, e.y, R, '#ff6a1a', 0.35, 5);
    this.burst(e.x, e.y, '#ffb52e', 16, 260, 0.45, 7);
    this.sfx('boom');
    if (Math.hypot(p.x - e.x, p.y - e.y) < R + p.r) this.hurtPlayer(12, 'bomber');
    for (const o of this.enemiesNear(e.x, e.y, R)) if (o !== e && !o.boss) this.damage(o, 30, 0, 0, true);
  }

  updateBoss(b, dt) {
    const def = b.def, p = this.player;
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    if (b.phase - 1 < def.phases.length && b.hp < b.maxHp * def.phases[b.phase - 1]) {
      b.phase++;
      this.ui.banner(`${b.name} ${b.phase === 3 ? 'UNLEASHED' : 'ENRAGED'}`, '');
      this.sfx('boss');
      this.shake = 14;
      this.bossSummon(b, 10);
    }
    const enr = b.phase - 1;
    const fast = 1 + enr * 0.25;
    b.rot += dt * (0.6 + enr * 0.6);
    b.rot2 -= dt * (1 + enr);
    let mx = 0, my = 0;
    if (def.move === 'chase') {
      mx = (dx / d) * b.speed; my = (dy / d) * b.speed;
      if (d < 150) { mx *= -0.3; my *= -0.3; }
    } else if (def.move === 'float') {
      // hover around the player at a fixed distance
      b.oa = (b.oa ?? Math.atan2(-dy, -dx)) + dt * 0.35 * fast;
      const ex = p.x + Math.cos(b.oa) * 240 - b.x, ey = p.y + Math.sin(b.oa) * 240 - b.y, el = Math.hypot(ex, ey) || 1;
      const sp = Math.min(b.speed * 2.2, el * 2);
      mx = (ex / el) * sp; my = (ey / el) * sp;
    } else if (def.move === 'anchor') {
      // rooted in its crater: it never moves, its cannon turns after the ship (Moon Spire)
      b.aim = angleLerp(b.aim ?? Math.atan2(dy, dx), Math.atan2(dy, dx), Math.min(1, dt * (1.2 + enr * 0.5)));
    } else if (def.move === 'serpent') {
      b.heading = angleLerp(b.heading, Math.atan2(dy, dx), Math.min(1, dt * (1.3 + enr * 0.5)));
      const a = b.heading + Math.sin(this.time * 2.6) * 0.55;
      const sp = b.speed * fast * (b.lunge > 0 ? 2.4 : 1);
      b.lunge -= dt;
      mx = Math.cos(a) * sp; my = Math.sin(a) * sp;
    }
    b.modeT -= dt;
    if (b.mode === 'idle') {
      b.atkT -= dt;
      if (b.atkT <= 0) this.bossStart(b, enr, dx, dy);
    } else {
      const o = this.bossTick(b, dt, enr, dx, dy);
      if (o) { mx = o[0]; my = o[1]; }
      if (b.modeT <= 0) {
        b.mode = 'idle';
        b.ghost = false;
        b.alpha = 1;
        b.atkT = def.rest * (1 - enr * 0.25);
      }
    }
    b.x += mx * dt;
    b.y += my * dt;
    const hw = this.arena.w / 2 - b.r, hh = this.arena.h / 2 - b.r;
    b.x = clamp(b.x, -hw, hw);
    b.y = clamp(b.y, -hh, hh);
    if (b.segs) this.updateSegments(b);
    if (!b.ghost && d < b.r + p.r) this.hurtPlayer(b.dmg, 'boss');
  }

  bossSummon(b, n) {
    const types = b.def.summon;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const e = this.spawnEnemy(types[i % types.length], b.x + Math.cos(a) * (b.r + 25), b.y + Math.sin(a) * (b.r + 25));
      e.spawnT = 0.2;
    }
    this.addFx(b.x, b.y, b.r * 2.4, b.color, 0.5, 4);
  }

  bossStart(b, enr, dx, dy) {
    const p = this.player;
    b.mode = b.def.attacks[b.atk++ % b.def.attacks.length];
    b.shotT = 0;
    switch (b.mode) {
      case 'spiral': b.modeT = 3; break;
      case 'burst': b.modeT = 1.6; break;
      case 'summon': b.modeT = 0.6; this.bossSummon(b, (b.def.summonN || 7) + enr * 3); break;
      case 'charge': b.modeT = 1.05; b.dir = Math.atan2(dy, dx); break;
      case 'lunge': b.modeT = 1.4; b.lunge = 1.4; this.sfx('warn'); break;
      case 'segburst': {
        b.modeT = 0.2;
        b.segs.forEach((sg, i) => {
          if (i % 2 && !enr) return;
          for (const side of [1, -1]) this.enemyShoot(sg.x, sg.y, sg.rot + (side * Math.PI) / 2, 145 + enr * 20, 7);
        });
        break;
      }
      case 'beams': {
        b.modeT = 3.6;
        const n = 4 + enr * 2, off = rand(0, TAU), dir = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < n; i++) {
          this.addHazard({ kind: 'beam', owner: b, x: b.x, y: b.y, a: off + (i / n) * TAU, len: 900, w: 18, warn: 1.0, dur: 2.4, dmg: 14, rot: 0.55 * dir * (1 + enr * 0.2) });
        }
        this.sfx('warn');
        break;
      }
      case 'mortar': b.modeT = 1.4; this.mortars(5 + enr * 3, 1.1); break;
      // the cannon (Moon Spire): it charges (flashing), then fires heavy shells along its aim, 3 to 5 in a row
      case 'cannon': b.modeT = 0.9 + (3 + enr) * 0.32; b.shots = 0; this.sfx('warn'); break;
      // crystal (Red Colossus): black crystal bursts out of the ground around the ship, with a ring of shards
      case 'crystal': {
        b.modeT = 1.2;
        for (let i = 0; i < 3 + enr; i++) {
          const a = rand(0, TAU), R = i ? rand(90, 200) : rand(0, 40);
          layCrystal(this, p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, 90, 18);
        }
        const n = (b.def.burstN || 18) + enr * 4, off = rand(0, TAU);
        for (let k = 0; k < n; k++) this.enemyShoot(b.x, b.y, off + (k / n) * TAU, 140 * (b.def.bulletSpeed || 1), b.def.bulletDmg || 8);
        this.sfx('warn');
        break;
      }
      // build (Foundry Mother): its two assembly bays put out a squad each, left and right of it
      case 'build': {
        b.modeT = 1.0; b.built = this.time;
        const a = Math.atan2(dy, dx), types = b.def.summon, n = (b.def.summonN || 4) + enr * 2;
        for (const side of [-1, 1]) {
          const bx = b.x + Math.cos(a + side * Math.PI / 2) * b.r * 1.05, by = b.y + Math.sin(a + side * Math.PI / 2) * b.r * 1.05;
          for (let i = 0; i < n; i++) {
            const e = this.spawnEnemy(types[i % types.length], bx + rand(-20, 20), by + rand(-20, 20));
            e.spawnT = 0.3;
          }
          this.addFx(bx, by, 60, '#ff7a1a', 0.4, 4);
        }
        this.sfx('warn');
        break;
      }
      case 'turrets': {
        b.modeT = 0.6;
        const hw = this.arena.w / 2 - 30, hh = this.arena.h / 2 - 30;
        for (let i = 0; i < 2 + enr; i++) {
          const a = rand(0, TAU);
          this.spawnEnemy('turret', clamp(p.x + Math.cos(a) * 230, -hw, hw), clamp(p.y + Math.sin(a) * 230, -hh, hh));
        }
        break;
      }
      case 'teleport': b.modeT = 1.2; b.tp = false; break;
      case 'blackhole': b.modeT = 0.5; this.wells(enr > 1 ? 2 : 1); break;
    }
  }

  bossTick(b, dt, enr, dx, dy) {
    const p = this.player;
    const bd = b.def.bulletDmg || 10, bs = b.def.bulletSpeed || 1;
    switch (b.mode) {
      case 'cannon': {
        const n = 3 + enr, left = b.modeT - (n - b.shots) * 0.32;
        if (b.shots === 0 && left > 0) { b.flash = Math.max(b.flash, Math.sin(b.modeT * 50) > 0 ? 0.03 : 0); break; }
        if (b.shots < n && b.modeT <= (n - b.shots) * 0.32) {
          b.shots++;
          b.fired = this.time;
          const a = b.aim ?? Math.atan2(dy, dx), mz = b.r * 0.9;
          this.enemyShoot(b.x + Math.cos(a) * mz, b.y + Math.sin(a) * mz, a, 270 * bs, bd * 2.2, false, 13);
          // two lighter shells beside it from the second phase on
          if (enr) for (const s of [-1, 1]) this.enemyShoot(b.x + Math.cos(a) * mz, b.y + Math.sin(a) * mz, a + s * 0.3, 230 * bs, bd);
          this.sfx('boom');
          this.shake = Math.max(this.shake, 5);
        }
        break;
      }
      case 'spiral':
        b.shotT -= dt;
        if (b.shotT <= 0) {
          b.shotT = 0.1 - enr * 0.015;
          b.spin += 0.32;
          const arms = 2 + enr;
          for (let k = 0; k < arms; k++) this.enemyShoot(b.x, b.y, b.spin + (k / arms) * TAU, (160 + enr * 25) * bs, bd);
        }
        break;
      case 'burst':
        b.shotT -= dt;
        if (b.shotT <= 0) {
          b.shotT = 0.5;
          const n = (b.def.burstN || 20) + enr * 6, off = rand(0, TAU);
          for (let k = 0; k < n; k++) this.enemyShoot(b.x, b.y, off + (k / n) * TAU, (150 + enr * 25) * bs, bd);
        }
        break;
      case 'charge': {
        if (b.modeT > 0.45) {
          // telegraph: the boss flashes and a red lane shows the charge direction
          b.flash = Math.max(b.flash, Math.sin(b.modeT * 50) > 0 ? 0.03 : 0);
          b.dir = Math.atan2(dy, dx);
          return [0, 0];
        }
        const sp = 540 + enr * 100;
        return [Math.cos(b.dir) * sp, Math.sin(b.dir) * sp];
      }
      case 'teleport': {
        if (b.modeT > 0.8) {
          b.ghost = true;
          b.alpha = Math.max(0, (b.modeT - 0.8) / 0.4);
        } else if (!b.tp) {
          b.tp = true;
          const a = rand(0, TAU);
          const hw = this.arena.w / 2 - b.r, hh = this.arena.h / 2 - b.r;
          b.x = clamp(p.x + Math.cos(a) * 250, -hw, hw);
          b.y = clamp(p.y + Math.sin(a) * 250, -hh, hh);
          b.oa = a;
          if (b.trail) for (const t of b.trail) { t.x = b.x; t.y = b.y; }
        } else {
          b.alpha = Math.min(1, (0.8 - b.modeT) / 0.3);
          if (b.alpha >= 1 && b.ghost) {
            b.ghost = false;
            const n = 18 + enr * 6;
            for (let k = 0; k < n; k++) this.enemyShoot(b.x, b.y, (k / n) * TAU, (150 + enr * 20) * bs, bd);
            this.addFx(b.x, b.y, b.r * 2.5, b.color, 0.4, 5);
          }
        }
        return [0, 0];
      }
    }
    return null;
  }

  updateSegments(b) {
    const tr = b.trail;
    const last = tr[0];
    if (Math.hypot(b.x - last.x, b.y - last.y) > 2) {
      tr.unshift({ x: b.x, y: b.y });
      if (tr.length > 500) tr.pop();
    }
    const sp = b.def.segSpacing;
    let acc = 0, si = 0, prev = tr[0];
    for (let i = 1; i < tr.length && si < b.segs.length; i++) {
      const t = tr[i];
      acc += Math.hypot(t.x - prev.x, t.y - prev.y);
      while (si < b.segs.length && acc >= (si + 1) * sp) {
        const sg = b.segs[si];
        sg.rot = Math.atan2(prev.y - t.y, prev.x - t.x);
        sg.x = t.x; sg.y = t.y;
        si++;
      }
      prev = t;
    }
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
          if (e.dead || e.spawnT > 0 || e.ghost) continue;
          const rr = pr.r + e.r;
          if ((e.x - pr.x) ** 2 + (e.y - pr.y) ** 2 > rr * rr) continue;
          if (pr.hit.includes(e.id)) continue;
          if (pr.kind === 'missile') {
            this.explode(pr.x, pr.y, pr.rad, pr.dmg, pr.color);
            this.missileCombos(pr.x, pr.y);
            remove = true;
            break;
          }
          const sp = pr.speed || 1;
          this.damage(e, pr.dmg, (pr.vx / sp) * pr.knock, (pr.vy / sp) * pr.knock);
          pr.hit.push(e.id);
          if (pr.flak) {
            // Flak Cannon: a small quiet blast around the hit
            for (const o of this.enemiesNear(pr.x, pr.y, pr.flak)) if (o !== e) this.damage(o, pr.dmg * 0.6, 0, 0, true);
            this.addFx(pr.x, pr.y, pr.flak, '#ffd23d', 0.22, 2);
          }
          if (pr.ion) {
            // Ion Bolts combo: the hit sparks to the nearest other enemy for half damage
            let best = null, bd = 130 * 130;
            for (const o of this.enemiesNear(e.x, e.y, 130)) {
              if (o === e || o.dead) continue;
              const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
              if (d < bd) { bd = d; best = o; }
            }
            if (best) {
              this.damage(best, pr.dmg * 0.5, 0, 0, true);
              if (this.bolts.length < 40) this.addBolt([e.x, e.y, best.x, best.y], '#c8ffff');
            }
          }
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
      if (b.homing) {
        b.a = angleLerp(b.a, Math.atan2(p.y - b.y, p.x - b.x), Math.min(1, 1.7 * dt));
        b.vx = Math.cos(b.a) * b.speed; b.vy = Math.sin(b.a) * b.speed;
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let remove = b.life <= 0 || Math.abs(b.x) > hw || Math.abs(b.y) > hh;
      if (!remove && this.cover.length) {
        const c = coverAt(this, b.x, b.y);
        if (c && c !== b.from) {
          remove = true;
          if (this.particles.length < 600) this.burst(b.x, b.y, '#b8a9d9', 3, 90, 0.3, 4);
        } else if (!c) b.from = null;
      }
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
        if (r.slow && !e.boss) e.slowT = r.slow;
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
      if (m.pull && m.arm <= 0) {
        // Gravity Mines: drag nearby enemies (not bosses) toward the mine
        for (const e of this.enemiesNear(m.x, m.y, m.pull)) {
          if (e.boss || e.seg || e.prop || e.def.speed === 0) continue;
          const dx = m.x - e.x, dy = m.y - e.y, d = Math.hypot(dx, dy) || 1;
          const v = 160 * dt * (e.kbRes ?? 0.4);
          e.x += (dx / d) * v; e.y += (dy / d) * v;
        }
      }
      if (!boom && m.arm <= 0 && this.enemiesNear(m.x, m.y, 22).length) boom = true;
      if (boom) {
        this.explode(m.x, m.y, m.rad, m.dmg, m.pull ? '#b06bff' : '#ffd23d');
        this.mines.splice(i, 1);
        // Storm Mines combo: the blast fires chain lightning at Arc Coil's strength
        const coil = this.combos.has('stormmines') && this.wstats('lightning');
        const tgt = coil && this.nearestEnemy(m.x, m.y, 170);
        if (tgt) this.chainLightning(m.x, m.y, tgt, coil.dmg * this.player.dmgMult, 4, '#7df9ff');
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
        this.app.haptic('heavy');
        this.flash = 0.4;
        this.shake = 16;
        this.sfx('bigboom');
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0) continue;
          if (Math.abs(e.x - this.cam.x) < this.app.W && Math.abs(e.y - this.cam.y) < this.app.H) this.damage(e, e.boss ? 300 : 99999, 0, 0, true);
        }
        this.ebullets.length = 0;
        break;
      case 'chest': this.pendingChests += k.v || 1; break;
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
    if (this.tut.tip) this.tut.close(false);
    if (st.endless) return this.finishEndless();
    // 3 stars: clear the sector, reach the kill goal, destroy every elite (and the boss, which clearing a boss sector needs)
    const goals = [won, this.kills >= st.kills, won && this.elitesKilled >= st.elites];
    const stars = won ? goals.filter(Boolean).length : 0;
    const idx = stageIndex(st.id);
    const collected = Math.round(this.coinsRun);
    const firstClear = won && !save.cleared[st.id];
    const clearBonus = won ? Math.round((40 + idx * 20) * (firstClear ? 1.5 : 1) * p.coinMult) : 0;
    // a star earned for the first time pays 50, a star earned again 15
    const prevStars = save.stars[st.id] || 0;
    const newStars = Math.max(0, stars - prevStars);
    const starBonus = won ? Math.round((newStars * 50 + (stars - newStars) * 15) * p.coinMult) : 0;
    let worldBonus = 0;
    if (won) {
      save.cleared[st.id] = true;
      save.stars[st.id] = Math.max(prevStars, stars);
      if (st.boss) save.stats.bossKills += 1;
      // all 18 stars of a world: a one-time 300 coins
      const w = st.world;
      const worldTotal = w.stages.reduce((a, s) => a + (save.stars[s.id] || 0), 0);
      if (worldTotal >= w.stages.length * 3 && !save.worldStars[w.id]) {
        save.worldStars[w.id] = true;
        worldBonus = 300;
      }
    }
    const total = collected + clearBonus + starBonus + worldBonus;
    save.coins += total;
    save.stats.kills += this.kills;
    save.stats.runs += 1;
    this.app.persist();
    this.app.audio.sfx(won ? 'win' : 'lose');
    this.ui.bossBar(null);
    this.ui.results({
      won, stage: st, stars, prevStars, newStars, goals, time: this.time, kills: this.kills, level: this.level,
      elitesKilled: this.elitesKilled, collected, clearBonus, starBonus, worldBonus, total, firstClear,
      newEntries: this.newEntries,
    });
  }

  // Endless ends only when the ship is destroyed: the score is the kills, coins are the run's plus a bonus per minute.
  finishEndless() {
    const st = this.stage, save = this.save, w = st.world.id;
    const minutes = Math.floor(this.time / 60);
    const collected = Math.round(this.coinsRun);
    const minuteBonus = Math.round(minutes * ENDLESS.minuteCoins * this.player.coinMult);
    const total = collected + minuteBonus;
    const prev = save.endless[w] || { kills: 0, time: 0 };
    const best = this.kills > prev.kills;
    if (best) save.endless[w] = { kills: this.kills, time: Math.floor(this.time) };
    save.coins += total;
    save.stats.kills += this.kills;
    save.stats.runs += 1;
    this.app.persist();
    this.app.leaderboard?.submit(w, this.kills);
    this.app.audio.sfx(best ? 'win' : 'lose');
    this.ui.bossBar(null);
    this.ui.endlessResults({
      stage: st, time: this.time, kills: this.kills, level: this.level, bosses: this.endless.bosses, best, prev,
      collected, minutes, minuteBonus, total, newEntries: this.newEntries,
    });
  }

  pause() {
    if (this.state !== 'play') return;
    this.state = 'paused';
    this.ui.pause(this.buildSummary(), () => { this.state = 'play'; this.app.input.resetDrag(); }, () => this.app.quitRun());
  }

  // ---------------- rendering ----------------

  // drawing lives in js/render-canvas.js (1.x look) and js/v2/ (2.0 look); both only read the game's state
  render(ctx, overlay = false) {
    renderGame(this, ctx, overlay);
  }
}
