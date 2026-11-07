// Exports the 2.0 game data (ships, enemies, bosses, worlds, sectors, weapons, perks, combos, crates…) to JSON for
// Void Blaster 3.0 (Unreal Engine 5), so 3.0 starts from the same balance numbers as 2.0.
// Usage: npm run export:ue [-- <output dir>]   (default dist/ue-data)
// Functions in the tables (per-weapon fire logic, sector spawners…) are game code, not data: they are left out and
// listed in _manifest.json, so the 3.0 port knows what has to be rewritten in C++.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as data from '../js/data.js';
import { WEAPONS, WEAPON_MAX } from '../js/weapons.js';
import { COMBOS, COMBO_LEVEL, SUPER_LEVEL } from '../js/combos.js';
import { CRATES, CRATE_ORDER } from '../js/crates.js';

const out = resolve(process.argv[2] || 'dist/ue-data');
// js/version.js reads build-time globals, so take the numbers from its text instead of importing it.
const vText = readFileSync(new URL('../js/version.js', import.meta.url), 'utf8');
const VERSION = (vText.match(/version: '([^']+)'/) || [])[1];
const BUILD = Number((vText.match(/build: (\d+)/) || [])[1]);

// Plain-data copy: drops functions (recorded by path) and breaks reference cycles (recorded as "<ref:path>").
function plain(value, path, skipped, seen = new Map()) {
  if (typeof value === 'function') { skipped.push(path); return undefined; }
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return `<ref:${seen.get(value)}>`;
  seen.set(value, path);
  let res;
  if (Array.isArray(value)) {
    res = value.map((v, i) => plain(v, `${path}[${i}]`, skipped, seen) ?? null);
  } else {
    res = {};
    for (const [k, v] of Object.entries(value)) {
      const p = plain(v, `${path}.${k}`, skipped, seen);
      if (p !== undefined) res[k] = p;
    }
  }
  seen.delete(value);
  return res;
}

const tables = {
  ships: data.SHIPS,
  shop: data.SHOP,
  daily: data.DAILY,
  passives: { max: data.PASSIVE_MAX, list: data.PASSIVES },
  enemies: data.ENEMIES,
  bosses: data.BOSSES,
  traits: data.TRAITS,
  worldTuning: data.WORLD_TUNING,
  worlds: data.WORLDS,
  endless: data.ENDLESS,
  xp: Array.from({ length: 100 }, (_, i) => ({ level: i + 1, xp: data.xpFor(i + 1) })),
  weapons: { max: WEAPON_MAX, list: WEAPONS },
  combos: { comboLevel: COMBO_LEVEL, superLevel: SUPER_LEVEL, list: COMBOS },
  crates: { order: CRATE_ORDER, list: CRATES },
};

mkdirSync(out, { recursive: true });
const manifest = { source: 'super-game- (Void Blaster 2.0)', version: VERSION, build: BUILD, files: {}, skippedFunctions: {} };
for (const [name, value] of Object.entries(tables)) {
  const skipped = [];
  const json = plain(value, name, skipped);
  writeFileSync(join(out, `${name}.json`), JSON.stringify(json, null, 2) + '\n');
  manifest.files[name] = `${name}.json`;
  if (skipped.length) manifest.skippedFunctions[name] = skipped;
}
writeFileSync(join(out, '_manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const count = (o) => (Array.isArray(o) ? o.length : Object.keys(o).length);
console.log(`UE data (build ${BUILD}) -> ${out}`);
console.log(`  worlds ${data.WORLDS.length}, sectors ${data.ALL_STAGES.length}, enemies ${count(data.ENEMIES)}, ` +
  `bosses ${count(data.BOSSES)}, weapons ${count(WEAPONS)}, perks ${count(data.PASSIVES)}, combos ${count(COMBOS)}`);
const nSkipped = Object.values(manifest.skippedFunctions).reduce((n, l) => n + l.length, 0);
console.log(`  ${nSkipped} functions left out (game logic to port to C++), listed in _manifest.json`);
