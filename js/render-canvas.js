// Drawing a run with Canvas 2D, the 1.x look: reads the state of a Game (js/game.js) and draws it; the game logic
// never draws. The 2.0 look (PixiJS) lives in js/v2/ and reads the same state.
import { TAU, rand, clamp } from './util.js';
import { TRAITS } from './data.js';
import { WEAPONS, weaponStats } from './weapons.js';
import {
  shipSprite, enemySprite, bossLayer, boltSprite, missileSprite, orbSprite, gemSprite,
  glowDot, mineSprite, pickupSprite,
} from './sprites.js';

// The camera of this frame, with screen shake. When the 2.0 look is on, it is worked out once per frame
// (game.frameCam) so both layers shake together.
export function frameCamera(game) {
  const shx = game.shake ? rand(-game.shake, game.shake) * 0.5 : 0;
  const shy = game.shake ? rand(-game.shake, game.shake) * 0.5 : 0;
  return { cx: game.cam.x + shx, cy: game.cam.y + shy };
}

// overlay: the 2.0 look (js/v2/) has drawn the background, the floor, the ship, every enemy or boss it has art for
// (marked e.v2), shots, enemy bullets, gems, pickups, mines, weapons, particles, rings and lightning on its own canvas below; this
// canvas is cleared and draws everything else on top.
export function renderGame(game, ctx, overlay = false) {
  const app = game.app;
  const { W, H, dpr, zoom } = app;
  const { cx, cy } = game.frameCam || frameCamera(game);
  if (overlay) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
  else app.bg.draw(ctx, cx * zoom, cy * zoom, app.time);

  const k = dpr * zoom, ox = dpr * W / 2 - cx * k, oy = dpr * H / 2 - cy * k;
  const base = () => ctx.setTransform(k, 0, 0, k, ox, oy);
  const R = {
    ctx,
    rot(spr, x, y, a, sc = 1) {
      const c = Math.cos(a) * k * sc, s = Math.sin(a) * k * sc;
      ctx.setTransform(c, s, -s, c, x * k + ox, y * k + oy);
      ctx.drawImage(spr.canvas, -spr.half, -spr.half, spr.half * 2, spr.half * 2);
      ctx.setTransform(k, 0, 0, k, ox, oy);
    },
    img(spr, x, y, sc = 1) {
      const h = spr.half * sc;
      ctx.drawImage(spr.canvas, x - h, y - h, h * 2, h * 2);
    },
  };
  base();
  const { vw, vh } = game.viewSize();
  const x0 = cx - vw / 2 - 60, x1 = cx + vw / 2 + 60, y0 = cy - vh / 2 - 60, y1 = cy + vh / 2 + 60;
  const vis = (o, m = 0) => o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m;

  if (!overlay) drawArena(game, ctx, x0, x1, y0, y1);
  // 2.0 world-1 props (js/props.js) as plain shapes; the 2.0 look draws them with their art
  if (!overlay) for (const o of game.props) {
    if (!vis(o, 40)) continue;
    ctx.globalAlpha = o.dead ? 0.35 : 1;
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#3a4152';
    ctx.strokeStyle = o.prop === 'tank' ? '#ffb02e' : '#8a94aa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(o.x - o.r * 1.4, o.y - o.r * 0.8, o.r * 2.8, o.r * 1.6); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.globalCompositeOperation = 'lighter';
  // mines
  if (!overlay) for (const m of game.mines) if (vis(m)) R.img(mineSprite(m.pull ? '#b06bff' : '#ffd23d', m.arm <= 0 && Math.sin(game.time * 12) > 0), m.x, m.y);
  // gems & pickups
  if (!overlay) for (const g of game.gems) {
    if (!vis(g)) continue;
    const col = g.v >= 10 ? '#ff4dd8' : g.v >= 3 ? '#3dff8a' : '#2fd2ff';
    R.img(gemSprite(col), g.x, g.y, g.v >= 10 ? 1.4 : g.v >= 3 ? 1.15 : 1);
  }
  if (!overlay) for (const pk of game.pickups) {
    if (!vis(pk)) continue;
    const bob = pk.kind === 'coin' ? 1 : 1 + Math.sin(game.time * 5) * 0.1;
    R.img(pickupSprite(pk.kind), pk.x, pk.y, bob);
  }
  // damaging rings
  if (!overlay) for (const r of game.rings) {
    const a = 1 - Math.max(0, r.t - r.dur) / 0.15;
    ctx.globalAlpha = 0.85 * a;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(r.x, r.y, Math.max(1, r.r), 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.15 * a;
    ctx.fillStyle = r.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawHazards(game, ctx, overlay);
  ctx.globalCompositeOperation = 'source-over';

  // enemies
  for (const e of game.enemies) {
    if (e.dead || !vis(e, e.r)) continue;
    const sc = e.spawnT > 0 ? Math.max(0.05, 1 - e.spawnT / 0.35) : 1;
    if (e.boss) { if (!(overlay && e.v2)) drawBoss(game, R, e, sc); continue; }
    if (e.seg) {
      R.rot(enemySprite('prism', e.color, Math.round(e.r), e.flash > 0 ? 'flash' : ''), e.x, e.y, e.rot + Math.PI, sc);
      continue;
    }
    const variant = e.flash > 0 ? 'flash' : e.elite ? 'elite' : '';
    let ex = e.x, ey = e.y;
    if (e.state === 'wind' || e.state === 'fuse') { ex += rand(-2, 2); ey += rand(-2, 2); }
    if (e.alpha < 1) ctx.globalAlpha = Math.max(0.05, e.alpha);
    if (!(overlay && e.v2)) R.rot(enemySprite(e.shape, e.color, Math.round(e.r), variant), ex, ey, e.rot, sc);
    ctx.globalAlpha = 1;
    if (e.elite) drawBar(game, ctx, e.x, e.y + e.r + 10, 34, e.hp / e.maxHp, '#ffd23d');
    if (e.traits) drawTraits(game, ctx, e);
    else if (e.shield > 0) { ctx.strokeStyle = TRAITS.shielded.color; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  }

  // player bullets / enemy bullets
  ctx.globalCompositeOperation = 'lighter';
  if (!overlay) for (const pr of game.proj) {
    if (!vis(pr)) continue;
    let spr;
    switch (pr.look) {
      case 'bolt': spr = boltSprite(pr.color, 12, 3); break;
      case 'photon': spr = boltSprite(pr.color, 22, 4); break;
      case 'pellet': spr = orbSprite(pr.color, 4); break;
      case 'missile': spr = missileSprite(pr.color); break;
      default: spr = boltSprite(pr.color, 8, 2.5);
    }
    R.rot(spr, pr.x, pr.y, pr.a, 1);
  }
  const ebs = orbSprite('#ff2d55', 6), ehs = orbSprite('#ff4dd8', 7);
  if (!overlay) for (const b of game.ebullets) if (vis(b)) R.img(b.homing ? ehs : ebs, b.x, b.y);

  // weapon visuals (blades, drones)
  if (!overlay) for (const w of game.weapons) {
    const def = WEAPONS[w.id];
    if (def.render && game.state !== 'dying' && game.state !== 'over') def.render(w, game, R, weaponStats(w));
  }
  ctx.globalCompositeOperation = 'source-over';

  // player
  const p = game.player;
  if (game.state !== 'dying' && game.state !== 'over') {
    const blink = p.inv > 0 && Math.floor(game.time * 20) % 2 === 0;
    if (!overlay) {
      ctx.globalAlpha = blink ? 0.35 : 1;
      ctx.globalCompositeOperation = 'lighter';
      const fl = glowDot(game.ship.color, 14);
      R.img(fl, p.x - Math.cos(p.facing) * 14, p.y - Math.sin(p.facing) * 14, 0.7 + Math.random() * 0.4 + Math.min(1, p.moving / 300) * 0.5);
      ctx.globalCompositeOperation = 'source-over';
      R.rot(shipSprite(game.ship.shape, game.ship.color, game.flash > 0.15), p.x, p.y, p.facing, 1);
      ctx.globalAlpha = 1;
    }
    drawBar(game, ctx, p.x, p.y + 26, 40, p.hp / p.maxHp, p.hp / p.maxHp > 0.35 ? '#3dff8a' : '#ff3d6e');
  }

  game.tut.renderWorld(ctx);

  // particles, explosions, lightning
  ctx.globalCompositeOperation = 'lighter';
  if (!overlay) for (const q of game.particles) {
    if (!vis(q)) continue;
    ctx.globalAlpha = q.life / q.max;
    R.img(glowDot(q.color, 8), q.x, q.y, (q.size / 8) * (0.4 + 0.6 * (q.life / q.max)));
  }
  if (!overlay) for (const f of game.fx) {
    const t = f.t / f.dur;
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.strokeStyle = f.color;
    ctx.lineWidth = f.width * (1 - t) + 1;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.max * (0.2 + 0.8 * Math.sqrt(t)), 0, TAU); ctx.stroke();
  }
  if (!overlay) for (const b of game.bolts) {
    const a = b.t / 0.2;
    for (const [lw, col, al] of [[7, b.color, 0.35], [2, '#ffffff', 1]]) {
      ctx.globalAlpha = al * a;
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(b.pts[0], b.pts[1]);
      for (let i = 2; i < b.pts.length; i += 2) ctx.lineTo(b.pts[i], b.pts[i + 1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // damage numbers
  if (game.texts.length) {
    ctx.font = '700 13px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    for (const t of game.texts) {
      ctx.globalAlpha = Math.min(1, t.t * 3);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  // screen-space overlays
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (game.boss && !vis(game.boss, -40)) drawOffscreenArrow(game, ctx, game.boss, cx, cy);
  // elites off screen get an arrow in the colour of their (first) trait, so the player can hunt them down
  for (const e of game.enemies) {
    if (!e.elite || e.dead || e.boss || vis(e, -20)) continue;
    drawOffscreenArrow(game, ctx, e, cx, cy, e.traits ? TRAITS[[...e.traits][0]].color : '#ffd23d', 0.75);
  }
  const low = p.hp / p.maxHp;
  if (low < 0.35 || game.flash > 0) {
    const a = Math.max(game.flash * 1.5, low < 0.35 ? (0.35 - low) * 1.4 * (0.7 + 0.3 * Math.sin(game.time * 6)) : 0);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(255,30,80,0)');
    g.addColorStop(1, `rgba(255,30,80,${Math.min(0.6, a)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawArena(game, ctx, x0, x1, y0, y1) {
  const hw = game.arena.w / 2, hh = game.arena.h / 2;
  const grid = game.stage.world.theme.grid;
  const gs = 64;
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.09;
  ctx.beginPath();
  const ax0 = Math.max(-hw, x0), ax1 = Math.min(hw, x1), ay0 = Math.max(-hh, y0), ay1 = Math.min(hh, y1);
  for (let x = Math.ceil(ax0 / gs) * gs; x <= ax1; x += gs) { ctx.moveTo(x, ay0); ctx.lineTo(x, ay1); }
  for (let y = Math.ceil(ay0 / gs) * gs; y <= ay1; y += gs) { ctx.moveTo(ax0, y); ctx.lineTo(ax1, y); }
  ctx.stroke();
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 12;
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = grid;
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.globalAlpha = 1;
}

function drawBoss(game, R, b, sc) {
  const fl = b.flash > 0;
  const def = b.def;
  const ctx = R.ctx;
  const pulse = 1 + Math.sin(game.time * 4) * 0.04;
  if (b.alpha < 1) ctx.globalAlpha = Math.max(0.05, b.alpha);
  const inner = b.phase >= 2 ? (b.phase >= 3 ? '#ffffff' : '#ffd23d') : def.inner;
  R.rot(bossLayer('outer', b.color, b.r, fl, def.sides), b.x, b.y, def.move === 'serpent' ? b.heading : b.rot, sc * pulse);
  R.rot(bossLayer('inner', inner, b.r, fl, def.sides), b.x, b.y, b.rot2, sc);
  R.rot(bossLayer('core', b.color, b.r, fl, def.sides), b.x, b.y, 0, sc * (1 + Math.sin(game.time * 8) * 0.08));
  ctx.globalAlpha = 1;
  if (b.mode === 'charge' && b.modeT > 0.45) {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ff2d55';
    ctx.lineWidth = b.r * 1.4;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + Math.cos(b.dir) * 500, b.y + Math.sin(b.dir) * 500);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawHazards(game, ctx, overlay) {
  const t = game.time;
  for (const h of game.hazards) {
    if (h.kind === 'wreck') {
      drawWreck(h, ctx, t, overlay);
      ctx.globalCompositeOperation = 'lighter';
    } else if (h.kind === 'beam') {
      const [x0, y0, x1, y1] = game.beamEnds(h);
      const col = h.centered ? '#ffb52e' : '#ff2d55';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      if (h.t < h.warn) {
        // telegraph: thin pulsing guide that thickens as the shot nears
        const k = h.t / h.warn;
        ctx.globalAlpha = 0.25 + 0.35 * k + 0.2 * Math.sin(t * 30);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2 + h.w * 0.35 * k;
        ctx.stroke();
      } else {
        const k = 1 - Math.max(0, h.t - h.warn - h.dur + 0.15) / 0.15;
        ctx.globalAlpha = 0.45 * k;
        ctx.strokeStyle = col;
        ctx.lineWidth = h.w * 1.6;
        ctx.stroke();
        ctx.globalAlpha = 0.95 * k;
        ctx.lineWidth = h.w * 0.6;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = h.w * 0.22;
        ctx.stroke();
      }
    } else if (h.kind === 'mortar') {
      const k = Math.min(1, h.t / h.warn);
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 25);
      ctx.strokeStyle = h.color || '#ff8a2a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = h.color || '#ff5a1a';
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, TAU); ctx.fill();
    } else if (h.kind === 'well') {
      const k = Math.min(1, h.t / h.warn) * Math.min(1, (h.dur - h.t) / 0.4);
      ctx.globalAlpha = 0.35 * k;
      ctx.strokeStyle = '#9d4dff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rr = h.pullR * (((t * 0.6 + i / 3) % 1));
        ctx.beginPath(); ctx.arc(h.x, h.y, h.pullR - rr, 0, TAU); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.9 * k;
      const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 2.4);
      g.addColorStop(0, '#000000');
      g.addColorStop(0.45, '#05000c');
      g.addColorStop(0.6, '#b04dff');
      g.addColorStop(1, 'rgba(157,77,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 2.4, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.8 * k;
      ctx.strokeStyle = '#ff2d95';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + (i / 3) * TAU;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 1.4, a, a + 1.2); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

// The falling wreck of world 1 (Game.fallingWreck): while it warns, an amber corridor along its path with chevrons
// running its way and a shadow growing where it will pass the ship; then the wreck itself (the 2.0 look draws it as
// a sprite, js/v2/renderer.js, so the overlay skips it).
function drawWreck(h, ctx, t, overlay) {
  const k = Math.min(1, h.t / h.warn), c = Math.cos(h.a), s = Math.sin(h.a);
  const len = Math.hypot(h.x1 - h.x0, h.y1 - h.y0), mx = (h.x0 + h.x1) / 2, my = (h.y0 + h.y1) / 2;
  ctx.save();
  ctx.translate(mx, my); ctx.rotate(h.a);
  const fade = h.t < h.warn ? 1 : Math.max(0, 1 - (h.t - h.warn) / h.dur);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = (0.1 + 0.06 * Math.sin(t * 14)) * fade;
  ctx.fillStyle = '#ffb02e';
  ctx.fillRect(-len / 2, -h.w / 2, len, h.w);
  ctx.globalAlpha = 0.75 * fade;
  ctx.strokeStyle = '#ffb02e';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 12]); ctx.lineDashOffset = -t * 120;
  ctx.beginPath(); ctx.moveTo(-len / 2, -h.w / 2); ctx.lineTo(len / 2, -h.w / 2); ctx.moveTo(-len / 2, h.w / 2); ctx.lineTo(len / 2, h.w / 2); ctx.stroke();
  ctx.setLineDash([]);
  if (h.t < h.warn) {
    // chevrons running the wreck's way
    ctx.globalAlpha = 0.55 + 0.3 * k;
    ctx.lineWidth = 3;
    const step = 90, off = (t * 260) % step;
    for (let x = -len / 2 + off; x < len / 2; x += step) {
      ctx.beginPath(); ctx.moveTo(x - 12, -16); ctx.lineTo(x + 4, 0); ctx.lineTo(x - 12, 16); ctx.stroke();
    }
  }
  ctx.restore();
  // its shadow: grows at the middle of the path while it warns, then runs with the wreck
  const sx = h.t < h.warn ? mx : h.x, sy = h.t < h.warn ? my : h.y;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.5 * (h.t < h.warn ? k : 1) * fade;
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, h.w);
  g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(sx, sy, h.w * (0.6 + 0.4 * k), h.w * 0.6 * (0.6 + 0.4 * k), h.a, 0, TAU); ctx.fill();
  if (!overlay && h.t >= h.warn) {
    // the 1.x look: a plain dark slab
    ctx.save();
    ctx.translate(h.x, h.y); ctx.rotate(h.a + (h.t - h.warn) * h.spin);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a4152'; ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 2;
    ctx.fillRect(-h.w * 0.8, -h.w * 0.45, h.w * 1.6, h.w * 0.9); ctx.strokeRect(-h.w * 0.8, -h.w * 0.45, h.w * 1.6, h.w * 0.9);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Trait elites: a ring per trait, names over the health bar, the shield, a swift charge line, command links.
function drawTraits(game, ctx, e) {
  const list = [...e.traits];
  const pulse = 0.5 + 0.5 * Math.sin(game.app.time * 5);
  ctx.save();
  ctx.lineWidth = 2;
  list.forEach((id, i) => {
    const c = TRAITS[id].color;
    ctx.strokeStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.55 + pulse * 0.35;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7 + i * 5, 0, TAU); ctx.stroke();
  });
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  if (e.traits.has('bulwark')) { ctx.strokeStyle = TRAITS.bulwark.color; ctx.globalAlpha = 0.18; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 160, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  if (e.enraged) { ctx.fillStyle = TRAITS.berserker.color; ctx.globalAlpha = 0.18 + pulse * 0.12; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (e.sw?.phase === 'wind') {
    ctx.strokeStyle = TRAITS.swift.color; ctx.globalAlpha = 0.7; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.sw.dir) * 380, e.y + Math.sin(e.sw.dir) * 380); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  if (e.traits.has('commander')) {
    ctx.strokeStyle = TRAITS.commander.color; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
    const near = game.tmp3 || [];
    let n = 0;
    for (const o of near) { if (o.buffT > 0 && !o.dead && n++ < 14) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(o.x, o.y); ctx.stroke(); } }
    ctx.globalAlpha = 1;
  }
  if (e.maxShield) drawBar(game, ctx, e.x, e.y + e.r + 16, 34, e.shield / e.maxShield, TRAITS.shielded.color);
  ctx.font = "700 10px 'Orbitron', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = TRAITS[list[0]].color;
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillText(list.map((id) => TRAITS[id].name).join(' · '), e.x, e.y - e.r - 14);
  ctx.restore();
}

function drawBar(game, ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w * clamp(frac, 0, 1), 3);
}

function drawOffscreenArrow(game, ctx, t, cx, cy, color = '#ff2d6f', size = 1) {
  const { W, H } = game.app;
  const a = Math.atan2(t.y - cy, t.x - cx);
  const m = 40;
  const x = clamp(W / 2 + Math.cos(a) * W, m, W - m), y = clamp(H / 2 + Math.sin(a) * H, m + 60, H - m);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(-8, 10); ctx.lineTo(-3, 0); ctx.lineTo(-8, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
