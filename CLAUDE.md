# Void Blaster: notes for Claude

- Owner: **Konrad Lechowicz**. Use this name for authorship, copyright and the App Store seller name.
  Talk to Konrad in Polish; the game itself is in English.
- Neon space survivor for iPhone. Vanilla JS + Canvas, no framework. Code map is in README.md.

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
- Bump `VERSION` in `sw.js` on each release so installed PWAs pick up new files.
