// The 2.0 look on PixiJS (WebGL), stage 1 of the 2.0 plan. It reads the same game state as js/render-canvas.js and
// draws, on its own canvas under the game's: the background (world 1: the orbital wreck field, js/v2/orbit.js; other
// worlds: a floor tile), the Striker built from its parts,
// every enemy or boss that already has 2.0 art (marked e.v2), and the GPU-heavy crowd: shots, enemy bullets, gems,
// pickups, mines, particles, blast rings and lightning, each with a soft glow, plus the weapons around the ship (their
// own render functions in js/weapons.js, through an adapter). The 1.x renderer (js/render-canvas.js), drawing on its
// transparent canvas on top, skips all of that and adds the rest (bars, numbers, arrows). Loaded only by the TEST
// variant (js/testkit.js), so normal and App Store builds contain no PixiJS. Textures: scripts/v2-assets.mjs.
import { Application, Container, Sprite, Texture, TilingSprite, Graphics } from 'pixi.js';
import { BOSSES } from '../data.js';
import { PROPS } from '../props.js';
import { boltSprite, missileSprite, orbSprite, gemSprite, glowDot, pickupSprite, mineSprite } from '../sprites.js';
import { WEAPONS, weaponStats } from '../weapons.js';
import ASSETS from './assets.gen.js';
import { makeTitle } from './title.js';
import { makeOrbitalRuins } from './orbit.js';
import { makeSiegeOfEarth } from './siege.js';
import { makeLunarBridgehead } from './lunar.js';
import { makeRedConversion } from './mars.js';
import { stormLevel } from '../crystal.js';

const TAU = Math.PI * 2;
// enemy types with 2.0 art, and the colour of their glow
const ENEMY_ART = {
  drone: 0xff2d95, swarmer: 0xffe23d, dasher: 0xff3d9a, shooter: 0xff2d95, tank: 0xb04dff, splitter: 0x9dff3d,
  // world 2, the landing force (proto2/make-world2.py)
  interceptor: 0xff2d95, lander: 0xff2d95, gunship: 0xff2d95, skymine: 0xff2d95, raider: 0xff2d95, walker: 0xff2d95,
  // world 3, the bridgehead's garrison (proto2/make-world3.py)
  probe: 0xff2d95, crawler: 0xff2d95, hopper: 0xff2d95, mortarnode: 0xff2d95, cturret: 0xff2d95, rgolem: 0xff2d95,
  // world 4, the converted (proto2/make-world4.py)
  mite: 0xff2d95, sdrone: 0xff2d95, stalker: 0xff2d95, prismnode: 0xff2d95, spreader: 0xff2d95, cgolem: 0xff2d95,
};
const ENEMY_SIZE = 2.8; // sprite size in enemy radii
const DEBRIS_MAX = 160; // enemy debris fragments flying at once (W1 P7); the oldest is reused past that
const SHIP_H = 46; // the Striker's length in world units
const FLOOR_SCALE = 0.5;
const TITLE_SHIP_H = 120; // the Striker on the title screen, in points
const PHANTOM_L = 44, TITAN_L = 40; // nose to nozzle, in world units (the Striker is SHIP_H long)
const GOLD = 0xffd98a; // tint of the Gold Striker skin

