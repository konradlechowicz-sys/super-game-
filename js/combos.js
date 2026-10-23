// Weapon combos (v1.2): two weapons that both reach COMBO_LEVEL unlock a bonus effect for the rest of the run.
// The effects live where the weapons fire (js/weapons.js) and where their shots land (js/game.js); this file only
// says which pairs exist and when they are active.
import { WEAPONS } from './weapons.js';

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
    desc: 'Missile blasts can leave a mine behind.',
  },
};

// A weapon's level for combos: an evolved weapon counts as maxed.
const levelOf = (weapons, id) => {
  const w = weapons.find((x) => x.id === id);
  return w ? (w.evolved ? 99 : w.level) : 0;
};

export function comboActive(weapons, id) {
  return COMBOS[id].parts.every((part) => levelOf(weapons, part) >= COMBO_LEVEL);
}

// Combos a weapon card moves forward: the partner weapon is owned. `done` = the card completes the combo.
export function combosFor(weapons, weaponId, nextLevel) {
  const out = [];
  for (const [id, c] of Object.entries(COMBOS)) {
    if (!c.parts.includes(weaponId)) continue;
    const partner = c.parts.find((x) => x !== weaponId);
    const pl = levelOf(weapons, partner);
    if (!pl || comboActive(weapons, id)) continue;
    out.push({ id, partner: WEAPONS[partner].name, done: nextLevel >= COMBO_LEVEL && pl >= COMBO_LEVEL });
  }
  return out;
}
