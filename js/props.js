// Destructible props of Void Blaster 2.0, world 1 "Orbital Ruins" (Art Bible: W1 L2, task P5). Fuel tanks: their amber
// weak point blows up and hurts everything around, enemies and the ship alike (tanks set each other off). Ammo crates:
// break open into coins and sometimes a pickup. Weapons hit props like enemies (they go into the spatial hash), but
// nothing aims at them (nearestEnemy only looks at enemies). A broken prop stays as a wreck; new ones keep coming.
import { TAU, rand, randi, lerp } from './util.js';

export const PROPS = {
  tank: { hp: 40, r: 26, blast: 150, dmg: 60, hurt: 12 },
  crate: { hp: 30, r: 24 },
};
const START = 7, MAX_LIVE = 9, EVERY = 30, MAX_WRECKS = 12;
let nextId = -1; // negative, so a prop never shares an id with an enemy

// the same toughness ramp as the enemies' (Game.spawnEnemy), so props stay worth breaking late in the sector
const tough = (g) => lerp(g.stage.hp0 || 1, g.stage.hp, g.progress()) * g.tune.hp;

function addProp(g, kind, start) {
  const { w, h } = g.arena, p = g.player, { vw, vh } = g.viewSize();
  for (let k = 0; k < 20; k++) {
    const x = rand(-w / 2 + 90, w / 2 - 90), y = rand(-h / 2 + 90, h / 2 - 90);
    // at the start away from the ship, later out of sight
    if (start ? Math.hypot(x - p.x, y - p.y) < 320 : Math.abs(x - g.cam.x) < vw / 2 + 80 && Math.abs(y - g.cam.y) < vh / 2 + 80) continue;
    if (g.props.some((o) => (o.x - x) ** 2 + (o.y - y) ** 2 < 150 * 150)) continue;
    const d = PROPS[kind], hp = d.hp * tough(g);
    g.props.push({ id: nextId--, prop: kind, x, y, r: d.r, hp, maxHp: hp, rot: rand(0, TAU), flash: 0, kx: 0, ky: 0, kbRes: 0, spawnT: 0, dead: false });
    return;
  }
}

export function initProps(g) {
  for (let i = 0; i < START; i++) addProp(g, i % 3 === 2 ? 'crate' : 'tank', true);
}

export function updateProps(g, dt) {
  for (const o of g.props) if (o.flash > 0) o.flash -= dt;
  g.propT = (g.propT ?? EVERY) - dt;
  if (g.propT <= 0) {
    g.propT = EVERY;
    if (g.props.filter((o) => !o.dead).length < MAX_LIVE) addProp(g, Math.random() < 0.6 ? 'tank' : 'crate', false);
    // forget the oldest wrecks
    const wrecks = g.props.filter((o) => o.dead);
    if (wrecks.length > MAX_WRECKS) g.props.splice(g.props.indexOf(wrecks[0]), 1);
  }
}

// called by Game.kill when a prop's health runs out
export function breakProp(g, o) {
  o.dead = true;
  o.flash = 0;
  g.burst(o.x, o.y, '#ffb02e', 16, 260, 0.5, 7);
  if (o.prop === 'tank') {
    const d = PROPS.tank, p = g.player;
    g.explode(o.x, o.y, d.blast, d.dmg * tough(g), '#ff8a2a');
    g.shake = Math.max(g.shake, 8);
    if (Math.hypot(p.x - o.x, p.y - o.y) < d.blast + p.r) g.hurtPlayer(d.hurt, 'fuel tank');
  } else {
    g.sfx('boom');
    for (let i = randi(3, 5); i > 0; i--) g.pickups.push({ x: o.x + rand(-20, 20), y: o.y + rand(-20, 20), kind: 'coin', v: 1 });
    const r = Math.random();
    if (r < 0.3) g.pickups.push({ x: o.x, y: o.y, kind: 'heal', v: 1 });
    else if (r < 0.42) g.pickups.push({ x: o.x, y: o.y, kind: 'magnet', v: 1 });
  }
}
