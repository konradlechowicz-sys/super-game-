// npm run release — mark an accepted build as an App Store release.
//
// Branches: claude/... = proposals from the cloud, main = builds Konrad accepted (npm run review),
// release = exactly what goes to the App Store, one tag vX.Y.Z per release.
// The script picks an accepted build from main, merges it into `release`, stamps the public version and a build
// number (the accepted build's own, if possible), tags it vX.Y.Z, pushes branch + tag and opens Xcode for Archive.
// main is never modified, so cloud work keeps merging cleanly.
// Set VB_NO_SIM=1 to skip building and opening Xcode (for testing on a machine without Xcode).
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
// Answers are queued line by line, so typed-ahead or piped answers are never lost between questions.
const rl = createInterface({ input: process.stdin });
const lines = [];
let waiting = null;
rl.on('line', (l) => (waiting ? (waiting(l), (waiting = null)) : lines.push(l)));
rl.on('close', () => waiting && waiting(''));
const ask = async (q) => {
  process.stdout.write(q);
  const l = lines.length ? lines.shift() : await new Promise((r) => (waiting = r));
  return l.trim().toLowerCase();
};
const bye = (msg, code = 0) => { if (msg) console.log(msg); rl.close(); process.exit(code); };
const exists = (ref) => { try { sh(`git rev-parse --verify -q ${ref}`); return true; } catch { return false; } };

function versionAt(ref) {
  try {
    const m = sh(`git show ${ref}:js/version.js`).match(/version: '([^']+)', build: (\d+), date: '([^']+)'/);
    return m && { version: m[1], build: +m[2], date: m[3] };
  } catch { return null; }
}
const semver = (v) => v.split('.').map(Number);
const cmpVer = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

// ---------------------------------------------------------------------------
// Only changes to tracked files can block switching versions; new untracked files (e.g. Xcode caches) cannot.
const dirty = sh('git status --porcelain --untracked-files=no');
if (dirty) {
  bye(`Te pliki projektu mają niezapisane zmiany:\n${dirty.split('\n').map((l) => '  ' + l.trim().replace(/^\S+\s+/, '')).join('\n')}\n` +
    'Odłóż je komendą „git stash” (można je przywrócić: „git stash pop”) i uruchom ponownie.', 1);
}
console.log('Pobieram stan z GitHuba…');
run('git fetch -q --prune --tags origin');
if (!versionAt('origin/main')) bye('W main nie ma jeszcze zaakceptowanej wersji gry. Najpierw: npm run review', 1);

// Earlier releases: tags vX.Y.Z, each annotated with the accepted commit it came from.
const tags = sh("git tag -l 'v*.*.*'").split('\n').filter(Boolean).sort(cmpVer).reverse();
const releases = tags.map((t) => ({ tag: t, info: versionAt(t), note: sh(`git tag -l --format='%(contents)' ${t}`) }));
const releasedFrom = new Map(releases.map((r) => [(r.note.match(/from ([0-9a-f]{40})/) || [])[1], r.tag]));

console.log(releases.length
  ? `\nWydane wersje: ${releases.slice(0, 5).map((r) => `${r.tag} (build ${r.info?.build})`).join(', ')}`
  : '\nTo będzie pierwsze wydanie.');

// Accepted builds on main, newest first, one entry per build number.
const seen = new Set();
const builds = sh("git log --first-parent -n 30 --format='%H|%cr' origin/main").split('\n').filter(Boolean)
  .map((l) => { const [sha, when] = l.split('|'); return { sha, when, v: versionAt(sha) }; })
  .filter((b) => b.v && !seen.has(b.v.build) && seen.add(b.v.build))
  .slice(0, 8);

console.log('\nZaakceptowane buildy w main:');
builds.forEach((b, i) => {
  const rel = releasedFrom.get(b.sha);
  console.log(`  ${i + 1}) build ${b.v.build} (${b.v.date}) · ${b.when}${rel ? `  ← już wydany jako ${rel}` : ''}`);
});
const pick = await ask(`\nKtóry build wydać? [1-${builds.length}, Enter = 1] `);
const chosen = builds[(+pick || 1) - 1];
if (!chosen) bye('Nie ma takiego buildu.', 1);

