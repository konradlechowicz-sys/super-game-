// Single source of truth for the game version. Updated by `npm run bump` (scripts/bump.mjs) — do not edit by hand.
//   version: public release number (App Store "Version", CFBundleShortVersionString)
//   build:   increases with every change (App Store "Build", CFBundleVersion)
export const VERSION = { version: '1.3.0', build: 69, date: '2026-10-27' };

// 'dev' for test builds; release builds are made with `--release`, which esbuild injects as __CHANNEL__.
/* global __CHANNEL__ */
export const CHANNEL = typeof __CHANNEL__ !== 'undefined' ? __CHANNEL__ : 'dev';

// TEST variant (tester's panel, js/testkit.js): the build scripts replace __TEST__ with true/false, so normal and
// App Store builds drop the test code entirely. On the unbundled dev page index.html sets it from ?test.
/* global __TEST__ */
export const TEST = __TEST__;

// Test builds show the date and build so a report can name the exact build; releases show the public version.
export function versionLabel() {
  if (TEST) return `TEST · build ${VERSION.build}`;
  return CHANNEL === 'release' ? `v${VERSION.version}` : `${VERSION.date} · build ${VERSION.build}`;
}

// Full identifier, shown in Settings in every channel.
export function versionFull() {
  return `v${VERSION.version} (build ${VERSION.build}, ${VERSION.date})${TEST ? ' · TEST' : ''}`;
}
