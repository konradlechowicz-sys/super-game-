// Bumps the build number after every change and keeps every place that carries the version in sync:
//   js/version.js, package.json, sw.js (offline cache name) and the Xcode project (Build / Version).
// Usage: npm run bump                 -> build + 1, date = today
//        npm run bump -- 1.1.0        -> also set the public version
//        node scripts/bump.mjs 1.1.0 --build 42   -> exact build number (used by scripts/release.mjs)
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/version.js';
const src = readFileSync(file, 'utf8');
const m = src.match(/export const VERSION = \{ version: '([^']+)', build: (\d+), date: '([^']+)' \};/);
if (!m) throw new Error('js/version.js: VERSION line not found');

const args = process.argv.slice(2);
const bi = args.indexOf('--build');
const forcedBuild = bi >= 0 ? +args.splice(bi, 2)[1] : null;
const newVersion = args[0] || m[1];
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) throw new Error(`Version must look like 1.2.3, got "${newVersion}"`);
const build = forcedBuild ?? +m[2] + 1;
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
edit('sw.js', /const VERSION = '[^']+';/, `const VERSION = 'vb-${newVersion}-${build}';`);
const pbx = 'ios/App/App.xcodeproj/project.pbxproj';
edit(pbx, /CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`);
edit(pbx, /MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${newVersion};`);

console.log(`Version ${newVersion}, build ${build}, ${date}`);
