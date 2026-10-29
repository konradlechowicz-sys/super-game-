// Destructible props of Void Blaster 2.0 (Art Bible: L2, task P5 of each world). Weapons hit props like enemies (they
// go into the spatial hash), but nothing aims at them (nearestEnemy only looks at enemies). A broken prop stays as a
// wreck; new ones keep coming.
// - blast: blows up and hurts everything around, enemies and the ship alike (they set each other off).
// - loot: breaks open into coins and sometimes a pickup.
// - buff: while it stands, enemies within that radius move and hit harder (like a commander elite's aura).
// World 1 "Orbital Ruins": fuel tanks (blast, an amber weak point) and ammo crates (loot).
// World 2 "Siege of Earth": human flak batteries whose ammo cooks off (blast) and the Collective's beacon pylons (buff,
// then loot).
// World 3 "Lunar Bridgehead": the lunar base's mortar posts (blast), the Collective's pumps on its conduits (buff, then
// loot) and supply crates (loot; nothing is left of them). Props stay out of the craters (js/cover.js).
// art/broken: textures (js/v2/renderer.js), size: drawn length in radii, glow: 'weak' point, soft 'halo' or magenta 'core'.
import { TAU, rand, randi, lerp } from './util.js';
import { coverAt } from './cover.js';

export const PROPS = {
  tank: { hp: 40, r: 26, blast: 150, dmg: 60, hurt: 12, art: 'w1-prop-tank', broken: 'w1-prop-tank-broken', size: 3.4, glow: 'weak' },
  crate: { hp: 30, r: 24, loot: true, art: 'w1-prop-crate', broken: 'w1-prop-crate-broken', size: 3, glow: 'halo' },
  flak: { hp: 50, r: 25, blast: 170, dmg: 70, hurt: 12, art: 'w2-prop-flak-intact', broken: 'w2-prop-flak-destroyed', size: 3.4, glow: 'halo' },
  beacon: { hp: 70, r: 25, buff: 240, loot: true, art: 'w2-prop-beacon-intact', broken: 'w2-prop-beacon-destroyed', size: 3.8, glow: 'core' },
  mortarpost: { hp: 50, r: 25, blast: 170, dmg: 70, hurt: 12, art: 'w3-prop-mortar-intact', broken: 'w3-prop-mortar-destroyed', size: 3.4, glow: 'halo' },
  pump: { hp: 70, r: 25, buff: 240, loot: true, art: 'w3-prop-pump-intact', broken: 'w3-prop-pump-destroyed', size: 3.8, glow: 'core' },
  supply: { hp: 30, r: 20, loot: true, art: 'w3-prop-supply-crate', broken: null, size: 2.6, glow: 'halo' },
  crystal: { hp: 50, r: 25, blast: 160, dmg: 70, hurt: 12, art: 'w4-prop-crystal-intact', broken: 'w4-prop-crystal-destroyed', size: 3.4, glow: 'core' },
  pylon: { hp: 70, r: 25, buff: 240, loot: true, art: 'w4-prop-pylon-intact', broken: 'w4-prop-pylon-destroyed', size: 3.8, glow: 'core' },
  drop: { hp: 30, r: 20, loot: true, art: 'w4-prop-supply-drop', broken: null, size: 2.6, glow: 'halo' },
};
// the props of each world, in the order they come (the list repeats)
const WORLD_PROPS = { 1: ['tank', 'tank', 'crate'], 2: ['flak', 'beacon', 'flak'], 3: ['mortarpost', 'pump', 'supply'], 4: ['crystal', 'pylon', 'drop'] };
const START = 7, MAX_LIVE = 9, EVERY = 30, MAX_WRECKS = 12;
let nextId = -1; // negative, so a prop never shares an id with an enemy

// the same toughness ramp as the enemies' (Game.spawnEnemy), so props stay worth breaking late in the sector
const tough = (g) => lerp(g.stage.hp0 || 1, g.stage.hp, g.progress()) * g.tune.hp;

export const hasProps = (worldId) => !!WORLD_PROPS[worldId];

function addProp(g, kind, start) {
  const { w, h } = g.arena, p = g.player, { vw, vh } = g.viewSize();
  for (let k = 0; k < 20; k++) {
    const x = rand(-w / 2 + 90, w / 2 - 90), y = rand(-h / 2 + 90, h / 2 - 90);
    // at the start away from the ship, later out of sight
    if (start ? Math.hypot(x - p.x, y - p.y) < 320 : Math.abs(x - g.cam.x) < vw / 2 + 80 && Math.abs(y - g.cam.y) < vh / 2 + 80) continue;
    if (g.props.some((o) => (o.x - x) ** 2 + (o.y - y) ** 2 < 150 * 150)) continue;
    if (g.cover?.length && coverAt(g, x, y, 60)) continue;
    const d = PROPS[kind], hp = d.hp * tough(g);
    g.props.push({ id: nextId--, prop: kind, x, y, r: d.r, hp, maxHp: hp, rot: rand(0, TAU), flash: 0, kx: 0, ky: 0, kbRes: 0, spawnT: 0, dead: false });
    return;
  }
}

export function initProps(g) {
  g.propKinds = WORLD_PROPS[g.stage.world.id];
  for (let i = 0; i < START; i++) addProp(g, g.propKinds[i % g.propKinds.length], true);
}

export function updateProps(g, dt) {
  for (const o of g.props) {
    if (o.flash > 0) o.flash -= dt;
    // a beacon pylon drives the enemies around it (Game.dmgMul and the move speed read buffT)
    const R = PROPS[o.prop].buff;
    if (R && !o.dead) for (const e of g.enemiesNear(o.x, o.y, R)) if (!e.prop && !e.boss) e.buffT = 0.25;
  }
  g.propT = (g.propT ?? EVERY) - dt;
  if (g.propT <= 0) {
    g.propT = EVERY;
    if (g.props.filter((o) => !o.dead).length < MAX_LIVE) addProp(g, g.propKinds[randi(0, g.propKinds.length - 1)], false);
    // forget the oldest wrecks
    const wrecks = g.props.filter((o) => o.dead);
    if (wrecks.length > MAX_WRECKS) g.props.splice(g.props.indexOf(wrecks[0]), 1);
  }
}

// called by Game.kill when a prop's health runs out
export function breakProp(g, o) {
  const d = PROPS[o.prop];
  o.dead = true;
  o.flash = 0;
  g.burst(o.x, o.y, d.buff ? '#ff2d95' : '#ffb02e', 16, 260, 0.5, 7);
  if (d.blast) {
    const p = g.player;
    g.explode(o.x, o.y, d.blast, d.dmg * tough(g), '#ff8a2a');
    g.shake = Math.max(g.shake, 8);
    if (Math.hypot(p.x - o.x, p.y - o.y) < d.blast + p.r) g.hurtPlayer(d.hurt, o.prop);
  }
  if (d.loot) {
    if (!d.blast) g.sfx('boom');
    for (let i = randi(3, 5); i > 0; i--) g.pickups.push({ x: o.x + rand(-20, 20), y: o.y + rand(-20, 20), kind: 'coin', v: 1 });
    const r = Math.random();
    if (r < 0.3) g.pickups.push({ x: o.x, y: o.y, kind: 'heal', v: 1 });
    else if (r < 0.42) g.pickups.push({ x: o.x, y: o.y, kind: 'magnet', v: 1 });
  }
}
