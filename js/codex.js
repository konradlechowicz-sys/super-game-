// Codex (v1.2): every weapon, evolution, weapon combo, perk and perk set. An entry is discovered the first time the
// player gets it in any run (Game.discover), is stored in save.codex and survives "Reset progress". Undiscovered
// entries show as "???" with one hint.
import { PASSIVES } from './data.js';
import { WEAPONS } from './weapons.js';
import { COMBOS } from './combos.js';

const W = WEAPONS, P = PASSIVES;
const partName = (combo, id) => (combo.perk ? P[id] : W[id]).name;
const partIcon = (combo, id) => (combo.perk ? P[id] : W[id]).icon;

// Sections in the order the Codex shows them. Keys: w:weapon, e:evolution, c:combo or perk set, p:perk.
export function codexSections() {
  const combos = (perk) => Object.entries(COMBOS).filter(([, c]) => !!c.perk === perk).map(([id, c]) => ({
    key: `c:${id}`, name: c.name, desc: c.desc, icon: partIcon(c, c.parts[0]), color: c.color,
    recipe: c.parts.map((x) => partName(c, x)).join(' + ') + ' (both LV 3)',
    hint: `Needs ${partName(c, c.parts[0])} and one more ${perk ? 'perk' : 'weapon'}`,
  }));
  return [
    { title: 'WEAPONS', items: Object.entries(W).map(([id, w]) => ({
      key: `w:${id}`, name: w.name, desc: w.desc[0], icon: w.icon, color: w.color, hint: 'Find it on a level-up card',
    })) },
    { title: 'EVOLUTIONS', items: Object.entries(W).filter(([, w]) => w.evo).map(([id, w]) => ({
      key: `e:${id}`, name: w.evo.name, desc: w.evo.desc, icon: w.icon, color: '#ffd23d', evo: true,
      recipe: `${w.name} LV 5 + ${P[w.evo.with].name}`, hint: `Evolves from ${w.name}`,
    })) },
    { title: 'WEAPON COMBOS', items: combos(false) },
    { title: 'PERKS', items: Object.entries(P).map(([id, p]) => ({
      key: `p:${id}`, name: p.name, desc: p.desc, icon: p.icon, color: p.color, hint: 'Find it on a level-up card',
    })) },
    { title: 'PERK SETS', items: combos(true) },
  ];
}

// Display name of a codex key (for "NEW IN CODEX" on the results screen).
export function codexName(key) {
  const [kind, id] = key.split(':');
  if (kind === 'w') return W[id].name;
  if (kind === 'e') return W[id].evo.name;
  if (kind === 'p') return P[id].name;
  return COMBOS[id].name;
}
