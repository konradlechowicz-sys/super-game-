// First-run tutorial: short hints that appear the first time something happens (moving, crystals, an elite, a crate,
// a pickup, a boss). Time slows down while a hint waits for the player to act. Each hint is shown once; SKIP turns
// them all off and Settings → Tutorial brings them back.
import { TAU } from './util.js';
import { TRAITS } from './data.js';

const PICKUP_TIPS = {
  heal: ['REPAIR KIT', 'Fly over it to restore 30% hull.'],
  magnet: ['MAGNET', 'Pulls in every crystal on the map.'],
  bomb: ['BOMB', 'Destroys every enemy on screen.'],
};

export const tipsOn = (save) => !save.tipsOff;
export const tipSeen = (save, id) => !!save.tips[id];
export function markTip(app, id) {
  if (app.save.tips[id]) return;
  app.save.tips[id] = 1;
  app.persist();
}
// Skip button and the Settings replay switch.
export function setTips(app, on) {
  app.save.tipsOff = !on;
  if (on) app.save.tips = {};
  app.persist();
}

const nearest = (list, p, ok = () => true) => {
  let best = null, bd = Infinity;
  for (const o of list) {
    if (!ok(o)) continue;
    const d = (o.x - p.x) ** 2 + (o.y - p.y) ** 2;
    if (d < bd) { bd = d; best = o; }
  }
  return best;
};

export class Tutorial {
  constructor(game) {
    this.g = game;
    this.app = game.app;
    this.tip = null;
    this.gap = 1.2; // seconds between two hints
    const g = game;
    const moveSub = {
      joystick: 'Use the joystick below. Your weapons fire on their own.',
      float: 'Touch the lower screen and steer. Your weapons fire on their own.',
      drag: 'Drag anywhere to fly. Your weapons fire on their own.',
    }[this.app.save.settings.control] || '';
    // In priority order. `when` starts the hint, `target` is what the marker circles, `done` ends it early.
    this.defs = [
      {
        id: 'move', title: 'STEER YOUR SHIP', sub: moveSub, slow: Infinity, max: 14, hold: 1.4,
        when: () => g.time > 0.8,
        target: () => 'joy',
        start: (t) => { t.moved = 0; t.px = g.player.x; t.py = g.player.y; },
        tick: (t) => { t.moved += Math.hypot(g.player.x - t.px, g.player.y - t.py); t.px = g.player.x; t.py = g.player.y; },
        done: (t) => t.moved > 110,
      },
      {
        id: 'gems', title: 'COLLECT CRYSTALS', sub: 'Fly over them to fill the XP bar and level up.', slow: Infinity, max: 10, hold: 1.4,
        when: () => this.onScreen(g.gems).length > 0,
        target: (t) => (t.gem && g.gems.includes(t.gem) ? t.gem : (t.gem = nearest(this.onScreen(g.gems), g.player))),
        start: (t) => { t.xp0 = g.xp; t.lv0 = g.level; },
        done: (t) => g.level > t.lv0 || g.xp - t.xp0 >= 3,
      },
      {
        id: 'chest', title: 'GRAB THE CRATE', sub: 'Supply crates hold a free reward.', slow: 1.6, max: 10, hold: 1,
        when: () => g.pickups.some((k) => k.kind === 'chest'),
        target: () => g.pickups.find((k) => k.kind === 'chest'),
        done: () => !g.pickups.some((k) => k.kind === 'chest'),
      },
      {
        id: 'elite', title: 'ELITE ENEMY', sub: 'Tougher than the rest. Destroy it to drop a supply crate.', slow: 2, max: 9, hold: 1.5,
        when: () => this.onScreen(g.enemies).some((e) => e.elite && !e.dead),
        target: (t) => (t.e && !t.e.dead ? t.e : (t.e = g.enemies.find((e) => e.elite && !e.dead))),
        done: (t) => t.e && t.e.dead,
      },
      // the first elite of each trait (v1.1)
      ...Object.entries(TRAITS).map(([id, tr]) => ({
        id: 'trait_' + id, title: `${tr.name} ELITE`, sub: tr.tip, slow: 2, max: 8, hold: 1.5,
        when: () => this.onScreen(g.enemies).some((e) => e.traits?.has(id) && !e.dead),
        target: (t) => (t.e && !t.e.dead ? t.e : (t.e = g.enemies.find((e) => e.traits?.has(id) && !e.dead))),
        done: (t) => t.e && t.e.dead,
      })),
      ...Object.entries(PICKUP_TIPS).map(([kind, [title, sub]]) => ({
        id: 'pickup_' + kind, title, sub, slow: 1.2, max: 7, hold: 1,
        when: () => this.onScreen(g.pickups).some((k) => k.kind === kind),
        target: (t) => (t.k && g.pickups.includes(t.k) ? t.k : (t.k = nearest(this.onScreen(g.pickups), g.player, (k) => k.kind === kind))),
        done: (t) => t.k && !g.pickups.includes(t.k),
      })),
      {
        id: 'boss', title: 'BOSS FIGHT', sub: 'Keep moving and dodge its attacks. Destroy it to clear the sector.', slow: 1.6, max: 4.5, hold: 4.5,
        when: () => !!g.boss,
        target: () => g.boss,
        done: () => false,
      },
    ];
  }

