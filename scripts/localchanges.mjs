// Shared by `npm run review` and `npm run release`: both switch versions, which needs a clean checkout.
// Xcode rewrites its own project files without asking (signing team, scheme, settings checks), so local changes
// under ios/ are expected and are discarded after a confirmation, with a backup patch kept in .git/.
// Changes anywhere else are real work and still stop the script.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).trim();

export async function clearLocalChanges(ask, bye) {
  // Only changes to tracked files can block switching versions; new untracked files (e.g. Xcode caches) cannot.
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