export async function createV2Renderer(app) {
  const canvas = document.createElement('canvas');
  canvas.id = 'game2';
  canvas.dataset.look = 'VB-V2LOOK'; // the build scripts check that only the TEST variant contains this file
  canvas.style.cssText = 'position:fixed;inset:0;display:none;';
  document.body.insertBefore(canvas, document.getElementById('game'));
  const px = new Application();
  await px.init({
    canvas, width: app.W, height: app.H, resolution: app.dpr, autoDensity: true, background: 0x05010f,
    antialias: true, autoStart: false, powerPreference: 'high-performance',
  });
  const tex = {}, imgs = {};
  await Promise.all(Object.entries(ASSETS.images).map(async ([name, url]) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    imgs[name] = img;
    tex[name] = Texture.from(img);
  }));
  // the 2.0 pictures of the ships for the HTML screens (hangar, sector briefing; js/ui.js paintCanvases)
  app.shipArt = (id) => imgs[`ship-card-${id}`] || null;

  const halo = softDot(), halo0 = halo;
  // the 1.x neon sprites (pre-rendered canvases, js/sprites.js) as GPU textures, made once per canvas
  const canvasTex = new WeakMap();
  const texOf = (spr) => {
    let t = canvasTex.get(spr.canvas);
    if (!t) { t = Texture.from(spr.canvas); canvasTex.set(spr.canvas, t); }
    return t;
  };

  const add = (c) => { c.blendMode = 'add'; return c; };
  const world = new Container();
  px.stage.addChild(world);
  const floor = new TilingSprite({ texture: tex.floor, width: 10, height: 10 });
  floor.tileScale.set(FLOOR_SCALE);
  const border = new Graphics();
  const lootLayer = add(new Container()), ringG = add(new Graphics());
  const glowLayer = add(new Container());
  const propLayer = new Container(), debrisLayer = new Container(), wreckLayer = new Container();
  const enemyLayer = new Container(), bossLayer = new Container(), shipLayer = new Container(), shadowLayer = new Container();
  const shotLayer = add(new Container()), fxLayer = add(new Container()), fxG = add(new Graphics());
  const weaponLayer = add(new Container()), weaponG = new Graphics();
  weaponLayer.addChild(weaponG);
  // the worlds with a 2.0 arena, each a far layer under the arena, its arena and a near layer over everything: world 1
  // "Orbital Ruins" (js/v2/orbit.js), world 2 "Siege of Earth" (js/v2/siege.js, plus cloud banks over the enemies
  // with the enemies' cores shining through them), world 3 "Lunar Bridgehead" (js/v2/lunar.js, with the craters of
  // js/cover.js), world 4 "Red Conversion" (js/v2/mars.js, with js/crystal.js's network and storms); the other worlds
  // use the floor tile
  const orbit = makeOrbitalRuins(tex), siege = makeSiegeOfEarth(tex), lunar = makeLunarBridgehead(tex, halo);
  const mars = makeRedConversion(tex, halo);
  const coreLayer = add(new Container());
  px.stage.addChildAt(mars.far, 0);
  px.stage.addChildAt(lunar.far, 0);
  px.stage.addChildAt(siege.far, 0);
  px.stage.addChildAt(orbit.far, 0);
  world.addChild(floor, border, orbit.arena, siege.arena, lunar.arena, mars.arena, propLayer, debrisLayer, shadowLayer, lootLayer, ringG, glowLayer, enemyLayer, bossLayer, siege.cover, coreLayer, shotLayer, weaponLayer, shipLayer, wreckLayer, fxLayer, fxG);
  // reusable sprites: each frame takes as many as it needs and hides the rest (no per-object create/destroy)
  const lootHalo = pool(lootLayer), loot = pool(lootLayer);
  const shotHalo = pool(shotLayer), shots = pool(shotLayer);
  const sparks = pool(fxLayer);
  const weaponSprites = pool(weaponLayer);
  const weaponR = weaponAdapter(weaponG, (spr, x, y, a, sc, alpha) => { put(weaponSprites.next(), spr, x, y, a, sc).alpha = alpha; });

  // a pooled sprite showing one of the 1.x neon sprites
  function put(s, spr, x, y, rot = 0, sc = 1) {
    const t = texOf(spr);
    if (s.texture !== t) s.texture = t;
    s.position.set(x, y); s.rotation = rot; s.alpha = 1;
    s.scale.set((spr.half * 2 * sc) / t.width);
    return s;
  }
  // the three ships: the Striker built from its parts, Phantom and Titan as a body with animated flames
  const makeShips = (scale) => ({
    striker: makeShip(tex, ASSETS.ship, SHIP_H * scale),
    phantom: makeBodyShip(tex, 'phantom', ASSETS.ships.phantom, PHANTOM_L * scale),
    titan: makeBodyShip(tex, 'titan', ASSETS.ships.titan, TITAN_L * scale),
  });
  const ships = makeShips(1);
  for (const s of Object.values(ships)) { s.body.visible = false; shipLayer.addChild(s.body); }
  let ship = ships.striker;
  // the title screen behind the menus (js/v2/title.js), with its own, bigger ships
  const title = makeTitle(tex, halo, makeShips(TITLE_SHIP_H / SHIP_H));
  title.scene.visible = false;
  px.stage.addChild(orbit.near, siege.near, lunar.near, mars.near, title.scene);

  let arenaKey = '', lastTime = null;
  const drawn = new Map(); // game object -> its sprites
  let frameNo = 0;

  function spritesFor(e, make) {
    let s = drawn.get(e);
    if (!s) { s = make(); drawn.set(e, s); }
    s.frame = frameNo;
    return s;
  }

  function enemySprites(e) {
    const art = e.elite && tex[`enemy-${e.type}-elite`] ? `enemy-${e.type}-elite` : `enemy-${e.type}`;
    const body = new Sprite(tex[art]);
    body.anchor.set(0.5);
    const glow = new Sprite(tex[`glow-${e.type}`]);
    glow.anchor.set(0.5);
    // the magenta core that shows through world 2's cloud banks
    const core = new Sprite(halo);
    core.anchor.set(0.5); core.tint = 0xff2d95;
    // world 3: a hard black shadow toward the lower right (sunlight from the top left, no air), so the pale armor
    // stands out from the gray ground
    const shadow = new Sprite(tex[art]);
    shadow.anchor.set(0.5); shadow.tint = 0x000000; shadow.alpha = 0.6;
    shadowLayer.addChild(shadow);
    enemyLayer.addChild(body); glowLayer.addChild(glow); coreLayer.addChild(core);
    return { body, glow, core, shadow, base: (e.r * ENEMY_SIZE) / Math.max(body.texture.width, body.texture.height) };
  }

  // a prop to shoot (js/props.js: world 1 fuel tank or ammo crate, world 2 flak battery or beacon pylon) on a dark
  // shadow, so it stands out from what lies under it, and a glow: a weak point, a faint halo or a magenta core
  function propSprites(o) {
    const body = new Container();
    const shadow = new Sprite(halo), spr = new Sprite(tex[PROPS[o.prop].art]);
    shadow.anchor.set(0.5); spr.anchor.set(0.5);
    shadow.tint = 0x000000; shadow.alpha = 0.8;
    shadow.scale.set((spr.texture.width * 1.5) / 64, (spr.texture.height * 1.7) / 64);
    body.addChild(shadow, spr);
    propLayer.addChild(body);
    const glow = new Sprite(halo);
    glow.anchor.set(0.5); glow.tint = PROPS[o.prop].glow === 'core' ? 0xff2d95 : 0xffb02e;
    glowLayer.addChild(glow);
    return { body, spr, shadow, glow, base: (o.r * PROPS[o.prop].size) / spr.texture.width };
  }

  // the world-1 boss, the Harvester (W1 P8): the assembled ship with its glowing parts laid over it and animated (core,
  // pods, nose) and two engine flames; positions are in the art's 1254 px frame, the textures are stored at 1024 px
  // a destroyed enemy breaks into its own fragments (W1 P7: 4 per enemy type), which fly apart, spin and fade
  const debris = [];
  let debrisGame = null, debrisTime = 0;
  function shatter(e) {
    const dt = (n) => tex[`w1-debris-${e.type}-${n}`] || tex[`w2-debris-${e.type}-${n}`] || tex[`w3-debris-${e.type}-${n}`] || tex[`w4-debris-${e.type}-${n}`];
    if (!dt(1)) return;
    const n = e.elite ? 4 : 2 + Math.floor(Math.random() * 2), first = Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      let d;
      if (debris.length < DEBRIS_MAX) {
        d = { s: new Sprite() };
        d.s.anchor.set(0.5);
        debrisLayer.addChild(d.s);
      } else d = debris.shift();
      const t = dt(((first + i) % 4) + 1);
      const a = Math.random() * TAU, v = 70 + Math.random() * 120;
      d.s.texture = t;
      d.base = (e.r * ENEMY_SIZE * 0.55) / Math.max(t.width, t.height);
      Object.assign(d, { x: e.x, y: e.y, vx: Math.cos(a) * v + e.kx * 0.3, vy: Math.sin(a) * v + e.ky * 0.3, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 6, t: 0, life: 0.8 + Math.random() * 0.5 });
      debris.push(d);
    }
  }
  function updateDebris(game) {
    if (game !== debrisGame) { debrisGame = game; debrisTime = game.time; for (const d of debris) d.t = d.life; }
    const dt = Math.min(0.05, Math.max(0, game.time - debrisTime));
    debrisTime = game.time;
    const drag = Math.exp(-2.5 * dt);
    for (const d of debris) {
      d.t += dt;
      const k = d.t / d.life;
      d.s.visible = k < 1;
      if (k >= 1) continue;
      d.vx *= drag; d.vy *= drag;
      d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.spin * dt;
      d.s.position.set(d.x, d.y); d.s.rotation = d.rot;
      d.s.scale.set(d.base * (1 - k * 0.25));
      d.s.alpha = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6;
    }
  }

  // the world-2 boss, the Landing Citadel (W2 P8): the core hull inside two gun rings that turn opposite ways, four
  // weak points that glow, and the engine flame; parts placed from ASSETS.citadel (centers in the art's 1024 frame)
  function citadelSprites() {
    const c = new Container();
    const at = (name, add) => {
      const s = new Sprite(tex[`w2-boss-${name}`]);
      const [x, y] = ASSETS.citadel.parts[name];
      s.anchor.set(0.5); s.position.set(x - 512, y - 512);
      if (add) s.blendMode = 'add';
      return s;
    };
    const halo = new Sprite(tex['glow-walker'] || halo0);
    halo.anchor.set(0.5); halo.tint = 0xff2d95; halo.blendMode = 'add'; halo.scale.set(4.2);
    const flame = at('engine-flame', true);
    flame.anchor.set(0.5, 0.2); flame.y -= flame.height * 0.3;
    const outer = at('outer-gun-ring'), inner = at('inner-gun-ring'), hull = at('core-hull');
    const weak = ['nw', 'ne', 'sw', 'se'].map((n) => at(`weak-point-${n}`));
    const weakGlow = weak.map((w) => { const g = new Sprite(halo0); g.anchor.set(0.5); g.position.copyFrom(w.position); g.tint = 0xff2d95; g.blendMode = 'add'; g.scale.set(1.6); return g; });
    c.addChild(halo, flame, outer, inner, hull, ...weak, ...weakGlow);
    bossLayer.addChild(c);
    return { body: c, inner: hull, outer, ring: inner, flame, halo, weakGlow, rings: [outer, inner] };
  }

  // the world-3 boss, the Moon Spire (W3 P8): the armored crown in its crater, four living conduit roots that stir,
  // the cannon core that turns after the ship (Game: b.aim), four weak points that glow and the muzzle flash of each
  // shell; parts placed from ASSETS.spire (centers in the art's 1024 frame)
  function spireSprites() {
    const c = new Container();
    const at = (name, add) => {
      const s = new Sprite(tex[`w3-boss-${name}`]);
      const [x, y] = ASSETS.spire.parts[name];
      s.anchor.set(0.5); s.position.set(x - 512, y - 512);
      if (add) s.blendMode = 'add';
      return s;
    };
    const halo = new Sprite(tex['glow-rgolem'] || halo0);
    halo.anchor.set(0.5); halo.tint = 0xff2d95; halo.blendMode = 'add'; halo.scale.set(3.6);
    const crown = at('crown-and-crater-foundation');
    const roots = ['north', 'east', 'south', 'west'].map((n) => at(`root-${n}`));
    const core = at('cannon-core');
    const weak = ['nw', 'ne', 'sw', 'se'].map((n) => at(`weak-point-${n}`));
    const weakGlow = weak.map((w) => { const g = new Sprite(halo0); g.anchor.set(0.5); g.position.copyFrom(w.position); g.tint = 0xff2d95; g.blendMode = 'add'; g.scale.set(1.8); return g; });
    const coreGlow = new Sprite(halo0);
    coreGlow.anchor.set(0.5); coreGlow.position.copyFrom(core.position); coreGlow.tint = 0xff2d95; coreGlow.blendMode = 'add'; coreGlow.scale.set(3.2);
    const flash = at('muzzle-flash', true);
    flash.anchor.set(0.5, 0.85); flash.alpha = 0;
    c.addChild(halo, crown, ...roots, core, ...weak, ...weakGlow, coreGlow, flash);
    bossLayer.addChild(c);
    return { body: c, inner: crown, core, roots, halo, weakGlow, coreGlow, flash };
  }

  // the world-4 boss, the Red Colossus (W4 P8): the assembled drawing (its parts do not match it exactly, see
  // proto2/make-world4.py) with glows laid over it: four weak points at the leg joints, the core and the two cannons
  // (positions from ASSETS.colossus, in the art's 1024 frame)
  function colossusSprites() {
    const c = new Container();
    const glowAt = ([x, y], size, tint = 0xff2d95) => {
      const g = new Sprite(halo0);
      g.anchor.set(0.5); g.position.set(x - 512, y - 512); g.tint = tint; g.blendMode = 'add'; g.scale.set(size);
      return g;
    };
    const halo = new Sprite(tex['glow-cgolem'] || halo0);
    halo.anchor.set(0.5); halo.tint = 0xff2d95; halo.blendMode = 'add'; halo.scale.set(3.4);
    const body = new Sprite(tex['w4-boss']);
    body.anchor.set(0.5);
    const weak = ASSETS.colossus.weak.map((p) => glowAt(p, 2));
    const core = glowAt(ASSETS.colossus.core, 3.2);
    const cannons = ASSETS.colossus.cannons.map((p) => glowAt([p[0], p[1] - 120], 2.2, 0xff5a2e));
    c.addChild(halo, body, ...weak, core, ...cannons);
    bossLayer.addChild(c);
    return { body: c, inner: body, halo, weak, core, cannons };
  }

  function bossSprites() {
    const c = new Container();
    const at = (s, x, y) => { s.position.set(((x - 627) / 1254) * 1024, ((y - 627) / 1254) * 1024); return s; };
    const part = (name, x, y, ax = 0.5, ay = 0.5) => {
      const s = new Sprite(tex[`w1-boss-${name}`]);
      s.anchor.set(ax, ay); s.blendMode = 'add';
      return at(s, x, y);
    };
    const halo = new Sprite(tex['glow-tank']);
    halo.anchor.set(0.5); halo.tint = 0xff2dd0; halo.blendMode = 'add'; halo.scale.set(6.4);
    const flames = [455, 800].map((x) => part('flame', x, 1045, 0.5, 0.15));
    const body = new Sprite(tex['w1-boss']);
    body.anchor.set(0.5);
    const core = part('glow-core', 627, 619);
    const pods = [part('glow-pod-left', 285, 643), part('glow-pod-right', 967, 643)];
    const nose = part('glow-nose', 627, 266);
    c.addChild(halo, ...flames, body, core, ...pods, nose);
    bossLayer.addChild(c);
    return { body: c, inner: body, flames, halo, core, pods, nose };
  }

  const fitScreen = () => {
    if (px.renderer.width !== Math.round(app.W * app.dpr) || px.renderer.height !== Math.round(app.H * app.dpr)) {
      px.renderer.resolution = app.dpr;
      px.renderer.resize(app.W, app.H);
    }
  };

  // the menus: the title scene; main = the main menu (full brightness, the ship), showShip = the 2.0 ship is the one chosen
  function renderTitle(time, opts) {
    fitScreen();
    world.visible = orbit.near.visible = siege.near.visible = lunar.near.visible = mars.near.visible = false;
    title.scene.visible = true;
    title.update(time, app.W, app.H, opts);
    px.render();
  }

  function render(game) {
    frameNo++;
    fitScreen();
    world.visible = true;
    title.scene.visible = false;
    const w1 = game.stage.world.id === 1, w2 = game.stage.world.id === 2 && siege.ok, w3 = game.stage.world.id === 3 && lunar.ok;
    const w4 = game.stage.world.id === 4 && mars.ok, storm = w4 ? stormLevel(game) : 0;
    orbit.far.visible = orbit.arena.visible = w1;
    orbit.near.visible = w1 && !!tex['w1-near'];
    siege.far.visible = siege.arena.visible = siege.cover.visible = siege.near.visible = coreLayer.visible = w2;
    lunar.far.visible = lunar.arena.visible = lunar.near.visible = w3;
    mars.far.visible = mars.arena.visible = mars.near.visible = w4;
    floor.visible = border.visible = !w1 && !w2 && !w3 && !w4;
    const sdt = Math.min(0.1, Math.max(0, game.time - (lastTime ?? game.time)));
    lastTime = game.time;
    const { cx, cy } = game.frameCam;
    const z = app.zoom;
    world.scale.set(z);
    world.position.set(app.W / 2 - cx * z, app.H / 2 - cy * z);

    // the arena: world 1 is the orbital wreck field, the others a floor tile with a border in the world's colour
    const { w, h } = game.arena;
    const key = `${w}x${h}:${game.stage.world.theme.grid}:${game.stage.id}`;
    if (key !== arenaKey) {
      arenaKey = key;
      const seed = [...String(game.stage.id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
      if (w1) orbit.setArena(w, h, seed);
      if (w2) siege.setArena(w, h, seed);
      if (w3) lunar.setArena(w, h, seed, game.cover);
      if (w4) mars.setArena(w, h, seed, game.crystal);
      floor.width = w; floor.height = h; floor.position.set(-w / 2, -h / 2);
      const col = Number.parseInt(game.stage.world.theme.grid.slice(1), 16);
      border.clear().rect(-w / 2, -h / 2, w, h).stroke({ width: 12, color: col, alpha: 0.2 }).rect(-w / 2, -h / 2, w, h).stroke({ width: 2.5, color: col, alpha: 0.9 });
    }

    if (w1) orbit.update(game.time, cx, cy, z, app.W, app.H);
    if (w2) siege.update(game.time, cx, cy, z, app.W, app.H, sdt);
    if (w3) lunar.update(game.time, cx, cy, z, app.W, app.H);
    if (w4) mars.update(game.time, cx, cy, z, app.W, app.H, game.crystal, storm);

    // the props to shoot, whole or broken (js/props.js)
    for (const o of game.props) {
      const P = PROPS[o.prop];
      if (!tex[P.art]) continue;
      const s = spritesFor(o, () => propSprites(o));
      // a prop with no broken picture (world 3's supply crate) is gone once broken
      s.body.visible = !o.dead || !!P.broken;
      const t = tex[o.dead ? P.broken : P.art] || s.spr.texture;
      if (s.spr.texture !== t) s.spr.texture = t;
      s.body.position.set(o.x, o.y); s.body.rotation = o.rot; s.body.scale.set(s.base);
      s.spr.tint = o.flash > 0 ? 0xffb0ff : 0xffffff;
      s.shadow.alpha = o.dead ? 0.4 : 0.8;
      s.glow.visible = !o.dead;
      const pulse = Math.sin(game.time * 5 + o.id);
      if (P.glow === 'weak') {
        // the weak point sits right of the tank's middle
        const off = o.r * P.size * 0.14;
        s.glow.position.set(o.x + Math.cos(o.rot) * off, o.y + Math.sin(o.rot) * off);
        s.glow.scale.set(1.3);
        s.glow.alpha = 0.7 + 0.3 * pulse;
      } else if (P.glow === 'core') {
        s.glow.position.set(o.x, o.y);
        s.glow.scale.set((o.r * 3) / 64);
        s.glow.alpha = 0.55 + 0.35 * pulse;
      } else {
        s.glow.position.set(o.x, o.y);
        s.glow.scale.set((o.r * 4) / 64);
        s.glow.alpha = 0.24 + 0.1 * pulse;
      }
    }

    // enemies and bosses with 2.0 art
    for (const e of game.enemies) {
      if (e.dead || e.seg) continue;
      let sc = e.spawnT > 0 ? Math.max(0.05, 1 - e.spawnT / (e.boss ? 1.2 : 0.35)) : 1;
      // world 3's hopper grows while it is in the air (a leap lasts 0.45 s)
      if (e.state === 'leap' && e.def.ai === 'hop') sc *= 1 + 0.35 * Math.sin(Math.PI * Math.min(1, 1 - e.t / 0.45));
      if (e.boss && e.def === BOSSES.citadel && tex['w2-boss-core-hull']) {
        e.v2 = true;
        const s = spritesFor(e, () => citadelSprites());
        // the entrance (spawnT 1.2 s): it rises out of the clouds below, growing
        const k = Math.max(0, e.spawnT) / 1.2, rise = k * k;
        s.body.position.set(e.x, e.y + rise * 700);
        s.body.alpha = (e.alpha ?? 1) * (1 - k * 0.6);
        s.body.scale.set(((e.r * 4.2) / 1024) * (1 - rise * 0.6));
        s.body.rotation = Math.PI;
        s.inner.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
        // the gun rings turn opposite ways, faster with each phase; the weak points beat with it
        const rage = (e.phase || 1) - 1, t = game.time;
        s.outer.rotation = t * (0.25 + rage * 0.2);
        s.ring.rotation = -t * (0.4 + rage * 0.3);
        s.flame.scale.set(1, (1 + rise * 1.5) * (1 + 0.15 * Math.sin(t * 31)));
        s.halo.alpha = (0.2 + 0.08 * Math.sin(t * 5)) * (1 + rage * 0.5);
        s.weakGlow.forEach((g, i) => { g.alpha = 0.45 + 0.35 * Math.sin(t * (4 + rage * 3) + i * 1.6) + rage * 0.15; });
        continue;
      }
      if (e.boss && e.def === BOSSES.spire && tex['w3-boss-crown-and-crater-foundation']) {
        e.v2 = true;
        const s = spritesFor(e, () => spireSprites());
        // the entrance (spawnT 1.2 s): it pushes up out of the ground, growing
        const k = Math.max(0, e.spawnT) / 1.2;
        s.body.position.set(e.x, e.y);
        s.body.alpha = (e.alpha ?? 1) * (1 - k * 0.7);
        s.body.scale.set(((e.r * 4.1) / 1024) * (1 - k * 0.5));
        s.inner.tint = s.core.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
        const rage = (e.phase || 1) - 1, t = game.time;
        // the cannon turns after the ship (its art faces up); the flash sits at the muzzle, along the aim
        const aim = (e.aim ?? -Math.PI / 2) + Math.PI / 2;
        s.core.rotation = aim;
        const since = game.time - (e.fired ?? -9);
        s.flash.rotation = aim;
        s.flash.alpha = since < 0.18 ? 1 - since / 0.18 : 0;
        s.flash.scale.set(0.9 + since * 2);
        s.roots.forEach((r, i) => { r.rotation = Math.sin(t * (0.9 + rage * 0.6) + i * 1.7) * 0.025; });
        s.halo.alpha = (0.18 + 0.08 * Math.sin(t * 4)) * (1 + rage * 0.5);
        s.coreGlow.alpha = (e.mode === 'cannon' && !e.shots ? 0.9 : 0.4) + 0.2 * Math.sin(t * (5 + rage * 3));
        s.weakGlow.forEach((g, i) => { g.alpha = 0.45 + 0.35 * Math.sin(t * (4 + rage * 3) + i * 1.6) + rage * 0.15; });
        continue;
      }
      if (e.boss && e.def === BOSSES.colossus && tex['w4-boss']) {
        e.v2 = true;
        const s = spritesFor(e, () => colossusSprites());
        // the entrance (spawnT 1.2 s): it strides in out of the dust, growing
        const k = Math.max(0, e.spawnT) / 1.2;
        const p = game.player, rage = (e.phase || 1) - 1, t = game.time;
        // it turns toward the ship as it walks (its art faces up), and its stride rocks it a little
        const want = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2;
        let d = want - (s.heading ?? want);
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        s.heading = (s.heading ?? want) + d * 0.04;
        s.body.position.set(e.x, e.y);
        s.body.rotation = s.heading + Math.sin(t * 3.2) * 0.035;
        s.body.alpha = (e.alpha ?? 1) * (1 - k * 0.7);
        s.body.scale.set(((e.r * 4.0) / 1024) * (1 - k * 0.4) * (1 + 0.012 * Math.sin(t * 6.4)));
        s.inner.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
        s.halo.alpha = (0.18 + 0.08 * Math.sin(t * 4)) * (1 + rage * 0.5);
        s.core.alpha = 0.5 + 0.3 * Math.sin(t * (4 + rage * 3)) + rage * 0.15;
        s.weak.forEach((g, i) => { g.alpha = 0.45 + 0.35 * Math.sin(t * (4 + rage * 3) + i * 1.6) + rage * 0.15; });
        const firing = e.mode === 'beams' || e.mode === 'spiral' || e.mode === 'burst';
        s.cannons.forEach((g, i) => { g.alpha = (firing ? 0.8 : 0.25) + 0.2 * Math.sin(t * 12 + i * 2); });
        continue;
      }
      if (e.boss) {
        if (e.def !== BOSSES.hive) continue;
        e.v2 = true;
        const s = spritesFor(e, () => bossSprites());
        // the entrance (spawnT 1.2 s): it rises from the depth on the side of the Earth (lower left), growing
        const k = Math.max(0, e.spawnT) / 1.2, rise = k * k;
        s.body.position.set(e.x - rise * 520, e.y + rise * 900);
        s.body.alpha = (e.alpha ?? 1) * (1 - k * 0.6);
        s.inner.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
        s.body.rotation = Math.PI + Math.sin(game.time * 1.3) * 0.05 - rise * 0.5;
        s.body.scale.set(((e.r * 4.6) / 1024) * (1 - rise * 0.65));
        // engines burn harder while it rises; the glows beat faster and brighter once it is enraged
        const rage = e.phase > 1 ? 1 : 0, t = game.time * (rage ? 7 : 4);
        s.flames.forEach((f, i) => f.scale.set(1.1, (1.1 + rise * 1.2) * (1 + 0.15 * Math.sin(game.time * 31 + i * 1.7))));
        s.halo.alpha = (0.22 + 0.1 * Math.sin(game.time * 6)) * (1 + rage * 0.6);
        s.core.alpha = 0.55 + 0.35 * Math.sin(t) + rage * 0.2;
        s.core.scale.set(1 + 0.08 * Math.sin(t) + rage * 0.15);
        s.pods.forEach((p, i) => { p.alpha = 0.5 + 0.4 * Math.sin(t * 0.8 + i * Math.PI) + rage * 0.2; });
        s.nose.alpha = 0.45 + 0.3 * Math.sin(t * 1.3) + rage * 0.3;
        continue;
      }
      const glowCol = ENEMY_ART[e.type];
      if (glowCol === undefined) continue;
      e.v2 = true;
      const s = spritesFor(e, () => enemySprites(e));
      let ex = e.x, ey = e.y;
      if (e.state === 'wind' || e.state === 'fuse') { ex += Math.random() * 4 - 2; ey += Math.random() * 4 - 2; }
      const rot = e.def.spin ? e.rot : e.rot + Math.PI / 2;
      s.body.position.set(ex, ey); s.body.rotation = rot; s.body.scale.set(s.base * sc);
      // world 4's dust stalkers fade into a dust storm
      s.body.alpha = Math.max(0.05, (e.alpha ?? 1) * (e.type === 'stalker' ? 1 - 0.8 * storm : 1));
      s.body.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
      s.glow.position.set(ex, ey); s.glow.rotation = rot; s.glow.scale.set(s.base * sc * (e.elite ? 1.4 : 1));
      s.glow.tint = e.elite ? 0xffd23d : 0xffffff;
      s.glow.alpha = (0.7 + 0.2 * Math.sin(game.time * 4 + (e.id || 0))) * s.body.alpha;
      if (w2) { s.core.position.set(ex, ey); s.core.scale.set((e.r * 1.3 * sc) / 64); s.core.alpha = 0.6 * s.body.alpha; }
      s.shadow.visible = w3 || w4;
      if (w3 || w4) {
        // a hopper in the air casts its shadow farther
        const lift = 0.18 * e.r + (sc - 1) * 3 * e.r;
        s.shadow.position.set(ex + lift, ey + lift * 1.3); s.shadow.rotation = rot; s.shadow.scale.set(s.base * Math.min(sc, 1));
        s.shadow.alpha = 0.6 * s.body.alpha;
      }
    }
    // world 1: the falling wreck (Game.fallingWreck), a deck fragment (W1 P3b) tumbling across the arena
    for (const h of game.hazards) {
      if (h.kind !== 'wreck' || h.t < h.warn || h.t > h.warn + h.dur) continue;
      const s = spritesFor(h, () => {
        const body = new Sprite(tex[`w1-island-${h.art}`] || tex['w1-prop-mast']);
        body.anchor.set(0.5);
        wreckLayer.addChild(body);
        return { body };
      });
      s.body.position.set(h.x, h.y);
      s.body.rotation = h.a + (h.t - h.warn) * h.spin;
      s.body.scale.set((h.w * 2.1) / Math.max(s.body.texture.width, s.body.texture.height));
    }
    // drop the sprites of objects that are gone
    for (const [obj, s] of drawn) {
      if (s.frame === frameNo) continue;
      if (obj.dead && !obj.boss && !obj.prop && ENEMY_ART[obj.type] !== undefined) shatter(obj);
      s.body.destroy({ children: true });
      s.glow?.destroy();
      s.core?.destroy();
      if (s.shadow && !s.shadow.destroyed) s.shadow.destroy();
      drawn.delete(obj);
    }

    updateDebris(game);
    drawCrowd(game);


    // the ship the player flies (game.ship: its id, and skinName for the Gold Striker)
    const p = game.player;
    const alive = game.state !== 'dying' && game.state !== 'over';
    const flying = ships[game.ship.id] || ships.striker;
    if (flying !== ship) { ship.body.visible = false; ship = flying; ship.lastFacing = null; }
    const base = game.ship.skinName ? GOLD : 0xffffff;
    ship.body.visible = alive;
    if (alive) {
      let turn = p.facing - (ship.lastFacing ?? p.facing);
      while (turn > Math.PI) turn -= TAU;
      while (turn < -Math.PI) turn += TAU;
      ship.lastFacing = p.facing;
      ship.bank += (Math.max(-1, Math.min(1, turn * 12)) - ship.bank) * 0.15;
      ship.body.position.set(p.x, p.y);
      ship.body.rotation = p.facing + Math.PI / 2;
      ship.body.alpha = p.inv > 0 && Math.floor(game.time * 20) % 2 === 0 ? 0.35 : 1;
      ship.setTint(game.flash > 0.15 ? 0xff8080 : base);
      ship.animate(game.time, 0.6 + Math.min(1, p.moving / 300) * 0.8, ship.bank);
    }
    px.render();
  }

  // everything that comes in hundreds: drawn from pooled sprites, culled to the view
  function drawCrowd(game) {
    const { vw, vh } = game.viewSize();
    const { cx, cy } = game.frameCam;
    const x0 = cx - vw / 2 - 60, x1 = cx + vw / 2 + 60, y0 = cy - vh / 2 - 60, y1 = cy + vh / 2 + 60;
    const vis = (o) => o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1;
    const glow = (pl, x, y, color, size, alpha) => {
      const s = pl.next();
      if (s.texture !== halo) s.texture = halo;
      s.position.set(x, y); s.rotation = 0; s.tint = color; s.alpha = alpha;
      s.scale.set(size / halo.width);
    };
    for (const pl of [lootHalo, loot, shotHalo, shots, sparks, weaponSprites]) pl.begin();
    const t = game.time;

    // mines
    for (const m of game.mines) if (vis(m)) put(loot.next(), mineSprite(m.pull ? '#b06bff' : '#ffd23d', m.arm <= 0 && Math.sin(t * 12) > 0), m.x, m.y);

    // weapons around the ship (blades, drones, aura), drawn by their own render functions
    weaponG.clear();
    if (game.state !== 'dying' && game.state !== 'over') {
      for (const w of game.weapons) {
        const def = WEAPONS[w.id];
        if (def.render) def.render(w, game, weaponR, weaponStats(w));
      }
    }

    // gems and pickups, with a slow glowing pulse
    for (const g of game.gems) {
      if (!vis(g)) continue;
      const col = g.v >= 10 ? '#ff4dd8' : g.v >= 3 ? '#3dff8a' : '#2fd2ff';
      const sc = g.v >= 10 ? 1.4 : g.v >= 3 ? 1.15 : 1;
      glow(lootHalo, g.x, g.y, col, 34 * sc, 0.28 + 0.1 * Math.sin(t * 5 + g.x * 0.05));
      put(loot.next(), gemSprite(col), g.x, g.y, 0, sc);
    }
    for (const pk of game.pickups) {
      if (!vis(pk)) continue;
      const bob = pk.kind === 'coin' ? 1 : 1 + Math.sin(t * 5) * 0.1;
      put(loot.next(), pickupSprite(pk.kind), pk.x, pk.y, 0, bob);
    }

    // damaging rings (shockwaves of weapons) under the enemies
    ringG.clear();
    for (const r of game.rings) {
      const a = 1 - Math.max(0, r.t - r.dur) / 0.15;
      ringG.circle(r.x, r.y, Math.max(1, r.r)).fill({ color: r.color, alpha: 0.15 * a }).stroke({ width: 5, color: r.color, alpha: 0.85 * a });
    }

    // player shots and enemy bullets, each with a halo in its colour
    for (const pr of game.proj) {
      if (!vis(pr)) continue;
      let spr, size = 26;
      switch (pr.look) {
        case 'bolt': spr = boltSprite(pr.color, 12, 3); break;
        case 'photon': spr = boltSprite(pr.color, 22, 4); size = 40; break;
        case 'pellet': spr = orbSprite(pr.color, 4); size = 20; break;
        case 'missile': spr = missileSprite(pr.color); size = 34; break;
        default: spr = boltSprite(pr.color, 8, 2.5); size = 20;
      }
      glow(shotHalo, pr.x, pr.y, pr.color, size, 0.35);
      put(shots.next(), spr, pr.x, pr.y, pr.a);
    }
    const ebs = orbSprite('#ff2d55', 6), ehs = orbSprite('#ff4dd8', 7);
    for (const b of game.ebullets) {
      if (!vis(b)) continue;
      glow(shotHalo, b.x, b.y, b.homing ? '#ff4dd8' : '#ff2d55', 34, 0.4);
      put(shots.next(), b.homing ? ehs : ebs, b.x, b.y);
    }

    // particles, blast rings and lightning above everything
    for (const q of game.particles) {
      if (!vis(q)) continue;
      const l = q.life / q.max;
      put(sparks.next(), glowDot(q.color, 8), q.x, q.y, 0, (q.size / 8) * (0.4 + 0.6 * l)).alpha = l;
    }
    fxG.clear();
    for (const f of game.fx) {
      const k = f.t / f.dur;
      fxG.circle(f.x, f.y, f.max * (0.2 + 0.8 * Math.sqrt(k))).stroke({ width: f.width * (1 - k) + 1, color: f.color, alpha: (1 - k) * 0.9 });
    }
    for (const b of game.bolts) {
      const a = b.t / 0.2;
      for (const [w, col, al] of [[7, b.color, 0.35], [2, '#ffffff', 1]]) {
        fxG.moveTo(b.pts[0], b.pts[1]);
        for (let i = 2; i < b.pts.length; i += 2) fxG.lineTo(b.pts[i], b.pts[i + 1]);
        fxG.stroke({ width: w, color: col, alpha: al * a, join: 'round', cap: 'round' });
      }
    }
    for (const pl of [lootHalo, loot, shotHalo, shots, sparks, weaponSprites]) pl.end();
  }

  return {
    render,
    renderTitle,
    show(on) { canvas.style.display = on ? 'block' : 'none'; },
  };
}

// The Striker from its parts (positions from art/2.0/ship/parts/assembly.json), as in proto2/ and the teaser:
// engine flames that grow with speed and banking wings.
function makeShip(tex, SHIP, height) {
  const part = (name) => { const s = new Sprite(tex[`ship-${name}`]); s.anchor.set(0.5); return s; };
  const P = SHIP.pos, Z = SHIP.size, k = SHIP.k;
  const at = (key, name) => ({ x: P[key][0] * k + Z[name][0] / 2, y: P[key][1] * k + Z[name][1] / 2 });
  const hullAt = at('hull', 'hull');
  const cx = hullAt.x, cy = 633 * k;
  const engAt = at('engR', 'engine-right');
  const engDX = engAt.x - cx, engY = engAt.y - 40 * k;
  const flames = [part('flame'), part('flame')];
  const wings = [part('wing-left'), part('wing-right')];
  const engines = [part('engine-left'), part('engine-right')];
  const guns = [part('gun'), part('gun')];
  const glass = part('glass'), hull = part('hull');
  const wl = at('wingL', 'wing-left'), wr = at('wingR', 'wing-right');
  wings[0].position.set(wl.x - cx, wl.y - cy);
  wings[1].position.set(wr.x - cx, wr.y - cy);
  engines.forEach((e, i) => { e.scale.set(1.15); e.position.set((i ? 1 : -1) * engDX, engY - cy); });
  const gunX = 398 * k - cx, gunY = 455 * k - cy + (Z.gun[1] * 0.95) / 2;
  guns.forEach((g, i) => { g.scale.set(0.95); g.position.set((i ? -1 : 1) * gunX, gunY); });
  const flameTop = engY - cy + (Z['engine-right'][1] * 1.15) / 2 - 40 * k;
  flames.forEach((f, i) => { f.anchor.set(0.5, 0); f.position.set((i ? 1 : -1) * engDX, flameTop); f.blendMode = 'add'; });
  hull.position.set(0, hullAt.y - cy);
  const gl = at('glass', 'glass');
  glass.position.set(0, gl.y - cy);
  const body = new Container();
  body.addChild(...flames, ...guns, ...wings, ...engines, hull, glass);
  body.scale.set(height / (k * 1201));
  const solid = [...guns, ...wings, ...engines, hull, glass];
  return {
    body, bank: 0, lastFacing: null,
    setTint(t) { for (const s of solid) s.tint = t; },
    animate(time, boost, bank) {
      wings[0].scale.x = 1 - 0.18 * Math.max(0, bank);
      wings[1].scale.x = 1 - 0.18 * Math.max(0, -bank);
      flames.forEach((f, i) => {
        f.scale.set(0.9, boost * (1 + 0.16 * Math.sin(time * 31 + i * 1.7) + 0.08 * Math.sin(time * 53)));
        f.alpha = 0.85 + 0.15 * Math.sin(time * 40 + i);
      });
    },
  };
}

// A pool of sprites in one layer: begin() each frame, next() for every object drawn, end() hides the unused rest.
function pool(layer) {
  const list = [];
  let n = 0;
  return {
    begin() { n = 0; },
    next() {
      let s = list[n];
      if (!s) { s = new Sprite(); s.anchor.set(0.5); layer.addChild(s); list.push(s); }
      s.visible = true;
      n++;
      return s;
    },
    end() { for (let i = n; i < list.length; i++) list[i].visible = false; },
  };
}

// A soft white round glow, tinted per use (halos of shots and gems).
function softDot() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return Texture.from(c);
}

