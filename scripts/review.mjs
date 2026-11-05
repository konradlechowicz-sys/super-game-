// npm run review — test new game versions prepared in the cloud, then accept or reject them.
//
// Two accepted lines (decided by Konrad, 2026-10-27): `main` = Void Blaster 1.x (releasable, bug fixes only) and
// `v2` = the accepted builds of 2.0 (never released from there; it is merged into main for the 2.0 launch).
// Cloud sessions push their work to `claude/...` branches: `claude/v2-...` are 2.0 candidates for `v2`, every other
// `claude/...` branch is a 1.x candidate for `main`. This script lists those with changes not yet in their line,
// builds the chosen one, launches it in the iOS Simulator or on the iPhone (scripts/run.mjs) and asks Konrad for a decision:
//   accept -> merged into its line (main or v2) and pushed (main is the version that gets released),
//   reject -> back to main; this exact version is not offered again (new commits on the branch will be),
//   later  -> back to main, nothing changes.
// Set VB_NO_SIM=1 to skip the simulator (for testing this script on a machine without Xcode).
import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { buildsBetween, describe, readAt } from './changelog.mjs';
const MAC = process.platform === 'darwin';
import { clearLocalChanges } from './localchanges.mjs';

const sh = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
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

const REJECTED = `${sh('git rev-parse --git-dir')}/void-blaster-rejected`;
const rejected = new Set(existsSync(REJECTED) ? readFileSync(REJECTED, 'utf8').split('\n').filter(Boolean) : []);

function buildLabel(ref) {
  try {
    const m = sh(`git show ${ref}:js/version.js`).match(/version: '([^']+)', build: (\d+), date: '([^']+)'/);
    return m ? `build ${m[2]} (${m[3]})` : 'bez numeru builda';
  } catch {
    return 'bez numeru builda';
  }
}

// claude/v2-... (or claude/v2/...) goes to the 2.0 line once it exists on GitHub; everything else to main.
const LINES = { main: 'Void Blaster 1.x → main', v2: 'Wersja 2.0 → v2' };
let hasV2 = false;
const lineOf = (branch) => (hasV2 && /^claude\/v2[-/]/.test(branch) ? 'v2' : 'main');

const buildOf = (ref) => { try { return +(sh(`git show ${ref}:js/version.js`).match(/build: (\d+)/) || [])[1] || 0; } catch { return 0; } };
// What a version changes compared with the accepted one, from its CHANGELOG.md.
const changesOf = (ref, max, line = 'main') => describe(buildsBetween(readAt(ref), buildOf(`origin/${line}`), buildOf(ref)), '     ', max);

function switchTo(line) {
  const hasLocal = sh(`git branch --list ${line}`) !== '';
  run(hasLocal ? `git checkout -q ${line}` : `git checkout -q -b ${line} origin/${line}`);
  run(`git merge -q --ff-only origin/${line}`);
}
const switchToMain = () => switchTo('main');

// Build and launch with the tools of the version being tested (it is checked out at this point), so fixes to the
// build/launch scripts take effect immediately instead of only after they reach main.
// place = sim | phone (Mac only) | web | android; test = TEST variant (tester's panel, separate "VB Test" app). Versions from before
// scripts/run.mjs can only go to the simulator; versions from before the TEST line ignore the flag.
function buildAndLaunch(place, test) {
  run('npm install --no-audit --no-fund');
  if (process.env.VB_NO_SIM) return run(`node scripts/build.mjs${test ? ' --test' : ''}`);
  if (existsSync('scripts/run.mjs')) return run(`node scripts/run.mjs ${place} --keep --yes${test ? ' --test' : ''}`);
  if (!MAC) throw new Error('ta wersja nie ma jeszcze skryptów dla Windowsa');
  run(`node scripts/build.mjs${test ? ' --test' : ''}`);
  run('npx cap sync ios');
  if (existsSync('scripts/sim.mjs')) run(`node scripts/sim.mjs${test ? ' --test' : ''}`);
  else run('npx cap run ios');
}

// ---------------------------------------------------------------------------
await clearLocalChanges(ask, bye);
const startBranch = sh('git branch --show-current');
const startSha = sh('git rev-parse HEAD');
console.log('Sprawdzam nowe wersje na GitHubie…');
run('git fetch -q --prune origin');
hasV2 = (() => { try { sh('git rev-parse --verify -q origin/v2'); return true; } catch { return false; } })();

