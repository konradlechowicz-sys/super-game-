// The four social-media videos (plan approved by Konrad 2026-11-02): what each shows, shot by shot, recorded from
// the real game by promo/record.mjs. A shot: dur (seconds), setup (runs in the page once, before the shot; window.__promo
// is the recorder's toolkit there), warm (seconds of game run off camera first), each (page code run every frame,
// with P, t and dur), cap (a caption: t, s, y, void, rows, at, until), fadeIn / fadeOut (to black). Shot lengths
// are whole or half bars of the video's music, so the cuts fall on the beat. Captions in English (Konrad's choice).
import { codexSections } from '../js/codex.js';

export const CODEX_KEYS = codexSections().flatMap((s) => s.items.map((i) => i.key));

const HALE = 'EARTH COMMAND // ADMIRAL HALE', VOID = 'VOID COLLECTIVE // SIGNAL';
const TYPE = 'P.type(t);';
// a story shot: the scene's picture with the given transmission (functions run in the page, so the text goes in as JSON)
const story = (key, panel, say) => new Function(`window.__promo.story(${JSON.stringify(key)}, ${panel}, ${JSON.stringify(say || null)});`);
// the end card: key art, VOID BLASTER 2.0, OUT NOW on iPhone, Android coming soon (changed 2026-11-14, promo/recard.mjs)
const END = (bars, bar) => ({ dur: bars * bar, each: 'P.end(Math.min(1, t / 0.4));', fadeOut: 0.8 });

// ---- 1. THE INVASION: the story trailer, on the 2.0 theme (142.2 BPM); the gameplay starts on the drop
const B1 = 1.6875;
const invasion = {
  file: 'VB-01-invasion', cover: 2,
  music: { file: 'art/2.0/audio/void-blaster-theme-suno.mp3', start: 35.5 - 6 * B1 },
  shots: [
    { dur: 2 * B1, setup: story('intro', 1), each: TYPE, fadeIn: 0.4 },
    { dur: 2 * B1, setup: story('intro', 2), each: TYPE },
    { dur: 2 * B1, setup: story('intro', 3, [{ who: 'cmd', head: 'EARTH COMMAND // ADMIRAL HALE', lines: ["One ship. That's all we have left.", 'Take back our sky.'] }]), each: TYPE },
    { dur: 2 * B1, warm: 1, setup: () => { const P = window.__promo; P.stage('1-4', { at: 50, weapons: [['blaster', 5], ['missiles', 5], ['lightning', 4]] }); P.stress(120); },
      cap: { t: 'ONE PILOT', s: 'VS. THE VOID COLLECTIVE', y: 0.17, at: 0.3 } },
    { dur: B1, setup: story('w2', 0, [{ who: 'void', head: VOID, lines: ['MOON: BRIDGEHEAD ESTABLISHED.'] }]), each: TYPE },
    { dur: B1, setup: story('w3', 0, [{ who: 'void', head: VOID, lines: ['MARS: 61% REWRITTEN.'] }]), each: TYPE },
    { dur: B1, setup: story('w5', 0, [{ who: 'void', head: VOID, lines: ['WHY DO YOU RESIST REPAIR?'] }]), each: TYPE },
    { dur: B1, setup: story('w7', 0, [{ who: 'cmd', head: HALE, lines: ["Past the Gate, we can't reach you."] }]), each: TYPE },
    { dur: B1, setup: story('w8', 0, [{ who: 'void', head: VOID, lines: ['WE GROW. YOU COULD GROW WITH US.'] }]), each: TYPE },
    { dur: 2 * B1, setup: story('w9', 0, [{ who: 'void', head: VOID, lines: ['COME CLOSER, LITTLE LIGHT.'] }]), each: 'P.type(t, 24);' },
    { dur: 2 * B1, warm: 4, setup: () => window.__promo.stage('10-6', { boss: true, weapons: [['rail', 5, true], ['flame', 5], ['singularity', 5], ['blaster', 5]] }),
      cap: { t: 'REACH THE HEART', s: '10 WORLDS · ONE JOURNEY', y: 0.17, at: 0.4 } },
    END(2, B1),
  ],
};