// The drawing interface the weapons' render functions use (R in js/render-canvas.js): rot/img for the 1.x neon
// sprites and a small part of a 2D context (alpha, colours, circles and lines) for auras, drawn into a Graphics.
function weaponAdapter(g, sprite) {
  const ctx = {
    globalAlpha: 1, fillStyle: '#ffffff', strokeStyle: '#ffffff', lineWidth: 1, path: [],
    beginPath() { this.path = []; },
    arc(x, y, r) { this.path.push({ circle: [x, y, r] }); },
    moveTo(x, y) { this.path.push({ line: [x, y] }); },
    lineTo(x, y) { const last = this.path.at(-1); if (last?.line) last.line.push(x, y); else this.path.push({ line: [x, y] }); },
    trace() {
      for (const p of this.path) {
        if (p.circle) g.circle(...p.circle);
        else { g.moveTo(p.line[0], p.line[1]); for (let i = 2; i < p.line.length; i += 2) g.lineTo(p.line[i], p.line[i + 1]); }
      }
    },
    fill() { this.trace(); g.fill({ color: this.fillStyle, alpha: this.globalAlpha }); },
    stroke() { this.trace(); g.stroke({ width: this.lineWidth, color: this.strokeStyle, alpha: this.globalAlpha }); },
  };
  return {
    ctx,
    rot(spr, x, y, a, sc = 1) { sprite(spr, x, y, a, sc, ctx.globalAlpha); },
    img(spr, x, y, sc = 1) { sprite(spr, x, y, 0, sc, ctx.globalAlpha); },
  };
}

