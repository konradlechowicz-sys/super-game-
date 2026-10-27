// npm run review — test new game versions prepared in the cloud, then accept or reject them.
//
// Cloud sessions push their work to `claude/...` branches. This script lists those with changes not yet in `main`,
// builds the chosen one, launches it in the iOS Simulator or on the iPhone (scripts/run.mjs) and asks Konrad for a decision:
//   accept -> merged into main and pushed (main is the version that gets released),
//   reject -> back to main; this exact version is not offered again (new commits on the branch will be),
//   later  -> back to main, nothing changes.
// Set VB_NO_SIM=1 to skip the simulator (for testing this script on a machine without Xcode).
import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { buildsBetween, describe, readAt } from './changelog.mjs';
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

const buildOf = (ref) => { try { return +(sh(`git show ${ref}:js/version.js`).match(/build: (\d+)/) || [])[1] || 0; } catch { return 0; } };
// What a version changes compared with the accepted one, from its CHANGELOG.md.
const changesOf = (ref, max) => describe(buildsBetween(readAt(ref), buildOf('origin/main'), buildOf(ref)), '     ', max);

function switchToMain() {
  const hasLocalMain = sh('git branch --list main') !== '';
  run(hasLocalMain ? 'git checkout -q main' : 'git checkout -q -b main origin/main');
  run('git merge -q --ff-only origin/main');
}

// Build and launch with the tools of the version being tested (it is checked out at this point), so fixes to the
// build/launch scripts take effect immediately instead of only after they reach main.
// place = sim | phone; test = TEST variant (tester's panel, separate "VB Test" app). Versions from before
// scripts/run.mjs can only go to the simulator; versions from before the TEST line ignore the flag.
function buildAndLaunch(place, test) {
  run('npm install --no-audit --no-fund');
  if (process.env.VB_NO_SIM) return run(`node scripts/build.mjs${test ? ' --test' : ''}`);
  if (existsSync('scripts/run.mjs')) return run(`node scripts/run.mjs ${place} --keep --yes${test ? ' --test' : ''}`);
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

const candidates = sh("git for-each-ref --sort=-committerdate --format='%(refname:short)' refs/remotes/origin/claude/")
  .split('\n').filter(Boolean)
  .map((ref) => ({
    ref,
    branch: ref.replace(/^origin\//, ''),
    sha: sh(`git rev-parse ${ref}`),
    ahead: +sh(`git rev-list --count origin/main..${ref}`),
    subject: sh(`git log -1 --format=%s ${ref}`),
    when: sh(`git log -1 --format=%cr ${ref}`),
    label: buildLabel(ref),
  }))
  .filter((c) => c.ahead > 0 && !rejected.has(c.sha));

const mainHasGame = (() => { try { sh('git cat-file -e origin/main:package.json'); return true; } catch { return false; } })();
console.log(`Zaakceptowana wersja (main): ${mainHasGame ? buildLabel('origin/main') : 'jeszcze żadna'}\n`);
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
candidates.forEach((c, i) => console.log(`  ${i + 1}) ${c.label} · ${c.when}\n     gałąź: ${c.branch}\n${changesOf(c.ref, 4)}\n`));
const pick = candidates.length === 1 ? '1' : await ask(`\nKtórą wersję uruchomić? [1-${candidates.length}, Enter = 1] `);
const c = candidates[(+pick || 1) - 1];
if (!c) bye('Nie ma takiej wersji.', 1);

const where = await ask('Gdzie uruchomić? [Enter] symulator iOS  [i] Twój iPhone: ');
const variant = await ask('Która wersja?    [Enter] zwykła gra  [t] TEST (panel testera 🛠, osobna aplikacja „VB Test”): ');
if (where === 'i' && variant !== 't') {
  console.log('Uwaga: zwykła wersja na telefonie zastąpi grę z App Store (zapis zostaje). Do testów zwykle lepsza jest wersja TEST.');
  if ((await ask('Kontynuować? [t/N] ')) !== 't') bye('Przerwane, nic nie zmieniono.');
}
console.log(`\nPrzygotowuję ${c.label}${variant === 't' ? ' (TEST)' : ''} z gałęzi ${c.branch}…`);
run(`git checkout -q --detach ${c.sha}`);
try {
  buildAndLaunch(where === 'i' ? 'phone' : 'sim', variant === 't');
} catch {
  console.log('\nNie udało się zbudować albo uruchomić tej wersji. Możesz ją odrzucić albo spróbować później.');
}

console.log(`\nZmiany w ${c.label} względem zaakceptowanej wersji:\n${changesOf(c.sha)}`);
const decision = await ask('\nCo z tą wersją? [a] akceptuj  [o] odrzuć  [p] później: ');
// Normally return to main. Until the first version is accepted main has no game (not even this script),
// so in that case go back to the branch the script was started from.
if (decision === 'a' || mainHasGame) switchToMain();
else run(startBranch ? `git checkout -q ${startBranch}` : `git checkout -q --detach ${startSha}`);

if (decision === 'a') {
  run(`git merge -q --no-ff --no-edit -m "Accept ${c.label} from ${c.branch}" ${c.sha}`);
  try {
    run('git push -q origin main');
    console.log(`\n✔ Zaakceptowano ${c.label}. Jest teraz w main i na GitHubie.`);
  } catch {
    console.log('\n✔ Zaakceptowano lokalnie, ale nie udało się wysłać na GitHub (git push). Spróbuj później: git push origin main');
  }
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
  run('npx cap sync ios');
}
