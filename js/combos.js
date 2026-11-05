// Combos (v1.2): two weapons, or two perks (a perk set), that both reach COMBO_LEVEL unlock a bonus effect for the
// rest of the run. Super combos (2.0, PLAN-2.0-ARSENAL.md): three weapons at SUPER_LEVEL (an evolved weapon counts). The effects live where the weapons fire (js/weapons.js) and in the game loop (js/game.js); this
// file only says which pairs exist and when they are active.
import { WEAPONS, WEAPON_MAX } from './weapons.js';
import { PASSIVES } from './data.js';

export const COMBO_LEVEL = 3;
export const SUPER_LEVEL = WEAPON_MAX;

export const COMBOS = {
  stormmines: {
    name: 'Storm Mines', parts: ['lightning', 'mines'], color: '#7df9ff',
    desc: 'Every mine blast fires chain lightning.',
  },
  cluster: {
    name: 'Cluster Missiles', parts: ['missiles', 'spread'], color: '#ff8a2a',
    desc: 'Missiles burst into a ring of pellets.',
  },
  bladenova: {
    name: 'Blade Nova', parts: ['orbit', 'pulse'], color: '#3dffc8',
    desc: 'Each pulse flings your blades onto a wider, harder-hitting orbit.',
  },
  twinlink: {
    name: 'Twin Link', parts: ['drone', 'blaster'], color: '#9dff3d',
    desc: 'Your drones fire along with every blaster volley.',
  },
  ionbolts: {
    name: 'Ion Bolts', parts: ['blaster', 'lightning'], color: '#c8ffff',
    desc: 'Blaster hits spark to a nearby enemy.',
  },
  minelayer: {
    name: 'Minelayer', parts: ['missiles', 'mines'], color: '#ffd23d',
    desc: 'Every other missile blast leaves a mine behind.',
  },
  // 2.0 arsenal (PLAN-2.0-ARSENAL.md; effects in js/weapons.js, js/arsenal.js and js/game.js)
  ionrail: {
    name: 'Ion Rail', parts: ['rail', 'lightning'], color: '#c8f0ff',
    desc: 'Every enemy the railgun pierces sparks lightning to a neighbour.',
  },
  shrapnelrail: {
    name: 'Shrapnel Rail', parts: ['rail', 'spread'], color: '#ff8a2a',
    desc: 'The end of every beam bursts into a fan of pellets.',
  },
  napalm: {
    name: 'Napalm Mines', parts: ['flame', 'mines'], color: '#ff7a1a',
    desc: 'Mine blasts leave a pool of fire.',
  },
  fireblades: {
    name: 'Fire Blades', parts: ['flame', 'orbit'], color: '#ff8a2a',
    desc: 'Orbit blades set the enemies they cut on fire.',
  },
  gravbarrage: {
    name: 'Gravity Barrage', parts: ['singularity', 'missiles'], color: '#b06bff',
    desc: 'Missiles curve into black holes; enemies in a hole take +50% from them.',
  },
  collapse: {
    name: 'Collapse', parts: ['singularity', 'pulse'], color: '#c46bff',
    desc: 'A Nova pulse collapses your black holes into blasts at once.',
  },
  // perk sets
  overdrive: {
    name: 'Overdrive', perk: true, parts: ['power', 'overclock'], color: '#ff3d6e',
    desc: 'Every 12 s your weapons fire 50% faster for 4 s.',
  },
  ramplating: {
    name: 'Ram Plating', perk: true, parts: ['armor', 'thrusters'], color: '#3dff8a',
    desc: 'Crowds hit 30% softer and get knocked away.',
  },
  singularity: {
    name: 'Singularity', perk: true, parts: ['tractor', 'amplifier'], color: '#3dc8ff',
    desc: 'Every 25 s all XP crystals fly to you.',
  },
  hitrun: {
    name: 'Hit & Run', perk: true, parts: ['thrusters', 'overclock'], color: '#ff8a2a',
    desc: '+15% damage while you are moving.',
  },
  laststand: {
    name: 'Last Stand', perk: true, parts: ['power', 'armor'], color: '#ffd23d',
    desc: '+25% damage while your hull is below 50%.',
  },
  scorched: {
    name: 'Scorched Trail', perk: true, parts: ['thermal', 'thrusters'], color: '#ff7a1a',
    desc: 'You leave a trail of fire while you move.',
  },
  bastion: {
    name: 'Bastion Field', perk: true, parts: ['phase', 'armor'], color: '#7df9ff',
    desc: 'When your shield breaks, a wave throws enemies back; it recharges 30% faster.',
  },
  salvage: {
    name: 'Salvage Core', perk: true, parts: ['targeting', 'tractor'], color: '#fff2a8',
    desc: 'Critical kills drop an extra XP crystal.',
  },
  // super combos: three weapons at LV 5 (or evolved)
  thunderstorm: {
    name: 'Thunderstorm', super: true, parts: ['rail', 'lightning', 'mines'], color: '#fff27d',
    desc: 'Every 6 s lightning strikes 8 enemies; every strike leaves a mine.',
  },
  supernovacore: {
    name: 'Supernova Core', super: true, parts: ['pulse', 'singularity', 'flame'], color: '#ffd23d',
    desc: 'Every 4th Nova pulse pulls enemies in and leaves a ring of fire.',
  },
  phoenixrail: {
    name: 'Phoenix Rail', super: true, parts: ['rail', 'flame', 'blaster'], color: '#ff9a3d',
    desc: 'Beams leave a line of fire; once a run, a lethal hit becomes a firestorm and 30% hull.',
  },
};

// A part's level for combos: an evolved weapon counts as maxed; a perk is its level.
const levelOf = (g, combo, id) => {
  if (combo.perk) return g.passives[id] || 0;
  const w = g.weapons.find((x) => x.id === id);
  return w ? (w.evolved ? 99 : w.level) : 0;
};
const nameOf = (combo, id) => (combo.perk ? PASSIVES[id] : WEAPONS[id]).name;

export const levelFor = (c) => (c.super ? SUPER_LEVEL : COMBO_LEVEL);

// g: anything with `weapons` and `passives` (the game).
export function comboActive(g, id) {
  const c = COMBOS[id];
  return c.parts.every((part) => levelOf(g, c, part) >= levelFor(c));
}

// Combos a card moves forward (a weapon card for weapon combos, a perk card for perk sets), when the partners are
// already owned. `done` = taking the card to `nextLevel` completes the combo.
export function combosFor(g, perk, partId, nextLevel) {
  const out = [];
  for (const [id, c] of Object.entries(COMBOS)) {
    if (!!c.perk !== perk || !c.parts.includes(partId)) continue;
    const partners = c.parts.filter((x) => x !== partId);
    if (partners.some((x) => !levelOf(g, c, x)) || comboActive(g, id)) continue;
    const need = levelFor(c);
    out.push({ id, partner: partners.map((x) => nameOf(c, x)).join(' + '), level: need, super: !!c.super,
      done: nextLevel >= need && partners.every((x) => levelOf(g, c, x) >= need) });
  }
  return out;
}
