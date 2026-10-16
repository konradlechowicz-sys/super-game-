export const SHIPS = {
  striker: {
    id: 'striker', name: 'Striker', color: '#2ff3ff', shape: 'striker',
    desc: 'Balanced interceptor. Reliable in any fight.',
    hp: 100, speed: 235, dmg: 1, armor: 0, weapon: 'blaster', cost: 0,
    perk: 'No weaknesses',
  },
  phantom: {
    id: 'phantom', name: 'Phantom', color: '#ff4dd8', shape: 'phantom',
    desc: 'Blazing-fast scout. Fragile, but hits harder.',
    hp: 70, speed: 290, dmg: 1.15, armor: 0, weapon: 'spread', cost: 400,
    perk: '+15% damage',
  },
  titan: {
    id: 'titan', name: 'Titan', color: '#ffb52e', shape: 'titan',
    desc: 'Heavy gunship. Slow and armored, shreds anything close.',
    hp: 150, speed: 200, dmg: 1, armor: 3, weapon: 'orbit', cost: 900,
    perk: 'Armor: -3 damage per hit',
  },
};

export const SHOP = [
  { id: 'power', name: 'Weapon Core', desc: '+8% damage', icon: 'power', cost: [60, 120, 220, 360, 550] },
  { id: 'hull', name: 'Reinforced Hull', desc: '+15 max hull', icon: 'armor', cost: [50, 100, 180, 300, 480] },
  { id: 'thrust', name: 'Engine Tuning', desc: '+5% speed', icon: 'thrusters', cost: [50, 100, 180, 300, 480] },
  { id: 'magnet', name: 'Collector Field', desc: '+15% pickup range', icon: 'tractor', cost: [40, 80, 150, 250, 400] },
  { id: 'regen', name: 'Nano Repair', desc: '+0.25 hull / sec', icon: 'heal', cost: [100, 200, 350, 550] },
  { id: 'growth', name: 'Data Mining', desc: '+8% XP gain', icon: 'amplifier', cost: [60, 120, 220, 360, 550] },
  { id: 'greed', name: 'Salvage Rights', desc: '+15% coins', icon: 'coins', cost: [80, 160, 280, 450, 700] },
  { id: 'reroll', name: 'Re-Roll Chip', desc: '+1 upgrade re-roll per run', icon: 'overclock', cost: [150, 350, 700] },
  { id: 'revive', name: 'Phoenix Protocol', desc: 'Revive once per run', icon: 'phoenix', cost: [800] },
];

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
};

export const BOSSES = {
  hive: { name: 'HIVE MOTHER', hp: 3000, speed: 46, dmg: 25, r: 58, color: '#ff2d6f', xp: 0 },
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
    id: '1-6', name: 'Hive Mother', duration: 150, bossAt: 150, boss: 'hive', hp: 2.6, speed: 1.1, rate: [1.2, 4.2], max: 160, kills: 700,
    enemies: [['drone', 0, 9], ['swarmer', 10, 5], ['dasher', 25, 4], ['shooter', 40, 3], ['tank', 55, 2], ['splitter', 45, 3]],
    events: [
      { t: 50, type: 'ring', enemy: 'drone', count: 24, msg: 'INCOMING SWARM' },
      { t: 100, type: 'elite', enemy: 'tank', msg: 'ELITE DETECTED' },
      { t: 125, type: 'elite', enemy: 'dasher', msg: 'ELITE DETECTED' },
    ],
  },
];

export const WORLDS = [
  {
    id: 1, name: 'Neon Nebula', color: '#ff2d95', stages: W1,
    theme: { top: '#16002e', bottom: '#030010', neb: ['#ff2d95', '#7a2dff', '#00b3ff'], grid: '#b04dff' },
  },
  { id: 2, name: 'Crystal Belt', color: '#2ff3ff', stages: [], locked: true },
  { id: 3, name: 'Solar Forge', color: '#ffb52e', stages: [], locked: true },
  { id: 4, name: 'Void Core', color: '#9d4dff', stages: [], locked: true },
];

export const ALL_STAGES = WORLDS.flatMap((w) => w.stages.map((s) => ({ ...s, world: w })));

export function stageIndex(id) {
  return ALL_STAGES.findIndex((s) => s.id === id);
}

export function xpFor(level) {
  return Math.floor(4 + (level - 1) * 4 + Math.pow(level - 1, 1.6));
}
