// Supply crates bought with coins (decided by Konrad, 2026-11-04: once every shop upgrade is bought, coins had nothing
// left to buy). Chosen on the sector briefing (js/ui.js briefing), paid at LAUNCH, one per run; opened 0.8 s into the
// run (Game.update → ui.crateOpen): random weapons or perks at a starting level that rises with the price. Coins are
// only earned in play (no coin sales), so this is a reward for collecting them, not pay-to-win.
import { WEAPONS, WEAPON_MAX } from './weapons.js';
import { PASSIVES, PASSIVE_MAX } from './data.js';

// levels: [level, weight] for each item; colours follow the 2.0 interface (grey, amber, gold)
export const CRATES = {
  standard: { name: 'Standard Crate', cost: 250, items: 1, levels: [[1, 55], [2, 35], [3, 10]], color: '#aeb7c4' },
  military: { name: 'Military Crate', cost: 700, items: 2, levels: [[2, 50], [3, 40], [4, 10]], color: '#ffb02e' },
  prototype: { name: 'Prototype Crate', cost: 1800, items: 3, levels: [[3, 45], [4, 40], [5, 15]], color: '#ffd23d' },
};
export const CRATE_ORDER = ['standard', 'military', 'prototype'];
const MAX_WEAPONS = 4, MAX_PERKS = 4;

// What a crate holds for this run: [{ kind: 'weapon' | 'perk', id, level }]. No item twice; the ship's starting weapon
// (already on board) may come up and is raised to the drawn level; with four weapons (or four perks) on board the draw
// takes from the other kind; evolutions never come from a crate (they stay a goal of the run).
export function rollCrate(game, tier, rnd = Math.random) {
  const def = CRATES[tier];
  if (!def) return [];
  const items = [];
  const weaponsOn = () => new Set([...game.weapons.map((w) => w.id), ...items.filter((x) => x.kind === 'weapon').map((x) => x.id)]);
  const perksOn = () => new Set([...Object.keys(game.passives), ...items.filter((x) => x.kind === 'perk').map((x) => x.id)]);
  for (let n = 0; n < def.items; n++) {
    const taken = new Set(items.map((x) => `${x.kind}:${x.id}`));
    const w = weaponsOn(), p = perksOn();
    const pool = [
      ...Object.keys(WEAPONS).filter((id) => !taken.has(`weapon:${id}`) && (w.has(id) || w.size < MAX_WEAPONS)).map((id) => ({ kind: 'weapon', id })),
      ...Object.keys(PASSIVES).filter((id) => !taken.has(`perk:${id}`) && (p.has(id) || p.size < MAX_PERKS)).map((id) => ({ kind: 'perk', id })),
    ];
    if (!pool.length) break;
    const pick = pool[Math.floor(rnd() * pool.length)];
    let r = rnd() * def.levels.reduce((a, [, wt]) => a + wt, 0), level = def.levels[def.levels.length - 1][0];
    for (const [lv, wt] of def.levels) { r -= wt; if (r <= 0) { level = lv; break; } }
    items.push({ ...pick, level: Math.min(level, pick.kind === 'weapon' ? WEAPON_MAX : PASSIVE_MAX) });
  }
  return items;
}

// Puts the items on the ship: a weapon or perk already there only ever goes up to the drawn level.
export function applyCrate(game, items) {
  for (const it of items) {
    if (it.kind === 'weapon') {
      let w = game.weapons.find((x) => x.id === it.id);
      if (!w) { game.addWeapon(it.id); w = game.weapons[game.weapons.length - 1]; }
      w.level = Math.max(w.level, it.level);
    } else {
      game.passives[it.id] = Math.max(game.passives[it.id] || 0, it.level);
      game.discover(`p:${it.id}`);
    }
  }
  game.recompute();
  game.checkCombos();
}

// How an item looks on its card (the same icons as the level-up cards, js/icons.js)
export function crateCard(it) {
  const d = it.kind === 'weapon' ? WEAPONS[it.id] : PASSIVES[it.id];
  return { name: d.name, color: d.color, icon: d.icon, art: `${it.kind === 'weapon' ? 'w' : 'p'}-${it.id}`, level: it.level, kind: it.kind };
}
