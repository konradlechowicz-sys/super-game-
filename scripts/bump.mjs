// Bumps the build number after every change and keeps every place that carries the version in sync:
//   js/version.js, package.json, sw.js (offline cache name) and the Xcode project (Build / Version).
// A new build also gets its own section in CHANGELOG.md, to be filled in with what changed.
// Usage: npm run bump                 -> build + 1, date = today
//        npm run bump -- 1.1.0        -> also set the public version
//        node scripts/bump.mjs 1.1.0 --build 42   -> exact build number (used by scripts/release.mjs)
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { addBuild, FILE as CHANGELOG } from './changelog.mjs';

const file = 'js/version.js';
const src = readFileSync(file, 'utf8');
const m = src.match(/export const VERSION = \{ version: '([^']+)', build: (\d+), date: '([^']+)' \};/);
if (!m) throw new Error('js/version.js: VERSION line not found');

const args = process.argv.slice(2);
const bi = args.indexOf('--build');
const forcedBuild = bi >= 0 ? +args.splice(bi, 2)[1] : null;
// Without an explicit version the build carries the newest released one (highest vX.Y.Z tag), so work after a
// release shows e.g. 1.0.1 instead of the version main had before it; npm run release sets the next one.
function latestReleased() {
  try {
    const tags = execSync("git tag -l 'v*.*.*'", { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n').map((t) => t.trim().replace(/^v/, '')).filter((v) => /^\d+\.\d+\.\d+$/.test(v));
    return tags.sort(cmpVer).pop() || null;
  } catch {
    return null;
  }
}
function cmpVer(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}
const released = args[0] ? null : latestReleased();
const newVersion = args[0] || (released && cmpVer(released, m[1]) > 0 ? released : m[1]);
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) throw new Error(`Version must look like 1.2.3, got "${newVersion}"`);
// Build numbers are never reused: also count builds on other branches (e.g. test/... builds that never reach main).
function highestBuildOnBranches() {
  try {
    const refs = execSync("git for-each-ref --format='%(refname)' refs/remotes/origin/ refs/heads/", { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n').filter((r) => r && !r.endsWith('/HEAD'));
    let max = 0;
    for (const ref of refs) {
      try {
        const b = execSync(`git show ${ref}:js/version.js`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).match(/build: (\d+)/);
        if (b) max = Math.max(max, +b[1]);
      } catch { /* branch without the game */ }
    }
    return max;
  } catch {
    return 0;
  }
}
const build = forcedBuild ?? Math.max(+m[2], highestBuildOnBranches()) + 1;
if (!Number.isInteger(build) || build < 1) throw new Error(`Invalid build number: ${build}`);
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());

const edit = (path, re, to) => {
  const s = readFileSync(path, 'utf8');
  const found = typeof re === 'string' ? s.includes(re) : new RegExp(re.source).test(s);
  if (!found) throw new Error(`${path}: pattern ${re} not found`);
  writeFileSync(path, s.replace(re, to));
};

edit(file, m[0], `export const VERSION = { version: '${newVersion}', build: ${build}, date: '${date}' };`);
edit('package.json', /"version": "[^"]+"/, `"version": "${newVersion}"`);
// package-lock.json repeats the version (top level and packages[""]); keep it in sync, or npm install rewrites it
// and review/release stop on an "unsaved change".
if (existsSync('package-lock.json')) {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  lock.version = newVersion;
  if (lock.packages?.['']) lock.packages[''].version = newVersion;
  writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
}
edit('sw.js', /const VERSION = '[^']+';/, `const VERSION = 'vb-${newVersion}-${build}';`);
const pbx = 'ios/App/App.xcodeproj/project.pbxproj';
edit(pbx, /CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
edit(pbx, /MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${newVersion};`);

// Releases (--build) reuse an accepted build's number; that build already has its section.
if (forcedBuild == null && existsSync(CHANGELOG)) {
  writeFileSync(CHANGELOG, addBuild(readFileSync(CHANGELOG, 'utf8'), build, date));
  console.log(`${CHANGELOG}: describe what changed under "## Build ${build}"`);
}

console.log(`Version ${newVersion}, build ${build}, ${date}`);
