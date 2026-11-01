// The 2.0 story (Claude Doc "Void Blaster 2.0 - Fabula", accepted by Konrad 2026-11-01): an intro before the first
// sector, a short transmission after each world's boss (worlds 1-9) and an outro after the Void Heart. Each scene is
// one or more portrait pictures (Art Bible SC0a ... SC10d, ui-sc-<code> by proto2/make-story.py) with a slow camera
// drift, and the lines typed out under them: Earth Command in amber, the Void Collective in magenta capitals.
// Each scene plays by itself once (save.story); the Codex's Log replays the seen ones. Tap: finish the line / next;
// SKIP: the whole scene.
import { uiArt } from './icons.js';

const HALE = 'EARTH COMMAND // ADMIRAL HALE';
const VOID = 'VOID COLLECTIVE // SIGNAL';
const cmd = (head, ...lines) => ({ who: 'cmd', head, lines });
const sig = (...lines) => ({ who: 'void', head: VOID, lines });

// key -> { title (Codex Log), panels: [{ art, say: [...] }] }
export const STORY = {
  intro: {
    title: 'Prologue: The Grid',
    panels: [
      { art: '0a', say: [cmd('EARTH COMMAND // ORBITAL DEFENSE GRID', 'All stations green. Another quiet night above home.')] },
      { art: '0b', say: [{ who: 'void', head: 'VOID COLLECTIVE // SIGNAL INTERCEPTED', lines: ['TARGET: EARTH.', 'DEFENSES: OBSOLETE.', 'REWRITE IN PROGRESS.'] }] },
      { art: '0c', say: [cmd(HALE, "The grid is gone. Eleven minutes, and it's gone.", 'Any pilot still flying, report.')] },
      { art: '0d', say: [cmd(HALE, "One ship. That's all we have left.", "Call sign Vanguard: you're cleared to launch.", 'Take back our sky.')] },
    ],
  },
  w1: {
    title: '1 · Orbit Is Clear',
    panels: [{ art: '1', say: [cmd(HALE, 'Orbit is clear. But we were too late:', "they're already landing. Get down there, Vanguard."), sig('SURFACE CONVERSION: BEGUN.')] }],
  },
  w2: {
    title: '2 · Earth Holds',
    panels: [{ art: '2', say: [cmd(HALE, 'The citadel is down. Earth holds, for now.', 'Their signal comes from the Moon. They built a bridgehead', 'right above our heads. We take the fight to them.')] }],
  },
  w3: {
    title: '3 · The Last Message',
    panels: [{ art: '3', say: [cmd(HALE, 'The spire was a transmitter. Its last message went to Mars.'), sig('MARS: 61% REWRITTEN.', 'YOU REPAIR NOTHING. WHY DO YOU RESIST REPAIR?')] }],
  },
  w4: {
    title: '4 · Where the Army Comes From',
    panels: [{ art: '4', say: [cmd(HALE, 'We finally know where their army comes from.', 'The asteroid belt. Every rock is a factory.', 'Shut them down, and they stop growing.')] }],
  },
  w5: {
    title: '5 · Cut the Line',
    panels: [{ art: '5', say: [sig('YOU BROKE OUR HANDS. WE HAVE MORE.'), cmd(HALE, 'The factories took orders from Jupiter.', 'A relay in the storms. Cut the line, Vanguard.')] }],
  },
  w6: {
    title: '6 · Under the Ice',
    panels: [{ art: '6', say: [cmd(HALE, 'The relay is silent. But before it died,', 'it sent everything down. Under the ice of Europa.'), sig('WE ARE NOT ONLY MACHINES ANYMORE.')] }],
  },
  w7: {
    title: '7 · One Door',
    panels: [{ art: '7', say: [cmd(HALE, 'They all came through one door. The Rift Gate.', "Past it, we can't reach you. No signal, no support.", "It's your call, Vanguard. ...Good luck.")] }],
  },
  w8: {
    title: '8 · Signal Lost',
    panels: [{ art: '8', say: [{ who: 'lost', head: 'EARTH COMMAND // [SIGNAL LOST]', lines: ['...anguard... ...do you... ...ead...'] }, sig('YOU ARE ALONE NOW. WE ARE NEVER ALONE.', 'WE GROW. YOU COULD GROW WITH US.')] }],
  },
  w9: {
    title: '9 · The Heart',
    panels: [{ art: '9', say: [sig('YOU KILLED OUR MOTHER. YOU HAVE COME SO FAR.', 'THERE IS ONLY THE HEART LEFT.', 'COME CLOSER, LITTLE LIGHT.')] }],
  },
  outro: {
    title: 'Epilogue: Come Home',
    panels: [
      { art: '10a', say: [sig('WE... ARE... ONE...', 'we are... one...', '...')] },
      { art: '10b', say: [cmd('EARTH COMMAND // [SIGNAL RESTORED]', 'Vanguard? Vanguard, do you read?', 'The Moon just went dark. Mars too. Every one of them.', 'Whatever you did out there... it worked.')] },
      { art: '10c', say: [cmd(HALE, 'We lost the grid, the fleet, the Moon and half the sky.', "We didn't lose you.", 'Come home, Vanguard.')] },
      { art: '10d', say: [cmd('EARTH COMMAND // ORBITAL DEFENSE GRID', 'All stations green.')] },
    ],
    credits: true,
  },
};
export const STORY_ORDER = ['intro', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'outro'];

