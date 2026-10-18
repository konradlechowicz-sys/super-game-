// npm run review — test new game versions prepared in the cloud, then accept or reject them.
//
// Cloud sessions push their work to `claude/...` branches. This script lists those with changes not yet in `main`,
// builds the chosen one, launches it in the iOS Simulator and asks Konrad for a decision:
//   accept -> merged into main and pushed (main is the version that gets released),
//   reject -> back to main; this exact version is not offered again (new commits on the branch will be),
//   later  -> back to main, nothing changes.
// Set VB_NO_SIM=1 to skip the simulator (for testing this script on a machine without Xcode).
import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const sh = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q) => (await rl.question(q)).trim().toLowerCase();
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

function switchToMain() {
  const hasLocalMain = sh('git branch --list main') !== '';
  run(hasLocalMain ? 'git checkout -q main' : 'git checkout -q -b main origin/main');
  run('git merge -q --ff-only origin/main');
}

function buildAndLaunch() {
  run('npm install --no-audit --no-fund');
  run('node scripts/build.mjs');
  if (process.env.VB_NO_SIM) { run('npx cap sync ios'); return; }
  console.log('\nUruchamiam symulator — wybierz iPhone\'a strzałkami i Enter.\n');
  run('npx cap run ios');
}

// ---------------------------------------------------------------------------
if (sh('git status --porcelain')) {
  bye('Masz niezapisane zmiany w projekcie. Zapisz je (git commit) albo odłóż (git stash) i uruchom ponownie.', 1);
}
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
  bye('Brak nowych wersji do sprawdzenia. Zaakceptowaną wersję uruchomisz komendą: npm run play');
}

console.log('Nowe wersje do sprawdzenia:');
candidates.forEach((c, i) => console.log(`  ${i + 1}) ${c.label} · ${c.when} · ${c.subject}\n     gałąź: ${c.branch}`));
const pick = candidates.length === 1 ? '1' : await ask(`\nKtórą wersję uruchomić? [1-${candidates.length}, Enter = 1] `);
const c = candidates[(+pick || 1) - 1];
if (!c) bye('Nie ma takiej wersji.', 1);

console.log(`\nPrzygotowuję ${c.label} z gałęzi ${c.branch}…`);
run(`git checkout -q --detach ${c.sha}`);
try {
  buildAndLaunch();
} catch {
  console.log('\nNie udało się zbudować albo uruchomić tej wersji. Możesz ją odrzucić albo spróbować później.');
}

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
