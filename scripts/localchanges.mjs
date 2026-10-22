// Shared by `npm run review` and `npm run release`: both switch versions, which needs a clean checkout.
// Xcode rewrites its own project files without asking (signing team, scheme, settings checks), so local changes
// under ios/ are expected and are discarded after a confirmation, with a backup patch kept in .git/.
// A version-only change to package-lock.json (left by npm install) is discarded silently.
// Changes anywhere else are real work and still stop the script.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).trim();

export async function clearLocalChanges(ask, bye) {
  // Only changes to tracked files can block switching versions; new untracked files (e.g. Xcode caches) cannot.
  // npm install rewrites the version inside package-lock.json when it differs from package.json (e.g. on an older
  // release branch). Such a change carries no work, so it is discarded without asking.
  if (sh('git status --porcelain --untracked-files=no -- package-lock.json')) {
    const changed = sh('git diff -U0 HEAD -- package-lock.json').split('\n')
      .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
    if (changed.length && changed.every((l) => /^[+-]\s*"version": "[^"]*",?$/.test(l))) {
      execSync('git checkout -q HEAD -- package-lock.json', { stdio: 'inherit' });
      console.log('package-lock.json: odrzucono samą zmianę numeru wersji (npm install zrobił ją sam).');
    }
  }
  const status = execSync('git status --porcelain --untracked-files=no', { encoding: 'utf8' });
  const files = status.split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^.* -> /, ''));
  if (!files.length) return;
  const list = files.map((f) => '  ' + f).join('\n');
  if (files.some((f) => !f.startsWith('ios/'))) {
    bye(`Te pliki projektu mają niezapisane zmiany:\n${list}\n` +
      'Odłóż je komendą „git stash” (można je przywrócić: „git stash pop”) i uruchom ponownie.', 1);
  }
  console.log(`Xcode zmienił pliki projektu iOS (to normalne, robi to sam, np. przy wyborze zespołu do podpisu):\n${list}`);
  const a = await ask('[Enter] odrzuć te zmiany i kontynuuj  [n] przerwij: ');
  if (a === 'n') bye('Przerwano, nic nie zostało zmienione.');
  const backup = `${sh('git rev-parse --git-dir')}/vb-xcode-changes-${new Date().toISOString().replace(/[:.]/g, '-')}.patch`;
  writeFileSync(backup, sh('git diff HEAD -- ios') + '\n');
  execSync('git checkout -q HEAD -- ios', { stdio: 'inherit' });
  console.log(`Odrzucone. Kopia tych zmian: ${backup}\n`);
}