const candidates = sh('git for-each-ref --sort=-committerdate --format="%(refname:short)" refs/remotes/origin/claude/')
  .split('\n').filter(Boolean)
  .map((ref) => ({ ref, branch: ref.replace(/^origin\//, '') }))
  .map((c) => ({ ...c, line: lineOf(c.branch) }))
  .map(({ ref, branch, line }) => ({
    ref,
    branch,
    line,
    sha: sh(`git rev-parse ${ref}`),
    ahead: +sh(`git rev-list --count origin/${line}..${ref}`),
    subject: sh(`git log -1 --format=%s ${ref}`),
    when: sh(`git log -1 --format=%cr ${ref}`),
    label: buildLabel(ref),
  }))
  .filter((c) => c.ahead > 0 && !rejected.has(c.sha))
  // 1.x first, then 2.0; newest first within each line
  .sort((a, b) => (a.line === b.line ? 0 : a.line === 'main' ? -1 : 1));

const mainHasGame = (() => { try { sh('git cat-file -e origin/main:package.json'); return true; } catch { return false; } })();
console.log(`Zaakceptowana wersja 1.x (main): ${mainHasGame ? buildLabel('origin/main') : 'jeszcze żadna'}`);
if (hasV2) console.log(`Zaakceptowana wersja 2.0 (v2): ${buildLabel('origin/v2')}`);
console.log('');
if (!candidates.length) {
  if (mainHasGame && startBranch !== 'main') {
    // e.g. still on `release` after an App Store upload: come back to the accepted version
    switchToMain();
    syncAcceptedVersion();
    console.log('Wróciłeś do zaakceptowanej wersji (main).');
  }
  bye('Brak nowych wersji do sprawdzenia. Zaakceptowaną wersję uruchomisz komendą: npm start');
}

console.log('Nowe wersje do sprawdzenia:');
candidates.forEach((c, i) => {
  if (hasV2 && (i === 0 || candidates[i - 1].line !== c.line)) console.log(`\n  ── ${LINES[c.line]} ──`);
  console.log(`  ${i + 1}) ${c.label} · ${c.when}\n     gałąź: ${c.branch}\n${changesOf(c.ref, 4, c.line)}\n`);
});
const pick = candidates.length === 1 ? '1' : await ask(`\nKtórą wersję uruchomić? [1-${candidates.length}, Enter = 1] `);
const c = candidates[(+pick || 1) - 1];
if (!c) bye('Nie ma takiej wersji.', 1);

const where = await ask(MAC
  ? 'Gdzie uruchomić? [Enter] symulator iOS  [i] Twój iPhone  [p] przeglądarka  [a] Android: '
  : 'Gdzie uruchomić? [Enter] przeglądarka  [a] Android (emulator albo telefon): ');
const place = MAC ? ({ i: 'phone', p: 'web', a: 'android' }[where] || 'sim') : (where === 'a' ? 'android' : 'web');
const variant = await ask('Która wersja?    [Enter] zwykła gra  [t] TEST (panel testera 🛠, osobna aplikacja „VB Test”): ');
if (place === 'phone' && variant !== 't') {
  console.log('Uwaga: zwykła wersja na telefonie zastąpi grę z App Store (zapis zostaje). Do testów zwykle lepsza jest wersja TEST.');
  if ((await ask('Kontynuować? [t/N] ')) !== 't') bye('Przerwane, nic nie zmieniono.');
}
console.log(`\nPrzygotowuję ${c.label}${variant === 't' ? ' (TEST)' : ''} z gałęzi ${c.branch}…`);
run(`git checkout -q --detach ${c.sha}`);
try {
  buildAndLaunch(place, variant === 't');
} catch {
  console.log('\nNie udało się zbudować albo uruchomić tej wersji. Możesz ją odrzucić albo spróbować później.');
}

console.log(`\nZmiany w ${c.label} względem zaakceptowanej wersji (${c.line}):\n${changesOf(c.sha, undefined, c.line)}`);
const decision = await ask(`\nCo z tą wersją? [a] akceptuj (trafi do ${c.line})  [o] odrzuć  [p] później: `);
// Normally return to main. Until the first version is accepted main has no game (not even this script),
// so in that case go back to the branch the script was started from.
if (decision === 'a') switchTo(c.line);
else if (mainHasGame) switchToMain();
else run(startBranch ? `git checkout -q ${startBranch}` : `git checkout -q --detach ${startSha}`);

if (decision === 'a') {
  run(`git merge -q --no-ff --no-edit -m "Accept ${c.label} from ${c.branch}" ${c.sha}`);
  try {
    run(`git push -q origin ${c.line}`);
    console.log(`\n✔ Zaakceptowano ${c.label}. Jest teraz w ${c.line} i na GitHubie.`);
  } catch {
    console.log(`\n✔ Zaakceptowano lokalnie, ale nie udało się wysłać na GitHub (git push). Spróbuj później: git push origin ${c.line}`);
  }
  // the folder (and the Xcode project) always ends on the releasable 1.x line
  if (c.line !== 'main') switchToMain();
  syncAcceptedVersion();
} else if (decision === 'o') {
  appendFileSync(REJECTED, `${c.sha}\n`);
  console.log(`\n✖ Odrzucono ${c.label}. Ta wersja nie pojawi się już na liście.`);
  syncAcceptedVersion();
} else {
  console.log(`\nBez zmian. ${mainHasGame ? 'Wróciłeś do zaakceptowanej wersji; ta' : 'Ta'} wersja zostanie na liście.`);
  syncAcceptedVersion();
}
bye();

// After a decision the Xcode project should hold the accepted version again (no simulator launch).
function syncAcceptedVersion() {
  if (!existsSync('package.json')) {
    console.log('(main nie zawiera jeszcze gry — zaakceptuj pierwszą wersję, żeby ją tu mieć)');
    return;
  }
  run('npm install --no-audit --no-fund --silent');
  run('node scripts/build.mjs');
  if (MAC) run('npx cap sync ios');
}
