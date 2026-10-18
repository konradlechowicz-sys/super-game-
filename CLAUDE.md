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
Konrad decides what becomes the real game: **never push to `main`**. `main` holds only versions he accepted.
1. **Repo:** commit and push to a `claude/...` branch (this session's working branch). Do not merge into `main`.
2. **Shareable preview:** `npm run build:web` produces `dist/void-blaster.html` (whole game in one file);
   republish it to the existing artifact https://claude.ai/artifact/LvvWrttnsoUNQZYBt7HgDo (keep the URL).
   This preview always shows the newest candidate.
3. **Tell Konrad the build number and to run `npm run review` on his Mac.** The script lists every `claude/...`
   branch with commits not in `main`, builds the chosen one, launches it in the iOS Simulator and asks:
   accept (merged into `main` and pushed), reject (hidden until the branch gets new commits) or later.
   `npm run play` launches the accepted version (`main`) in the simulator.
- GitHub Pages should serve `main`, so `https://konradlechowicz-sys.github.io/super-game-/` is the accepted version.
- If a branch's commits are already in `main`, start new work from the latest `main`.

## Checks before pushing
- `node --check js/*.js`, then load the game with Playwright (`index.html?dev&god`) and confirm no page errors.
- Dev URL flags: `?dev` unlocks all sectors, `&fast=1`, `&ts=4`, `&god`, `&coins=1000`.
