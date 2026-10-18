// Single source of truth for the game version. Updated by `npm run bump` (scripts/bump.mjs) — do not edit by hand.
//   version: public release number (App Store "Version", CFBundleShortVersionString)
//   build:   increases with every change (App Store "Build", CFBundleVersion)
export const VERSION = { version: '1.0.0', build: 6, date: '2026-10-18' };

// 'dev' for test builds; release builds are made with `--release`, which esbuild injects as __CHANNEL__.
/* global __CHANNEL__ */
export const CHANNEL = typeof __CHANNEL__ !== 'undefined' ? __CHANNEL__ : 'dev';

// Test builds show the date and build so a report can name the exact build; releases show the public version.
export function versionLabel() {
  return CHANNEL === 'release' ? `v${VERSION.version}` : `${VERSION.date} · build ${VERSION.build}`;
}

// Full identifier, shown in Settings in every channel.
export function versionFull() {
  return `v${VERSION.version} (build ${VERSION.build}, ${VERSION.date})`;
}
