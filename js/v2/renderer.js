// The 2.0 look on PixiJS (WebGL), stage 1 of the 2.0 plan. It reads the same game state as js/render-canvas.js and
// draws, on its own canvas under the game's: the background, the world-1 floor, the Striker built from its parts and
// every enemy or boss that already has 2.0 art. What it draws is marked (e.v2), so the 1.x renderer, drawing on its
// transparent canvas on top, skips it and adds the rest (shots, effects, bars, numbers). Loaded only by the TEST
// variant (js/testkit.js), so normal and App Store builds contain no PixiJS. Textures: scripts/v2-assets.mjs.
import { Application, Container, Sprite, Texture, TilingSprite, Graphics } from 'pixi.js';
import { BOSSES } from '../data.js';
import ASSETS from './assets.gen.js';

const TAU = Math.PI * 2;
// enemy types with 2.0 art, and the colour of their glow
const ENEMY_ART = { drone: 0xff2d95, swarmer: 0xffe23d, dasher: 0xff3d9a, shooter: 0xff2d95, tank: 0xb04dff, splitter: 0x9dff3d };
const ENEMY_SIZE = 2.8; // sprite size in enemy radii
const SHIP_H = 46; // the Striker's length in world units
const FLOOR_SCALE = 0.5;

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
  const tex = {};
  await Promise.all(Object.entries(ASSETS.images).map(async ([name, url]) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    tex[name] = Texture.from(img);
  }));

  const world = new Container();
  px.stage.addChild(world);
  const floor = new TilingSprite({ texture: tex.floor, width: 10, height: 10 });
  floor.tileScale.set(FLOOR_SCALE);
  const border = new Graphics();
  const glowLayer = new Container(); glowLayer.blendMode = 'add';
  const enemyLayer = new Container(), bossLayer = new Container(), shipLayer = new Container();
  world.addChild(floor, border, glowLayer, enemyLayer, bossLayer, shipLayer);
  const ship = makeShip(tex, ASSETS.ship, SHIP_H);
  shipLayer.addChild(ship.body);

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

  function render(game) {
    frameNo++;
    if (px.renderer.width !== Math.round(app.W * app.dpr) || px.renderer.height !== Math.round(app.H * app.dpr)) {
      px.renderer.resolution = app.dpr;
      px.renderer.resize(app.W, app.H);
    }
    const { cx, cy } = game.frameCam;
    const z = app.zoom;
    world.scale.set(z);
    world.position.set(app.W / 2 - cx * z, app.H / 2 - cy * z);

    // the arena: the floor tile and a glowing border in the world's colour
    const { w, h } = game.arena;
    const key = `${w}x${h}:${game.stage.world.theme.grid}`;
    if (key !== arenaKey) {
      arenaKey = key;
      floor.width = w; floor.height = h; floor.position.set(-w / 2, -h / 2);
      const col = Number.parseInt(game.stage.world.theme.grid.slice(1), 16);
      border.clear().rect(-w / 2, -h / 2, w, h).stroke({ width: 12, color: col, alpha: 0.2 }).rect(-w / 2, -h / 2, w, h).stroke({ width: 2.5, color: col, alpha: 0.9 });
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

    // the ship
    const p = game.player;
    const alive = game.state !== 'dying' && game.state !== 'over';
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
      ship.setTint(game.flash > 0.15 ? 0xff8080 : 0xffffff);
      ship.animate(game.time, 0.6 + Math.min(1, p.moving / 300) * 0.8, ship.bank);
    }
    px.render();
  }

  return {
    render,
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
