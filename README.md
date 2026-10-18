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
npm run ios        # build www/ and copy it into the Xcode project
npm run open       # open Xcode
```
In Xcode: select the **App** target → *Signing & Capabilities* → pick your Team, then Run on a device or simulator.
Run `npm run ios` again after every change to the game code.

The app build (`scripts/build.mjs`) bundles `js/native-main.js`, which adds haptics and a native copy of the save
(Capacitor Haptics / Preferences). Fonts are bundled in `fonts/` (SIL OFL), so the app needs no network.
Bundle ID: `com.konradlechowicz.voidblaster` (change it in `capacitor.config.json` and in Xcode if needed).

## App Store materials
- `appstore/LISTING.md`: name, subtitle, description, keywords, privacy and age-rating answers, review notes
- `appstore/screenshots/`: 7 captioned screenshots, 1290 × 2796 (iPhone 6.9"), in upload order
- `site/privacy.html`, `site/support.html`: Privacy Policy and Support pages (required URLs)

Publish them with GitHub Pages: repository **Settings → Pages → Build and deployment → Deploy from a branch**,
pick the branch and `/ (root)`. The pages are then at `https://konradlechowicz-sys.github.io/super-game-/site/privacy.html`
and `.../site/support.html`, and the web version of the game at `https://konradlechowicz-sys.github.io/super-game-/`.

## Dev flags (query string)
- `?dev` — all sectors unlocked, service worker disabled
- `&fast=1` — sectors 6× shorter · `&ts=4` — 4× game speed · `&god` — invulnerable · `&coins=1000`

## Code map
- `js/game.js` — run logic: player, enemies, boss, spawning, combat, rendering
- `js/weapons.js` — weapon stats, behaviours and evolutions
- `js/data.js` — ships, enemies, sectors, shop, daily rewards
- `js/ui.js` — menus, HUD, level-up cards, results
- `js/sprites.js`, `js/icons.js`, `js/background.js` — pre-rendered neon graphics
- `js/audio.js` — Web Audio synth engine and music sequencer
