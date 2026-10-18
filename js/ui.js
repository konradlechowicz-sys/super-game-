import { WORLDS, SHIPS, SHOP, DAILY, ALL_STAGES, BOSSES, stageIndex } from './data.js';
import { WEAPONS } from './weapons.js';
import { icon } from './icons.js';
import { fmtTime } from './util.js';
import { shipSprite } from './sprites.js';
import { versionLabel, versionFull } from './version.js';

const STAR = '<svg viewBox="0 0 24 24" class="star-svg"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
const COIN = '<span class="coin-ico"></span>';

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class UI {
  constructor(app) {
    this.app = app;
    const root = (this.root = document.getElementById('ui'));
    root.innerHTML = `
      <div class="layer screen-layer"></div>
      <div class="layer hud hidden">
        <div class="hud-top">
          <div class="xpbar"><div class="xpfill"></div><div class="xplvl">LV 1</div></div>
          <div class="hud-row">
            <div class="hud-stat"><span class="hud-kills">0</span><small>KILLS</small></div>
            <div class="hud-timer">0:00</div>
            <div class="hud-stat right"><span class="hud-coins">0</span>${COIN}</div>
            <button class="pause-btn" data-act="pause" aria-label="Pause"><i></i><i></i></button>
          </div>
          <div class="bossbar hidden"><div class="bossname"></div><div class="bosstrack"><div class="bossfill"></div></div></div>
        </div>
      </div>
      <div class="layer banner-layer"></div>
      <div class="layer modal-layer"></div>
      <div class="toast"></div>`;
    this.screenEl = root.querySelector('.screen-layer');
    this.hudEl = root.querySelector('.hud');
    this.modalEl = root.querySelector('.modal-layer');
    this.bannerEl = root.querySelector('.banner-layer');
    this.toastEl = root.querySelector('.toast');
    this.h = {};
    this.mh = {};
    this.hudCache = {};
    this.globalH = { pause: () => app.game?.pause() };
    // Buttons fire on finger lift. iOS drops the synthetic click when the finger moves even slightly during a tap,
    // so a tap that ends on the same button within a small slop counts; bigger moves are scrolls, not taps.
    const activate = (t) => {
      if (!t || t.disabled || t.classList.contains('locked-tap') || !t.isConnected) return;
      app.audio.unlock();
      const fn = this.mh[t.dataset.act] || this.h[t.dataset.act] || this.globalH[t.dataset.act];
      if (fn) {
        if (t.dataset.act !== 'pick') app.audio.sfx('select');
        fn(t.dataset, t);
      }
    };
    let down = null;
    root.addEventListener('pointerdown', (e) => {
      const t = e.target.closest('[data-act]');
      down = t ? { t, x: e.clientX, y: e.clientY, id: e.pointerId } : null;
    });
    root.addEventListener('pointerup', (e) => {
      if (!down || e.pointerId !== down.id) return;
      const { t, x, y } = down;
      down = null;
      if (Math.hypot(e.clientX - x, e.clientY - y) > 24) return;
      if (e.target.closest('[data-act]') !== t && document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-act]') !== t) return;
      this.lastFired = { t, at: performance.now() };
      activate(t);
    });
    root.addEventListener('pointercancel', () => { down = null; });
    // Keyboard / accessibility clicks (and any click not already handled on pointerup).
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (this.lastFired && this.lastFired.t === t && performance.now() - this.lastFired.at < 800) return;
      activate(t);
    });
  }

  get save() { return this.app.save; }

  coinsHtml() {
    return `<div class="coins-pill">${COIN}<span>${this.save.coins.toLocaleString('en-US')}</span></div>`;
  }

  setScreen(html, handlers, cls = '') {
    this.screenEl.innerHTML = `<div class="screen ${cls}">${html}</div>`;
    this.h = handlers;
    this.paintCanvases(this.screenEl);
  }

  clearScreen() { this.screenEl.innerHTML = ''; this.h = {}; }

  modal(html, handlers, cls = '', guardMs = 0) {
    this.modalEl.innerHTML = `<div class="backdrop"></div><div class="modal ${cls}">${html}</div>`;
    this.modalEl.classList.add('open');
    this.mh = handlers;
    this.paintCanvases(this.modalEl);
    if (guardMs) {
      const btns = this.modalEl.querySelectorAll('[data-act]');
      btns.forEach((b) => b.classList.add('locked-tap'));
      setTimeout(() => btns.forEach((b) => b.classList.remove('locked-tap')), guardMs);
    }
  }

  closeModal() {
    this.modalEl.innerHTML = '';
    this.modalEl.classList.remove('open');
    this.mh = {};
  }

  paintCanvases(el) {
    el.querySelectorAll('canvas[data-ship]').forEach((c) => {
      const s = SHIPS[c.dataset.ship];
      const g = c.getContext('2d');
      const spr = shipSprite(s.shape, s.color);
      g.clearRect(0, 0, c.width, c.height);
      g.translate(c.width / 2, c.height / 2);
      g.rotate(-Math.PI / 2);
      const sz = c.width * 0.95;
      g.drawImage(spr.canvas, -sz / 2, -sz / 2, sz, sz);
    });
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('show');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
  }

  // ======================= MENU =======================
  menu() {
    const d = this.app.dailyStatus();
    this.hideHud();
    this.setScreen(`
      <div class="topbar">${this.coinsHtml()}<div class="version-tag">${versionLabel()}</div><button class="icon-btn" data-act="settings" aria-label="Settings">⚙</button></div>
      <div class="logo"><div class="logo-a">VOID</div><div class="logo-b">BLASTER</div></div>
      <div class="menu-spacer"></div>
      <div class="menu-buttons">
        <button class="btn primary big" data-act="play">PLAY</button>
        <div class="btn-row">
          <button class="btn" data-act="hangar">HANGAR</button>
          <button class="btn" data-act="shop">UPGRADES</button>
        </div>
        <button class="btn daily-btn ${d.claimable ? 'glow' : ''}" data-act="daily">DAILY REWARD ${d.claimable ? '<span class="badge">!</span>' : ''}</button>
      </div>
      <div class="foot">${this.save.settings.control === 'drag' ? 'Drag anywhere to fly' : 'Steer with the joystick at the bottom'} · Weapons fire automatically</div>
    `, {
      play: () => this.map(),
      hangar: () => this.hangar(),
      shop: () => this.shop(),
      daily: () => this.daily(),
      settings: () => this.settings(),
    }, 'menu');
  }

  // ======================= MAP =======================
  map(worldId = this.mapWorld || [...WORLDS].reverse().find((w) => this.app.isUnlocked(w.stages[0].id)).id) {
    this.mapWorld = worldId;
    const save = this.save;
    const world = WORLDS.find((w) => w.id === worldId);
    const open = (w) => this.app.isUnlocked(w.stages[0].id);
    const tabs = WORLDS.map((w) => `
      <button class="world-tab ${w.id === worldId ? 'active' : ''} ${open(w) ? '' : 'locked'}" style="--wc:${w.color}" data-act="world" data-id="${w.id}">
        <span class="wnum">${w.id}</span><span class="wname">${esc(w.name)}</span>
      </button>`).join('');
    let body;
    if (!open(world)) {
      const prev = WORLDS.find((w) => w.id === world.id - 1);
      const gate = titleCase(BOSSES[prev.stages[prev.stages.length - 1].boss].name);
      body = `<div class="soon"><img src="${icon('lock', world.color)}" alt=""><h3>${esc(world.name)}</h3><p>Defeat the ${esc(gate)} in ${esc(prev.name)} to open this sector.</p></div>`;
    } else {
      const totalStars = world.stages.reduce((a, s) => a + (save.stars[s.id] || 0), 0);
      body = `<div class="world-head"><h2 style="--wc:${world.color}">${esc(world.name)}</h2><div class="star-count">${STAR}<b>${totalStars}</b>/${world.stages.length * 3}</div></div>
      <div class="path">` + world.stages.map((s, i) => {
        const unlocked = this.app.isUnlocked(s.id);
        const stars = save.stars[s.id] || 0;
        const side = i % 2 ? 'right' : 'left';
        const starHtml = [0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}">${STAR}</span>`).join('');
        return `<div class="node-wrap ${side}">
          <button class="node ${unlocked ? '' : 'locked'} ${s.boss ? 'boss' : ''} ${save.cleared[s.id] ? 'cleared' : ''}" data-act="stage" data-id="${s.id}" ${unlocked ? '' : 'disabled'} style="--wc:${world.color}">
            <span class="node-num">${s.boss ? 'BOSS' : s.id}</span>
          </button>
          <div class="node-info"><div class="node-name">${esc(s.name)}</div><div class="node-stars">${starHtml}</div></div>
        </div>`;
      }).join('') + '</div>';
    }
    this.setScreen(`
      <div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">‹</button><h1 class="title">SECTORS</h1>${this.coinsHtml()}</div>
      <div class="world-tabs">${tabs}</div>
      <div class="scroll">${body}</div>
    `, {
      back: () => this.menu(),
      world: (ds) => this.map(+ds.id),
      stage: (ds) => this.briefing(ds.id),
    }, 'map');
  }

  briefing(id) {
    const st = ALL_STAGES.find((s) => s.id === id);
    const stars = this.save.stars[id] || 0;
    const goal = (i, txt) => `<li class="${i < stars ? 'done' : ''}">${STAR}<span>${txt}</span></li>`;
    const ship = SHIPS[this.save.ship];
    this.modal(`
      <div class="modal-kicker" style="color:${st.world.color}">SECTOR ${st.id}</div>
      <h2>${esc(st.name)}</h2>
      <p class="muted">${st.boss ? `Survive until the ${esc(titleCase(BOSSES[st.boss].name))} arrives at ${fmtTime(st.bossAt)}, then destroy it.` : `Survive for ${fmtTime(st.duration)}.`}</p>
      <ul class="goals">
        ${goal(0, st.boss ? 'Defeat the boss' : 'Survive to the end')}
        ${goal(1, `Destroy ${st.kills} enemies`)}
        ${goal(2, 'Finish with 50%+ hull')}
      </ul>
      <div class="brief-ship"><canvas data-ship="${ship.id}" width="96" height="96"></canvas><div><b>${esc(ship.name)}</b><br><small>${esc(WEAPONS[ship.weapon].name)}</small></div><button class="btn small" data-act="hangar">CHANGE</button></div>
      <div class="modal-actions">
        <button class="btn" data-act="close">BACK</button>
        <button class="btn primary" data-act="launch">LAUNCH</button>
      </div>
    `, {
      close: () => this.closeModal(),
      hangar: () => { this.closeModal(); this.hangar(() => this.map()); },
      launch: () => { this.closeModal(); this.app.startStage(id); },
    });
  }

  // ======================= HANGAR =======================
  hangar(back = () => this.menu()) {
    const save = this.save;
    const bars = (v, max) => `<div class="statbar"><i style="width:${Math.round((v / max) * 100)}%"></i></div>`;
    const cards = Object.values(SHIPS).map((s) => {
      const owned = save.ships.includes(s.id);
      const sel = save.ship === s.id;
      const btn = sel ? '<button class="btn small" disabled>SELECTED</button>'
        : owned ? `<button class="btn small primary" data-act="select" data-id="${s.id}">SELECT</button>`
          : `<button class="btn small buy" data-act="buy" data-id="${s.id}" ${save.coins < s.cost ? 'disabled' : ''}>${COIN}<span class="num">${s.cost}</span></button>`;
      return `<div class="ship-card ${sel ? 'selected' : ''}" style="--sc:${s.color}">
        <canvas data-ship="${s.id}" width="120" height="120"></canvas>
        <div class="ship-info">
          <h3>${esc(s.name)}</h3>
          <p class="muted">${esc(s.desc)}</p>
          <div class="stats">
            <label>HULL</label>${bars(s.hp, 160)}
            <label>SPEED</label>${bars(s.speed, 300)}
            <label>POWER</label>${bars(s.dmg, 1.2)}
          </div>
          <div class="ship-weapon"><img src="${icon(WEAPONS[s.weapon].icon, WEAPONS[s.weapon].color)}" alt=""><span>${esc(WEAPONS[s.weapon].name)}</span><em>${esc(s.perk)}</em></div>
          ${btn}
        </div>
      </div>`;
    }).join('');
    this.setScreen(`
      <div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">‹</button><h1 class="title">HANGAR</h1>${this.coinsHtml()}</div>
      <div class="scroll">${cards}</div>
    `, {
      back,
      select: (ds) => { save.ship = ds.id; this.app.persist(); this.hangar(back); },
      buy: (ds) => {
        const s = SHIPS[ds.id];
        if (save.coins < s.cost) return;
        save.coins -= s.cost;
        save.ships.push(s.id);
        save.ship = s.id;
        this.app.persist();
        this.app.audio.sfx('buy');
        this.toast(`${s.name} unlocked!`);
        this.hangar(back);
      },
    }, 'hangar');
  }

  // ======================= SHOP =======================
  shop() {
    const save = this.save;
    const rows = SHOP.map((it) => {
      const lvl = save.shop[it.id] || 0;
      const max = it.cost.length;
      const maxed = lvl >= max;
      const cost = maxed ? 0 : it.cost[lvl];
      const pips = Array.from({ length: max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      // "Damage +16% → +24%": the total bonus now and after buying the next level
      const fmt = (l) => {
        const v = l * it.per;
        if (it.plain) return String(v);
        const n = it.pct ? Math.round(v * 100) : Math.round(v * 100) / 100;
        return `+${n}${it.pct ? '%' : it.unit || ''}`;
      };
      const effect = maxed
        ? `${esc(it.stat)} <b class="fx-now">${fmt(lvl)}</b>`
        : `${esc(it.stat)} <b class="fx-now">${fmt(lvl)}</b> <span class="fx-arrow">→</span> <b class="fx-next">${fmt(lvl + 1)}</b>`;
      return `<div class="shop-row">
        <img src="${icon(it.icon, '#2ff3ff')}" alt="">
        <div class="shop-info"><div class="shop-head"><b>${esc(it.name)}</b><span class="shop-lvl">LV ${lvl}/${max}</span></div>
          <small class="shop-fx">${effect}</small><div class="pips">${pips}</div></div>
        ${maxed ? '<button class="btn small" disabled>MAX</button>' : `<button class="btn small buy" data-act="buy" data-id="${it.id}" ${save.coins < cost ? 'disabled' : ''}>${COIN}<span class="num">${cost}</span></button>`}
      </div>`;
    }).join('');
    this.setScreen(`
      <div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">‹</button><h1 class="title">UPGRADES</h1>${this.coinsHtml()}</div>
      <p class="muted center">Permanent upgrades for every ship.</p>
      <div class="scroll">${rows}</div>
    `, {
      back: () => this.menu(),
      buy: (ds) => {
        const it = SHOP.find((x) => x.id === ds.id);
        const lvl = save.shop[it.id] || 0;
        const cost = it.cost[lvl];
        if (cost == null || save.coins < cost) return;
        save.coins -= cost;
        save.shop[it.id] = lvl + 1;
        this.app.persist();
        this.app.audio.sfx('buy');
        this.shop();
      },
    }, 'shop');
  }

  // ======================= DAILY =======================
  daily() {
    const d = this.app.dailyStatus();
    const days = DAILY.map((v, i) => {
      const cls = i < d.dayIndex ? 'got' : i === d.dayIndex ? (d.claimable ? 'today' : 'got') : '';
      return `<div class="day ${cls}"><small>DAY ${i + 1}</small>${COIN}<b>${v}</b></div>`;
    }).join('');
    this.modal(`
      <h2>DAILY REWARD</h2>
      <p class="muted">Come back every day for bigger rewards. Miss a day and the streak resets.</p>
      <div class="days">${days}</div>
      <div class="modal-actions">
        ${d.claimable ? `<button class="btn primary" data-act="claim">CLAIM ${COIN}<span class="num">${DAILY[d.dayIndex]}</span></button>` : '<button class="btn" data-act="close">COME BACK TOMORROW</button>'}
      </div>
    `, {
      close: () => this.closeModal(),
      claim: () => {
        const v = this.app.claimDaily();
        this.closeModal();
        this.app.audio.sfx('chest');
        this.toast(`+${v} coins!`);
        this.menu();
      },
    }, 'daily');
  }

  // ======================= SETTINGS =======================
  settings() {
    const s = this.save.settings;
    const tog = (k, label) => `<button class="toggle ${s[k] ? 'on' : ''}" data-act="tog" data-k="${k}"><span>${label}</span><i></i></button>`;
    this.modal(`
      <h2>SETTINGS</h2>
      <button class="toggle choice" data-act="control"><span>Controls</span><b>${({ joystick: 'Joystick', float: 'Floating joystick', drag: 'Drag anywhere' })[s.control] || 'Joystick'}</b></button>
      ${tog('music', 'Music')}
      ${tog('sfx', 'Sound effects')}
      ${tog('dmgNums', 'Damage numbers')}
      ${this.app.native ? tog('haptics', 'Vibration') : ''}
      <div class="stats-line muted">${versionFull()}</div>
      <div class="stats-line muted">Enemies destroyed: ${this.save.stats.kills.toLocaleString('en-US')} · Runs: ${this.save.stats.runs}</div>
      <div class="modal-actions">
        <button class="btn danger small" data-act="reset">RESET PROGRESS</button>
        <button class="btn primary" data-act="close">DONE</button>
      </div>
      ${this.app.native ? '' : '<p class="tiny muted">On iPhone: Share → Add to Home Screen to play full-screen.</p>'}
    `, {
      close: () => this.closeModal(),
      control: () => {
        const order = ['joystick', 'float', 'drag'];
        s.control = order[(order.indexOf(s.control) + 1) % order.length];
        this.app.persist();
        this.settings();
      },
      tog: (ds) => {
        s[ds.k] = !s[ds.k];
        this.app.applySettings();
        this.app.persist();
        this.settings();
      },
      reset: (ds, el) => {
        if (!el.dataset.confirm) {
          el.dataset.confirm = '1';
          el.textContent = 'TAP AGAIN TO CONFIRM';
          return;
        }
        this.app.resetProgress();
        this.closeModal();
        this.menu();
        this.toast('Progress reset');
      },
    });
  }

  // ======================= IN-GAME =======================
  showHud() {
    this.clearScreen();
    this.hudEl.classList.remove('hidden');
    this.bossBar(null);
    this.hudCache = {};
  }

  hideHud() {
    this.hudEl.classList.add('hidden');
    this.bossBar(null);
  }

  hud(g) {
    const c = this.hudCache;
    const q = (sel) => (c['$' + sel] ||= this.hudEl.querySelector(sel));
    const set = (key, sel, val, fn) => {
      if (c[key] === val) return;
      c[key] = val;
      fn ? fn(q(sel), val) : (q(sel).textContent = val);
    };
    const xpFrac = Math.min(1, g.xp / g.xpNext);
    set('xp', '.xpfill', Math.round(xpFrac * 200), (el, v) => (el.style.transform = `scaleX(${v / 200})`));
    set('lvl', '.xplvl', `LV ${g.level}`);
    set('kills', '.hud-kills', g.kills);
    set('coins', '.hud-coins', Math.floor(g.coinsRun));
    const st = g.stage;
    const t = st.boss ? (g.boss || g.bossDefeated ? g.time : Math.max(0, st.bossAt - g.time)) : Math.max(0, st.duration - g.time);
    set('time', '.hud-timer', fmtTime(t));
    set('boss', '.hud-timer', !!g.boss, (el, v) => el.classList.toggle('boss-mode', v));
  }

  bossBar(name, frac) {
    const el = this.hudEl.querySelector('.bossbar');
    if (name == null) { el.classList.add('hidden'); this.bossFrac = null; return; }
    el.classList.remove('hidden');
    if (this.bossName !== name) { el.querySelector('.bossname').textContent = name; this.bossName = name; }
    const f = Math.round(frac * 300);
    if (this.bossFrac !== f) { el.querySelector('.bossfill').style.transform = `scaleX(${f / 300})`; this.bossFrac = f; }
  }

  banner(title, sub) {
    const b = document.createElement('div');
    b.className = 'banner';
    b.innerHTML = `<div class="banner-title">${esc(title)}</div>${sub ? `<div class="banner-sub">${esc(sub)}</div>` : ''}`;
    this.bannerEl.innerHTML = '';
    this.bannerEl.appendChild(b);
    setTimeout(() => b.remove(), 2600);
  }

  buildHtml(build) {
    const item = (x) => `<div class="build-item" style="--ic:${x.color}" title="${esc(x.name)}"><img src="${icon(x.icon, x.color)}" alt=""><b>${x.level}</b></div>`;
    return `<div class="build"><div class="build-row">${build.weapons.map(item).join('')}</div><div class="build-row">${build.passives.map(item).join('')}</div></div>`;
  }

  levelUp({ title, sub, cards, rerolls, build, onPick, onReroll, step = 1, steps = 1 }) {
    const html = cards.map((c, i) => `
      <button class="card ${c.evo ? 'evo' : ''}" style="--cc:${c.color}" data-act="pick" data-i="${i}">
        <img src="${icon(c.icon, c.color, c.evo)}" alt="">
        <div class="card-info">
          <div class="card-top"><b>${esc(c.name)}</b><span class="tag ${c.tag === 'NEW' ? 'new' : ''}">${c.tag}</span></div>
          <div class="card-desc">${esc(c.desc)}</div>
        </div>
      </button>`).join('');
    this.modal(`
      <div class="lu-title">${esc(title)}${steps > 1 ? ` <span class="lu-step">${step}/${steps}</span>` : ''}</div>
      <div class="muted center">${esc(sub)}</div>
      <div class="cards">${html}</div>
      ${this.buildHtml(build)}
      ${rerolls > 0 ? `<button class="btn small reroll" data-act="reroll">RE-ROLL (${rerolls})</button>` : ''}
    `, {
      pick: (ds, el) => {
        if (this.picking) return;
        this.picking = true;
        this.app.audio.sfx('select');
        el.classList.add('chosen');
        // brief flash so the choice visibly registers before the next level-up (if any) replaces this one
        setTimeout(() => { this.picking = false; this.closeModal(); onPick(+ds.i); }, 110);
      },
      reroll: () => onReroll(),
    }, 'levelup', 220);
  }

  pause(build, onResume, onQuit) {
    this.modal(`
      <h2>PAUSED</h2>
      ${this.buildHtml(build)}
      <div class="modal-actions col">
        <button class="btn primary" data-act="resume">RESUME</button>
        <button class="btn" data-act="quit">ABANDON RUN</button>
      </div>
    `, {
      resume: () => { this.closeModal(); onResume(); },
      quit: (ds, el) => {
        if (!el.dataset.confirm) { el.dataset.confirm = '1'; el.textContent = 'TAP AGAIN — COINS WILL BE LOST'; return; }
        this.closeModal();
        onQuit();
      },
    }, 'pause');
  }

  revive(onYes, onNo) {
    this.modal(`
      <div class="lu-title" style="--cc:#ffd23d">PHOENIX PROTOCOL</div>
      <p class="muted center">Your ship was destroyed. Rise from the ashes?</p>
      <div class="modal-actions col">
        <button class="btn primary" data-act="yes">REVIVE</button>
        <button class="btn" data-act="no">GIVE UP</button>
      </div>
    `, {
      yes: () => { this.closeModal(); onYes(); },
      no: () => { this.closeModal(); onNo(); },
    }, 'revive', 500);
  }

  results(r) {
    const idx = stageIndex(r.stage.id);
    const next = ALL_STAGES[idx + 1];
    const canNext = r.won && next && this.app.isUnlocked(next.id);
    const stars = [0, 1, 2].map((k) => `<span class="rstar ${k < r.stars ? 'on' : ''}" style="animation-delay:${0.3 + k * 0.25}s">${STAR}</span>`).join('');
    const goals = ['Clear', `${r.stage.kills} kills`, '50%+ hull'].map((g, i) => `<li class="${r.goals[i] && r.won ? 'done' : ''}">${STAR}<span>${g}</span></li>`).join('');
    this.hideHud();
    this.modal(`
      <div class="lu-title ${r.won ? '' : 'lose'}">${r.won ? (next ? 'SECTOR CLEAR' : 'GALAXY SAVED') : 'SHIP DESTROYED'}</div>
      ${r.won && !next ? '<p class="muted center">The Void Heart is destroyed. Replay any sector to collect every star.</p>' : ''}
      <div class="muted center">${esc(r.stage.id)} · ${esc(r.stage.name)}</div>
      ${r.won ? `<div class="rstars">${stars}</div><ul class="goals inline">${goals}</ul>` : ''}
      <div class="rtable">
        <div><span>Time</span><b>${fmtTime(r.time)}</b></div>
        <div><span>Enemies destroyed</span><b>${r.kills}</b></div>
        <div><span>Level reached</span><b>${r.level}</b></div>
        <div><span>Coins collected</span><b>${r.collected}</b></div>
        ${r.won ? `<div><span>Clear bonus${r.firstClear ? ' (first clear!)' : ''}</span><b>${r.clearBonus}</b></div><div><span>Star bonus</span><b>${r.starBonus}</b></div>` : ''}
        <div class="total"><span>Total</span><b>${COIN}${r.total}</b></div>
      </div>
      <div class="modal-actions">
        <button class="btn" data-act="map">SECTORS</button>
        <button class="btn" data-act="retry">RETRY</button>
        ${canNext ? '<button class="btn primary" data-act="next">NEXT</button>' : ''}
      </div>
      ${!r.won ? '<p class="tiny muted center">Tip: spend coins on permanent Upgrades to get stronger.</p>' : ''}
    `, {
      map: () => { this.closeModal(); this.app.endRun(); this.map(); },
      retry: () => { this.closeModal(); this.app.startStage(r.stage.id); },
      next: () => { this.closeModal(); this.app.startStage(next.id); },
    }, 'results', 700);
  }
}