// ---- 2. THE SWARM: gameplay chaos, on world 1's sector track (140.6 BPM)
const B2 = 60 / 140.6 * 4;
const swarm = {
  file: 'VB-02-swarm', cover: 1.2,
  music: { file: 'art/2.0/audio/w01-orbital-ruins-sector.mp3', start: 46.686 },
  shots: [
    { dur: 2 * B2, warm: 1.5, setup: () => { const P = window.__promo; P.stage('2-4', { at: 60, weapons: [['pulse', 5], ['singularity', 5], ['flame', 5], ['blaster', 5]] }); P.stress(300); },
      cap: { t: '300+ ENEMIES', s: 'ON SCREEN AT ONCE', y: 0.17, at: 0.2 } },
    { dur: B2, warm: 0.5, setup: () => { const P = window.__promo; const g = P.stage('3-3', { at: 40, weapons: [['blaster', 3], ['spread', 2]] }); delete g.openCards; g.gainXp((g.xpNext - g.xp) / g.player.xpMult + 1, true); },
      cap: { t: 'BUILD YOUR ARSENAL', s: 'PICK YOUR UPGRADES', y: 0.84, at: 0.1 } },
    { dur: 1.5 * B2, warm: 1, setup: () => { const P = window.__promo; P.stage('4-3', { at: 45, r: 50, weapons: [['flame', 5, true], ['orbit', 5]] }); P.stress(140); },
      cap: { t: 'INFERNO', s: 'FLAMETHROWER · EVOLVED', y: 0.17, at: 0.15 } },
    { dur: 1.5 * B2, warm: 1.5, setup: () => { const P = window.__promo; P.stage('8-3', { at: 45, weapons: [['singularity', 5, true], ['pulse', 5]] }); P.stress(160); },
      cap: { t: 'EVENT HORIZON', s: 'SINGULARITY CANNON · EVOLVED', y: 0.17, at: 0.15 } },
    { dur: 1.5 * B2, warm: 1, setup: () => { const P = window.__promo; P.stage('6-3', { at: 45, weapons: [['lightning', 5, true], ['mines', 5]] }); P.stress(160); },
      cap: { t: 'TEMPEST', s: 'ARC COIL · EVOLVED', y: 0.17, at: 0.15 } },
    { dur: 1.5 * B2, warm: 1, setup: () => { const P = window.__promo; P.stage('7-3', { at: 45, weapons: [['rail', 5, true], ['missiles', 5, true]] }); P.stress(160); },
      cap: { t: 'GAUSS LANCE', s: '+ SWARM BARRAGE', y: 0.17, at: 0.15 } },
    { dur: 2 * B2, warm: 1.5, setup: () => { const P = window.__promo; P.stage('9-4', { at: 60, weapons: [['rail', 5], ['flame', 5], ['blaster', 5], ['lightning', 5]] }); P.stress(220); },
      cap: { t: 'SUPER COMBOS', s: 'PHOENIX RAIL · THREE WEAPONS AT MAX', y: 0.17, at: 0.2 } },
    END(2, B2),
  ],
};

// ---- 3. TEN BOSSES, on world 10's boss track (about 152 BPM)
const B3 = 60 / 152 * 4;
const BOSSES = [
  [1, 'HARVESTER', 'ORBITAL RUINS'], [2, 'LANDING CITADEL', 'SIEGE OF EARTH'], [3, 'MOON SPIRE', 'LUNAR BRIDGEHEAD'],
  [4, 'RED COLOSSUS', 'RED CONVERSION'], [5, 'FOUNDRY MOTHER', 'FOUNDRY BELT'], [6, 'STORM EYE', 'STORM RELAY'],
  [7, 'ABYSS LEVIATHAN', 'ABYSS OF EUROPA'], [8, 'GATEKEEPER', 'THE RIFT GATE'], [9, 'BROOD MATRIARCH', 'BROOD WORLD'],
];
const LOADOUTS = [
  [['blaster', 5], ['missiles', 5], ['lightning', 5]], [['spread', 5], ['rail', 5], ['orbit', 5]],
  [['flame', 5], ['pulse', 5], ['drone', 5]], [['singularity', 5], ['missiles', 5, true], ['blaster', 5]],
];
const bossShot = (w, name, world, dur, cap) => ({
  dur, warm: 4.5,
  setup: new Function(`const P = window.__promo; P.stage('${w}-6', { boss: true, r: 90, ship: ${JSON.stringify(['striker', 'phantom', 'titan'][w % 3])}, weapons: ${JSON.stringify(LOADOUTS[w % 4])} });`),
  cap: cap || { t: name, s: `WORLD ${w} · ${world}`, y: 0.8, at: 0.1 },
});
const bosses = {
  file: 'VB-03-bosses', cover: 1.5,
  music: { file: 'art/2.0/audio/w10-nexus-boss.mp3', start: 30.1304 },
  shots: [
    { ...bossShot(10, 'VOID HEART', 'THE NEXUS', 2 * B3, { t: '10 BOSSES', s: 'ONE PILOT', y: 0.8, at: 0.2 }), fadeIn: 0.3 },
    ...BOSSES.map(([w, n, wn]) => bossShot(w, n, wn, 1.5 * B3)),
    bossShot(10, 'VOID HEART', 'THE NEXUS', 2 * B3, { t: 'CAN YOU REACH', s: 'THE HEART?', y: 0.8, at: 0.2 }),
    END(2, B3),
  ],
};