  get save() { return this.app.save; }

  onScreen(list) {
    const { vw, vh } = this.g.viewSize();
    const c = this.g.cam;
    return list.filter((o) => Math.abs(o.x - c.x) < vw / 2 - 20 && Math.abs(o.y - c.y) < vh / 2 - 20);
  }

  // Called from Game.update while the run is live; returns the time scale cap (1 = normal speed).
  update(dt) {
    if (!tipsOn(this.save)) { if (this.tip) this.close(false); return 1; }
    const t = this.tip;
    if (!t) {
      this.gap -= dt;
      if (this.gap > 0) return 1;
      const def = this.defs.find((d) => !tipSeen(this.save, d.id) && d.when());
      if (def) this.open(def);
      return 1;
    }
    t.age += dt;
    t.def.tick?.(t);
    const finished = t.age >= t.def.hold && t.def.done(t);
    if (finished || t.age >= t.def.max) { this.close(finished); return 1; }
    return t.age < t.def.slow ? 0.35 : 1;
  }

  open(def) {
    const t = (this.tip = { def, age: 0 });
    def.start?.(t);
    markTip(this.app, def.id);
    this.app.ui.tip(def.title, def.sub, def.target(t) === 'joy');
  }

  // A level-up or crate screen opens over the hint: finish it now instead of leaving it behind the dialog.
  interrupt() {
    const t = this.tip;
    if (t) this.close(t.age >= t.def.hold && t.def.done(t));
  }

  close(success) {
    this.tip = null;
    this.gap = 1.2;
    this.app.ui.tip(null, null, false, success);
  }

  // Target marker, drawn in world space (or around the joystick in screen space via joyTarget()).
  renderWorld(ctx) {
    const t = this.tip;
    if (!t) return;
    const o = t.def.target(t);
    if (!o || o === 'joy') return;
    const g = this.g;
    const { vw, vh } = g.viewSize();
    const pulse = 0.5 + 0.5 * Math.sin(g.app.time * 6);
    const r = (o.r || 12) + 14 + pulse * 6;
    const hx = vw / 2 - 26, hy = vh / 2 - 26;
    const dx = o.x - g.cam.x, dy = o.y - g.cam.y;
    ctx.save();
    ctx.strokeStyle = '#ffd23d';
    ctx.fillStyle = '#ffd23d';
    ctx.shadowColor = '#ffd23d';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    if (Math.abs(dx) < hx && Math.abs(dy) < hy) {
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, TAU); ctx.stroke();
      // chevron above the target
      const ay = o.y - r - 10 - pulse * 6;
      ctx.beginPath(); ctx.moveTo(o.x - 9, ay - 10); ctx.lineTo(o.x, ay); ctx.lineTo(o.x + 9, ay - 10); ctx.stroke();
    } else {
      // off screen: an arrow on the screen edge pointing at it
      const s = Math.min(hx / Math.abs(dx || 1e-6), hy / Math.abs(dy || 1e-6));
      const ex = g.cam.x + dx * s, ey = g.cam.y + dy * s, a = Math.atan2(dy, dx);
      ctx.translate(ex, ey); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  joyTarget() {
    const t = this.tip;
    return !!t && t.def.target(t) === 'joy';
  }
}

// Hints on the menus after the first run: stars on the sector map, then the Upgrades shop once coins add up.
export function menuTip(app, screen) {
  const save = app.save;
  if (!tipsOn(save) || app.game) return null;
  if (save.stats.runs < 1) return null;
  if (screen === 'map' && !tipSeen(save, 'stars')) {
    return { id: 'stars', anchor: '.world-head', title: 'EARN 3 STARS', text: 'Clear the sector, hit the kill goal, keep half your hull.' };
  }
  if (screen === 'menu' && !tipSeen(save, 'shop') && save.coins >= 60) {
    return { id: 'shop', anchor: '[data-act="shop"]', below: true, title: 'SPEND YOUR COINS', text: 'Permanent upgrades for every ship.' };
  }
  return null;
}
