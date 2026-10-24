// Combos (v1.2): two weapons, or two perks (a perk set), that both reach COMBO_LEVEL unlock a bonus effect for the
// rest of the run. The effects live where the weapons fire (js/weapons.js) and in the game loop (js/game.js); this
// file only says which pairs exist and when they are active.
import { WEAPONS } from './weapons.js';
import { PASSIVES } from './data.js';

export const COMBO_LEVEL = 3;

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
};

// A part's level for combos: an evolved weapon counts as maxed; a perk is its level.
const levelOf = (g, combo, id) => {
  if (combo.perk) return g.passives[id] || 0;
  const w = g.weapons.find((x) => x.id === id);
  return w ? (w.evolved ? 99 : w.level) : 0;
};
const nameOf = (combo, id) => (combo.perk ? PASSIVES[id] : WEAPONS[id]).name;

// g: anything with `weapons` and `passives` (the game).
export function comboActive(g, id) {
  const c = COMBOS[id];
  return c.parts.every((part) => levelOf(g, c, part) >= COMBO_LEVEL);
}

// Combos a card moves forward (a weapon card for weapon combos, a perk card for perk sets), when the partner is
// already owned. `done` = taking the card to `nextLevel` completes the combo.
export function combosFor(g, perk, partId, nextLevel) {
  const out = [];
  for (const [id, c] of Object.entries(COMBOS)) {
    if (!!c.perk !== perk || !c.parts.includes(partId)) continue;
    const partner = c.parts.find((x) => x !== partId);
    const pl = levelOf(g, c, partner);
    if (!pl || comboActive(g, id)) continue;
    out.push({ id, partner: nameOf(c, partner), done: nextLevel >= COMBO_LEVEL && pl >= COMBO_LEVEL });
  }
  return out;
}