const last = releases[0]?.tag.slice(1);
let version;
if (!last) {
  version = (await ask('Numer pierwszej wersji? [Enter = 1.0.0] ')) || '1.0.0';
} else {
  const [ma, mi, pa] = semver(last);
  const opts = { 1: `${ma}.${mi}.${pa + 1}`, 2: `${ma}.${mi + 1}.0`, 3: `${ma + 1}.0.0` };
  console.log(`\nOstatnie wydanie: v${last}. Jakie to wydanie?`);
  console.log(`  1) poprawki i balans      → v${opts[1]}`);
  console.log(`  2) nowa zawartość         → v${opts[2]}`);
  console.log(`  3) duża zmiana            → v${opts[3]}`);
  const t = (await ask('Wybierz [1-3, Enter = 1] albo wpisz numer, np. 1.2.0: ')) || '1';
  version = opts[t] || t;
}
if (!/^\d+\.\d+\.\d+$/.test(version)) bye(`Numer wersji musi mieć postać 1.2.3, a jest "${version}".`, 1);
if (last && cmpVer(version, last) <= 0) bye(`Nowa wersja musi być wyższa niż v${last}.`, 1);
if (exists(`refs/tags/v${version}`)) bye(`Tag v${version} już istnieje.`, 1);

// A release keeps the accepted build's number, so "build N" always means the same game. App Store Connect needs
// it to be higher than every earlier upload; only re-releasing an old build has to take the next free number.
const build = Math.max(chosen.v.build, ...releases.map((r) => (r.info?.build || 0) + 1));
const ok = await ask(`\nWydanie v${version} (build ${build})${build === chosen.v.build ? '' : ` z zaakceptowanego buildu ${chosen.v.build}`}. Kontynuować? [t/n] `);
if (ok !== 't' && ok !== 'tak') bye('Anulowano, nic nie zmieniono.');

if (exists('origin/release')) {
  run('git checkout -q -B release origin/release');
  // Record the accepted build as a parent (when it is not one already), then make the files exactly that build's,
  // so even re-releasing an older build ships precisely what was tested. Only the version stamp changes after.
  try { sh(`git merge --no-ff --no-commit -s ours ${chosen.sha}`); } catch { /* already merged earlier */ }
  run(`git read-tree -u --reset ${chosen.sha}`);
} else {
  run(`git checkout -q -B release ${chosen.sha}`);
}
run(`node scripts/bump.mjs ${version} --build ${build}`);
run(`git commit -q --allow-empty -am "Release v${version} (build ${build})"`);
run(`git tag -a v${version} -m "App Store release v${version} (build ${build}), from ${chosen.sha}"`);
try {
  run(`git push -q origin release v${version}`);
  console.log(`\n✔ Wydanie v${version} (build ${build}) jest na GitHubie: gałąź release i tag v${version}.`);
} catch {
  console.log(`\n✔ Wydanie przygotowane lokalnie, ale nie udało się wysłać na GitHub. Spróbuj: git push origin release v${version}`);
}

if (!process.env.VB_NO_SIM) {
  run('npm install --no-audit --no-fund --silent');
  run('node scripts/build.mjs --release');
  run('npx cap sync ios');
  run('npx cap open ios');
}
console.log(`
Teraz w Xcode:
  1. U góry jako urządzenie wybierz „Any iOS Device (arm64)”.
  2. Product → Archive.
  3. W oknie Organizer: Distribute App → App Store Connect → Upload.
Na ekranie startowym tej wersji jest „v${version}”, a w Ustawieniach „v${version} (build ${build})”.

Jesteś teraz na gałęzi release. Gdy skończysz wysyłkę, wróć do zwykłej pracy: git checkout main`);
bye();
