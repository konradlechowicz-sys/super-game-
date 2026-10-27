# Void Blaster: notes for Claude

- Owner: **Konrad Lechowicz**. Use this name for authorship, copyright and the App Store seller name.
  Talk to Konrad in Polish; the game itself is in English.
- Neon space survivor for iPhone. Vanilla JS + Canvas, no framework. Code map is in README.md.

## Art direction and ChatGPT (decided by Konrad, 2026-10-27)

- Konrad relays everything between Claude and ChatGPT himself: Claude writes prompts, Konrad pastes them, reviews and
  sends the images back. `AI-HANDOFF.md` is no longer used for new assignments.
- The source of all 2.0 visuals and ChatGPT prompts is the Claude Doc "Void Blaster 2.0 – Art Bible"
  (https://claude.ai/artifact/A6CDwwg4WSEQ3v99p9ZbMc): tab "Art Bible" (world cards, shared rules) and tab "Prompty"
  (style block, a world block per world, tasks P1-P8). Change a world's card and its prompts together.
- Music: the 2.0 theme is the menu music for good; no separate M1 track.

## Shared handoff with Codex (paused, see above)

- Before starting a task, read the root `AI-HANDOFF.md` for a pending assignment or status from Codex.
- For a handoff, use the same `claude/...` branch and commit the handoff update with the work. Work sequentially: only one agent edits that branch at a time.
- Keep the current handoff factual and secret-free. Continue to follow the project branch and Konrad-approval rules below.

## Roadmap (decided by Konrad)
- 1.2.0 (released as build 52): weapon combos, perk sets, evolutions for all weapons, Codex, tougher enemies.
- 1.3 (iOS only): Endless mode (unlocked after the whole game, full game only, one leaderboard per world,
  score = kills) + Game Center leaderboards. Done in build 62; released as v1.3.0 (the build first tagged v1.2.1,
  which never went out), 2026-10-27.
- After 1.3.0 the 1.x line is frozen (decided by Konrad, 2026-10-27): only bug fixes; all new work is 2.0.
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
  the full game costs more for new players (about USD 4.99). 2.0 is built in the same app on its own accepted line
  `v2` (decided by Konrad, 2026-10-27; see "Two lines" below), so `main` stays releasable as 1.x until launch. Stage 1
  (builds 68-70, in `main`) put the PixiJS look behind a switch in the TEST panel; on `v2` 2.0 becomes the normal game.
  Art lives in `art/2.0/` (see its README); the PixiJS prototype is `proto2/`.
- 2.0 performance gate 1 passed (Konrad, 2026-10-27, iPhone 17 Pro Max, TEST variant with the 2.0 look): a steady
  60 FPS with about 180 enemies on screen. 2.0 balance must use this: noticeably more enemies at once than 1.x
  (bigger waves and swarms), keeping a margin for older iPhones.

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
Claude never pushes to `main`, `v2` or `release` and never creates `v*` tags.

**Two accepted lines (decided by Konrad, 2026-10-27):** `main` = Void Blaster 1.x (releasable, bug fixes only) and
`v2` = accepted 2.0 builds. All 2.0 work goes on `claude/v2-...` branches cut from `origin/v2`; `npm run review` offers
them under "Wersja 2.0 → v2" and merges accepted ones into `v2`. Every other `claude/...` branch is a 1.x candidate
for `main`. 1.x fixes accepted into `main` are brought into `v2` by Claude (merge `origin/main` into a `claude/v2-...`
branch). `npm run release` only releases `main`; for the 2.0 launch `v2` is merged into `main` first. Build numbers
stay one shared counter across both lines.

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
1. **Repo:** commit and push to a `claude/...` branch: `claude/v2-...` (from `origin/v2`) for 2.0 work, another
   `claude/...` branch (from `origin/main`) for 1.x fixes and tools. Do not merge into `main` or `v2`.
2. **Shareable previews:** `npm run build:web` produces `dist/void-blaster.html` and `dist/void-blaster-test.html`
   (whole game in one file each). Republish them to the existing artifacts (keep the URLs):
   normal https://claude.ai/artifact/LvvWrttnsoUNQZYBt7HgDo, TEST https://claude.ai/artifact/T9TmADoewKYcxJgXLp4YCk.
   Both always show the newest candidate.
3. **Tell Konrad the build number and to run `npm run review` on his Mac.** The script lists every `claude/...`
   branch with commits not in `main`, builds the chosen one, launches it in the iOS Simulator and asks:
   accept (merged into `main` and pushed), reject (hidden until the branch gets new commits) or later.
   It also asks simulator or iPhone, and the normal or the TEST variant.
   Launchers (Konrad's cheat sheet `JAK-TESTOWAC.md`, logic `scripts/run.mjs`): `npm start` asks where and which
   variant; `npm run web|sim|phone` + `:test` for the TEST variant (browser on the Mac / iOS Simulator / connected
   iPhone; the phone asks for the Team ID once, saved in `.vb-team`). Each prints build, branch, place and variant.
   `review` also asks simulator or iPhone. Use these names when telling Konrad what to run.
   Konrad also works on a Windows desktop (no Xcode): there `npm start`, `web`, `review` (browser or Android) and the
   Android commands work; simulator, iPhone and `npm run release` are Mac only. Keep `scripts/` cross-platform (no
   single quotes in shell commands, no Mac-only tools outside Mac-only paths).
- GitHub Pages should serve `main`, so `https://konradlechowicz-sys.github.io/super-game-/` is the accepted version.
- If a branch's commits are already in its line (`main` or `v2`), start new work from the latest of that line.

## Checks before pushing
- `node --check js/*.js`, then load the game with Playwright (`index.html?dev&god`) and confirm no page errors.
  On the `v2` line the unbundled dev page cannot load PixiJS and shows the 1.x look; check the 2.0 look in `dist/`.
- Also load `dist/void-blaster-test.html` and open the 🛠 panel; confirm the normal page has no 🛠 button.
- Dev URL flags: `?test` turns on the TEST variant on the unbundled page, `?dev` unlocks all sectors of the purchased content, `&full` grants the full game (simulated purchase),
  `&fast=1`, `&ts=4`, `&god`, `&coins=1000`. Without `&full`, worlds 2-4 show the paywall.
  These flags work only on local hosts (localhost, private network, `file:`) and in TEST builds; the public
  GitHub Pages version ignores them so it stays a free trial (`LOCAL` in `js/main.js`, same rule for `?test` in `index.html`).
