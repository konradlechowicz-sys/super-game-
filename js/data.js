export const SHIPS = {
  striker: {
    id: 'striker', name: 'Striker', color: '#2ff3ff', shape: 'striker',
    desc: 'Balanced interceptor. Reliable in any fight.',
    hp: 110, speed: 235, dmg: 1, armor: 0, weapon: 'blaster', cost: 0,
    perk: 'No weaknesses',
  },
  phantom: {
    id: 'phantom', name: 'Phantom', color: '#ff4dd8', shape: 'phantom',
    desc: 'Blazing-fast scout. Fragile, but hits harder.',
    hp: 80, speed: 290, dmg: 1.15, armor: 0, weapon: 'spread', cost: 400,
    perk: '+15% damage',
  },
  titan: {
    id: 'titan', name: 'Titan', color: '#ffb52e', shape: 'titan',
    desc: 'Heavy gunship. Slow and armored, shreds anything close.',
    hp: 160, speed: 200, dmg: 1, armor: 3, weapon: 'orbit', cost: 900,
    perk: 'Armor: -3 damage per hit',
  },
};

// Permanent upgrades. `per` is the fixed bonus each level adds; the game (Game.recompute) and the shop screen
// both read it from here. stat/unit/pct describe how the shop shows it: "Damage +16% → +24%".
export const SHOP = [
  { id: 'power', name: 'Weapon Core', stat: 'Damage', per: 0.08, pct: true, icon: 'power', cost: [60, 120, 220, 360, 550, 800, 1100, 1500] },
  { id: 'hull', name: 'Reinforced Hull', stat: 'Max hull', per: 15, icon: 'armor', cost: [50, 100, 180, 300, 480, 700, 950, 1300] },
  { id: 'thrust', name: 'Engine Tuning', stat: 'Speed', per: 0.05, pct: true, icon: 'thrusters', cost: [50, 100, 180, 300, 480] },
  { id: 'magnet', name: 'Collector Field', stat: 'Pickup range', per: 0.15, pct: true, icon: 'tractor', cost: [40, 80, 150, 250, 400] },
  { id: 'regen', name: 'Nano Repair', stat: 'Repair', per: 0.25, unit: '/s', icon: 'heal', cost: [100, 200, 350, 550, 800, 1100] },
  { id: 'growth', name: 'Data Mining', stat: 'XP gain', per: 0.08, pct: true, icon: 'amplifier', cost: [60, 120, 220, 360, 550, 800] },
  { id: 'greed', name: 'Salvage Rights', stat: 'Coins', per: 0.15, pct: true, icon: 'coins', cost: [80, 160, 280, 450, 700, 1000] },
  { id: 'reroll', name: 'Re-Roll Chip', stat: 'Re-rolls per run', per: 1, plain: true, icon: 'overclock', cost: [150, 350, 700] },
  { id: 'revive', name: 'Phoenix Protocol', stat: 'Revives per run', per: 1, plain: true, icon: 'phoenix', cost: [800] },
];

// Total bonus of a permanent upgrade at a given level (0 when not bought).
export function shopBonus(save, id) {
  const it = SHOP.find((x) => x.id === id);
  return (save.shop[id] || 0) * it.per;
}

export const DAILY = [50, 80, 120, 160, 220, 300, 500];

export const PASSIVES = {
  power: { name: 'Power Core', color: '#ff3d6e', icon: 'power', desc: '+12% damage' },
  overclock: { name: 'Overclock', color: '#ffd23d', icon: 'overclock', desc: '-8% weapon cooldown' },
  thrusters: { name: 'Thrusters', color: '#ff8a2a', icon: 'thrusters', desc: '+8% movement speed' },
  armor: { name: 'Armor Plating', color: '#3dff8a', icon: 'armor', desc: '+20 max hull, +0.15 hull/sec' },
  tractor: { name: 'Tractor Beam', color: '#3dc8ff', icon: 'tractor', desc: '+30% pickup range' },
  amplifier: { name: 'Amplifier', color: '#b06bff', icon: 'amplifier', desc: '+12% area of effect' },
};
export const PASSIVE_MAX = 5;

