# Void Blaster

Neon space survivor for iPhone (PWA). Steer with the joystick at the bottom of the screen (or switch to floating joystick / drag anywhere in Settings) — weapons fire automatically.
Blast the swarm, collect XP crystals, pick upgrades, evolve weapons and take down the boss.

## Features (v0.3)
- 4 worlds × 6 sectors, each world with its own colours, music, enemies and boss:
  - **Neon Nebula** — Hive Mother
  - **Crystal Belt** — orbiting shards, prism gunners, drifting asteroids · boss: Crystal Serpent
  - **Solar Forge** — fused bombers, turrets, magma golems, solar flares and mortar strikes · boss: Forge Titan
  - **Void Core** — teleporting wraiths, seeker eyes, gravity wells · final boss: Void Heart (3 phases)
- 3 stars per sector: clear · kill target · finish with 50%+ hull
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
npm run review     # test new versions from the cloud in the simulator, then accept or reject them
npm run play       # launch the accepted version (main) in the simulator
npm run play:test  # the same as the TEST variant (tester's panel) — separate app "VB Test"
npm run phone:test # the TEST variant on the connected iPhone (asks for your Team ID once)
npm run release    # turn an accepted build into an App Store release (tag vX.Y.Z), then open Xcode to Archive
npm run ios        # build www/ (test label) and copy it into the Xcode project
npm run ios:release  # same, with the release label (use for App Store uploads)
npm run open       # open Xcode
```
In Xcode: select the **App** target → *Signing & Capabilities* → pick your Team, then Run on a device or simulator.
**Xcode's own changes.** Xcode rewrites files under `ios/` by itself (e.g. the signing team). `review` and `release`
offer to discard such changes (a backup patch goes to `.git/vb-xcode-changes-*.patch`); changes elsewhere still stop them.
**Reviewing new versions.** Changes made in the cloud arrive on `claude/...` branches and never go straight into `main`.
On the Mac, `npm run review` lists them, launches the chosen one in the simulator and asks to accept (merge into
`main` and push), reject or decide later. `main` therefore always holds the versions Konrad accepted.

The app build (`scripts/build.mjs`) bundles `js/native-main.js`, which adds haptics and a native copy of the save
(Capacitor Haptics / Preferences). Fonts are bundled in `fonts/` (SIL OFL), so the app needs no network.
Bundle ID: `com.konradlechowicz.voidblaster` (change it in `capacitor.config.json` and in Xcode if needed).

## Free trial and the full game
- Free: world 1 with its boss, the Striker, shop upgrades up to level 3. The browser version is always the free trial.
- **Full Game** in-app purchase (`com.konradlechowicz.voidblaster.fullgame`, non-consumable): worlds 2–4, Phantom and
  Titan, every upgrade level, 1,000 coins and the Gold Striker skin. Logic in `js/store.js`; StoreKit 2 bridge in
  `ios/App/App/StorePlugin.swift`, registered by `GameViewController.swift`.
- Test without real money: run the game from Xcode (▶). The shared scheme
  (`ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme`) already selects the local StoreKit configuration
  `VoidBlaster.storekit`, so the purchase works in the simulator for free. It only works when launched from Xcode, not
  via `npm run play` / `review`, which install the app without the scheme. In the browser, `?dev` simulates the purchase and `?dev&full` starts unlocked.

## Three lines: R&D, TEST, RELEASE
- **R&D** — `claude/...` branches: proposals from cloud sessions; `main`: builds accepted with `npm run review`.
- **TEST** — not a branch but a build variant of the same code: the game plus the tester's panel 🛠 (`js/testkit.js`):
  god mode, all sectors, full game on/off, boss now (with 0–20 level-ups), coins, 3 stars everywhere, reset tutorial
  or progress, game speed ×2/×4, level up, full hull, spawn elite, skip 30 s, win sector, FPS counter.
  It shows *TEST · build N* in red. Browser: `dist/void-blaster-test.html` (from `npm run build:web`) or `?test`;
  iOS: `npm run play:test`, `npm run phone:test`, or [t] in `npm run review` — always a separate app "VB Test"
  with its own save. Normal and App Store builds contain none of it: the build removes `js/testkit.js`, and
  `build.mjs --release` stops if any trace of it is left.
- **RELEASE** — `release` + tags `v1.0.0`, `v1.0.1`, …: exactly what was sent to the App Store. `npm run release` picks
  an accepted build, copies it to `release` with the public version, keeps its build number, tags it and opens Xcode
  for *Product → Archive*. `main` is never modified by a release.

## Versions and builds
`js/version.js` holds the public version and the build number; `npm run bump` increments the build after every change
and keeps `package.json`, `sw.js` and the Xcode project in sync (`npm run bump -- 1.1.0` also sets a new public version).
Test builds show *date · build N* on the start screen. For App Store uploads use `npm run ios:release`, which shows
*vX.Y.Z* instead; Settings always shows the full version, build and date.

## App Store materials
- `appstore/LISTING.md`: name, subtitle, description, keywords, privacy and age-rating answers, review notes
- `appstore/screenshots/`: 7 captioned screenshots, 1290 × 2796 (iPhone 6.9"), in upload order
- `site/privacy.html`, `site/support.html`: Privacy Policy and Support pages (required URLs)

Publish them with GitHub Pages: repository **Settings → Pages → Build and deployment → Deploy from a branch**,
pick the branch and `/ (root)`. The pages are then at `https://konradlechowicz-sys.github.io/super-game-/site/privacy.html`
and `.../site/support.html`, and the web version of the game at `https://konradlechowicz-sys.github.io/super-game-/`.

## Dev flags (query string)
- `?test` — TEST variant (tester's panel) on the unbundled page
- `?dev` — all sectors unlocked, service worker disabled
- `&fast=1` — sectors 6× shorter · `&ts=4` — 4× game speed · `&god` — invulnerable · `&coins=1000`

## Code map
- `js/game.js` — run logic: player, enemies, boss, spawning, combat, rendering
- `js/weapons.js` — weapon stats, behaviours and evolutions
- `js/data.js` — ships, enemies, sectors, shop, daily rewards
- `js/ui.js` — menus, HUD, level-up cards, results
- `js/testkit.js` — TEST variant only: the tester's panel (removed from normal and App Store builds)
- `js/tutorial.js` — first-run hints (in-game with slow motion, level-up cards, map and menu); SKIP turns them off, Settings → Tutorial → Replay brings them back
- `js/sprites.js`, `js/icons.js`, `js/background.js` — pre-rendered neon graphics
- `js/audio.js` — Web Audio synth engine and music sequencer
