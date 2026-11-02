// The four social-media videos (plan approved by Konrad 2026-11-02): what each shows, shot by shot, recorded from
// the real game by promo/record.mjs. A shot: dur (seconds), setup (runs in the page once, before the shot; window.__promo
// is the recorder's toolkit there), warm (seconds of game run off camera first), each (page code run every frame,
// with P, t and dur), cap (a caption: t, s, y, void, rows, at, until), fadeIn / fadeOut (to black). Shot lengths
// are whole or half bars of the video's music, so the cuts fall on the beat. Captions in English (Konrad's choice).
import { codexSections } from '../js/codex.js';

export const CODEX_KEYS = codexSections().flatMap((s) => s.items.map((i) => i.key));

const HALE = 'EARTH COMMAND // ADMIRAL HALE', VOID = 'VOID COLLECTIVE // SIGNAL';
const TYPE = 'P.type(t);';
// the end card: key art, VOID BLASTER 2.0, COMING SOON, iPhone & Android
const END = (bars, bar) => ({ dur: bars * bar, each: 'P.end(Math.min(1, t / 0.4));', fadeOut: 0.8 });

// ---- 1. THE INVASION: the story trailer, on the 2.0 theme (142.2 BPM); the gameplay starts on the drop
const B1 = 1.6875;
const invasion = {
  file: 'VB-01-invasion', cover: 2,
  music: { file: 'art/2.0/audio/void-blaster-theme-suno.mp3', start: 35.5 - 6 * B1 },
  shots: [
    { dur: 2 * B1, setup: () => window.__promo.story('intro', 1), each: TYPE, fadeIn: 0.4 },
    { dur: 2 * B1, setup: () => window.__promo.story('intro', 2), each: TYPE },
    { dur: 2 * B1, setup: () => window.__promo.story('intro', 3, [{ who: 'cmd', head: 'EARTH COMMAND // ADMIRAL HALE', lines: ["One ship. That's all we have left.", 'Take back our sky.'] }]), each: TYPE },
    { dur: 2 * B1, warm: 1, setup: () => { const P = window.__promo; P.stage('1-4', { at: 50, weapons: [['blaster', 5], ['missiles', 5], ['lightning', 4]] }); P.stress(120); },
      cap: { t: 'ONE PILOT', s: 'VS. THE VOID COLLECTIVE', y: 0.17, at: 0.3 } },
    { dur: B1, setup: () => window.__promo.story('w2', 0, [{ who: 'void', head: VOID, lines: ['MOON: BRIDGEHEAD ESTABLISHED.'] }]), each: TYPE },
    { dur: B1, setup: () => window.__promo.story('w3', 0, [{ who: 'void', head: VOID, lines: ['MARS: 61% REWRITTEN.'] }]), each: TYPE },
    { dur: B1, setup: () => window.__promo.story('w5', 0, [{ who: 'void', head: VOID, lines: ['WHY DO YOU RESIST REPAIR?'] }]), each: TYPE },
    { dur: B1, setup: () => window.__promo.story('w7', 0, [{ who: 'cmd', head: HALE, lines: ["Past the Gate, we can't reach you."] }]), each: TYPE },
    { dur: B1, setup: () => window.__promo.story('w8', 0, [{ who: 'void', head: VOID, lines: ['WE GROW. YOU COULD GROW WITH US.'] }]), each: TYPE },
    { dur: 2 * B1, setup: () => window.__promo.story('w9', 0, [{ who: 'void', head: VOID, lines: ['COME CLOSER, LITTLE LIGHT.'] }]), each: 'P.type(t, 24);' },
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
    { dur: B2, warm: 0.5, setup: () => { const P = window.__promo; const g = P.stage('3-3', { at: 40, weapons: [['blaster', 3], ['spread', 2]] }); delete g.openCards; g.gainXp((g.xpNext - g.xp) / g.player.xpMult + 1); },
      cap: { t: 'BUILD YOUR ARSENAL', y: 0.12, at: 0.1 } },
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
      cap: { t: '54 WAYS TO FIGHT', y: 0.58, at: 0.2, rowsIn: 2.4,
        rows: [[11, 'WEAPONS'], [11, 'EVOLUTIONS'], [9, 'PERKS'], [12, 'COMBOS'], [8, 'PERK SETS'], [3, 'SUPER COMBOS']] } },
    { dur: 2 * B4, setup: () => window.__promo.hangar(),
      cap: { t: '3 SHIPS', s: 'SKINS · WEAPON MODULES', y: 0.8, at: 0.2 } },
    END(2, B4),
  ],
};

export const VIDEOS = { invasion, swarm, bosses, worlds };