export const ENEMIES = {
  drone: { hp: 12, speed: 72, dmg: 8, r: 11, xp: 1, color: '#ff3d9a', shape: 'tri' },
  swarmer: { hp: 6, speed: 118, dmg: 4, r: 8, xp: 1, color: '#ffe23d', shape: 'dart', pack: [4, 7] },
  dasher: { hp: 28, speed: 58, dmg: 9, r: 13, xp: 2, color: '#ff8a2a', shape: 'diamond', ai: 'dash' },
  shooter: { hp: 30, speed: 50, dmg: 8, r: 13, xp: 3, color: '#4dff8a', shape: 'hex', ai: 'shoot', spin: 1 },
  tank: { hp: 130, speed: 34, dmg: 12, r: 22, xp: 6, color: '#a35cff', shape: 'square', spin: 0.6 },
  splitter: { hp: 45, speed: 58, dmg: 10, r: 15, xp: 2, color: '#9dff3d', shape: 'circle', split: 'swarmer', spin: 1.5 },
  // Crystal Belt
  shard: { hp: 14, speed: 150, dmg: 7, r: 9, xp: 1, color: '#7df9ff', shape: 'shard', ai: 'orbit' },
  prism: { hp: 40, speed: 45, dmg: 8, r: 14, xp: 3, color: '#b4fff0', shape: 'prism', ai: 'shoot', shots: 3, fire: 4.2, spin: 0.8 },
  asteroid: { hp: 160, speed: 70, dmg: 14, r: 26, xp: 5, color: '#6fa8ff', shape: 'rock', ai: 'drift', spin: 0.5 },
  // Solar Forge
  bomber: { hp: 22, speed: 100, dmg: 6, r: 12, xp: 2, color: '#ff6a1a', shape: 'bomb', ai: 'fuse', spin: 3 },
  turret: { hp: 70, speed: 0, dmg: 8, r: 16, xp: 4, color: '#ffc23d', shape: 'turret', ai: 'turret', spin: 0.7 },
  golem: { hp: 220, speed: 30, dmg: 14, r: 24, xp: 8, color: '#ff3d1a', shape: 'square', spin: 0.4 },
  // Void Core
  wraith: { hp: 30, speed: 80, dmg: 7, r: 12, xp: 3, color: '#c86bff', shape: 'wraith', ai: 'blink' },
  eye: { hp: 50, speed: 40, dmg: 8, r: 15, xp: 4, color: '#ff4dd8', shape: 'eye', ai: 'seeker' },
  voidling: { hp: 10, speed: 130, dmg: 4, r: 8, xp: 1, color: '#9d4dff', shape: 'dart', pack: [4, 6] },
};

export const BOSSES = {
  hive: {
    // First boss: deliberately forgiving (weaker, slower bullets, fewer minions, long pauses).
    name: 'HIVE MOTHER', hp: 5000, speed: 42, dmg: 18, r: 58, color: '#ff2d6f', inner: '#ff8ad0', sides: 6,
    move: 'chase', rest: 1.9, phases: [0.5], attacks: ['spiral', 'burst', 'summon', 'charge'], summon: ['drone', 'swarmer'],
    bulletDmg: 7, bulletSpeed: 0.85, burstN: 16, summonN: 5, bgSpawn: 0.2,
  },
  serpent: {
    name: 'CRYSTAL SERPENT', hp: 15000, speed: 120, dmg: 22, r: 34, color: '#2ff3ff', inner: '#b4fff0', sides: 5,
    move: 'serpent', rest: 1.2, phases: [0.5], attacks: ['segburst', 'lunge', 'burst', 'summon', 'segburst', 'lunge'],
    summon: ['shard'], segments: 14, segR: 20, segSpacing: 30,
  },
  forge: {
    name: 'FORGE TITAN', hp: 14000, speed: 32, dmg: 28, r: 64, color: '#ffb52e', inner: '#ff5a1a', sides: 4,
    move: 'chase', rest: 1.3, phases: [0.5], attacks: ['beams', 'mortar', 'turrets', 'burst', 'mortar'], summon: ['bomber'],
  },
  voidheart: {
    name: 'VOID HEART', hp: 18000, speed: 70, dmg: 26, r: 60, color: '#b04dff', inner: '#ff2d95', sides: 8,
    move: 'float', rest: 1.1, phases: [0.6, 0.25],
    attacks: ['spiral', 'teleport', 'blackhole', 'beams', 'summon', 'teleport', 'burst'], summon: ['wraith', 'voidling'],
  },
};

