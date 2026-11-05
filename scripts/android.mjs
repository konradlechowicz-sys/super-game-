// npm run android:play — the normal game on the running Android emulator or the connected phone
// npm run android:test — the TEST variant (tester's panel 🛠) as a separate app "VB Test" with its own save
// Both build the game, install it with Gradle and launch it. Start an emulator first (Android Studio → Device Manager
// → ▶) or connect a phone with USB debugging on. `npm run android:open` opens the project in Android Studio instead.
// npm run android:bundle — the signed app bundle for Google Play (dist/void-blaster-build-N.aab), to upload in Play
// Console (closed testing, then production). The first time it makes the upload key: android/void-blaster-upload.jks
// and android/keystore.properties (passwords), both kept out of git; back them up (Google Play signs the app itself
// and can replace a lost upload key, but that takes days).
import { execSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline/promises';

const mode = process.argv[2];
if (mode !== 'play' && mode !== 'test' && mode !== 'bundle') {
  console.log('Użycie: node scripts/android.mjs play|test|bundle');
  process.exit(1);
}
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const bye = (msg) => { console.log(`\n${msg}`); process.exit(1); };

// Android Studio's own Java and SDK (default install places on the Mac and on Windows), so nothing else has to be installed.
const WIN = process.platform === 'win32';
const env = { ...process.env };
const studioJava = WIN ? 'C:\\Program Files\\Android\\Android Studio\\jbr' : '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
// Gradle 8.14 runs on Java 17-24 only (a newer one fails with "Unsupported class file major version"): take the first
// Java of that range, Android Studio's own first, then JAVA_HOME (often another JDK installed for something else).
const javaVersion = (home) => {
  if (!home || !existsSync(home)) return 0;
  try {
    // java -version prints to stderr
    const r = spawnSync(`${home}${WIN ? '\\bin\\java.exe' : '/bin/java'}`, ['-version'], { encoding: 'utf8' });
    const m = `${r.stderr}${r.stdout}`.match(/version "(\d+)(?:\.(\d+))?/);
    if (!m) return 0;
    return m[1] === '1' ? +m[2] : +m[1];
  } catch { return 0; }
};
// JDKs installed in the usual places (Temurin, Microsoft, Oracle, Zulu, Corretto), newest of each kind first
const jdkDirs = WIN
  ? ['C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Microsoft', 'C:\\Program Files\\Java', 'C:\\Program Files\\Zulu', 'C:\\Program Files\\Amazon Corretto']
  : ['/Library/Java/JavaVirtualMachines'];
const installedJdks = jdkDirs.filter((d) => existsSync(d)).flatMap((d) => readdirSync(d).filter((n) => /jdk|zulu|corretto|temurin/i.test(n))
  .sort().reverse().map((n) => (WIN ? `${d}\\${n}` : `${d}/${n}/Contents/Home`)));
const javaCandidates = [env.VB_JAVA_HOME, studioJava, env.JAVA_HOME, ...installedJdks].filter(Boolean);
const goodJava = javaCandidates.find((h) => { const v = javaVersion(h); return v >= 17 && v <= 24; });
if (goodJava) env.JAVA_HOME = goodJava;
else {
  const found = javaCandidates.map((h) => `  ${h}: Java ${javaVersion(h) || 'brak'}`).join('\n');
  bye(`Gradle potrzebuje Javy w wersji od 17 do 24, a znalazłem:\n${found}\n` +
    'Zainstaluj JDK 21, np. w PowerShell: winget install EclipseAdoptium.Temurin.21.JDK\n' +
    '(albo z adoptium.net, wersja 21 LTS) i uruchom ponownie; skrypt sam je znajdzie.');
}
console.log(`Java dla Gradle: ${env.JAVA_HOME} (wersja ${javaVersion(env.JAVA_HOME)})`);
const defaultSdk = WIN ? `${env.LOCALAPPDATA}\\Android\\Sdk` : `${homedir()}/Library/Android/sdk`;
const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || defaultSdk;
if (!existsSync(sdk)) bye(`Nie widzę Android SDK w ${sdk}. Otwórz raz Android Studio (npm run android:open), żeby je zainstalowało.`);
env.ANDROID_HOME = sdk;
// local.properties needs forward slashes (or escaped backslashes) on Windows
if (!existsSync('android/local.properties')) writeFileSync('android/local.properties', `sdk.dir=${sdk.replaceAll('\\', '/')}\n`);
const adb = `"${sdk}/platform-tools/adb${WIN ? '.exe' : ''}"`;
const gradlew = WIN ? 'gradlew.bat' : './gradlew';

if (mode === 'bundle') {
  if (!existsSync('android/keystore.properties')) {
    console.log('\nPierwszy pakiet dla Google Play: tworzę klucz do wysyłania (upload key).');
    console.log('Wymyśl hasło (co najmniej 6 znaków) i ZAPISZ je w bezpiecznym miejscu razem z plikiem');
    console.log('android/void-blaster-upload.jks — bez nich nie wyślesz nowej wersji do Google Play.\n');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const pass = (await rl.question('Hasło klucza: ')).trim();
    rl.close();
    if (pass.length < 6) bye('Hasło musi mieć co najmniej 6 znaków.');
    const keytool = `"${env.JAVA_HOME ? `${env.JAVA_HOME}/bin/` : ''}keytool"`;
    run(`${keytool} -genkeypair -keystore android/void-blaster-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000 ` +
      `-storepass "${pass}" -keypass "${pass}" -dname "CN=Konrad Lechowicz, O=Konrad Lechowicz, C=PL"`);
    writeFileSync('android/keystore.properties', `storeFile=../void-blaster-upload.jks\nstorePassword=${pass}\nkeyAlias=upload\nkeyPassword=${pass}\n`);
    console.log('\nKlucz zapisany: android/void-blaster-upload.jks + android/keystore.properties (poza gitem). Zrób kopię zapasową!');
  }
  run('node scripts/build.mjs');
  run('npx cap sync android');
  console.log('\nBuduję podpisany pakiet dla Google Play…');
  run(`${gradlew} -q bundleGameRelease`, { cwd: 'android', env });
  const build = (readFileSync('js/version.js', 'utf8').match(/build:\s*(\d+)/) || [])[1] || 'x';
  mkdirSync('dist', { recursive: true });
  const out = `dist/void-blaster-build-${build}.aab`;
  cpSync('android/app/build/outputs/bundle/gameRelease/app-game-release.aab', out);
  console.log(`\n✔ ${out}\nWyślij go w Play Console: Testy → Testy zamknięte → Utwórz nową wersję → Prześlij.`);
  process.exit(0);
}

const devices = sh(`${adb} devices`).split(/\r?\n/).slice(1).filter((l) => /\tdevice\s*$/.test(l));
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
run(`${gradlew} -q install${flavor}Debug`, { cwd: 'android', env });
run(`${adb} shell monkey -p ${appId} -c android.intent.category.LAUNCHER 1`, { stdio: 'ignore' });
console.log(`\n▶ ${test ? '„VB Test” (wersja TEST z panelem 🛠)' : 'Void Blaster'} działa na: ${devices[0].split('\t')[0]}`);
