# Void Blaster

Neon space survivor for iPhone (PWA). Steer with the joystick at the bottom of the screen (or switch to floating joystick / drag anywhere in Settings) — weapons fire automatically.
Blast the swarm, collect XP crystals, pick upgrades, evolve weapons and take down the boss.

## Features (v0.3)
- 4 worlds × 6 sectors, each world with its own colours, music, enemies and boss:
  - **Neon Nebula** — Hive Mother
  - **Crystal Belt** — orbiting shards, prism gunners, drifting asteroids · boss: Crystal Serpent
  - **Solar Forge** — fused bombers, turrets, magma golems, solar flares and mortar strikes · boss: Forge Titan
  - **Void Core** — teleporting wraiths, seeker eyes, gravity wells · final boss: Void Heart (3 phases)
- 3 stars per sector: clear · kill target (+20% in worlds 2-4) · destroy every elite (and the boss); 50 coins per new star, 15 on a replay, 300 for all 18 stars of a world
- 3 ships: Striker, Phantom, Titan (unlock with coins)
- 8 weapons, 6 passive upgrades, 4 weapon evolutions
- Elite enemies drop supply crates; pickups: repair, magnet, bomb
- Permanent upgrade shop, 7-day daily reward streak
- Synthesized synthwave music and sound effects (no audio files)
- Offline-capable PWA, full-screen when added to the home screen

## Run locally
Any static server works:
```
npx http-server -p 8080 .
```
Then open http://localhost:8080. On iPhone: open the hosted URL in Safari → Share → **Add to Home Screen**.

