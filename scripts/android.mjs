// npm run android:play — the normal game on the running Android emulator or the connected phone
// npm run android:test — the TEST variant (tester's panel 🛠) as a separate app "VB Test" with its own save
// Both build the game, install it with Gradle and launch it. Start an emulator first (Android Studio → Device Manager
// → ▶) or connect a phone with USB debugging on. `npm run android:open` opens the project in Android Studio instead.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const mode = process.argv[2];
if (mode !== 'play' && mode !== 'test') {
  console.log('Użycie: node scripts/android.mjs play|test');
  process.exit(1);
}
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const bye = (msg) => { console.log(`\n${msg}`); process.exit(1); };

// Android Studio's own Java and SDK, so nothing else has to be installed.
const env = { ...process.env };
const studioJava = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
if (!env.JAVA_HOME && existsSync(studioJava)) env.JAVA_HOME = studioJava;
const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || `${homedir()}/Library/Android/sdk`;
if (!existsSync(sdk)) bye(`Nie widzę Android SDK w ${sdk}. Otwórz raz Android Studio (npm run android:open), żeby je zainstalowało.`);
env.ANDROID_HOME = sdk;
if (!existsSync('android/local.properties')) writeFileSync('android/local.properties', `sdk.dir=${sdk}\n`);
const adb = `"${sdk}/platform-tools/adb"`;

const devices = sh(`${adb} devices`).split('\n').slice(1).filter((l) => /\tdevice$/.test(l));
if (!devices.length) {
  bye('Nie widzę emulatora ani telefonu. Uruchom emulator (Android Studio → Device Manager → ▶)\n' +
    'albo podłącz telefon z włączonym debugowaniem USB, potem spróbuj ponownie.');
}

const test = mode === 'test';
if (test) {
  // The TEST build goes into the vbtest flavor's assets, which override the normal game's files in that app only.
  run('node scripts/build.mjs --test');
  rmSync('android/app/src/vbtest/assets/public', { recursive: true, force: true });
  cpSync('www', 'android/app/src/vbtest/assets/public', { recursive: true });
}
// The normal build always ends up in www/ and the main assets, so the next sync or iOS build is never the TEST one.
run('node scripts/build.mjs');
run('npx cap sync android');

const flavor = test ? 'Vbtest' : 'Game';
const appId = `com.konradlechowicz.voidblaster${test ? '.test' : ''}`;
console.log(`\nBuduję i instaluję ${test ? '„VB Test”' : 'Void Blaster'} (pierwszy raz trwa kilka minut)…`);
run(`./gradlew -q install${flavor}Debug`, { cwd: 'android', env });
run(`${adb} shell monkey -p ${appId} -c android.intent.category.LAUNCHER 1`, { stdio: 'ignore' });
console.log(`\n▶ ${test ? '„VB Test” (wersja TEST z panelem 🛠)' : 'Void Blaster'} działa na: ${devices[0].split('\t')[0]}`);