// ---- 4. 10 WORLDS · 54 WAYS TO FIGHT, on world 10's sector track (about 151 BPM)
const B4 = 60 / 151 * 4;
const WORLDS = ['ORBITAL RUINS', 'SIEGE OF EARTH', 'LUNAR BRIDGEHEAD', 'RED CONVERSION', 'FOUNDRY BELT', 'STORM RELAY',
  'ABYSS OF EUROPA', 'THE RIFT GATE', 'BROOD WORLD', 'THE NEXUS'];
const worlds = {
  file: 'VB-04-worlds', cover: 0.9,
  music: { file: 'art/2.0/audio/w10-nexus-sector.mp3', start: 72.7474 },
  shots: [
    ...WORLDS.map((n, i) => ({
      dur: B4, warm: 3,
      setup: new Function(`const P = window.__promo; P.stage('${i + 1}-3', { at: 55, ship: ${JSON.stringify(['striker', 'phantom', 'titan'][i % 3])}, weapons: ${JSON.stringify(LOADOUTS[i % 4])} }); P.stress(90);`),
      cap: { t: `${String(i + 1).padStart(2, '0')} · ${n}`, s: i === 0 ? '10 WORLDS TO FREE' : '', y: 0.15, at: 0.05 },
      ...(i === 0 ? { fadeIn: 0.2 } : {}),
    })),
    { dur: 4 * B4, setup: () => window.__promo.codex(), each: 'P.scroll(".codex .scroll", Math.min(1, t / dur) ** 1.2);',
      cap: { t: '54 WAYS TO FIGHT', y: 0.36, box: true, at: 0.2, rowsIn: 2.4,
        rows: [[11, 'WEAPONS'], [11, 'EVOLUTIONS'], [9, 'PERKS'], [12, 'COMBOS'], [8, 'PERK SETS'], [3, 'SUPER COMBOS']] } },
    { dur: 2 * B4, setup: () => window.__promo.hangar(),
      cap: { t: '3 SHIPS', s: 'SKINS · WEAPON MODULES', y: 0.42, box: true, at: 0.2 } },
    END(2, B4),
  ],
};

// ======== second batch (approved by Konrad 2026-11-14): launch, weapon growth, builds, a boss at 1 HP ========
// Bar grids measured from the tracks (onset autocorrelation): Foundry Belt 136 BPM, Storm Relay 137.35 BPM, Nexus boss
// 152.25 BPM; the theme as in video 1.
const NOB = { nob: true }; // the game's own banners off where a caption sits in their place

