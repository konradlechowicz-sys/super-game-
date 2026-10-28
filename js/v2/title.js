// The 2.0 title screen, in the spirit of the teaser (teaser/main.js, shot 1): Earth at night under the Void
// Collective's web, data pulses running down its strands, satellites in orbit that keep being "rewritten" (they
// flicker into the Collective's version and back), and the Striker built from its parts hovering in front.
// The menu's buttons and logo stay HTML on top (js/ui.js). On the other menu screens (map, hangar, ...) the same
// scene is shown dimmed, without the ship. The chosen ship (Striker, Phantom, Titan) is shown. Drawn by js/v2/renderer.js.
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';

const ART_W = 1080, ART_H = 1920; // the teaser's art is drawn for this frame
const TAU = Math.PI * 2;
// satellites in art pixels: x, y, scale, rotation; low over the horizon and to the sides, clear of the logo and ship
const SATS = [[215, 790, 0.85, -0.25], [870, 750, 0.8, 0.1], [235, 960, 0.75, 0.22], [860, 990, 0.7, -0.08]];
const CYCLE = 9; // seconds between two rewrites of one satellite

export function makeTitle(tex, halo, ships) {
  const scene = new Container();
  const art = new Container();
  scene.addChild(art);

  // stars in the dark sky above Earth, twinkling
  const stars = new Container();
  stars.blendMode = 'add';
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const starList = Array.from({ length: 90 }, () => {
    const s = new Sprite(halo);
    s.anchor.set(0.5);
    const size = 4 + rnd() * 9;
    s.scale.set(size / halo.width);
    s.position.set(rnd() * ART_W, rnd() * ART_H * 0.55);
    s.tint = rnd() < 0.2 ? 0xb9a8ff : 0xffffff;
    stars.addChild(s);
    return { s, phase: rnd() * TAU, speed: 0.6 + rnd() * 2 };
  });

  const earth = new Sprite(tex.earth);
  const web = new Sprite(tex.web);
  web.alpha = 0.7;
  // a glowing copy of the web, cut into strips so pulses can run down the strands
  const pulse = new Container();
  pulse.blendMode = 'add';
  const strips = [];
  for (let y = 0; y < ART_H; y += 24) {
    const s = new Sprite(new Texture({ source: tex.web.source, frame: new Rectangle(0, y, ART_W, Math.min(24, ART_H - y)) }));
    s.y = y;
    pulse.addChild(s);
    strips.push({ s, y: y + 12 });
  }
  const sats = new Container();
  const satList = SATS.map(([x, y, sc, rot], i) => {
    const c = new Container();
    const n = new Sprite(tex[`sat-${i + 1}`]), w = new Sprite(tex[`sat-${i + 1}-rewritten`]);
    n.anchor.set(0.5); w.anchor.set(0.5); w.alpha = 0;
    c.addChild(n, w); c.scale.set(sc); c.position.set(x, y); c.rotation = rot;
    sats.addChild(c);
    return { c, n, w, x, y, rot, i, was: false };
  });
  const fx = new Graphics();
  fx.blendMode = 'add';
  const sparks = new Container();
  sparks.blendMode = 'add';
  art.addChild(stars, earth, web, pulse, sats, fx, sparks);

  // dark bands at the bottom (menu buttons over the city lights) and the top (the logo over the web)
  const shadeTex = Texture.from(gradient());
  const shade = new Sprite(shadeTex);
  const topShade = new Sprite(shadeTex);
  topShade.scale.y = -1;
  scene.addChild(shade, topShade);

  // the emblem above the logo (the Striker in a neon ring), with a pulsing glow behind it
  const emblemC = new Container();
  const emblemGlow = new Sprite(halo);
  emblemGlow.anchor.set(0.5); emblemGlow.tint = 0x9fd8ff; emblemGlow.blendMode = 'add';
  const emblem = new Sprite(tex.emblem);
  emblem.anchor.set(0.5);
  emblemC.addChild(emblemGlow, emblem);
  scene.addChild(emblemC);

  const shipC = new Container();
  for (const s of Object.values(ships)) { s.body.visible = false; shipC.addChild(s.body); }
  scene.addChild(shipC);

  const bursts = [];
  const rings = [];
  function rewriteBurst(x, y) {
    for (let k = 0; k < 18; k++) {
      const s = new Sprite(halo);
      s.anchor.set(0.5); s.tint = 0xff3df0;
      const a = rnd() * TAU, v = 120 + rnd() * 260;
      s.position.set(x, y);
      sparks.addChild(s);
      bursts.push({ s, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, max: 0.6, size: 10 + rnd() * 16 });
    }
    rings.push({ x, y, t: 0 });
  }

  let lastTime = null;
  return {
    scene,
    // time: seconds; W, H: screen in points; main: the main menu (ship, full brightness); shipId: the chosen ship;
    // gold: the Gold Striker skin
    // emblem: { y, size } of the room above the logo, in points (null: no emblem)
    update(time, W, H, { main, shipId, gold, emblem: em }) {
      const dt = lastTime === null ? 0 : Math.min(0.05, time - lastTime);
      lastTime = time;
      // cover the screen with the portrait art, Earth kept at the bottom; a slow breathing zoom
      const k = Math.max(W / ART_W, H / ART_H) * (1.02 + 0.02 * Math.sin(time * 0.15));
      art.scale.set(k);
      art.position.set((W - ART_W * k) / 2, H - ART_H * k);
      art.alpha = main ? 1 : 0.28;

      for (const st of starList) st.s.alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * st.speed + st.phase));
      // two pulses run down the web, one after another
      const fronts = [((time * 260) % 2400) - 300, ((time * 260 + 1200) % 2400) - 300];
      for (const s of strips) {
        let a = 0;
        for (const f of fronts) a += Math.exp(-(((s.y - f) / 70) ** 2));
        s.s.alpha = 0.05 + 0.45 * Math.min(1, a); // the 2.0 interface is calm: the web only hints at the Collective
      }
      web.alpha = 0.32 + 0.06 * Math.sin(time * 1.3);

      // satellites: drift, then get rewritten for a while (flicker in, hold, flicker out)
      fx.clear();
      for (const s of satList) {
        s.c.x = s.x + Math.sin(time * 0.5 + s.i) * 14;
        s.c.y = s.y + Math.cos(time * 0.4 + s.i * 2) * 6;
        s.c.rotation = s.rot + Math.sin(time * 0.2 + s.i) * 0.08;
        const p = (time + s.i * 2.3) % CYCLE;
        const on = p > 3 && p < 6.5;
        if (on && !s.was) rewriteBurst(s.c.x, s.c.y);
        s.was = on;
        let w = 0;
        if (on) w = p < 3.35 ? (p - 3) / 0.35 * (0.5 + 0.5 * Math.sin(time * 70)) : 1;
        else if (p >= 6.5 && p < 6.8) w = (1 - (p - 6.5) / 0.3) * (0.5 + 0.5 * Math.sin(time * 70));
        s.w.alpha = w; s.n.alpha = 1 - w;
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i];
        g.t += dt;
        const q = g.t / 0.5;
        if (q >= 1) { rings.splice(i, 1); continue; }
        fx.circle(g.x, g.y, 30 + 170 * q).stroke({ width: 4 * (1 - q) + 1, color: 0xff3df0, alpha: 0.6 * (1 - q) });
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life -= dt;
        if (b.life <= 0) { b.s.destroy(); bursts.splice(i, 1); continue; }
        b.s.x += b.vx * dt; b.s.y += b.vy * dt; b.vx *= 0.93; b.vy *= 0.93;
        b.s.alpha = (0.6 * b.life) / b.max;
        b.s.scale.set(b.size / halo.width);
      }

      shade.width = W; shade.height = H * 0.5; shade.y = H * 0.5;
      shade.alpha = main ? 0.85 : 0.6;
      topShade.width = W; topShade.height = H * 0.46; topShade.y = H * 0.46; // flipped (scale.y < 0): spans up to the top
      topShade.alpha = main ? 0.9 : 0.5;

      // the ship hovers in the middle, nose up, engines breathing
      emblemC.visible = !!(main && em && em.size > 0);
      if (emblemC.visible) {
        emblemC.position.set(W / 2, em.y);
        emblem.scale.set(em.size / emblem.texture.height);
        emblemGlow.scale.set((em.size * 1.9) / halo.width);
        emblemGlow.alpha = 0.14 + 0.06 * Math.sin(time * 2.2);
      }

      shipC.visible = !!main;
      if (shipC.visible) {
        const ship = ships[shipId] || ships.striker;
        for (const s of Object.values(ships)) s.body.visible = s === ship;
        shipC.position.set(W / 2, H * 0.47 + Math.sin(time * 1.6) * 8);
        ship.body.rotation = 0;
        ship.setTint(gold ? 0xffd98a : 0xffffff);
        ship.animate(time, 0.9 + 0.25 * Math.sin(time * 2.3), Math.sin(time * 0.7) * 0.25);
      }
    },
  };
}

// transparent at the top, deep navy at the bottom
function gradient() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, 'rgba(5,1,15,0)');
  gr.addColorStop(0.55, 'rgba(5,1,15,0.75)');
  gr.addColorStop(1, 'rgba(5,1,15,0.95)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  return c;
}
