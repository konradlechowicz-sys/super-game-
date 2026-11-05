# App Store listing: Void Blaster 2.0

Everything to paste into App Store Connect for version **2.0.0**. Character limits are Apple's; all texts below fit.
The 1.x listing (version 1.0-1.3) is in git history. Google Play: `appstore/GOOGLE-PLAY-LISTING.md` (same story).

## URLs
| Field | Value |
|---|---|
| Privacy Policy URL | https://konradlechowicz-sys.github.io/super-game-/site/privacy.html |
| Support URL | https://konradlechowicz-sys.github.io/super-game-/site/support.html |
| Marketing URL (optional) | https://konradlechowicz-sys.github.io/super-game-/ |

## App information
| Field | Value |
|---|---|
| Name (30) | Void Blaster: Neon Survivor |
| Subtitle (30) | Blast the Neon Swarm |
| Bundle ID | com.konradlechowicz.voidblaster |
| Primary category | Games → Action |
| Secondary category | Games → Arcade |
| Price | Free, with one in-app purchase (Full Game) |
| Seller / developer name | Konrad Lechowicz |

## Promotional text (170) · 143
```text
Void Blaster 2.0: 10 worlds from Earth's orbit to the Nexus, 10 bosses and a story to fight through. Free to try: worlds 1 and 2. No ads, ever.
```

## Keywords (100) · 89
```text
shooter,space,survivor,roguelite,arcade,neon,bullet hell,galaxy,shmup,boss,offline,sci-fi
```

## Description (4000) · 2492
```text
Earth's orbital defenses fell in eleven minutes. One ship made it out. Yours.

Void Blaster is a neon space survivor built for one-thumb play. Steer your ship while your weapons fire on their own, weave through hundreds of enemies, scoop up the crystals they drop and level up mid-fight. Every level-up offers three upgrades, so every run builds a different arsenal.

ONE JOURNEY, 10 WORLDS
Fight the Void Collective, a machine intelligence that rewrites whole worlds, from Earth's orbit to the heart of its empire:
• Orbital Ruins and the Siege of Earth
• The Lunar Bridgehead and Mars under conversion
• The Foundry Belt, the storms of Jupiter and the ice of Europa
• The Rift Gate, the Brood World and the Nexus itself
60 sectors, each world with its own enemies, hazards and atmosphere: falling wrecks, dust storms, drifting asteroids, ion winds, sliding ice, reality rifts and acid.

10 BOSSES
From the Harvester to the Void Heart, every world ends with a boss that gets faster and deadlier as it weakens, with special attacks you have to dodge at the right moment.

BUILD YOUR ARSENAL
• 11 weapons, from the pulse blaster and seeker missiles to the railgun, flamethrower and singularity cannon
• 11 evolutions that turn a maxed weapon into a super weapon
• 9 perks, 12 weapon combos, 8 perk sets and 3 super combos
• Weapon modules appear on your ship as you collect them
• A Codex that records everything you discover

EVERY FIGHT IS DIFFERENT
Flank attacks, pincers, closing rings, sniper lines and priority targets force you to read the battlefield, not just run in circles.

A STORY TO FIGHT THROUGH
Illustrated transmissions from Earth Command and intercepted signals from the Collective follow you from world to world.

FREE TO TRY
Play the first two worlds and their bosses for free. One purchase unlocks the full game: eight more worlds, their bosses, the Phantom and Titan ships, every upgrade level, 1,000 coins and the Gold Striker skin. No ads, no subscriptions, no energy timers.

PROGRESS THAT STICKS
• Earn up to 3 stars in every sector
• Spend coins on permanent ship upgrades
• Three ships with different stats and starting weapons
• Daily rewards for your streak
• Endless mode in every world after you finish the journey

Plays offline. Made by one independent developer.

MADE FOR PHONES
• Portrait, one-thumb controls: fixed joystick, floating joystick or drag anywhere
• Haptic feedback on hits, level-ups and boss kills
• Game Center leaderboards for Endless mode
```

## What's New in version 2.0 (4000) · 608
```text
VOID BLASTER 2.0: A WHOLE NEW JOURNEY
• 10 new worlds, from Earth's orbit to the heart of the Void Collective, 60 sectors
• 10 bosses with fury phases and special attacks
• A fresh look: hand-drawn art, a new soundtrack and an illustrated story
• 11 weapons with evolutions, 12 combos, 8 perk sets and 3 super combos, shown on your ship
• Smarter enemy swarms and set attack patterns
• Supply crates: spend your coins on a stronger start
• Endless mode in every world after the journey
Full Game owners keep everything they bought. Your progress starts over with a veteran bonus and the Veteran Striker skin.
```

## App Privacy (questionnaire)
Unchanged from 1.x: **"No, we do not collect data from this app"** → **Data Not Collected**. Progress stays on the device;
no analytics, ads or third-party SDKs. The purchase is handled by Apple (StoreKit), the leaderboards by Game Center.

## Age rating (questionnaire)
- Cartoon or Fantasy Violence: the player shoots machines and alien creatures of the Void Collective; they burst into
  sparks and debris. No blood, no people hurt. Infrequent/Mild.
- Everything else (realistic violence, gambling, horror, user-generated content, web access, etc.): None / No.
- In-app purchases: Yes (one non-consumable). Unrestricted web access: No.

## App Review notes
No login or account is needed. Worlds 1 and 2 (12 sectors and two bosses) are free; sectors unlock one by one. The
"Full Game" in-app purchase unlocks worlds 3-10; it can be bought from UNLOCK FULL GAME in the main menu, from the locked
worlds on the sector map, or after the world 2 boss, and restored in Settings → Restore purchases. Existing Full Game
owners from version 1.x keep the purchase. The game works fully offline; Game Center is only used for the Endless
leaderboards, unlocked after finishing the journey.

## In-app purchase (App Store Connect → Monetization → In-App Purchases → Full Game)
| Field | Value |
|---|---|
| Type | Non-Consumable (the same product as in 1.x; do not create a new one) |
| Product ID | `com.konradlechowicz.voidblaster.fullgame` (must match `js/store.js`) |
| Price | USD 4.99 for 2.0 (was 3.99; owners keep the purchase) |
| Display name (30) | Void Blaster Full Game |
| Description (45) | Worlds 3-10, 8 bosses, 2 ships, all upgrades |
| Review screenshot | the paywall of 2.0 (`appstore/2.0/screenshots/` holds one) |

## Game Center
10 Endless leaderboards for the 2.0 worlds, added to version 2.0.0: `appstore/GAME-CENTER.md`, section "Wersja 2.0".

## Screenshots
`appstore/2.0/screenshots/6.9/` (1320 × 2868, iPhone 6.9") and `appstore/2.0/screenshots/6.5/` (1284 × 2778), the same
8 scenes in upload order; smaller sizes are made by App Store Connect. Google Play: `appstore/2.0/screenshots/play/`.

## Copyright
`2026 Konrad Lechowicz`