// ---- 5. OUT NOW: the launch trailer on the theme's drop
const outnow = {
  file: 'VB-05-out-now', cover: 0.6,
  music: { file: 'art/2.0/audio/void-blaster-theme-suno.mp3', start: 35.5 },
  shots: [
    { dur: B1, warm: 1.5, ...NOB, setup: () => { const P = window.__promo; P.stage('9-4', { at: 60, weapons: [['rail', 5], ['flame', 5], ['blaster', 5], ['lightning', 5]] }); P.stress(260); },
      cap: { t: "IT'S HERE.", s: 'VOID BLASTER 2.0', y: 0.17, at: 0.05 } },
    ...WORLDS.map((n, i) => ({
      dur: B1 / 2, warm: i % 2 ? 4.5 : 2, ...NOB,
      setup: new Function(`const P = window.__promo; P.stage('${i + 1}-${i % 2 ? 6 : 3}', { ${i % 2 ? 'boss: true, r: 90' : 'at: 55'}, ship: ${JSON.stringify(['striker', 'phantom', 'titan'][i % 3])}, weapons: ${JSON.stringify(LOADOUTS[i % 4])} }); ${i % 2 ? '' : 'P.stress(110);'}`),
      cap: { t: n, y: 0.86, at: 0, sm: true },
    })),
    { dur: B1, warm: 1.5, ...NOB, setup: () => { const P = window.__promo; P.stage('5-3', { at: 55, weapons: [['flame', 5, true], ['orbit', 5]] }); P.stress(160); },
      cap: { t: '10 WORLDS', s: '60 SECTORS · ONE JOURNEY', y: 0.17, at: 0.05 } },
    { dur: B1, warm: 4.5, ...NOB, setup: () => window.__promo.stage('10-6', { boss: true, r: 90, weapons: [['rail', 5, true], ['singularity', 5], ['pulse', 5]] }),
      cap: { t: '10 BOSSES', s: 'FURY PHASES · SPECIAL ATTACKS', y: 0.8, at: 0.05 } },
    { dur: B1, warm: 1.5, ...NOB, setup: () => { const P = window.__promo; P.stage('7-3', { at: 55, weapons: [['singularity', 5, true], ['pulse', 5]] }); P.stress(200); },
      cap: { t: 'NO ADS. EVER.', s: 'NO TIMERS · PLAYS OFFLINE', y: 0.4, box: true, at: 0.05 } },
    { dur: B1, setup: () => window.__promo.hangar(),
      cap: { t: 'FREE TO TRY', s: 'WORLDS 1-2 FREE · ONE PURCHASE FOR THE REST', y: 0.42, box: true, at: 0.05 } },
    END(2, B1),
  ],
};

// ---- 6. FROM PEA SHOOTER TO PHOTON STORM: one arsenal growing, on world 5's sector track (136 BPM)
const B6 = 60 / 136 * 4;
const evolve = {
  file: 'VB-06-evolution', cover: 9.5,
  music: { file: 'art/2.0/audio/w05-foundry-belt-sector.mp3', start: 1.334 + 5 * B6 },
  shots: [
    { dur: 2 * B6, warm: 1, ...NOB, fadeIn: 0.3, setup: () => { const P = window.__promo; P.stage('5-2', { at: 20, r: 40 }); P.stress(18); },
      cap: { t: 'LV 1', s: 'ONE PULSE BLASTER', y: 0.17, at: 0.3 } },
    { dur: B6, warm: 0.5, ...NOB, setup: () => { const P = window.__promo; const g = P.stage('5-2', { at: 35, weapons: [['blaster', 2]] }); delete g.openCards; g.gainXp((g.xpNext - g.xp) / g.player.xpMult + 1, true); },
      cap: { t: 'LEVEL UP', s: 'PICK 1 OF 3', y: 0.84, at: 0.1 } },
    { dur: 1.5 * B6, warm: 1, ...NOB, setup: () => { const P = window.__promo; P.stage('5-3', { at: 45, weapons: [['blaster', 5], ['missiles', 5], ['spread', 5]] }); P.stress(120); },
      cap: { t: 'LV 5', s: 'THREE WEAPONS ON YOUR HULL', y: 0.17, at: 0.1 } },
    { dur: 2 * B6, warm: 1, ...NOB, setup: () => { const P = window.__promo; P.stage('5-4', { at: 50, weapons: [['blaster', 5], ['missiles', 5], ['spread', 5]] }); P.stress(150); P.evo = 0; },
      each: 'if (t > 0.45 && !P.evo) { P.evo = 1; P.weapon("blaster", 5, true); }',
      cap: { t: 'EVOLUTION', s: 'PULSE BLASTER → PHOTON STORM', y: 0.17, at: 0.45 } },
    { dur: 2 * B6, warm: 1.5, setup: () => { const P = window.__promo; P.stage('9-4', { at: 60, weapons: [['rail', 5], ['flame', 5, true], ['blaster', 5, true], ['lightning', 5]] }); P.stress(260); },
      cap: { t: 'PHOENIX RAIL', s: 'THREE WEAPONS AT MAX', y: 0.8, at: 0.3 } },
    { dur: 1.5 * B6, warm: 1, ...NOB, setup: () => { const P = window.__promo; P.stage('6-3', { at: 50, ship: 'phantom', weapons: [['lightning', 5, true], ['mines', 5], ['rail', 5]] }); P.stress(150); },
      cap: { t: '54 WAYS TO FIGHT', s: '11 WEAPONS · 11 EVOLUTIONS · 12 COMBOS', y: 0.4, box: true, at: 0.1 } },
    END(2, B6),
  ],
};

