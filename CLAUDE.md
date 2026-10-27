# Void Blaster: notes for Claude

- Owner: **Konrad Lechowicz**. Use this name for authorship, copyright and the App Store seller name.
  Talk to Konrad in Polish; the game itself is in English.
- Neon space survivor for iPhone. Vanilla JS + Canvas, no framework. Code map is in README.md.

## Shared handoff with Codex

- Before starting a task, read the root `AI-HANDOFF.md` for a pending assignment or status from Codex.
- For a handoff, use the same `claude/...` branch and commit the handoff update with the work. Work sequentially: only one agent edits that branch at a time.
- Keep the current handoff factual and secret-free. Continue to follow the project branch and Konrad-approval rules below.

## Roadmap (decided by Konrad)
- 1.2.0 (released as build 52): weapon combos, perk sets, evolutions for all weapons, Codex, tougher enemies.
- 1.3 (iOS only): Endless mode (unlocked after the whole game, full game only, one leaderboard per world,
  score = kills) + Game Center leaderboards. Done in build 62; released as v1.2.1 (build 65, 2026-10-27).
- Android moved to 2.0 (decided by Konrad, 2026-10-26: the Google Play developer account is not paid yet, and 2.0
  takes a while anyway): Google Play, Billing and Google Play Games launch with 2.0.
- 2.0: visual overhaul on PixiJS (same JS + Capacitor code), richer art made with ChatGPT from Claude's prompts,
  10 worlds of 6 sectors each, one journey: the Void Collective (a machine intelligence that rewrites worlds, more
  organic the deeper you go) attacks Earth; the player fights from Earth's orbit to its heart, the Nexus (worlds and
  enemies in `art/2.0/CHATGPT-BRIEF.md`; free trial = worlds 1-2). Work on 2.0 starts only after 1.3 is released.
  2.0 decisions (Konrad, 2026-10-26; execution plan in the Claude Doc "Void Blaster 2.0 – plan wykonawczy"): the 10
  new worlds replace the 4 of 1.x; all 10 ship at once, iOS and Android the same day; the "1.4" content (OVERLOAD
  minute, Railgun, Flamethrower, Singularity Cannon, 12 combos, 8 perk sets, 3 super combos) goes into 2.0; 2.0 is a
  free update for Full Game owners (same app, same product); progress starts over, with a bonus for 1.x veterans;
  the full game costs more for new players (about USD 4.99). 2.0 is built in the same app behind a switch that only
  the TEST variant shows, so `main` stays releasable as 1.x until launch. Art lives in `art/2.0/` (see its
  README); the PixiJS prototype is `proto2/`.

## Android (decided by Konrad)
Android launches with 2.0 (Google Play needs 12 testers for 14 days on a new account before publishing, so closed
testing should start during 2.0 work). Project in `android/`, see README.md. Until Google
Play Billing exists, Android is trial-only. This cloud environment cannot build Android (no SDK); Konrad builds in
Android Studio on his Mac (`npm run android:open`; `npm run android:play` / `npm run android:test` install and
launch the normal game / the TEST app "VB Test" on the emulator or phone).

## Monetization (decided by Konrad)
Free trial + one non-consumable in-app purchase "Full Game" (USD 3.99, `com.konradlechowicz.voidblaster.fullgame`).
Free: world 1 with its boss, the Striker, upgrades up to level 3. Full: worlds 2-4, Phantom + Titan, all upgrade
levels, 1,000 coins, Gold Striker skin. No ads, no subscriptions, no pay-to-win coin sales. Logic: `js/store.js`;
StoreKit 2: `ios/App/App/StorePlugin.swift`.
Apple Developer Program team: Konrad Lechowicz, Team ID `6V97J7SV57` (set as DEVELOPMENT_TEAM in the Xcode project).
`ios/App/App/VoidBlaster.storekit` (format 6.3) and the shared scheme `App.xcscheme` were saved by Konrad's Xcode and
tested (purchase works in the simulator from Xcode); never hand-write them in an older format. The public web version is trial-only; the preview artifact may simulate it.

## Three lines: R&D, TEST, RELEASE (decided by Konrad)
| Line | Where | Holds | Decides |
|---|---|---|---|
| **R&D** | `claude/...` → `main` | ideas, fixes; tested in browser, simulator, phone; accepted with `npm run review` | Konrad accepts |
| **TEST** | same code as R&D, built as the TEST variant | the game plus the tester's panel 🛠 (`js/testkit.js`) | Claude builds, Konrad tests |
| **RELEASE** | `release` + tags `vX.Y.Z` | exactly what was sent to the App Store (`npm run release`), no test tools | Konrad only |
Claude never pushes to `main` or `release` and never creates `v*` tags.

TEST is a build variant, not a branch, so it always contains the newest game:
- Test tools (god mode, unlock all, boss now, coins, stars, speed, level up, spawn elite, skip, win, FPS) belong in
  `js/testkit.js`, never in game code paths. Hooks into the game use `__TEST__` (replaced by the build with
  true/false) or generic fields (`app.god`, `app.testUnlockAll`, `app.timeScale`, `app.onFrame`).
