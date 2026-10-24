// TEST build only: the tester's panel (🛠). Normal and App Store builds never contain this file: main.js loads it
// behind the __TEST__ build flag and esbuild drops it, and `build.mjs --release` fails if MARKER is found.
import { ALL_STAGES, BOSSES, TRAITS } from './data.js';
import { COMBOS, COMBO_LEVEL } from './combos.js';

// Everything lives inside installTestKit (no top-level code), so bundlers drop the whole module when it is not called.
export function installTestKit(app) {
  const KEY = 'voidblaster.test';
  const MARKER = 'VB-TESTKIT';
  const BOSS_STAGES = ALL_STAGES.filter((s) => s.boss);
  const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const ui = app.ui;
  let opts = { god: false, unlockAll: true, fps: false, levels: 12 };
  try { opts = { ...opts, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* defaults */ }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(opts)); } catch { /* not saved */ } };
  const apply = () => {
    app.god = opts.god;
    app.testUnlockAll = opts.unlockAll;
    fpsEl.hidden = !opts.fps;
  };

  document.body.classList.add('test-build');
  const fpsEl = document.createElement('div');
  fpsEl.className = 'fps';
  document.body.appendChild(fpsEl);
  let acc = 0, frames = 0;
  app.onFrame = (dt) => {
    if (!opts.fps) return;
    acc += dt; frames++;
    if (acc >= 0.5) { fpsEl.textContent = `${Math.round(frames / acc)} FPS · ${app.game ? app.game.enemies.length + ' enemies' : 'menu'}`; acc = 0; frames = 0; }
  };
  app.timeScale = 1;
  apply();

  const tog = (k, label) => `<button class="toggle ${opts[k] ? 'on' : ''}" data-act="opt" data-k="${k}"><span>${label}</span><i></i></button>`;
  const btn = (act, label, extra = '') => `<button class="btn small" data-act="${act}" ${extra}>${label}</button>`;

  // Start a sector 8 s before its boss, with a number of level-ups to pick first.
  const bossNow = (id) => {
    ui.closeModal();
    app.startStage(id);
    const g = app.game;
    if (!g || g.stage.id !== id) return; // paywall: the full game is off
    const t = Math.max(0, g.stage.bossAt - 8);
    g.stage.events.forEach((e, i) => { if (e.t < t) g.eventsDone.add(i); });
    g.time = t;
    for (let i = 0; i < opts.levels; i++) g.gainXp((g.xpNext - g.xp) / g.player.xpMult);
  };

  function menuPanel() {
    const s = app.save;
    const bosses = BOSS_STAGES.map((st) => `<button class="btn small tk-boss" data-act="boss" data-id="${st.id}" style="--wc:${st.world.color}">
      <b>${titleCase(BOSSES[st.boss].name)}</b><small>${st.id}</small></button>`).join('');
    ui.modal(`
      <div class="modal-kicker tk-kicker" data-kit="${MARKER}">TEST PANEL</div>
      <h2>TESTER</h2>
      ${tog('god', 'God mode (no damage)')}
      ${tog('unlockAll', 'All sectors unlocked')}
      <button class="toggle ${app.store.isFull() ? 'on' : ''}" data-act="tkfull"><span>Full game (simulated)</span><i></i></button>
      ${tog('fps', 'FPS counter')}
      <div class="tk-head">Boss now · start with <b>${opts.levels}</b> level-ups</div>
      <div class="tk-row">${[0, 6, 12, 20].map((n) => `<button class="btn small ${n === opts.levels ? 'primary' : ''}" data-act="lv" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="tk-grid">${bosses}</div>
      <div class="tk-head">Progress</div>
      <div class="tk-row">
        ${btn('coins', '+1,000 COINS')}
        ${btn('stars', '3 STARS EVERYWHERE')}
        ${btn('tips', 'RESET TUTORIAL')}
        ${btn('reset', 'RESET PROGRESS')}
      </div>
      <p class="tiny muted center">Coins: ${s.coins.toLocaleString('en-US')} · Stars: ${Object.values(s.stars).reduce((a, b) => a + b, 0)}/${ALL_STAGES.length * 3}</p>
      <div class="modal-actions"><button class="btn primary" data-act="close">DONE</button></div>
    `, {
      close: () => { ui.closeModal(); ui.menu(); },
      opt: (ds) => { opts[ds.k] = !opts[ds.k]; keep(); apply(); menuPanel(); },
      tkfull: () => { if (app.store.isFull()) app.store.revoke(); else app.store.grant(); menuPanel(); },
      lv: (ds) => { opts.levels = +ds.n; keep(); menuPanel(); },
      boss: (ds) => bossNow(ds.id),
      coins: () => { s.coins += 1000; app.persist(); ui.toast('+1,000 coins'); menuPanel(); },
      stars: () => {
        for (const st of ALL_STAGES) { s.stars[st.id] = 3; s.cleared[st.id] = true; }
        app.persist(); ui.toast('Every sector cleared with 3 stars'); menuPanel();
      },
      tips: () => { s.tips = {}; s.tipsOff = false; app.persist(); ui.toast('Tutorial will show again'); menuPanel(); },
      reset: (ds, el) => {
        if (!el.dataset.confirm) { el.dataset.confirm = '1'; el.textContent = 'TAP AGAIN'; return; }
        app.resetProgress(); ui.toast('Progress reset'); menuPanel();
      },
    }, 'testkit');
  }

  function gamePanel() {
    const g = app.game;
    if (g.state !== 'play') return;
    g.state = 'paused';
    const st = g.stage;
    const resume = () => { ui.closeModal(); if (app.game === g && g.state === 'paused') { g.state = 'play'; app.input.resetDrag(); } };
    const act = (fn) => () => { resume(); fn(); };
    ui.modal(`
      <div class="modal-kicker tk-kicker">TEST PANEL · ${st.id} · ${Math.floor(g.time)} s</div>
      <h2>TESTER</h2>
      ${tog('god', 'God mode (no damage)')}
      ${tog('fps', 'FPS counter')}
      <div class="tk-head">Game speed</div>
      <div class="tk-row">${[1, 2, 4].map((n) => `<button class="btn small ${n === app.timeScale ? 'primary' : ''}" data-act="speed" data-n="${n}">×${n}</button>`).join('')}</div>
      <div class="tk-head">Actions</div>
      <div class="tk-row">
        ${btn('level', 'LEVEL UP')}
        ${btn('heal', 'FULL HULL')}
        ${btn('elite', 'SPAWN ELITE')}
      </div>
      <div class="tk-head">Spawn elite with a trait</div>
      <div class="tk-row">
        ${Object.entries(TRAITS).map(([id, t]) => btn('elite', t.name, `data-trait="${id}" style="color:${t.color}"`)).join('')}
        ${btn('skip', 'SKIP 30 S')}
        ${st.boss && !g.boss && !g.bossDefeated ? btn('summon', 'BOSS NOW') : ''}
        ${btn('win', 'WIN SECTOR')}
        ${btn('win3', 'WIN · 3 STARS')}
      </div>
      <div class="tk-head">Give a combo (both weapons to LV ${COMBO_LEVEL})</div>
      <div class="tk-row">
        ${Object.entries(COMBOS).filter(([, c]) => !c.perk).map(([id, c]) => btn('combo', c.name.toUpperCase(), `data-id="${id}" style="color:${c.color}"`)).join('')}
      </div>
      <div class="tk-head">Give a perk set (both perks to LV ${COMBO_LEVEL})</div>
      <div class="tk-row">
        ${Object.entries(COMBOS).filter(([, c]) => c.perk).map(([id, c]) => btn('combo', c.name.toUpperCase(), `data-id="${id}" style="color:${c.color}"`)).join('')}
      </div>
      <div class="modal-actions"><button class="btn primary" data-act="close">RESUME</button></div>
    `, {
      close: resume,
      opt: (ds) => { opts[ds.k] = !opts[ds.k]; keep(); apply(); ui.closeModal(); g.state = 'play'; gamePanel(); },
      speed: (ds) => { app.timeScale = +ds.n; resume(); },
      level: act(() => g.gainXp((g.xpNext - g.xp) / g.player.xpMult)),
      heal: act(() => { g.player.hp = g.player.maxHp; }),
      elite: (ds) => act(() => {
        const types = st.enemies.filter(([, at]) => at <= g.time).map(([t]) => t);
        const a = Math.random() * Math.PI * 2;
        g.spawnElite(types[types.length - 1] || st.enemies[0][0], g.player.x + Math.cos(a) * 260, g.player.y + Math.sin(a) * 260, ds.trait ? [ds.trait] : []);
      })(),
      skip: act(() => {
        const end = st.boss ? st.bossAt : st.duration;
        g.time = Math.min(g.time + 30, end - 1);
        st.events.forEach((e, i) => { if (e.t < g.time) g.eventsDone.add(i); });
      }),
      summon: act(() => { st.events.forEach((e, i) => g.eventsDone.add(i)); g.time = st.bossAt; }),
      combo: (ds) => act(() => {
        const c = COMBOS[ds.id];
        if (c.perk) {
          for (const id of c.parts) g.passives[id] = Math.max(g.passives[id] || 0, COMBO_LEVEL);
          g.recompute();
          g.checkCombos();
          return;
        }
        for (const id of c.parts) {
          let w = g.weapons.find((x) => x.id === id);
          if (!w) { g.addWeapon(id); w = g.weapons[g.weapons.length - 1]; }
          w.level = Math.max(w.level, COMBO_LEVEL);
        }
        g.checkCombos();
      })(),
      win: act(() => winNow()),
      // as if every goal was met: kill goal reached and every elite of the sector destroyed
      win3: act(() => { g.kills = Math.max(g.kills, st.kills); g.elitesKilled = st.elites; winNow(); }),
    }, 'testkit');
  }

  function winNow() {
    const g = app.game, st = g.stage;
    if (g.boss) g.kill(g.boss);
    else if (!st.boss) g.win();
    else { g.bossDefeated = true; g.win(); }
  }

  ui.globalH.testkit = () => (app.game ? gamePanel() : menuPanel());
}
