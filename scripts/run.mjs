// npm start — one launcher for every way of testing the game, on the Mac and on Windows. With no arguments it asks:
//   where:   [p] browser   [s] iOS Simulator   [i] the connected iPhone   [a] Android (emulator or phone)
//            (the simulator and the iPhone need Xcode, so only the Mac offers them)
//   variant: [Enter] normal game   [t] TEST (tester's panel 🛠, a separate app "VB Test" with its own save)
// Shortcuts skip the questions: npm run web | web:test | sim | sim:test | phone | phone:test (android: android:play|test).
// It always launches the code that is checked out right now and says first which build and branch that is
// (main = accepted, claude/... = a candidate). New candidates from the cloud: npm run review (it uses this script).
// After a TEST launch the Xcode project gets the normal game back, so Xcode's ▶ and Archive always mean the normal game.
// Flags: --test (TEST variant), --keep (do not restore the normal game afterwards; npm run review does that itself),
// --yes (skip the question before replacing the App Store game on the phone; npm run review asks it itself).
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { runInSimulator, TEST_APP, testOverrides } from './sim.mjs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const tryTo = (fn, fallback = '') => { try { return fn(); } catch { return fallback; } };

export const MAC = process.platform === 'darwin';
export const PLACES = {
  web: 'przeglądarka',
  sim: 'symulator iOS',
  phone: 'Twój iPhone',
  android: 'Android (emulator albo telefon)',
};

// Opens a file with the system's default app (the browser for .html).
function openFile(file) {
  const full = resolve(file);
  if (process.platform === 'win32') run(`start "" "${full}"`);
  else run(`${MAC ? 'open' : 'xdg-open'} "${full}"`);
}

// Which code is checked out, in words: build number and whether it is the accepted version or a candidate.
export function describeCheckout() {
  const m = readFileSync('js/version.js', 'utf8').match(/version: '([^']+)', build: (\d+), date: '([^']+)'/);
  const build = m ? `build ${m[2]} (${m[3]})` : 'build ?';
  const branch = tryTo(() => sh('git branch --show-current'));
  const head = tryTo(() => sh('git rev-parse HEAD'));
  const main = tryTo(() => sh('git rev-parse origin/main'));
  let what;
  if (head && head === main) what = 'zaakceptowana wersja (main)';
  else if (branch === 'main') what = 'main (lokalnie inny niż na GitHubie)';
  else if (branch.startsWith('claude/')) what = `kandydat z chmury, jeszcze nie zaakceptowany (gałąź ${branch})`;
  else if (branch) what = `gałąź ${branch}`;
  else what = 'wersja wybrana w npm run review';
  const dirty = tryTo(() => sh('git status --porcelain --untracked-files=no -- js css index.html')) ? ' + niezapisane zmiany' : '';
  return { build, what: what + dirty };
}

function banner(place, test) {
  const { build, what } = describeCheckout();
  const line = '─'.repeat(64);
  console.log(`\n${line}\n  Void Blaster · ${build}\n  Kod:     ${what}\n  Gdzie:   ${PLACES[place]}\n` +
    `  Wariant: ${test ? `TEST — panel testera 🛠${place === 'web' ? '' : `, osobna aplikacja „${TEST_APP.name}”`}` : 'zwykła gra'}\n${line}\n`);
}

// Apple Team ID for signing on the phone: VB_TEAM, the saved .vb-team file, the Xcode project, or asked once.
async function teamId() {
  if (process.env.VB_TEAM) return process.env.VB_TEAM.trim();
  if (existsSync('.vb-team')) return readFileSync('.vb-team', 'utf8').trim();
  const inProject = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8').match(/DEVELOPMENT_TEAM = (\w+);/);
  if (inProject) return inProject[1];
  console.log('\nPotrzebny jest Twój Team ID (10 znaków, np. AB12CD34EF).\n' +
    'Znajdziesz go w Xcode: Settings → Accounts → Twoje Apple ID → kolumna „Team ID”,\n' +
    'albo na developer.apple.com/account → Membership details.');
  const id = (await question('Team ID: ')).trim();
  if (!/^[A-Z0-9]{10}$/.test(id)) throw new Error('To nie wygląda na Team ID (10 liter/cyfr).');
  writeFileSync('.vb-team', id + '\n');
  console.log('Zapisane w pliku .vb-team (tylko na tym Macu, poza gitem).');
  return id;
}

// The first iPhone connected by cable or on the same Wi-Fi with developer mode on.
function pickPhone() {
  const tmp = `${process.env.TMPDIR || '/tmp'}/vb-devices.json`;
  sh(`xcrun devicectl list devices --json-output "${tmp}"`);
  const devices = JSON.parse(readFileSync(tmp, 'utf8')).result?.devices || [];
  const phone = devices.find((d) => d.hardwareProperties?.deviceType === 'iPhone' && d.connectionProperties?.tunnelState !== 'unavailable');
  if (!phone) throw new Error('Nie widzę iPhone\'a. Podłącz go kablem, odblokuj i zaufaj temu Macowi (tryb deweloperski musi być włączony).');
  return { id: phone.identifier, name: phone.deviceProperties?.name || 'iPhone' };
}