## iOS app (App Store)
The game ships as a native iOS app via [Capacitor](https://capacitorjs.com). The Xcode project lives in `ios/`
(Swift Package Manager, no CocoaPods). Requirements: a Mac with Xcode, Node.js 20+, an Apple Developer account.

```
npm install        # once
npm start          # asks where (browser / simulator / iPhone) and which variant (normal / TEST), then launches
npm run web        # the checked-out build in the Mac's browser;            npm run web:test   = TEST variant
npm run sim        # ... in the iOS Simulator;                              npm run sim:test   = TEST variant
npm run phone      # ... on the connected iPhone (replaces the App Store app); npm run phone:test = TEST variant
npm run review     # test new versions from the cloud (simulator or iPhone, normal or TEST), then accept or reject
npm run xcode      # build the normal game into the Xcode project and open Xcode (for ▶ by hand)
npm run release    # turn an accepted build into an App Store release (tag vX.Y.Z), then open Xcode to Archive
npm run ios:release  # build www/ with the release label and copy it into Xcode (App Store uploads)
```
All launchers live in `scripts/run.mjs` (simulator: `scripts/sim.mjs`). They print which build, branch, place and
variant they start, launch whatever is checked out, and after a TEST launch put the normal game back into the Xcode
project. `npm run play` / `play:test` remain as old names for `sim` / `sim:test`. On Windows (no Xcode) `npm start`, `web`, `review` (browser or Android) and the Android commands work;
the simulator, the iPhone and `npm run release` need the Mac. Konrad's Polish cheat sheet:
`JAK-TESTOWAC.md`.
In Xcode: select the **App** target → *Signing & Capabilities* → pick your Team, then Run on a device or simulator.
**Xcode's own changes.** Xcode rewrites files under `ios/` by itself (e.g. the signing team). `review` and `release`
offer to discard such changes (a backup patch goes to `.git/vb-xcode-changes-*.patch`); changes elsewhere still stop them.
**Reviewing new versions.** Changes made in the cloud arrive on `claude/...` branches and never go straight into `main`.
On the Mac, `npm run review` lists them, launches the chosen one in the simulator and asks to accept (merge into
`main` and push), reject or decide later. `main` therefore always holds the versions Konrad accepted.

The app build (`scripts/build.mjs`) bundles `js/native-main.js`, which adds haptics and a native copy of the save
(Capacitor Haptics / Preferences). Fonts are bundled in `fonts/` (SIL OFL), so the app needs no network.
Bundle ID: `com.konradlechowicz.voidblaster` (change it in `capacitor.config.json` and in Xcode if needed).

## 2.0 prototype (`proto2/`)
One arena of the planned 2.0 look on PixiJS (WebGL): the Striker built from its parts (engine flames, banking,
gun recoil), world 1 enemies with pre-baked glow, the tech-ruin floor, an FPS meter and stress buttons. Not part of
the game builds. `npm run proto2` prepares the textures from `art/2.0` (`make-assets.py`) and writes one file,
`dist/void-blaster-2-proto.html`.

## Android app (Google Play, in preparation)
The same game in `android/` (Capacitor 8, minSdk 24, target 36), package `com.konradlechowicz.voidblaster`, portrait
only, launcher icons and splash made from the iOS ones. `npm run android` builds `www/` and syncs it into the Android
project; `npm run android:open` also opens Android Studio (run it on an emulator or a phone from there).
`npm run android:play` builds, installs and launches the normal game on the running emulator or connected phone;
`npm run android:test` does the same for the TEST variant, a separate app "VB Test" (`...voidblaster.test`, Gradle
flavor `vbtest`, whose assets in `android/app/src/vbtest/assets/public` override the normal game's).
`npm run bump` sets `versionCode` (= build number) and `versionName` in `android/app/build.gradle`.
Not done yet: Google Play Billing (Android plays as the free trial; `js/native-entry.js` passes no store plugin),
the back button, signing for Google Play, Android in `npm run review`.

## Free trial and the full game
- Free: world 1 with its boss, the Striker, shop upgrades up to level 3. The browser version is always the free trial.
- **Full Game** in-app purchase (`com.konradlechowicz.voidblaster.fullgame`, non-consumable): worlds 2–4, Phantom and
  Titan, every upgrade level, 1,000 coins and the Gold Striker skin. Logic in `js/store.js`; StoreKit 2 bridge in
  `ios/App/App/StorePlugin.swift`, registered by `GameViewController.swift`.
- Test without real money: run the game from Xcode (▶). The shared scheme
  (`ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme`) already selects the local StoreKit configuration
  `VoidBlaster.storekit`, so the purchase works in the simulator for free. It only works when launched from Xcode, not
  via `npm start` / `sim` / `review`, which install the app without the scheme. In the browser, `?dev` simulates the purchase and `?dev&full` starts unlocked.

## Three lines: R&D, TEST, RELEASE
- **R&D** — `claude/...` branches: proposals from cloud sessions; `main`: 1.x builds accepted with `npm run review`;
  `v2`: accepted 2.0 builds (from `claude/v2-...` branches, also via `npm run review`; never released directly, merged
  into `main` for the 2.0 launch).
- **TEST** — not a branch but a build variant of the same code: the game plus the tester's panel 🛠 (`js/testkit.js`):
  god mode, all sectors, full game on/off, boss now (with 0–20 level-ups), coins, 3 stars everywhere, reset tutorial
  or progress, game speed ×2/×4, level up, full hull, spawn elite, skip 30 s, win sector, FPS counter.
  It shows *TEST · build N* in red. Browser: `npm run web:test` (`dist/void-blaster-test.html`) or `?test`;
  iOS: `npm run sim:test`, `npm run phone:test`, or [t] in `npm run review` — always a separate app "VB Test"
  with its own save. Normal and App Store builds contain none of it: the build removes `js/testkit.js`, and
  `build.mjs --release` stops if any trace of it is left.
- **RELEASE** — `release` + tags `v1.0.0`, `v1.0.1`, …: exactly what was sent to the App Store. `npm run release` picks
  an accepted build, copies it to `release` with the public version, keeps its build number, tags it and opens Xcode
  for *Product → Archive*. `main` is never modified by a release.

## AI handoff
`AI-HANDOFF.md` is the shared handoff board between Claude (development) and Codex: working rules and the current
handoff (task, branch, commit, checks, next step, decision needed from Konrad). Codex's own instructions: `AGENTS.md`.

## Changelog
`CHANGELOG.md` lists every build's changes (newest first) and a full summary of every App Store release.
`npm run bump` adds the section for a new build; `npm run review` shows what a candidate changes and `npm run release`
shows everything since the last release, then writes the release summary into `CHANGELOG.md` and the tag and prints
the App Store "What's New" text. Parsing and formatting: `scripts/changelog.mjs`.

## Versions and builds
`js/version.js` holds the public version and the build number; `npm run bump` increments the build after every change
and keeps `package.json`, `sw.js` and the Xcode project in sync (`npm run bump -- 1.1.0` also sets a new public version).
Test builds show *date · build N* on the start screen. For App Store uploads use `npm run ios:release`, which shows
*vX.Y.Z* instead; Settings always shows the full version, build and date.

## App Store materials
- `appstore/LISTING.md`: name, subtitle, description, keywords, privacy and age-rating answers, review notes
- `appstore/screenshots/`: 7 captioned screenshots, 1290 × 2796 (iPhone 6.9"), in upload order
- `appstore/screenshots/<W>x<H>/`: the same 7 screenshots in every iPhone size App Store Connect may ask for (6.9", 6.7", 6.5", 6.3", 6.1")
- `appstore/social/`: profile picture (1080×1080), YouTube banner (2560×1440), video thumbnail (1280×720), vertical cover for TikTok / Shorts / Reels (1080×1920)
- `site/privacy.html`, `site/support.html`: Privacy Policy and Support pages (required URLs)

Publish them with GitHub Pages: repository **Settings → Pages → Build and deployment → Deploy from a branch**,
pick the branch and `/ (root)`. The pages are then at `https://konradlechowicz-sys.github.io/super-game-/site/privacy.html`
and `.../site/support.html`, and the web version of the game at `https://konradlechowicz-sys.github.io/super-game-/`.

## Dev flags (query string)
- `?test` — TEST variant (tester's panel) on the unbundled page
- `?dev` — all sectors unlocked, service worker disabled
- `&fast=1` — sectors 6× shorter · `&ts=4` — 4× game speed · `&god` — invulnerable · `&coins=1000`

## Code map
- `js/game.js` — run logic: player, enemies, boss, spawning, combat
- `js/render-canvas.js` — the 1.x look: draws a game's state on the 2D canvas (also as a transparent overlay over the 2.0 look)
- `js/edition.js` — which game this line builds (`v2` line: Void Blaster 2.0, tag *2.0 dev* next to the build number)
- `js/v2/` — the 2.0 look on PixiJS, the normal look on the `v2` line (🛠 → *1.x look* compares); textures come from `js/v2/assets.gen.js`, written by `scripts/v2-assets.mjs` from `proto2/assets` and `teaser/assets` (not committed). Release and normal web builds fail if the marker `VB-V2LOOK` is found
- `js/weapons.js` — weapon stats, behaviours and evolutions
- `js/codex.js` — the Codex (v1.2): its sections and entries; discoveries are saved in `save.codex` (kept by Reset progress)
- `js/combos.js` — weapon combos and perk sets (v1.2): which pairs exist and when they are active; their effects live in weapons.js and game.js (`updatePerkSets`, `missileCombos`, `crowdHit`)
- `js/data.js` — ships, enemies, sectors, elite traits (fixed per sector), shop, daily rewards, Endless mode (`ENDLESS`, `endlessStage`)
- `js/leaderboard.js` — Endless leaderboards (v1.3, one per world, score = kills): Game Center through `ios/App/App/GameCenterPlugin.swift` (registered by `GameViewController.swift`, entitlement in `App.entitlements`); does nothing on the web and Android. Setup in App Store Connect: `appstore/GAME-CENTER.md`
- `js/ui.js` — menus, HUD, level-up cards, results
- `js/testkit.js` — TEST variant only: the tester's panel (removed from normal and App Store builds)
- `js/tutorial.js` — first-run hints (in-game with slow motion, level-up cards, map and menu); SKIP turns them off, Settings → Tutorial → Replay brings them back
- `js/sprites.js`, `js/icons.js`, `js/background.js` — pre-rendered neon graphics
- `js/audio.js` — Web Audio synth engine and music sequencer
