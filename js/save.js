const KEY = 'voidblaster.save.v1';

const fresh = () => ({
  coins: 0,
  stars: {},
  cleared: {},
  ships: ['striker'],
  ship: 'striker',
  shop: {},
  daily: { last: null, streak: 0 },
  settings: { sfx: true, music: true, dmgNums: true },
  stats: { kills: 0, runs: 0, bossKills: 0 },
});

export function loadSave() {
  const base = fresh();
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s) return base;
    return {
      ...base, ...s,
      settings: { ...base.settings, ...s.settings },
      stats: { ...base.stats, ...s.stats },
      daily: { ...base.daily, ...s.daily },
    };
  } catch {
    return base;
  }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  return fresh();
}