async function runOnPhone(test) {
  const team = await teamId();
  const phone = pickPhone();
  const appId = test ? TEST_APP.bundleId : JSON.parse(readFileSync('capacitor.config.json', 'utf8')).appId;
  console.log(`Buduję aplikację dla: ${phone.name}…`);
  run('xcodebuild -quiet -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphoneos ' +
    `-destination generic/platform=iOS -derivedDataPath ios/DerivedData -allowProvisioningUpdates DEVELOPMENT_TEAM=${team} ` +
    `${test ? testOverrides() : ''} build`);
  run(`xcrun devicectl device install app --device ${phone.id} ios/DerivedData/Build/Products/Debug-iphoneos/App.app`);
  try {
    run(`xcrun devicectl device process launch --device ${phone.id} ${appId}`);
  } catch {
    console.log(`Aplikacja jest zainstalowana; uruchom „${test ? TEST_APP.name : 'Void Blaster'}” ręcznie na telefonie.`);
  }
  console.log(`\n▶ ${test ? `„${TEST_APP.name}”` : 'Gra'} jest na telefonie ${phone.name}. ` +
    'Za pierwszym razem: Ustawienia → Ogólne → VPN i urządzenia → zaufaj deweloperowi.');
}

function runInBrowser(test) {
  run('node scripts/build-web.mjs');
  const file = `dist/void-blaster${test ? '-test' : ''}.html`;
  openFile(file);
  console.log(`\n▶ Otworzyłem ${file} w przeglądarce (cała gra w jednym pliku, ta sama co podgląd w Claude).`);
}

// Answers typed ahead (or piped) are kept, as in npm run review.
let rl = null;
const pending = [];
let waiting = null;
function question(q) {
  if (!rl) {
    rl = createInterface({ input: process.stdin });
    rl.on('line', (l) => (waiting ? (waiting(l), (waiting = null)) : pending.push(l)));
    rl.on('close', () => waiting && waiting(''));
  }
  process.stdout.write(q);
  return pending.length ? Promise.resolve(pending.shift()) : new Promise((r) => (waiting = r));
}

export async function launch(place, test, { keep = false, yes = false } = {}) {
  banner(place, test);
  if (place === 'web') return runInBrowser(test);
  if (place === 'android') return run(`node scripts/android.mjs ${test ? 'test' : 'play'}`);
  if (!MAC) throw new Error('Symulator iOS i iPhone działają tylko na Macu (potrzebny Xcode). Tutaj: przeglądarka albo Android.');
  if (place === 'phone' && !test && !yes) {
    console.log('Uwaga: zwykła wersja na telefonie zastąpi grę z App Store (ten sam identyfikator aplikacji; zapis zostaje).\n' +
      'Wrócisz do wersji ze sklepu, instalując ją ponownie z App Store. Do testów zwykle lepsza jest wersja TEST.');
    if ((await question('Kontynuować? [t/N] ')).trim().toLowerCase() !== 't') return console.log('Przerwane.');
  }
  let failed = null;
  try {
    run(`node scripts/build.mjs${test ? ' --test' : ''}`);
    run('npx cap sync ios');
    if (place === 'sim') runInSimulator({ test });
    else await runOnPhone(test);
  } catch (e) {
    failed = e;
  } finally {
    // Leave the Xcode project with the normal game, so a later ▶ or Archive never ships the TEST variant.
    if (test && !keep) {
      console.log('\nPrzywracam w projekcie Xcode zwykłą grę…');
      run('node scripts/build.mjs');
      run('npx cap sync ios');
    }
  }
  if (failed) throw failed;
}

async function menu() {
  const { build, what } = describeCheckout();
  console.log(`\nVoid Blaster · ${build}\nKod: ${what}\n`);
  const where = (await question(MAC
    ? 'Gdzie uruchomić?  [p] przeglądarka  [s] symulator iOS  [i] iPhone  [a] Android: '
    : 'Gdzie uruchomić?  [p] przeglądarka  [a] Android (emulator albo telefon): ')).trim().toLowerCase();
  const place = (MAC ? { p: 'web', s: 'sim', i: 'phone', a: 'android' } : { p: 'web', a: 'android' })[where[0]];
  if (!place) throw new Error(MAC ? 'Wybierz p, s, i albo a.' : 'Wybierz p albo a.');
  const variant = (await question('Która wersja?    [Enter] zwykła gra  [t] TEST (panel testera 🛠): ')).trim().toLowerCase();
  return { place, test: variant.startsWith('t') };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  try {
    const place = args.find((a) => PLACES[a]);
    const choice = place ? { place, test: args.includes('--test') } : await menu();
    await launch(choice.place, choice.test, { keep: args.includes('--keep'), yes: args.includes('--yes') });
  } catch (e) {
    console.log(`\nNie udało się: ${e.message}`);
    process.exitCode = 1;
  } finally {
    rl?.close();
  }
}
