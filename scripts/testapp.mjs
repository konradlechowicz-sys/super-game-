// npm run play:test  — the TEST variant (tester's panel 🛠) in the iOS Simulator
// npm run phone:test — the TEST variant on the connected iPhone
// Both install it as a separate app "VB Test" (bundle id ...voidblaster.test) next to the normal game, so test saves
// never mix with real progress. Afterwards the Xcode project gets the normal version back.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { runInSimulator, TEST_APP, testOverrides } from './sim.mjs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const target = process.argv[2];
if (target !== 'sim' && target !== 'phone') {
  console.log('Użycie: node scripts/testapp.mjs sim|phone');
  process.exit(1);
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
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const id = (await rl.question('Team ID: ')).trim();
  rl.close();
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

async function runOnPhone() {
  const team = await teamId();
  const phone = pickPhone();
  console.log(`\nBuduję wersję TEST dla: ${phone.name}…`);
  run('xcodebuild -quiet -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphoneos ' +
    `-destination generic/platform=iOS -derivedDataPath ios/DerivedData -allowProvisioningUpdates DEVELOPMENT_TEAM=${team} ${testOverrides()} build`);
  run(`xcrun devicectl device install app --device ${phone.id} ios/DerivedData/Build/Products/Debug-iphoneos/App.app`);
  try {
    run(`xcrun devicectl device process launch --device ${phone.id} ${TEST_APP.bundleId}`);
  } catch {
    console.log('Aplikacja jest zainstalowana; uruchom „VB Test” ręcznie na telefonie.');
  }
  console.log(`\n▶ „${TEST_APP.name}” jest na telefonie ${phone.name}. Za pierwszym razem: Ustawienia → Ogólne → VPN i urządzenia → zaufaj deweloperowi.`);
}

let failed = false;
try {
  run('node scripts/build.mjs --test');
  run('npx cap sync ios');
  if (target === 'sim') runInSimulator({ test: true });
  else await runOnPhone();
} catch (e) {
  failed = true;
  console.log(`\nNie udało się: ${e.message}`);
} finally {
  // Leave the Xcode project with the normal version, so a later Run or Archive never ships the TEST variant.
  run('node scripts/build.mjs');
  run('npx cap sync ios');
}
process.exit(failed ? 1 : 0);
