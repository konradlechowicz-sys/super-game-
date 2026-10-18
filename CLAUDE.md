# Void Blaster: notes for Claude

- Owner: **Konrad Lechowicz**. Use this name for authorship, copyright and the App Store seller name.
  Talk to Konrad in Polish; the game itself is in English.
- Neon space survivor for iPhone. Vanilla JS + Canvas, no framework. Code map is in README.md.

## Versioning
- `js/version.js` is the single source of truth; never edit it by hand.
- **Every change gets a new build:** run `npm run bump` before committing. It increments the build number, sets the
  date (Europe/Warsaw) and syncs `package.json`, `sw.js` and the Xcode project (Build / Version).
- Test builds show `YYYY-MM-DD · build N` on the start screen; release builds (`npm run ios:release`) show `vX.Y.Z`.
  Settings always shows the full `vX.Y.Z (build N, date)`.
- New App Store release: `npm run bump -- X.Y.Z` (patch = fixes, minor = new content, major = big overhaul).
  The build number never resets: App Store Connect requires it to grow with every upload.
- Mention the new build number to Konrad after each change.

## Shipping a change (do all three after every gameplay change)
1. **Repo:** commit and push to the working branch. GitHub Pages serves the repo root, so the web version
   (`https://konradlechowicz-sys.github.io/super-game-/`) updates by itself 1-2 minutes after the push.
2. **Shareable preview:** `npm run build:web` produces `dist/void-blaster.html` (whole game in one file);
   republish it to the existing artifact https://claude.ai/artifact/LvvWrttnsoUNQZYBt7HgDo (keep the URL).
3. **iOS app:** nothing to do on the server side. Konrad runs `npm run update` on his Mac
   (git pull + npm install + build + cap sync), then presses Run in Xcode.

## Checks before pushing
- `node --check js/*.js`, then load the game with Playwright (`index.html?dev&god`) and confirm no page errors.
- Dev URL flags: `?dev` unlocks all sectors, `&fast=1`, `&ts=4`, `&god`, `&coins=1000`.
