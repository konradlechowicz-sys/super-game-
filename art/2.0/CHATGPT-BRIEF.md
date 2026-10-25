<!--
Dla Konrada: to kompletna instrukcja dla ChatGPT do grafiki wersji 2.0. Wklej ją w całości na początku nowej
rozmowy (albo dołącz ten plik) razem z obrazkami-wzorcami: art/2.0/ship/striker.webp, art/2.0/enemies/world1/
enemies-sheet.webp i art/2.0/worlds/tech-ruin-concept.webp. Potem pisz tylko: "Next task: B2" itd.
Gotowe pliki odsyłaj Claude'owi: sprawdzi je w grze i wstawi do art/2.0/.
-->

# Void Blaster 2.0 — complete art brief for ChatGPT

You are the art team for **Void Blaster**, a top-down mobile space shooter (a "survivors-like": the player flies a
small starfighter through huge swarms, weapons fire on their own, the player picks upgrades on level-up). Version 2.0
is a visual overhaul. A programmer (Claude) assembles your images in the game engine (PixiJS) and **animates them in
code**. Your job is to draw clean, consistent **game assets**, not illustrations.

Work through the task list in Part 4 **one task per reply**. After each task, stop and wait. The owner (Konrad)
approves or asks for changes, then says "Next task: <id>".

---

## Part 1 — Rules for every image

1. **Style reference first.** Three approved images are attached: the player ship `striker.webp`, the world-1 enemy
   sheet `enemies-sheet.webp` and the world concept `tech-ruin-concept.webp`. Match their rendering, line weight,
   level of detail and lighting exactly. Start every image prompt you write with the STYLE BLOCK (Part 2).
2. **Camera:** strictly top-down orthographic (looking straight down). No perspective, no tilt, no side view.
   Ships and enemies face **up** (nose toward the top of the image).
3. **Transparent background** (PNG with real alpha) for every object, part, prop, effect and icon. Only floors,
   world concepts and menu backgrounds have a full background.
4. **One object per image, or a sheet** with generous empty space between objects (at least 10% of the image) so
   each can be cut out automatically. Nothing touches another object or the image edge. No overlaps.
