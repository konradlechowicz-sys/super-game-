// npm run release — mark an accepted build as an App Store release.
//
// Branches: claude/... = proposals from the cloud, main = builds Konrad accepted (npm run review),
// release = exactly what goes to the App Store, one tag vX.Y.Z per release.
// The script picks an accepted build from main, merges it into `release`, stamps the public version and a build
// number (the accepted build's own, if possible), tags it vX.Y.Z, pushes branch + tag and opens Xcode for Archive.
// Only main is ever released: the 2.0 line (`v2`) is not offered here; for the 2.0 launch it is first merged into main.
// main is never modified, so cloud work keeps merging cleanly.
// CHANGELOG.md: each build is listed with its changes, the release shows everything since the previous release and
// stamps a full summary into the release's CHANGELOG.md and tag, plus the App Store "What's New" text.
// Set VB_NO_SIM=1 to skip building and opening Xcode (for testing on a machine without Xcode).
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { buildsBetween, describe, FILE as CHANGELOG, grouped, parse, readAt, stampRelease, whatsNew } from './changelog.mjs';
import { clearLocalChanges } from './localchanges.mjs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
if (process.platform !== 'darwin') {
  console.log('Wydanie do App Store robi się tylko na Macu (Xcode → Archive). Uruchom npm run release na Macu.');
  process.exit(1);
}
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
await clearLocalChanges(ask, bye);
console.log('Pobieram stan z GitHuba…');
run('git fetch -q --prune --tags origin');
if (!versionAt('origin/main')) bye('W main nie ma jeszcze zaakceptowanej wersji gry. Najpierw: npm run review', 1);

// Earlier releases: tags vX.Y.Z, each annotated with the accepted commit it came from.
const tags = sh('git tag -l "v*.*.*"').split('\n').filter(Boolean).sort(cmpVer).reverse();
const releases = tags.map((t) => ({ tag: t, info: versionAt(t), note: sh(`git tag -l --format="%(contents)" ${t}`) }));
const releasedFrom = new Map(releases.map((r) => [(r.note.match(/from ([0-9a-f]{40})/) || [])[1], r.tag]));

console.log(releases.length
  ? `\nWydane wersje: ${releases.slice(0, 5).map((r) => `${r.tag} (build ${r.info?.build})`).join(', ')}`
  : '\nTo będzie pierwsze wydanie.');

// Accepted builds on main, newest first, one entry per build number.
const seen = new Set();
const builds = sh('git log --first-parent -n 30 --format="%H|%cr" origin/main').split('\n').filter(Boolean)
  .map((l) => { const [sha, when] = l.split('|'); return { sha, when, v: versionAt(sha) }; })
  .filter((b) => b.v && !seen.has(b.v.build) && seen.add(b.v.build))
  .slice(0, 8);

// The release before a given build: changes after it go into the next release. A build released again under a new number (e.g. a version that never reached
// the store) brings the same changes as its first release, so they are counted from the release before it.
const releaseBefore = (build) => Math.max(0, ...releases.map((r) => r.info?.build || 0).filter((b) => b < build));
const latestLog = readAt('origin/main');
console.log('\nZaakceptowane buildy w main:');
builds.forEach((b, i) => {
  const rel = releasedFrom.get(b.sha);
  const own = buildsBetween(latestLog, b.v.build - 1, b.v.build)[0];
  const first = own?.bullets[0]?.replace(/^- /, '') || '(bez opisu)';
  const more = own && own.bullets.length > 1 ? ` (+${own.bullets.length - 1})` : '';
  console.log(`  ${i + 1}) build ${b.v.build} (${b.v.date}) · ${b.when}${rel ? `  ← już wydany jako ${rel}` : ''}`);
  console.log(`     ${first.length > 100 ? first.slice(0, 97) + '…' : first}${more}`);
});
const pick = await ask(`\nKtóry build wydać? [1-${builds.length}, Enter = 1] `);
const chosen = builds[(+pick || 1) - 1];
if (!chosen) bye('Nie ma takiego buildu.', 1);

// Everything this release brings, read from the chosen build's own CHANGELOG.md.
const chosenLog = readAt(chosen.sha);
const fromBuild = releaseBefore(chosen.v.build);
const sameAs = releasedFrom.get(chosen.sha);
const inRelease = buildsBetween(chosenLog, fromBuild, chosen.v.build);
if (sameAs) console.log(`\nTen build był już wydany jako ${sameAs}; wydanie powtórzy jego zmiany.`);
console.log(`\n━━ Zmiany w tym wydaniu${fromBuild ? ` (od wydanego buildu ${fromBuild})` : ''} ━━`);
console.log(inRelease.length ? grouped(inRelease).replace(/^/gm, '  ') : describe(inRelease, '  '));
const nextNote = parse(chosenLog).find((s) => s.kind === 'next');
const news = whatsNew(nextNote);
if (news) console.log(`\n━━ What's New (App Store) ━━\n${news}`);
else if (chosenLog) console.log('\n(Brak tekstu „What\'s New” w CHANGELOG.md; poproś Claude o jego przygotowanie.)');
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
// The release's full summary goes into its CHANGELOG.md and into the tag.
let summary = '';
if (chosenLog) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());
  const stamped = stampRelease(readFileSync(CHANGELOG, 'utf8'), {
    version, build, date, fromBuild,
    note: sameAs && `Ten sam build ${chosen.v.build} co ${sameAs}, wydany ponownie jako v${version}.`,
  });
  writeFileSync(CHANGELOG, stamped);
  const sec = parse(stamped).find((s) => s.kind === 'release' && s.version === version);
  summary = sec ? sec.lines.join('\n').trim() : '';
}
run(`git commit -q --allow-empty -am "Release v${version} (build ${build})"`);
writeFileSync(`${sh('git rev-parse --git-dir')}/vb-tag-message`, `App Store release v${version} (build ${build}), from ${chosen.sha}\n\n${summary}\n`);
run(`git tag -a --cleanup=verbatim v${version} -F "${sh('git rev-parse --git-dir')}/vb-tag-message"`);
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
if (news) console.log(`\nTekst „What's New” do App Store Connect (pole przy wersji ${version}):\n\n${news}\n`);
console.log(`Pełne podsumowanie wydania: CHANGELOG.md na gałęzi release (sekcja v${version}) i opis tagu v${version} na GitHubie.`);
console.log(`
Teraz w Xcode:
  1. U góry jako urządzenie wybierz „Any iOS Device (arm64)”.
  2. Product → Archive.
  3. W oknie Organizer: Distribute App → App Store Connect → Upload.
Na ekranie startowym tej wersji jest „v${version}”, a w Ustawieniach „v${version} (build ${build})”.

Jesteś teraz na gałęzi release. Gdy skończysz wysyłkę, wróć do zwykłej pracy: git checkout main`);
bye();