- Normal and App Store builds drop the testkit entirely; `build.mjs --release` and `build-web.mjs` fail if the marker
  `VB-TESTKIT` is found. Keep testkit.js free of top-level code so tree-shaking can remove it.
- The TEST variant shows `TEST · build N` in red; on iOS it is a separate app "VB Test"
  (`com.konradlechowicz.voidblaster.test`) with its own save.
- Old `test/...` branches (e.g. `test/build-14-boss-test`) are archives only; do not create new ones.

## Versioning
- `js/version.js` is the single source of truth; never edit it by hand.
- Build numbers are never reused; `npm run bump` also counts builds on `test/...` and other branches.
- **Every change gets a new build:** run `npm run bump` before committing. It increments the build number, sets the
  date (Europe/Warsaw) and syncs `package.json`, `sw.js` and the Xcode project (Build / Version).
- **Exception (decided by Konrad):** a commit that changes only `AI-HANDOFF.md` (messages between Claude and Codex)
  never gets a new build: no `npm run bump`, no `CHANGELOG.md` entry, no preview republish.
- Test builds show `YYYY-MM-DD · build N` on the start screen; release builds (`npm run ios:release`) show `vX.Y.Z`.
  Settings always shows the full `vX.Y.Z (build N, date)`.
- App Store releases are made only by Konrad with `npm run release` on his Mac: it picks an accepted build from `main`,
  copies it to `release` with the public version (patch = fixes, minor = new content, major = big overhaul),
  keeps that build's number, tags `vX.Y.Z` and opens Xcode for Archive. Do not choose public versions in cloud work:
  `npm run bump` gives every new build the newest released version (highest `vX.Y.Z` tag; fetch tags first), so builds
  after the v1.0.1 release carry 1.0.1 (decided by Konrad).
- Mention the new build number to Konrad after each change.

## Changelog (`CHANGELOG.md`, decided by Konrad)
Konrad wants to see what every build changes when he reviews and releases, and a full summary for every release.
- `npm run bump` adds `## Build N · date` with a placeholder; replace it with bullets tagged `[Nowe]`, `[Zmiana]`,
  `[Balans]`, `[Poprawka]`, `[App Store]` or `[Narzędzia]` (written in Polish, concrete: what the player notices).
- Also keep `## Następne wydanie` current: a short Polish summary of everything since the last release and, under
  `### What's New (App Store)`, the English text for App Store Connect (player-facing changes only).
- `npm run review` prints the builds a candidate adds over `main`; `npm run release` prints every change since the last
  release and stamps a `## vX.Y.Z · build N · date · App Store` section (summary + all changes) into the release's
  `CHANGELOG.md` and the tag. If a `v*` tag exists that `main`'s `CHANGELOG.md` does not have yet, copy that section
  from the `release` branch into it and reset `Następne wydanie`. Logic: `scripts/changelog.mjs`.

## Shipping a change (do all three after every gameplay change)
Konrad decides what becomes the real game: **never push to `main`**. `main` holds only versions he accepted.
1. **Repo:** commit and push to a `claude/...` branch (this session's working branch). Do not merge into `main`.
2. **Shareable previews:** `npm run build:web` produces `dist/void-blaster.html` and `dist/void-blaster-test.html`
   (whole game in one file each). Republish them to the existing artifacts (keep the URLs):
   normal https://claude.ai/artifact/LvvWrttnsoUNQZYBt7HgDo, TEST https://claude.ai/artifact/T9TmADoewKYcxJgXLp4YCk.
   Both always show the newest candidate.
3. **Tell Konrad the build number and to run `npm run review` on his Mac.** The script lists every `claude/...`
   branch with commits not in `main`, builds the chosen one, launches it in the iOS Simulator and asks:
   accept (merged into `main` and pushed), reject (hidden until the branch gets new commits) or later.
   It also asks whether to launch the normal or the TEST variant.
   `npm run play` launches the accepted version (`main`) in the simulator; `npm run play:test` its TEST variant,
   `npm run phone:test` the TEST variant on the connected iPhone (asks for the Team ID once, saved in `.vb-team`).
- GitHub Pages should serve `main`, so `https://konradlechowicz-sys.github.io/super-game-/` is the accepted version.
- If a branch's commits are already in `main`, start new work from the latest `main`.

## Checks before pushing
- `node --check js/*.js`, then load the game with Playwright (`index.html?dev&god`) and confirm no page errors.
- Also load `dist/void-blaster-test.html` and open the 🛠 panel; confirm the normal page has no 🛠 button.
- Dev URL flags: `?test` turns on the TEST variant on the unbundled page, `?dev` unlocks all sectors of the purchased content, `&full` grants the full game (simulated purchase),
  `&fast=1`, `&ts=4`, `&god`, `&coins=1000`. Without `&full`, worlds 2-4 show the paywall.
  These flags work only on local hosts (localhost, private network, `file:`) and in TEST builds; the public
  GitHub Pages version ignores them so it stays a free trial (`LOCAL` in `js/main.js`, same rule for `?test` in `index.html`).