// the scene that follows clearing a world's boss sector (worlds 1-9: a transmission, world 10: the outro)
export const sceneAfterWorld = (worldId) => (worldId >= 10 ? 'outro' : worldId >= 1 ? `w${worldId}` : null);

const CREDITS = `
  <div class="story-credits">
    <h2>VOID BLASTER</h2>
    <p>A game by<br><b>Konrad Lechowicz</b></p>
    <p class="muted">Thank you for playing.</p>
    <div class="story-sig">VOID COLLECTIVE // SIGNAL<br>...WE REMEMBER.</div>
    <p class="story-endless">ENDLESS MODE UNLOCKED</p>
  </div>`;

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Plays a scene over everything (a layer of its own in #ui); done() when it ends or is skipped.
export function playStory(key, done) {
  const scene = STORY[key];
  if (!scene) { done?.(); return; }
  const el = document.createElement('div');
  el.className = 'story';
  el.innerHTML = '<div class="story-art"></div><div class="story-shade"></div><div class="story-text"></div><button class="story-skip">SKIP ›</button>';
  document.getElementById('ui').appendChild(el);
  const art = el.querySelector('.story-art'), text = el.querySelector('.story-text');
  let panel = -1, timer = 0, typing = null, ended = false;

  // the lines of one panel, typed out one character after another
  function showPanel() {
    const p = scene.panels[panel];
    const pic = uiArt(`sc-${p.art}`);
    art.classList.remove('drift');
    art.style.backgroundImage = pic ? `url(${pic})` : 'none';
    void art.offsetWidth; // restart the drift
    art.classList.add('drift');
    art.classList.toggle('left', panel % 2 === 1);
    art.classList.toggle('right', panel % 2 === 0);
    text.innerHTML = p.say.map((b) => `<div class="story-block ${b.who}"><div class="story-head">${esc(b.head)}</div>${b.lines.map((l) => `<p data-t="${esc(l)}"></p>`).join('')}</div>`).join('');
    const slots = [...text.querySelectorAll('p')];
    let i = 0, n = 0;
    typing = {
      finish() { slots.forEach((s) => { s.textContent = s.dataset.t; }); stop(); },
    };
    const stop = () => { clearInterval(timer); timer = 0; typing = null; };
    timer = setInterval(() => {
      const s = slots[i];
      if (!s) { stop(); return; }
      const full = s.dataset.t;
      n = Math.min(full.length, n + 1);
      s.textContent = full.slice(0, n);
      if (n >= full.length) { i++; n = 0; }
    }, 28);
  }

  function showCredits() {
    clearInterval(timer); typing = null;
    art.style.backgroundImage = 'none';
    text.innerHTML = CREDITS;
    el.classList.add('credits');
  }

  function next() {
    if (ended) return;
    if (typing) { typing.finish(); return; }
    panel++;
    if (panel < scene.panels.length) showPanel();
    else if (scene.credits && panel === scene.panels.length) showCredits();
    else end();
  }

  function end() {
    if (ended) return;
    ended = true;
    clearInterval(timer);
    el.classList.add('out');
    setTimeout(() => { el.remove(); done?.(); }, 350);
  }

  // on finger lift (iOS drops the click when the finger moves a little during a tap)
  el.querySelector('.story-skip').addEventListener('pointerup', (e) => { e.stopPropagation(); end(); });
  el.addEventListener('pointerup', next);
  next();
}
