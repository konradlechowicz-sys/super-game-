# Void Blaster

Neon space survivor for iPhone (PWA). Drag anywhere to fly — weapons fire automatically.
Blast the swarm, collect XP crystals, pick upgrades, evolve weapons and take down the boss.

## Features (prototype v0.1)
- World 1 **Neon Nebula**: 6 sectors, the last one ends with the **Hive Mother** boss (worlds 2–4 coming soon)
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
