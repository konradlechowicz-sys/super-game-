// Builds the iOS app and runs it in the iOS Simulator using Apple's own tools (xcodebuild + simctl),
// so it works whatever the simulator app is called in the installed Xcode ("Simulator", "Device Hub", …).
// Used by `npm run play` and `npm run review`; assumes www/ was already built and synced (cap sync).
// --test (or runInSimulator({ test: true })): installs it as a separate app "VB Test" with its own bundle id and save.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// The TEST variant is a separate app next to the normal one, so test saves never mix with real progress.
export const TEST_APP = { bundleId: 'com.konradlechowicz.voidblaster.test', name: 'VB Test' };
export const testOverrides = () => `PRODUCT_BUNDLE_IDENTIFIER=${TEST_APP.bundleId} VB_DISPLAY_NAME="${TEST_APP.name}"`;

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

export function checkSimulatorTools() {
  try {
    sh('xcrun simctl help');
    return true;
  } catch {
    console.log('\nSystem nie widzi symulatora iOS (używa „Command Line Tools” zamiast pełnego Xcode). Napraw jednorazowo:\n' +
      '  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer\n');
    return false;
  }
}

// Prefer an already running iPhone, otherwise the newest available iPhone model.
function pickDevice() {
  const { devices } = JSON.parse(sh('xcrun simctl list devices available -j'));
  const all = Object.entries(devices)
    .filter(([runtime]) => runtime.includes('iOS'))
    .flatMap(([runtime, list]) => list.map((d) => ({ ...d, runtime })))
    .filter((d) => d.name.startsWith('iPhone'));
  if (!all.length) {
    throw new Error('Brak symulatorów iPhone. W Xcode: Settings → Components → iOS → Get, potem spróbuj ponownie.');
  }
  const ver = (d) => (d.runtime.match(/iOS-(\d+)-(\d+)/) || [0, 0, 0]).slice(1).map(Number);
  all.sort((a, b) => {
    const [a1, a2] = ver(a), [b1, b2] = ver(b);
    return (b.state === 'Booted') - (a.state === 'Booted') || b1 - a1 || b2 - a2 || b.name.localeCompare(a.name);
  });
  return all[0];
}

export function runInSimulator({ test = false } = {}) {
  if (!checkSimulatorTools()) throw new Error('simctl unavailable');
  const dev = pickDevice();
  const appId = test ? TEST_APP.bundleId : JSON.parse(readFileSync('capacitor.config.json', 'utf8')).appId;
  console.log(`\nBuduję aplikację dla symulatora (${dev.name}). Pierwszy raz może to potrwać kilka minut…`);
  run('xcodebuild -quiet -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator ' +
    `-destination id=${dev.udid} -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO ${test ? testOverrides() : ''} build`);
  if (dev.state !== 'Booted') run(`xcrun simctl boot ${dev.udid}`);
  // The simulator UI keeps its bundle id even when Xcode renames the app.
  try { sh('open -b com.apple.iphonesimulator'); } catch { /* the device still runs headless */ }
  run(`xcrun simctl install ${dev.udid} ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app`);
  run(`xcrun simctl launch ${dev.udid} ${appId}`);
  console.log(`\n▶ ${test ? 'Wersja TEST (aplikacja „VB Test”)' : 'Gra'} działa na symulatorze: ${dev.name}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runInSimulator({ test: process.argv.includes('--test') });
  } catch (e) {
    console.log(`\nNie udało się uruchomić symulatora: ${e.message}`);
    process.exit(1);
  }
}