// Phantom and Titan (proto2/make-ships.py): the assembled drawing as one body, the flames on its nozzles animated.
// Banking squeezes the body a little, so turns read as a roll. Same interface as makeShip.
function makeBodyShip(tex, name, def, length) {
  const body = new Container();
  const hull = new Sprite(tex[`ship-${name}-body`]);
  const mid = def.length / 2; // the ship turns around the middle between nose and nozzles
  hull.anchor.set(0.5, mid / def.size[1]);
  const flames = def.nozzles.map(([x, y]) => {
    const f = new Sprite(tex[`ship-${name}-flame`]);
    f.anchor.set(0.5, 0.12); f.blendMode = 'add';
    f.position.set(x - def.size[0] / 2, y - mid);
    return f;
  });
  body.addChild(...flames, hull);
  const k = length / def.length;
  body.scale.set(k);
  return {
    body, bank: 0, lastFacing: null,
    setTint(t) { hull.tint = t; },
    animate(time, boost, bank) {
      hull.scale.x = 1 - 0.12 * Math.abs(bank);
      flames.forEach((f, i) => {
        f.x = (def.nozzles[i][0] - def.size[0] / 2) * hull.scale.x;
        f.scale.set(1, boost * (1 + 0.16 * Math.sin(time * 31 + i * 1.7) + 0.08 * Math.sin(time * 53 + i)));
        f.alpha = 0.85 + 0.15 * Math.sin(time * 40 + i);
      });
    },
  };
}