const W1 = [
  {
    id: '1-1', name: 'First Contact', duration: 180, hp: 1.5, speed: 1, rate: [0.9, 3.2], max: 110, kills: 600,
    enemies: [['drone', 0, 10], ['swarmer', 45, 5]],
    events: [
      { t: 60, type: 'ring', enemy: 'drone', count: 16, msg: 'INCOMING SWARM' },
      { t: 100, type: 'elite', enemy: 'drone', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'swarmer', count: 28, msg: 'FINAL WAVE' },
    ],
  },
  {
    id: '1-2', name: 'Swarm Front', duration: 195, hp: 1.8, speed: 1.03, rate: [1, 3.6], max: 130, kills: 850,
    enemies: [['drone', 0, 10], ['swarmer', 10, 6], ['dasher', 35, 4]],
    events: [
      { t: 70, type: 'ring', enemy: 'swarmer', count: 30, msg: 'SWARM INCOMING' },
      { t: 110, type: 'elite', enemy: 'dasher', msg: 'ELITE DETECTED' },
      { t: 165, type: 'surge', dur: 25, mul: 2, msg: 'FINAL WAVE' },
    ],
  },
  {
    id: '1-3', name: 'Glass Fields', duration: 210, hp: 2.1, speed: 1.05, rate: [1.1, 4], max: 150, kills: 950,
    enemies: [['drone', 0, 10], ['swarmer', 10, 5], ['dasher', 25, 4], ['shooter', 40, 4]],
    events: [
      { t: 60, type: 'ring', enemy: 'drone', count: 24, msg: 'INCOMING SWARM' },
      { t: 105, type: 'elite', enemy: 'shooter', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'swarmer', count: 36, msg: 'SWARM INCOMING' },
      { t: 180, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' },
    ],
  },
  {
    id: '1-4', name: 'Heavy Metal', duration: 225, hp: 2.4, speed: 1.07, rate: [1.1, 4.3], max: 165, kills: 1050,
    enemies: [['drone', 0, 10], ['swarmer', 10, 5], ['dasher', 25, 4], ['shooter', 40, 3], ['tank', 50, 3]],
    events: [
      { t: 80, type: 'elite', enemy: 'tank', msg: 'ELITE DETECTED' },
      { t: 120, type: 'ring', enemy: 'dasher', count: 14, msg: 'DASHER PACK' },
      { t: 160, type: 'elite', enemy: 'tank', msg: 'ELITE DETECTED' },
      { t: 195, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' },
    ],
  },
  {
    id: '1-5', name: 'Split Storm', duration: 240, hp: 2.8, speed: 1.09, rate: [1.2, 4.6], max: 180, kills: 1200,
    enemies: [['drone', 0, 9], ['swarmer', 10, 5], ['dasher', 25, 4], ['shooter', 40, 3], ['tank', 55, 3], ['splitter', 30, 5]],
    events: [
      { t: 70, type: 'ring', enemy: 'splitter', count: 12, msg: 'SPLITTERS INCOMING' },
      { t: 110, type: 'elite', enemy: 'splitter', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'swarmer', count: 40, msg: 'SWARM INCOMING' },
      { t: 180, type: 'elite', enemy: 'tank', msg: 'ELITE DETECTED' },
      { t: 210, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' },
    ],
  },
  {
    id: '1-6', name: 'Hive Mother', duration: 150, bossAt: 150, boss: 'hive', hp: 2.3, speed: 1.1, rate: [1, 3.4], max: 130, kills: 600,
    enemies: [['drone', 0, 9], ['swarmer', 10, 5], ['dasher', 25, 4], ['shooter', 40, 2], ['splitter', 45, 3], ['tank', 70, 1]],
    events: [
      { t: 50, type: 'ring', enemy: 'drone', count: 20, msg: 'INCOMING SWARM' },
      { t: 100, type: 'elite', enemy: 'drone', msg: 'ELITE DETECTED' },
    ],
  },
];

// Compact stage builder for worlds 2-4.
// enemies: [type, unlock time (s), weight]; hp0 -> hp: enemy toughness at the start / end of the stage.
const S = (id, name, duration, hp0, hp, rate, max, kills, enemies, events, extra = {}) => ({
  id, name, duration, hp0, hp, speed: 1.1, rate, max, kills, enemies, events, ...extra,
});

const W2 = [
  S('2-1', 'Frozen Drift', 210, 1.15, 3.0, [1.1, 4.2], 150, 900,
    [['drone', 0, 8], ['shard', 0, 6], ['swarmer', 15, 4], ['asteroid', 30, 2]],
    [{ t: 60, type: 'asteroids', count: 6, msg: 'ASTEROID FIELD' }, { t: 110, type: 'elite', enemy: 'shard', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'shard', count: 20, msg: 'SHARD STORM' }, { t: 180, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('2-2', 'Prism Reef', 220, 1.17, 3.1, [1.1, 4.3], 155, 950,
    [['drone', 0, 8], ['shard', 0, 6], ['swarmer', 10, 4], ['prism', 30, 4], ['asteroid', 45, 2]],
    [{ t: 60, type: 'ring', enemy: 'drone', count: 24, msg: 'INCOMING SWARM' }, { t: 110, type: 'elite', enemy: 'prism', msg: 'ELITE DETECTED' },
      { t: 140, type: 'asteroids', count: 8, msg: 'ASTEROID FIELD' }, { t: 190, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('2-3', 'Shatter Point', 230, 1.19, 3.2, [1.15, 4.4], 160, 1000,
    [['drone', 0, 7], ['shard', 0, 6], ['swarmer', 10, 4], ['prism', 25, 4], ['splitter', 40, 4], ['asteroid', 50, 2]],
    [{ t: 70, type: 'ring', enemy: 'splitter', count: 12, msg: 'SPLITTERS INCOMING' }, { t: 120, type: 'asteroids', count: 10, msg: 'ASTEROID FIELD' },
      { t: 150, type: 'elite', enemy: 'prism', msg: 'ELITE DETECTED' }, { t: 200, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('2-4', 'Glacier Run', 240, 1.21, 3.3, [1.15, 4.5], 165, 1050,
    [['drone', 0, 7], ['shard', 0, 6], ['dasher', 15, 4], ['prism', 25, 4], ['tank', 50, 3], ['asteroid', 30, 3]],
    [{ t: 60, type: 'asteroids', count: 10, msg: 'ASTEROID FIELD' }, { t: 100, type: 'elite', enemy: 'tank', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'shard', count: 30, msg: 'SHARD STORM' }, { t: 210, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('2-5', 'Mirror Maze', 250, 1.23, 3.5, [1.2, 4.6], 175, 1150,
    [['drone', 0, 7], ['shard', 0, 6], ['swarmer', 0, 4], ['prism', 20, 5], ['splitter', 35, 4], ['tank', 55, 3], ['asteroid', 30, 2]],
    [{ t: 60, type: 'ring', enemy: 'prism', count: 10, msg: 'PRISM RING' }, { t: 110, type: 'elite', enemy: 'splitter', msg: 'ELITE DETECTED' },
      { t: 150, type: 'asteroids', count: 12, msg: 'ASTEROID FIELD' }, { t: 180, type: 'elite', enemy: 'prism', msg: 'ELITE DETECTED' },
      { t: 220, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('2-6', 'Crystal Serpent', 150, 1.25, 3.3, [1.2, 4.2], 160, 750,
    [['drone', 0, 7], ['shard', 0, 6], ['swarmer', 10, 4], ['prism', 25, 4], ['asteroid', 40, 2]],
    [{ t: 50, type: 'asteroids', count: 8, msg: 'ASTEROID FIELD' }, { t: 100, type: 'elite', enemy: 'prism', msg: 'ELITE DETECTED' }],
    { bossAt: 150, boss: 'serpent' }),
];

const W3 = [
  S('3-1', 'Ember Gate', 225, 1.3, 3.6, [1.15, 4.3], 160, 1000,
    [['drone', 0, 7], ['bomber', 0, 6], ['swarmer', 10, 4], ['dasher', 25, 4], ['turret', 40, 2]],
    [{ t: 60, type: 'mortar', count: 6, msg: 'INCOMING FIRE' }, { t: 110, type: 'elite', enemy: 'bomber', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'bomber', count: 14, msg: 'BOMBER PACK' }, { t: 195, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('3-2', 'Slag Rivers', 235, 1.32, 3.7, [1.15, 4.4], 165, 1050,
    [['drone', 0, 7], ['bomber', 0, 6], ['dasher', 15, 4], ['turret', 30, 3], ['golem', 50, 2]],
    [{ t: 60, type: 'flare', count: 2, msg: 'SOLAR FLARE' }, { t: 100, type: 'elite', enemy: 'golem', msg: 'ELITE DETECTED' },
      { t: 140, type: 'mortar', count: 8, msg: 'INCOMING FIRE' }, { t: 205, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('3-3', 'Turret Alley', 245, 1.34, 3.8, [1.2, 4.5], 170, 1100,
    [['drone', 0, 6], ['bomber', 0, 6], ['swarmer', 10, 4], ['turret', 20, 4], ['shooter', 35, 3], ['golem', 55, 2]],
    [{ t: 60, type: 'ring', enemy: 'turret', count: 6, msg: 'TURRET RING' }, { t: 110, type: 'flare', count: 3, msg: 'SOLAR FLARE' },
      { t: 150, type: 'elite', enemy: 'turret', msg: 'ELITE DETECTED' }, { t: 215, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('3-4', 'Solar Flare', 255, 1.36, 3.95, [1.2, 4.6], 175, 1150,
    [['drone', 0, 6], ['bomber', 0, 6], ['dasher', 10, 4], ['turret', 25, 3], ['golem', 45, 3]],
    [{ t: 50, type: 'flare', count: 3, msg: 'SOLAR FLARE' }, { t: 100, type: 'mortar', count: 10, msg: 'INCOMING FIRE' },
      { t: 140, type: 'flare', count: 4, msg: 'SOLAR FLARE' }, { t: 175, type: 'elite', enemy: 'golem', msg: 'ELITE DETECTED' },
      { t: 225, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('3-5', 'Core Smelter', 265, 1.38, 4.2, [1.25, 4.7], 185, 1250,
    [['drone', 0, 6], ['bomber', 0, 6], ['swarmer', 0, 4], ['dasher', 15, 4], ['turret', 25, 3], ['shooter', 35, 3], ['golem', 50, 3]],
    [{ t: 60, type: 'ring', enemy: 'bomber', count: 18, msg: 'BOMBER PACK' }, { t: 110, type: 'flare', count: 4, msg: 'SOLAR FLARE' },
      { t: 150, type: 'elite', enemy: 'turret', msg: 'ELITE DETECTED' }, { t: 190, type: 'mortar', count: 12, msg: 'INCOMING FIRE' },
      { t: 235, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('3-6', 'Forge Titan', 150, 1.4, 4.0, [1.2, 4.3], 165, 750,
    [['drone', 0, 6], ['bomber', 0, 6], ['dasher', 15, 4], ['turret', 30, 3], ['golem', 70, 2]],
    [{ t: 50, type: 'flare', count: 3, msg: 'SOLAR FLARE' }, { t: 100, type: 'elite', enemy: 'golem', msg: 'ELITE DETECTED' }],
    { bossAt: 150, boss: 'forge' }),
];

const W4 = [
  S('4-1', 'Event Horizon', 240, 1.45, 4.2, [1.2, 4.4], 170, 1100,
    [['voidling', 0, 6], ['drone', 0, 6], ['wraith', 15, 5], ['eye', 35, 3], ['tank', 50, 2]],
    [{ t: 60, type: 'well', count: 1, msg: 'GRAVITY ANOMALY' }, { t: 110, type: 'elite', enemy: 'wraith', msg: 'ELITE DETECTED' },
      { t: 150, type: 'ring', enemy: 'voidling', count: 30, msg: 'VOID SWARM' }, { t: 210, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('4-2', 'Whispering Dark', 250, 1.47, 4.3, [1.2, 4.5], 175, 1150,
    [['voidling', 0, 6], ['wraith', 0, 5], ['eye', 20, 4], ['prism', 35, 3], ['splitter', 50, 3]],
    [{ t: 60, type: 'ring', enemy: 'wraith', count: 12, msg: 'WRAITHS RISING' }, { t: 110, type: 'well', count: 2, msg: 'GRAVITY ANOMALY' },
      { t: 150, type: 'elite', enemy: 'eye', msg: 'ELITE DETECTED' }, { t: 220, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('4-3', 'Phase Rift', 260, 1.49, 4.45, [1.25, 4.6], 180, 1200,
    [['voidling', 0, 6], ['wraith', 0, 5], ['eye', 15, 4], ['bomber', 30, 4], ['tank', 50, 2]],
    [{ t: 60, type: 'well', count: 2, msg: 'GRAVITY ANOMALY' }, { t: 100, type: 'mortar', count: 8, msg: 'INCOMING FIRE' },
      { t: 150, type: 'elite', enemy: 'wraith', msg: 'ELITE DETECTED' }, { t: 230, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('4-4', 'Gravity Well', 270, 1.51, 4.6, [1.25, 4.7], 185, 1250,
    [['voidling', 0, 6], ['wraith', 0, 5], ['eye', 15, 4], ['shard', 25, 4], ['golem', 50, 2]],
    [{ t: 50, type: 'well', count: 2, msg: 'GRAVITY ANOMALY' }, { t: 100, type: 'flare', count: 3, msg: 'VOID FLARE' },
      { t: 140, type: 'well', count: 3, msg: 'GRAVITY ANOMALY' }, { t: 180, type: 'elite', enemy: 'golem', msg: 'ELITE DETECTED' },
      { t: 240, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('4-5', 'Null Cathedral', 285, 1.53, 4.8, [1.3, 4.8], 190, 1350,
    [['voidling', 0, 6], ['wraith', 0, 5], ['eye', 10, 4], ['prism', 25, 3], ['bomber', 35, 3], ['tank', 50, 2]],
    [{ t: 60, type: 'ring', enemy: 'eye', count: 8, msg: 'ALL-SEEING' }, { t: 110, type: 'well', count: 3, msg: 'GRAVITY ANOMALY' },
      { t: 150, type: 'elite', enemy: 'eye', msg: 'ELITE DETECTED' }, { t: 190, type: 'flare', count: 4, msg: 'VOID FLARE' },
      { t: 250, type: 'surge', dur: 30, mul: 2, msg: 'FINAL WAVE' }]),
  S('4-6', 'Void Heart', 160, 1.55, 4.6, [1.25, 4.4], 170, 800,
    [['voidling', 0, 6], ['wraith', 0, 5], ['eye', 15, 4], ['tank', 50, 2]],
    [{ t: 50, type: 'well', count: 2, msg: 'GRAVITY ANOMALY' }, { t: 100, type: 'elite', enemy: 'wraith', msg: 'ELITE DETECTED' },
      { t: 130, type: 'elite', enemy: 'eye', msg: 'ELITE DETECTED' }],
    { bossAt: 160, boss: 'voidheart' }),
];

// Elite traits (v1.1). Each sector's elites always have the same traits, so a sector plays the same way every time:
// none in 1-1 and 1-2 (the player meets a plain elite first), one in sectors 1-3 to 2-6, two in worlds 3 and 4.
export const TRAITS = {
  swift: { name: 'SWIFT', color: '#2ff3ff', tip: 'Fast, and charges after a warning flash. Dodge sideways.' },
  bulwark: { name: 'BULWARK', color: '#3dff8a', tip: "Huge and solid: you can't fly through it, and its aura slows you." },
  berserker: { name: 'BERSERKER', color: '#ff3d3d', tip: 'Hits hard and goes berserk at half health. Keep your distance.' },
  commander: { name: 'COMMANDER', color: '#ffd23d', tip: 'Brings an escort and speeds up enemies near it. Take it out first.' },
  shielded: { name: 'SHIELDED', color: '#b06bff', tip: 'Its shield regrows if you stop hitting it. Keep firing.' },
};
// Traits of each elite event in a sector, in the order the elites appear.
const ELITE_TRAITS = {
  '1-3': [['shielded']], '1-4': [['swift'], ['bulwark']], '1-5': [['berserker'], ['commander']], '1-6': [['swift']],
  '2-1': [['berserker']], '2-2': [['shielded']], '2-3': [['commander']], '2-4': [['bulwark']],
  '2-5': [['swift'], ['shielded']], '2-6': [['commander']],
  '3-1': [['swift', 'berserker']], '3-2': [['bulwark', 'shielded']], '3-3': [['shielded', 'commander']],
  '3-4': [['bulwark', 'berserker']], '3-5': [['commander', 'berserker']], '3-6': [['swift', 'shielded']],
  '4-1': [['berserker', 'shielded']], '4-2': [['commander', 'shielded']], '4-3': [['swift', 'berserker']],
  '4-4': [['bulwark', 'commander']], '4-5': [['berserker', 'shielded']], '4-6': [['swift', 'berserker'], ['commander', 'shielded']],
};
for (const st of [...W1, ...W2, ...W3, ...W4]) {
  // v1.1 stars: the 3rd star needs every elite of the sector, and the kill goal is 20% higher in worlds 2-4
  st.elites = st.events.filter((e) => e.type === 'elite').length;
  if (!W1.includes(st)) st.kills = Math.round((st.kills * 1.2) / 10) * 10;
  const list = ELITE_TRAITS[st.id] || [];
  st.events.filter((e) => e.type === 'elite').forEach((e, i) => {
    e.traits = list[i] || [];
    if (e.traits.length) e.msg = `${e.traits.map((t) => TRAITS[t].name).join(' ')} ELITE`;
  });
}

export const WORLDS = [
  {
    id: 1, name: 'Neon Nebula', color: '#ff2d95', stages: W1, music: 'game',
    theme: { top: '#16002e', bottom: '#030010', neb: ['#ff2d95', '#7a2dff', '#00b3ff'], grid: '#b04dff' },
  },
  {
    id: 2, name: 'Crystal Belt', color: '#2ff3ff', stages: W2, music: 'game2',
    theme: { top: '#001a2e', bottom: '#000812', neb: ['#2ff3ff', '#3d7bff', '#b4fff0'], grid: '#2fd2ff' },
  },
  {
    id: 3, name: 'Solar Forge', color: '#ffb52e', stages: W3, music: 'game3',
    theme: { top: '#2a0a00', bottom: '#0c0300', neb: ['#ff8a2a', '#ff3d1a', '#ffd23d'], grid: '#ff8a2a' },
  },
  {
    id: 4, name: 'Void Core', color: '#b04dff', stages: W4, music: 'game4',
    theme: { top: '#0d0020', bottom: '#020005', neb: ['#9d4dff', '#ff2d95', '#3d1aff'], grid: '#9d4dff' },
  },
];

export const ALL_STAGES = WORLDS.flatMap((w) => w.stages.map((s) => ({ ...s, world: w })));

export function stageIndex(id) {
  return ALL_STAGES.findIndex((s) => s.id === id);
}

export function xpFor(level) {
  return Math.floor(4 + (level - 1) * 4 + Math.pow(level - 1, 1.6));
}
