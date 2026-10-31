import { SHOP } from './data.js';

export const SAVE_KEY = 'voidblaster.save.v1';
const KEY = SAVE_KEY;
// Before the 1.x -> 2.0 move the old save is copied here untouched, in case it is ever needed again.
export const LEGACY_KEY = 'voidblaster.save.1x';
// The save's format: 2 = Void Blaster 2.0. A save without it was made by 1.x (or by a 2.0 test build before build 120).
const SAVE_VERSION = 2;

const fresh = () => ({
  v: SAVE_VERSION,
  // set once when a 1.x save is moved to 2.0: { coins } shown on the welcome screen until the player closes it
  veteranWelcome: null,
  // the player had a 1.x save (the Veteran skin will be theirs when its art is ready)
  veteran: false,
  coins: 0,
  stars: {},
  // Codex entries discovered in any run (key -> 1); kept by Reset progress
  codex: {},
  // worlds whose 18 stars already paid the full-set bonus (id -> true)
  worldStars: {},
  cleared: {},
  // Endless mode best per world (id -> { kills, time })
  endless: {},
  ships: ['striker'],
  ship: 'striker',
  fullGame: false,
  unlockBonus: false,
  skins: [],
  skin: null,
  // tutorial hints already shown (id -> 1); tipsOff after SKIP
  tips: {},
  tipsOff: false,
  shop: {},
  daily: { last: null, streak: 0 },
  settings: { sfx: true, music: true, dmgNums: true, haptics: true, control: 'joystick' },
  stats: { kills: 0, runs: 0, bossKills: 0 },
});

export function loadSave() {
  const base = fresh();
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s) return base;
    return migrate({
      ...base, ...s,
      v: s.v,
      settings: { ...base.settings, ...s.settings },
      stats: { ...base.stats, ...s.stats },
      daily: { ...base.daily, ...s.daily },
    }, s);
  } catch {
    return base;
  }
}

// What the 1.x -> 2.0 move pays a veteran (decided by Konrad, 2026-10-31): 300 coins, +10 per 1.x star (at most
// 72), +half of the coins spent on shop upgrades; at most 2,000.
export const VETERAN = { base: 300, perStar: 10, maxStars: 72, refund: 0.5, max: 2000 };

export function veteranCoins(old) {
  const stars = Math.min(VETERAN.maxStars, Object.values(old.stars || {}).reduce((a, n) => a + (+n || 0), 0));
  let spent = 0;
  for (const it of SHOP) for (let i = 0; i < Math.min(old.shop?.[it.id] || 0, it.cost.length); i++) spent += it.cost[i];
  return Math.min(VETERAN.max, VETERAN.base + stars * VETERAN.perStar + Math.floor(spent * VETERAN.refund));
}

// A save made by a 2.0 test build before the save had a version: it holds progress that 1.x could not make
// (worlds 5-10, the 2.0 weapons in the Codex), so it is kept as it is.
const madeBy2 = (s) => [...Object.keys(s.stars || {}), ...Object.keys(s.cleared || {})].some((id) => +id.split('-')[0] >= 5)
  || ['w:rail', 'w:flame', 'w:singularity'].some((k) => s.codex?.[k]);

// 2.0 starts the journey over (decided by Konrad, 2026-10-26): the 1.x worlds 2-4 are different places, so a 1.x save's
// stars, cleared sectors, Endless records and shop upgrades go; the purchase, ships, skins, settings, Codex, daily
// streak and lifetime stats stay. A player who played 1.x gets the veteran coins and a welcome screen once.
function migrate(s, raw) {
  if (s.v === SAVE_VERSION) return s;
  if (madeBy2(s)) return { ...s, v: SAVE_VERSION };
  try { localStorage.setItem(LEGACY_KEY, JSON.stringify(raw)); } catch { /* storage unavailable */ }
  const played = (s.stats?.runs || 0) > 0;
  const coins = played ? veteranCoins(s) : 0;
  return {
    ...s, v: SAVE_VERSION,
    stars: {}, cleared: {}, worldStars: {}, endless: {}, shop: {},
    coins,
    veteran: played,
    veteranWelcome: played ? { coins } : null,
  };
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  return fresh();
}

export function hasLocalSave() {
  try { return localStorage.getItem(KEY) !== null; } catch { return false; }
}

export function importSave(json) {
  try { localStorage.setItem(KEY, json); } catch { /* storage unavailable */ }
  return loadSave();
}