// ---- 7. WHICH BUILD ARE YOU? Four builds, each a real combo, on world 6's sector track (137.35 BPM)
const B7 = 60 / 137.35 * 4;
const BUILDS = [
  ['INFERNO', 'FLAMETHROWER + PROXIMITY MINES', '4-3', 'striker', [['flame', 5, true], ['mines', 5]]],
  ['STORM', 'ARC COIL + PROXIMITY MINES', '6-3', 'phantom', [['lightning', 5, true], ['mines', 5]]],
  ['BLACK HOLE', 'SINGULARITY CANNON + NOVA PULSE', '8-3', 'titan', [['singularity', 5, true], ['pulse', 5]]],
  ['RAILGUN', 'RAILGUN + ARC COIL', '7-3', 'striker', [['rail', 5, true], ['lightning', 5]]],
];
const builds = {
  file: 'VB-07-builds', cover: 4,
  music: { file: 'art/2.0/audio/w06-storm-relay-sector.mp3', start: 1.731 + 63 * B7 },
  shots: [
    { dur: 1.5 * B7, warm: 1.5, ...NOB, setup: () => { const P = window.__promo; P.stage('2-4', { at: 60, weapons: [['blaster', 5], ['spread', 5]] }); P.stress(150); },
      cap: { t: 'PICK YOUR BUILD', s: 'WHICH ONE ARE YOU?', y: 0.4, box: true, at: 0.05 } },
    ...BUILDS.map(([n, s, id, ship, w], i) => ({
      dur: 2 * B7, warm: 1.5, ...NOB,
      setup: new Function(`const P = window.__promo; P.stage('${id}', { at: 50, ship: '${ship}', weapons: ${JSON.stringify(w)} }); P.stress(170);`),
      cap: { t: `${i + 1} · ${n}`, s, y: 0.17, at: 0.05 },
    })),
    { dur: 1.5 * B7, warm: 1.5, ...NOB, setup: () => { const P = window.__promo; P.stage('10-3', { at: 55, ship: 'phantom', weapons: [['rail', 5], ['singularity', 5], ['flame', 5]] }); P.stress(180); },
      cap: { t: 'COMMENT YOUR BUILD', s: '1 · 2 · 3 · 4', y: 0.4, box: true, at: 0.05 } },
    END(2, B7),
  ],
};

// ---- 8. 1 HP: the Void Heart at its last breath, one fight in four shots, on world 10's boss track (152.25 BPM)
const B8 = 60 / 152.25 * 4;
// every frame of the fight: the ship's hull almost gone, the boss held at a share of its life, its special attacks
const LOW = (bossShare, spec) => `const g = window.__app.game; if (g && g.player) g.player.hp = g.player.maxHp * 0.04; P.vig(0.4 + 0.2 * Math.sin(t * 9));` +
  `if (g && g.boss) { g.boss.hp = Math.min(g.boss.hp, g.boss.maxHp * ${bossShare}); ${spec ? "if (g.boss.mode === 'idle') g.boss.specT = 0;" : ''} }`;
const onehp = {
  file: 'VB-08-one-hp', cover: 3,
  music: { file: 'art/2.0/audio/w10-nexus-boss.mp3', start: 1.048 + 61 * B8 },
  shots: [
    { dur: 2 * B8, warm: 4.5, ...NOB, fadeIn: 0.3,
      setup: () => window.__promo.stage('10-6', { boss: true, r: 100, w: 1.2, weapons: [['rail', 5, true], ['flame', 5], ['singularity', 5], ['blaster', 5]] }),
      each: LOW(0.3, false), cap: { t: '1 HP.', y: 0.72, at: 0.3, void: true } },
    { dur: 2 * B8, keep: true, ...NOB, each: LOW(0.05, true), cap: { t: 'VOID HEART: 5%', s: 'FURY PHASE', y: 0.72, at: 0.1, void: true } },
    { dur: 2 * B8, keep: true, ...NOB, each: LOW(0.05, true), cap: { t: "DON'T. BLINK.", y: 0.72, at: 0.1 } },
    // the last hit: the boss goes, the sector is won with all three stars
    { dur: 4 * B8, keep: true, ...NOB,
      each: 'const g = window.__app.game; P.vig(Math.max(0, 0.4 - t)); if (g && g.boss && t > 0.3) { g.kills = Math.max(g.kills, g.stage.kills); g.elitesKilled = Math.max(g.elitesKilled, g.stage.elites); g.boss.hp = 1; }' },
    END(2, B8),
  ],
};

export const VIDEOS = { invasion, swarm, bosses, worlds, outnow, evolve, builds, onehp };