5. **No text, letters, numbers, logos or watermarks** anywhere (UI text is added in code).
6. **Colors:** the player is **cyan** (#2ff3ff). Enemies **never** use cyan. Enemy bullets and danger are red/orange.
   Rewards (XP, coins, crates) are gold/green. Each world has its own enemy palette (Part 3).
7. **Readability at small size.** Enemies are 32–64 px on screen, the ship ~85 px. Strong silhouettes, glowing edges
   and cores; avoid dark-on-dark details that vanish when small. Check your image scaled down to 64 px.
8. **Consistent scale inside a sheet.** State the intended in-game size of each object; draw them to the same scale.
9. **Animation is done in code.** Do not try to draw animation frames of ships, enemies or bosses. Instead deliver
   **parts sheets** (separate moving parts: wings, engines, guns, cores, tentacles, rotors). Exception: effects
   (explosions, flames, portals) may be delivered as **frame strips** (Part 1.11).
10. **Parts sheets:** same design and scale as the full object; each part separate, unlit version where a glow is a
    separate part (e.g. engine without flame + flame alone). Keep pivot points obvious (a gun's base at its center).
11. **Frame strips (effects only):** N frames left to right in equal square cells (e.g. 8 frames of 256x256 in one
    2048x256 image), same center point in every cell, transparent background, consistent light.
12. **Output size:** see Part 5. Bigger is fine; Claude scales down.
13. **File names** (say them under each image): English, lowercase, hyphens, e.g. `ship-phantom-hull.png`,
    `enemy-w2-larva.png`, `boss-w3-colossus-core.png`, `fx-explosion-small-8f.png`, `icon-weapon-railgun.png`.
14. **No real brands, no real people, nothing copied from other games.**

---

## Part 2 — STYLE BLOCK (put this at the start of every image prompt)

```
STYLE (keep identical across all images):
Game art for "Void Blaster", a top-down mobile space shooter (survivors-like).
Camera: top-down orthographic, looking straight down, no perspective.
Look: stylized sci-fi with a neon accent. Dark, rich materials (gunmetal, carbon,
matte ceramic) lit from the top-left, with bright glowing neon edges, engine
glow and emissive lights. Strong readable silhouette at small size (64-128 px).
Detail level: high but clean - panel lines, vents, rivets, small lights; no noise,
no grunge overload.
Palette: deep navy and violet shadows (#05010f, #16002e), neon accents in cyan
#2ff3ff, magenta #ff2d95, violet #b04dff and gold #ffd23d (plus the world colors).
Rendering: crisp edges, soft bloom on glowing parts only, no motion blur,
no depth of field, not photorealistic.
Output: single object (or a sheet of separate objects), centered, transparent
background (PNG with alpha), no ground shadow, no text, no logo, no watermark.
Match the attached reference images exactly in style.
```

---

## Part 3 — Game content you are drawing

### Player ships (cyan family; each has its own accent)
| Ship | Description | Accent |
| --- | --- | --- |
| Striker (DONE) | balanced interceptor, swept wings, twin engines, side guns | cyan #2ff3ff |
| Phantom | very fast, slim stealth fighter, long narrow body, forward-swept blade wings, one large engine, sharp angular cockpit | magenta-cyan: cyan glow with #ff4dd8 trim |
| Titan | heavy gunship, wide armored hull, short thick wings with big weapon pods, four engines, raised bridge | cyan glow with gold-orange #ffb52e trim |
| Gold Striker (skin) | the Striker repainted in polished gold armor with white-gold glow, same shape | gold #ffd23d |

### Weapons (each appears as a small module on the ship, a projectile and a hit effect; 11 weapons, each with an evolution)
| Weapon | Projectile / effect | Evolution (drawn in gold accents) |
| --- | --- | --- |
| Pulse Blaster | short cyan energy bolts | Photon Storm: long white-cyan piercing lances |
| Scatter Gun | orange pellets in a cone | Flak Cannon: golden pellets that burst on impact |
| Seeker Missiles | small red-tipped homing missiles with smoke trail, explosion | Swarm Barrage: many gold micro-missiles |
| Orbit Blades | violet energy blades circling the ship | Plasma Halo: six pale-violet plasma blades + burning aura ring |
| Arc Coil | electric-blue chain lightning | Tempest: yellow-white double lightning |
| Nova Pulse | teal shockwave ring around the ship | Supernova: huge white-teal shockwave |
| Wingman Drone | small green drone orbiting the ship, green bolts | Drone Squadron: five yellow-green drones |
| Proximity Mines | yellow mines dropped behind, blast | Gravity Mines: violet mines with a swirling pull field |
| Railgun (new) | charged straight beam through a whole line of enemies | Gauss Lance: twin beams, blast at the end |
| Flamethrower (new) | short cone of fire, burning enemies | Inferno: wide blue flame, burning patches on the ground |
| Singularity Cannon (new) | slow dark orb that becomes a small black hole | Event Horizon: big black holes that collapse in a blast |

### Perks (icons only; 6)
Power Core (+damage, red reactor), Overclock (-cooldown, yellow speed gauge), Thrusters (+speed, orange chevrons),
Armor Plating (+hull, green shield with plus), Tractor Beam (+pickup range, cyan magnet), Amplifier (+area, violet
expanding arrows).

### Combos (icons; drawn as the two weapon symbols fused in one tile)
Weapon combos: Storm Mines, Cluster Missiles, Blade Nova, Twin Link, Ion Bolts, Minelayer, Ion Rail, Shrapnel Rail,
Napalm Mines, Fire Blades, Gravity Barrage, Collapse.
Perk sets: Overdrive, Ram Plating, Singularity, Hit & Run, Last Stand, Scorched Trail, Bastion Field, Salvage Core.
Super combos (three symbols, gold frame): Thunderstorm, Supernova Core, Phoenix Rail.

### Elite traits (5; drawn as overlays that sit on top of any enemy: a ring/aura + a small badge icon)
SWIFT (mint #3dffd8 speed streamlines; not cyan, which is the player's), BULWARK (green #3dff8a heavy shield plates),
BERSERKER (red #ff3d3d spikes and cracked glow), COMMANDER (gold #ffd23d antenna crown), SHIELDED (violet #b06bff
hexagon energy bubble).

### Ten worlds (6 sectors each; each world has its own floor, props, 6 enemy types and a boss)
Enemies are abstract alien machines/creatures with a glowing core: geometric silhouettes, never realistic animals.

| # | World | Look (floor and props) | Enemy colors | Enemies (size on screen) | Boss |
| --- | --- | --- | --- | --- | --- |
| 1 | Ruined Megastructure (DONE: concept + enemies) | broken circuit floor plates, fallen pylons, sparking cables, dead screens, rubble frame | magenta, violet, pink, yellow, acid green | drone 32, swarmer 24, dasher 32, shooter 36, tank 64, splitter 60 | Hive Mother: bloated machine queen with egg pods and spawning ports |
| 2 | Biological Hive | living organic floor, pulsing membranes, egg clusters, acid pools, bioluminescent veins | toxic green #3dff8a, sickly yellow, flesh pink | larva 26, spitter 36, leech 30, carapace beetle 64, spore pod (stationary) 48, brood sac 60 | Hive Queen: huge armored queen, tail of egg sacs, acid glands |
| 3 | Rock Wastes | canyons, mesas, cracked dry ground, boulders, dust | rust #ff6a2a, ochre, amber | rock crawler 32, dust devil 30, sand burrower 40, scorpion turret (stationary) 48, boulder golem 66, meteor 56 | Canyon Colossus: walking rock fortress with drill arms |
| 4 | Verdant World (Earth-like, seen from low orbit) | oceans, coastlines, forest patches, drifting cloud layer | hot pink, white, sky blue (no cyan) | hunter drone 32, storm kite 34, hover gunship 44, armored rover 56, cloud ray 50, satellite turret (stationary) 48 | Sky Fortress: flying citadel with rotating gun rings |
| 5 | Frozen Expanse | ice sheets, crevasses, frost crystals, aurora light | ice white, pale violet, deep blue | shard 30, ice wisp 28, frost crab 40, prism 40, snowflake mine 34, glacier golem 66 | Crystal Serpent: long segmented crystal snake |
| 6 | Volcanic Forge | lava rivers, obsidian plates, giant furnaces, ember storms | orange #ff8a2a, red, black | bomber 44, ember swarm 22, magma slug 40, forge turret (stationary) 48, lava eel 50, golem 64 | Forge Titan: walking furnace with magma cannons and armor plates |
| 7 | Crystal Caverns | towering prisms, refracted light beams, glowing geodes | turquoise #2fffc8, violet, white | gem beetle 32, echo bat 30, refractor 40, resonator (stationary) 48, crystal sentinel 60, prism swarm 22 | Prism Leviathan: crystalline whale-like construct |
| 8 | Derelict Station | dark corridors, emergency lights, debris, broken hull plates | warning red, sodium orange, gray | security drone 32, maintenance bot 36, crawler 34, wall turret (stationary) 48, mimic crate 44, ghost 40 | Station AI Core: giant core with orbiting drone arms |
| 9 | Storm Giant | swirling gas cloud bands, lightning, floating metal platforms | yellow, bronze, storm purple | storm jelly 36, gas mine 34, lightning kite 32, ion ray 46, vortex 50, cloud whale 66 | Storm Eye: cyclone creature with a lightning core |
| 10 | Void Core (finale) | fractured space, black holes, impossible geometry, violet energy | violet #b04dff, magenta, black | voidling 26, wraith 40, eye 44, phase walker 40, rift spawner (stationary) 52, null orb 48 | Void Heart: pulsing heart of darkness in a cage of broken rings, orbiting eyes |

---

## Part 4 — Task list (one task per reply, in this order)

Each task says exactly what to deliver. Use the STYLE BLOCK in every prompt. Attach the relevant approved images
as references.

### A — Finish world 1 and the player's look (needed first)
- **A1 Floor tile, world 1:** seamless tileable floor texture 1024x1024 matching `tech-ruin-concept.webp` (circuit
  floor plates, faint amber lines). Tiles perfectly on all four edges, low contrast, darker than objects, no large
  unique landmarks. Also a 2x2 preview of it tiled, to prove there are no seams.
- **A2 Props, world 1:** sheet of 3 large obstacles (200–320 px: broken pylon, fallen wall segment, dead screen
  console), 3 small cover objects (60–120 px), 2 destructible objects with a visible weak point (energy barrel,
  supply pod) **and** the same 2 in a destroyed/debris version.
- **A3 Arena border, world 1:** 4 rubble/wreckage border strips (top, bottom, left, right, each 1024 px long,
  tileable along their length) and 4 corner pieces, so the arena edge can be built at any size.
- **A4 Enemy debris:** for each world-1 enemy (drone, swarmer, dasher, shooter, tank, splitter) 3–4 broken shards
  of its body (for the death animation), one sheet.
- **A5 Elite trait overlays:** the 5 trait rings/auras from Part 3 as separate overlays (256x256, transparent
  center so any enemy fits inside) + 5 small badge icons (64x64).
- **A6 World-1 boss, Hive Mother:** full boss (about 300 px in game; deliver 1024x1024), 3–4 glowing destructible weak
  points (spawning ports, core, armor plates). Then a parts sheet: body, each weak point, each moving part.

### B — Player ships
- **B1 Phantom concepts:** 4 variants side by side (dark plain background allowed for concept sheets).
- **B2 Phantom final + parts:** the chosen variant alone (1024 px, transparent), then its parts sheet: hull with
  cockpit, wings, engine(s) without flame, one flame, cockpit glass, guns.
- **B3 Titan concepts**, **B4 Titan final + parts** (same as B1–B2).
- **B5 Gold Striker skin:** the Striker (attached) recolored as polished gold, plus the same parts sheet in gold.
- **B6 Weapon modules:** sheet of 11 small modules that mount on a ship (one per weapon, Part 3), top-down, each
  ~1/6 of the ship's length, readable at 24–32 px. **B7:** the same 11 as evolved versions (bigger, gold accents).

### C — Weapons and effects (frame strips allowed)
- **C1 Projectiles:** sheet of every projectile in Part 3 (11 + 11 evolved), each drawn pointing right, glow included.
- **C2 Impacts:** small hit sparks in the colors of each weapon (cyan, orange, red, violet, electric blue, teal,
  green, yellow, white, fire, dark violet), 8 frames each as strips of 128 px cells.
- **C3 Explosions:** small (enemy), medium (elite), large (boss) explosion, 8 frames each, 256/384/512 px cells.
- **C4 Lightning:** 6 jagged lightning segments (straight, ~512x64 each, electric blue) to be stretched between
  enemies, plus a yellow-white Tempest version.
- **C5 Fire:** flamethrower cone (8-frame strip), burning-ground patch (8 frames), small burn flame on an enemy
  (8 frames), blue Inferno versions.
- **C6 Black hole:** Singularity orb, small black hole (8-frame swirl loop), its collapse blast (8 frames), larger
  Event Horizon versions.
- **C7 Rail beams:** railgun beam body (tileable along its length), muzzle flash, end blast; Gauss Lance versions.
- **C8 Shockwaves and shields:** Nova ring, Supernova ring, player shield bubble (hex pattern), enemy shield bubble.
- **C9 Spawn and warning:** enemy spawn portal (8 frames), red warning circle for incoming mortar/slam, elite
  arrival flash.

### D — Pickups
- **D1:** XP crystal (small/medium/large, green-gold gems), coin (gold hexagon), repair kit, magnet, bomb, supply
  crate closed and open, boss chest closed and open. All transparent, 64–128 px.

### E — Interface (no text in images; text is added in code)
- **E1 Icons, 128x128 each, one sheet per group:** 11 weapons, 11 evolutions (gold frame), 6 perks, 12 weapon
  combos, 8 perk sets, 3 super combos (gold frame), 5 elite traits. Same tile style for all: dark rounded square,
  thin neon border in the item's color, symbol centered, readable at 48 px.
- **E2 UI frames (9-slice friendly):** panel frame, button (normal/pressed/disabled), card frame for level-up
  choices (normal, evolution = gold, combo = turquoise #3dffc8), HUD top bar, boss health bar frame, small badge.
  Plain shapes with neon borders and empty centers, no text.
- **E3 Logo:** "VOID BLASTER" wordmark is drawn in code — instead draw a **logo emblem** (the Striker in a neon
  ring) 1024x1024 transparent.
- **E4 Menu backgrounds:** main menu (1290x2796, deep space with nebula, the Striker small in the center, empty
  space for buttons at the bottom), hangar background, galaxy map background.
- **E5 Galaxy map:** 10 world nodes as planet/region tokens (one per world, 256x256, transparent), a locked
  version of each (dimmed, chained), and a path connector piece.
- **E6 Ship hangar turntable:** each ship (Striker, Phantom, Titan, Gold Striker) at 3/4 view, large and detailed,
  for the hangar screen only (the only non-top-down images).

### F — Worlds 2–10 (one world per task: F2, F3 … F10, in the order of Part 3)
For each world:
1. **Concept** (941x1672 portrait, like `tech-ruin-concept.webp`): the arena seen from above, calm darker center,
   props and border around the edges, no ships, no enemies.
2. **Floor tile** 1024x1024 seamless + a 2x2 tiled preview.
3. **Parallax overlay** (transparent, tileable 1024x1024): floating particles, mist, distant lights, spores, embers or
   snow, matching the world.
4. **Props sheet** (as A2) and **border pieces** (as A3).
5. **Enemy sheet** of the world's 6 enemies (Part 3 table), each with its size, facing up, transparent; plus an
   **elite** version of the first enemy (1.6x, more armor, gold ring) and **debris shards** (as A4).
6. **Boss** full + parts sheet (as A6).

### G — Store and marketing
- **G1 App icon:** 1024x1024, full bleed (no transparency, no rounded corners), the Striker in a dramatic pose with
  neon glow on a dark nebula; must read at 60 px.
- **G2 Google Play feature graphic:** 1024x500, the Striker and a swarm, space on the left for a title added later.
- **G3 Key art:** 2048x2048 square, the Striker fighting a boss in world 1, for social media.

---

## Part 5 — File specs

| Asset | Size on screen | Deliver | Background |
| --- | --- | --- | --- |
| Player ship (full and parts) | ~85 px | 1024x1024 | transparent |
| Enemy | 22–66 px | 256x256 each (or a sheet) | transparent |
| Elite | 50–110 px | 512x512 | transparent |
| Boss (full and parts) | ~300 px | 1024x1024 | transparent |
| Prop / obstacle | 60–320 px | 512–1024 | transparent |
| Floor tile | repeats | 1024x1024, seamless | full |
| Parallax overlay | repeats | 1024x1024, seamless | transparent |
| World concept | reference | 941x1672 | full |
| Effect frame strip | 32–200 px | N square cells of 128–512 px | transparent |
| Icon | 48–64 px | 128x128 | full tile |
| App icon | — | 1024x1024 | full, no alpha |

---

## Part 6 — Before you hand in each task (checklist)

- [ ] Straight top-down view (except E6 hangar turntables and G marketing images).
- [ ] Real transparency where required (checkerboard, not white or black).
- [ ] Every object separated with space around it; nothing cut off.
- [ ] No text, letters, numbers or watermarks.
- [ ] Player cyan; enemies never cyan; danger red/orange; rewards gold/green.
- [ ] Readable when scaled down to the in-game size.
- [ ] Same style as the attached references; same scale within the sheet.
- [ ] File name written under each image.
- [ ] Commercial use: the images will be used in a paid game; tell Konrad if your plan does not allow it.
