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
import { boltSprite, missileSprite, orbSprite, gemSprite, glowDot, pickupSprite, mineSprite } from '../sprites.js';
import { WEAPONS, weaponStats } from '../weapons.js';
import ASSETS from './assets.gen.js';
import { makeTitle } from './title.js';
import { makeOrbitalRuins } from './orbit.js';

const TAU = Math.PI * 2;
// enemy types with 2.0 art, and the colour of their glow
const ENEMY_ART = { drone: 0xff2d95, swarmer: 0xffe23d, dasher: 0xff3d9a, shooter: 0xff2d95, tank: 0xb04dff, splitter: 0x9dff3d };
const ENEMY_SIZE = 2.8; // sprite size in enemy radii
const PROP_SIZE = { tank: 3.4, crate: 3 }; // length of a world-1 prop in its radii
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

  const halo = softDot();
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
  const propLayer = new Container();
  const enemyLayer = new Container(), bossLayer = new Container(), shipLayer = new Container();
  const shotLayer = add(new Container()), fxLayer = add(new Container()), fxG = add(new Graphics());
  const weaponLayer = add(new Container()), weaponG = new Graphics();
  weaponLayer.addChild(weaponG);
  // world 1 "Orbital Ruins" (js/v2/orbit.js): far layer under the arena, wreckage on it; other worlds use the floor
  const orbit = makeOrbitalRuins(tex);
  px.stage.addChildAt(orbit.far, 0);
  world.addChild(floor, border, orbit.arena, propLayer, lootLayer, ringG, glowLayer, enemyLayer, bossLayer, shotLayer, weaponLayer, shipLayer, fxLayer, fxG);
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
  px.stage.addChild(orbit.near, title.scene);

  let arenaKey = '';
  const drawn = new Map(); // game object -> its sprites
  let frameNo = 0;

  function spritesFor(e, make) {
    let s = drawn.get(e);
    if (!s) { s = make(); drawn.set(e, s); }
    s.frame = frameNo;
    return s;
  }

  function enemySprites(e) {
    const art = e.elite && e.type === 'drone' ? 'enemy-drone-elite' : `enemy-${e.type}`;
    const body = new Sprite(tex[art]);
    body.anchor.set(0.5);
    const glow = new Sprite(tex[`glow-${e.type}`]);
    glow.anchor.set(0.5);
    enemyLayer.addChild(body); glowLayer.addChild(glow);
    return { body, glow, base: (e.r * ENEMY_SIZE) / Math.max(body.texture.width, body.texture.height) };
  }

  // world 1: a fuel tank or an ammo crate (js/props.js) on a dark shadow, so it stands out from the deck metal, and a
  // soft amber glow: the tank's weak point, a faint halo round the crate
  function propSprites(o) {
    const body = new Container();
    const shadow = new Sprite(halo), spr = new Sprite(tex[`w1-prop-${o.prop}`]);
    shadow.anchor.set(0.5); spr.anchor.set(0.5);
    shadow.tint = 0x000000; shadow.alpha = 0.8;
    shadow.scale.set((spr.texture.width * 1.5) / 64, (spr.texture.height * 1.7) / 64);
    body.addChild(shadow, spr);
    propLayer.addChild(body);
    const glow = new Sprite(halo);
    glow.anchor.set(0.5); glow.tint = 0xffb02e;
    glowLayer.addChild(glow);
    return { body, spr, shadow, glow, base: (o.r * PROP_SIZE[o.prop]) / spr.texture.width };
  }

  function bossSprites(b) {
    const c = new Container();
    const halo = new Sprite(tex['glow-tank']);
    halo.anchor.set(0.5); halo.tint = 0xff2dd0; halo.blendMode = 'add';
    const flames = [455, 790].map((x) => {
      const f = new Sprite(tex['h-flame']);
      f.anchor.set(0.5, 0.15); f.blendMode = 'add';
      f.position.set(((x - 627) / 1254) * 640, ((1045 - 627) / 1254) * 640);
      return f;
    });
    const body = new Sprite(tex.harvester);
    body.anchor.set(0.5);
    c.addChild(halo, ...flames, body);
    halo.scale.set(4);
    c.scale.set((b.r * 4.6) / 640);
    bossLayer.addChild(c);
    return { body: c, inner: body, flames, halo };
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
    world.visible = orbit.near.visible = false;
    title.scene.visible = true;
    title.update(time, app.W, app.H, opts);
    px.render();
  }

  function render(game) {
    frameNo++;
    fitScreen();
    world.visible = true;
    title.scene.visible = false;
    const w1 = game.stage.world.id === 1;
    orbit.far.visible = orbit.arena.visible = w1;
    orbit.near.visible = w1 && !!tex['w1-near'];
    floor.visible = border.visible = !w1;
    const { cx, cy } = game.frameCam;
    const z = app.zoom;
    world.scale.set(z);
    world.position.set(app.W / 2 - cx * z, app.H / 2 - cy * z);

    // the arena: world 1 is the orbital wreck field, the others a floor tile with a border in the world's colour
    const { w, h } = game.arena;
    const key = `${w}x${h}:${game.stage.world.theme.grid}:${game.stage.id}`;
    if (key !== arenaKey) {
      arenaKey = key;
      if (w1) orbit.setArena(w, h, [...String(game.stage.id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
      floor.width = w; floor.height = h; floor.position.set(-w / 2, -h / 2);
      const col = Number.parseInt(game.stage.world.theme.grid.slice(1), 16);
      border.clear().rect(-w / 2, -h / 2, w, h).stroke({ width: 12, color: col, alpha: 0.2 }).rect(-w / 2, -h / 2, w, h).stroke({ width: 2.5, color: col, alpha: 0.9 });
    }

    if (w1) orbit.update(game.time, cx, cy, z, app.W, app.H);

    // world 1: fuel tanks and ammo crates, whole or broken (js/props.js)
    if (tex['w1-prop-tank']) for (const o of game.props) {
      const s = spritesFor(o, () => propSprites(o));
      const t = tex[`w1-prop-${o.prop}${o.dead ? '-broken' : ''}`];
      if (s.spr.texture !== t) s.spr.texture = t;
      s.body.position.set(o.x, o.y); s.body.rotation = o.rot; s.body.scale.set(s.base);
      s.spr.tint = o.flash > 0 ? 0xffb0ff : 0xffffff;
      s.shadow.alpha = o.dead ? 0.4 : 0.8;
      s.glow.visible = !o.dead;
      const pulse = Math.sin(game.time * 5 + o.id);
      if (o.prop === 'tank') {
        // the weak point sits right of the tank's middle
        const off = o.r * PROP_SIZE.tank * 0.14;
        s.glow.position.set(o.x + Math.cos(o.rot) * off, o.y + Math.sin(o.rot) * off);
        s.glow.scale.set(1.3);
        s.glow.alpha = 0.7 + 0.3 * pulse;
      } else {
        s.glow.position.set(o.x, o.y);
        s.glow.scale.set((o.r * 4) / 64);
        s.glow.alpha = 0.24 + 0.1 * pulse;
      }
    }

    // enemies and bosses with 2.0 art
    for (const e of game.enemies) {
      if (e.dead || e.seg) continue;
      const sc = e.spawnT > 0 ? Math.max(0.05, 1 - e.spawnT / (e.boss ? 1.2 : 0.35)) : 1;
      if (e.boss) {
        if (e.def !== BOSSES.hive) continue;
        e.v2 = true;
        const s = spritesFor(e, () => bossSprites(e));
        s.body.position.set(e.x, e.y);
        s.body.alpha = e.alpha ?? 1;
        s.inner.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
        s.body.rotation = Math.PI + Math.sin(game.time * 1.3) * 0.05;
        s.flames.forEach((f, i) => f.scale.set(1.1, 1.1 * (1 + 0.15 * Math.sin(game.time * 31 + i * 1.7))));
        s.halo.alpha = 0.25 + 0.1 * Math.sin(game.time * 6);
        s.body.scale.set(((e.r * 4.6) / 640) * sc);
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
      s.body.alpha = Math.max(0.05, e.alpha ?? 1);
      s.body.tint = e.flash > 0 ? 0xffb0ff : 0xffffff;
      s.glow.position.set(ex, ey); s.glow.rotation = rot; s.glow.scale.set(s.base * sc * (e.elite ? 1.4 : 1));
      s.glow.tint = e.elite ? 0xffd23d : 0xffffff;
      s.glow.alpha = (0.7 + 0.2 * Math.sin(game.time * 4 + (e.id || 0))) * s.body.alpha;
    }
    // drop the sprites of objects that are gone
    for (const [obj, s] of drawn) {
      if (s.frame === frameNo) continue;
      s.body.destroy({ children: true });
      s.glow?.destroy();
      drawn.delete(obj);
    }

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
