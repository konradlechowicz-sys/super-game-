// Sound effects are synthesized with Web Audio. Music is synthesized too, unless a track has a recording (2.0 music
// made with Suno, registered by setRecording): then the recording plays instead, its intro once and then its loop.
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const TRACKS = {
  menu: { bpm: 96, chords: [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]], drums: false, pad: true },
  game: { bpm: 126, chords: [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]], drums: true, pad: false },
  // Crystal Belt: E minor, airy; Solar Forge: D minor, driving; Void Core: C minor, dark
  game2: { bpm: 122, chords: [[40, 52, 55, 59], [36, 48, 52, 55], [43, 55, 59, 62], [38, 50, 54, 57]], drums: true, pad: false },
  game3: { bpm: 134, chords: [[38, 50, 53, 57], [46, 58, 62, 65], [36, 48, 52, 55], [45, 57, 61, 64]], drums: true, pad: false, hard: true },
  game4: { bpm: 128, chords: [[36, 48, 51, 55], [44, 56, 60, 63], [39, 51, 55, 58], [43, 55, 59, 62]], drums: true, pad: false, hard: true },
  boss: { bpm: 140, chords: [[45, 57, 60, 64], [46, 58, 62, 65], [38, 50, 53, 57], [40, 52, 56, 59]], drums: true, pad: false, hard: true },
};
// 2.0 worlds 2-5's bosses: their recordings (js/v2/music.gen.js) play; without them, the synthesized boss track
TRACKS.boss2 = TRACKS.boss3 = TRACKS.boss4 = TRACKS.boss5 = TRACKS.boss;
// worlds 5-10 have no synthesized tracks of their own (the 1.x line had four worlds)
TRACKS.game5 = TRACKS.game7 = TRACKS.game9 = TRACKS.game3;
TRACKS.game6 = TRACKS.game8 = TRACKS.game10 = TRACKS.game4;
TRACKS.boss6 = TRACKS.boss7 = TRACKS.boss8 = TRACKS.boss9 = TRACKS.boss10 = TRACKS.boss;

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxOn = true;
    this.musicOn = true;
    this.last = {};
    this.track = null; // the synthesized track being played
    this.wanted = null; // the track the game asked for
    this.recordings = {}; // name -> { url, loopStart, loopEnd, gain }
    this.buffers = {}; // name -> Promise<AudioBuffer>
    this.playing = null; // { name, src, gain } of the recording being played
    this.recError = ''; // why the last recording failed to load (shown in the TEST panel)
    this.step = 0;
    this.nextTime = 0;
    this.xpPitch = 0;
    this.xpLast = 0;
  }

  // Called on every tap and key press (iOS lets audio start or resume only inside a user gesture).
  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // After the app was in the background or a notification interrupted the sound, iOS can leave the context
    // 'interrupted', or 'running' but silent, and resume() does not bring it back: start a fresh one instead.
    if (this.ctx && this.stale) this.restart();
    if (!this.ctx) this.build(new AC());
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  build(c) {
    this.ctx = c;
    this.stale = false;
    this.master = c.createDynamicsCompressor();
    this.master.threshold.value = -14;
    this.master.ratio.value = 6;
    this.master.connect(c.destination);
    this.sfxGain = c.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);
    this.musicGain = c.createGain();
    this.musicGain.gain.value = this.musicOn ? 0.32 : 0;
    this.musicGain.connect(this.master);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // Simple echo for the lead synth
    this.delay = c.createDelay(1);
    this.delay.delayTime.value = 0.36;
    const fb = c.createGain();
    fb.gain.value = 0.32;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(this.musicGain);
    this.nextTime = c.currentTime + 0.1;
    this.timer ??= setInterval(() => this.schedule(), 25);
    // the system took the sound away (a call, a notification, another app): rebuild on the next tap
    c.onstatechange = () => { if (c === this.ctx && c.state !== 'running' && c.state !== 'closed') this.stale = true; };
    if (this.recordings[this.wanted]) this.playRecording(this.wanted, true);
  }

  restart() {
    const old = this.ctx;
    this.ctx = null;
    this.playing = null;
    old.onstatechange = null;
    old.close().catch(() => {});
  }

  // the page went to the background (main.js): silence now, a fresh context when the player is back
  sleep() {
    if (!this.ctx) return;
    this.stale = true;
    this.ctx.suspend().catch(() => {});
  }

  // the page is visible again: try to resume at once; if iOS refuses, the next tap rebuilds (unlock)
  wake() {
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  setMusicOn(on) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.1);
  }

  setTrack(name) {
    if (this.wanted === name) return;
    this.wanted = name;
    if (this.recordings[name]) {
      this.track = null;
      this.playRecording(name);
      return;
    }
    this.stopRecording();
    this.track = name;
    this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.1;
  }

  // A recording for a track: from now on it plays instead of the synthesized one.
  setRecording(name, rec) {
    this.recordings[name] = rec;
    if (this.wanted === name) { this.wanted = null; this.setTrack(name); }
  }

  // again: the track was already playing before the context was rebuilt, so it goes on from its loop, not the intro
  playRecording(name, again = false) {
    if (!this.ctx || this.playing?.name === name) return;
    this.stopRecording();
    const rec = this.recordings[name], ctx = this.ctx;
    this.buffers[name] ??= bytesOf(rec.url).then((b) => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)));
    this.buffers[name].then((buf) => {
      if (this.ctx !== ctx || this.wanted !== name || this.playing?.name === name) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = rec.loopStart;
      src.loopEnd = Math.min(rec.loopEnd, buf.duration);
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(rec.gain ?? 1, t + 0.6);
      src.connect(gain).connect(this.musicGain);
      src.start(t, again ? src.loopStart : 0);
      this.playing = { name, src, gain };
    }).catch((e) => {
      // the context was rebuilt while decoding: decode again in the new one
      if (this.ctx !== ctx) { delete this.buffers[name]; if (this.ctx && this.wanted === name) this.playRecording(name, again); return; }
      // a recording that cannot be decoded here: fall back to the synthesized track, so there is never silence
      this.recError = `${name}: ${e?.message || e}`;
      delete this.recordings[name];
      delete this.buffers[name];
      if (this.wanted === name) { this.wanted = null; this.setTrack(name); }
    });
  }

  // For the TEST panel: what the music is doing right now.
  musicStatus() {
    if (!this.ctx) return 'waiting for the first tap';
    if (this.playing) return `recording "${this.playing.name}" (${this.ctx.state})`;
    const failed = this.recError ? ` · recording failed: ${this.recError}` : '';
    if (this.wanted && this.recordings[this.wanted]) return `loading "${this.wanted}"…${failed}`;
    return `synth "${this.track}" (${this.ctx.state})${failed}`;
  }

  stopRecording() {
    const p = this.playing;
    if (!p) return;
    this.playing = null;
    const t = this.ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0, t + 0.4);
    p.src.stop(t + 0.45);
  }

  // ---------- primitives ----------
  tone({ type = 'square', f0 = 440, f1 = null, dur = 0.1, vol = 0.1, at = 0, attack = 0.004, dest, filter }) {
    const c = this.ctx;
    const t = (at || c.currentTime);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      o.connect(f);
      node = f;
    }
    node.connect(g).connect(dest || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise({ dur = 0.2, vol = 0.2, type = 'lowpass', f0 = 2000, f1 = null, q = 1, at = 0, dest }) {
    const c = this.ctx;
    const t = at || c.currentTime;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest || this.sfxGain);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  throttle(name, gap) {
    const now = this.ctx.currentTime;
    if (now - (this.last[name] || 0) < gap) return false;
    this.last[name] = now;
    return true;
  }

  sfx(name) {
    if (!this.ctx || !this.sfxOn || this.ctx.state !== 'running') return;
    const T = (n, g) => this.throttle(n, g);
    switch (name) {
      case 'shoot': if (T(name, 0.06)) this.tone({ type: 'square', f0: 1100, f1: 500, dur: 0.06, vol: 0.035 }); break;
      case 'laser': if (T(name, 0.07)) this.tone({ type: 'sawtooth', f0: 1600, f1: 300, dur: 0.08, vol: 0.03 }); break;
      case 'shotgun': if (T(name, 0.08)) this.noise({ dur: 0.09, vol: 0.12, type: 'bandpass', f0: 1800, f1: 600 }); break;
      case 'missile': if (T(name, 0.1)) this.noise({ dur: 0.25, vol: 0.06, type: 'bandpass', f0: 600, f1: 2400, q: 3 }); break;
      case 'hit': if (T(name, 0.035)) this.tone({ type: 'triangle', f0: 420, f1: 180, dur: 0.05, vol: 0.05 }); break;
      case 'boom':
        if (T(name, 0.07)) {
          this.noise({ dur: 0.28, vol: 0.22, f0: 1400, f1: 120 });
          this.tone({ type: 'sine', f0: 140, f1: 40, dur: 0.22, vol: 0.18 });
        }
        break;
      case 'bigboom':
        this.noise({ dur: 1.2, vol: 0.5, f0: 2200, f1: 60 });
        this.tone({ type: 'sine', f0: 110, f1: 25, dur: 1, vol: 0.4 });
        break;
      case 'zap': if (T(name, 0.08)) { this.noise({ dur: 0.12, vol: 0.12, type: 'highpass', f0: 3000 }); this.tone({ type: 'sawtooth', f0: 900, f1: 200, dur: 0.1, vol: 0.04 }); } break;
      case 'pulse': if (T(name, 0.1)) this.tone({ type: 'sine', f0: 260, f1: 50, dur: 0.35, vol: 0.2 }); break;
      case 'xp': {
        const now = this.ctx.currentTime;
        this.xpPitch = now - this.xpLast < 0.25 ? Math.min(this.xpPitch + 1, 14) : 0;
        if (T(name, 0.035)) {
          this.xpLast = now;
          this.tone({ type: 'sine', f0: midi(84 + this.xpPitch), dur: 0.07, vol: 0.05 });
        }
        break;
      }
      case 'coin': if (T(name, 0.06)) { this.tone({ type: 'square', f0: 1320, dur: 0.05, vol: 0.04 }); this.tone({ type: 'square', f0: 1980, dur: 0.12, vol: 0.04, at: this.ctx.currentTime + 0.05 }); } break;
      case 'hurt': this.tone({ type: 'sawtooth', f0: 220, f1: 50, dur: 0.25, vol: 0.18 }); this.noise({ dur: 0.15, vol: 0.15, f0: 900 }); break;
      case 'levelup': this.arp([72, 76, 79, 84], 0.07, 'triangle', 0.12); break;
      case 'evolve': this.arp([60, 67, 72, 76, 79, 84, 88, 91], 0.06, 'square', 0.07); break;
      case 'chest': this.arp([76, 79, 83, 88], 0.08, 'square', 0.07); break;
      case 'pickup': this.arp([67, 74, 79], 0.05, 'triangle', 0.12); break;
      case 'select': this.tone({ type: 'sine', f0: 700, f1: 1000, dur: 0.06, vol: 0.08 }); break;
      case 'buy': this.arp([72, 79, 84], 0.05, 'square', 0.06); break;
      case 'warn': this.tone({ type: 'sawtooth', f0: 330, dur: 0.18, vol: 0.08, filter: 1200 }); this.tone({ type: 'sawtooth', f0: 330, dur: 0.18, vol: 0.08, filter: 1200, at: this.ctx.currentTime + 0.25 }); break;
      case 'boss': this.tone({ type: 'sawtooth', f0: 70, f1: 40, dur: 1.6, vol: 0.25, filter: 500, attack: 0.2 }); this.noise({ dur: 1.4, vol: 0.15, f0: 400, f1: 80 }); break;
      case 'eshoot': if (T(name, 0.09)) this.tone({ type: 'square', f0: 300, f1: 600, dur: 0.07, vol: 0.025 }); break;
      case 'win': this.arp([60, 64, 67, 72, 76, 79, 84], 0.09, 'square', 0.08); break;
      case 'lose': this.arp([67, 63, 60, 55, 51], 0.14, 'sawtooth', 0.07); break;
    }
  }

  arp(notes, gap, type, vol) {
    const t = this.ctx.currentTime;
    notes.forEach((n, i) => this.tone({ type, f0: midi(n), dur: gap * 2.2, vol, at: t + i * gap }));
  }

  // ---------- music sequencer (16th-note steps, look-ahead scheduling) ----------
  schedule() {
    if (!this.ctx || !this.track || this.ctx.state !== 'running') return;
    const tr = TRACKS[this.track];
    const sp = 60 / tr.bpm / 4;
    if (this.nextTime < this.ctx.currentTime - 0.2) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(tr, this.step, this.nextTime, sp);
      this.nextTime += sp;
      this.step = (this.step + 1) % 64;
    }
  }

  playStep(tr, step, t, sp) {
    const M = this.musicGain;
    const chord = tr.chords[Math.floor(step / 16) % tr.chords.length];
    const s = step % 16;
    const [root, ...tones] = chord;
    if (tr.pad) {
      if (s === 0) {
        for (const n of tones) {
          this.tone({ type: 'sawtooth', f0: midi(n), dur: sp * 16, vol: 0.035, at: t, attack: 0.6, dest: M, filter: 900 });
          this.tone({ type: 'sawtooth', f0: midi(n) * 1.006, dur: sp * 16, vol: 0.03, at: t, attack: 0.6, dest: M, filter: 900 });
        }
        this.tone({ type: 'triangle', f0: midi(root - 12), dur: sp * 15, vol: 0.12, at: t, attack: 0.3, dest: M });
      }
      if (s % 4 === 2) {
        const n = tones[(s / 4 + Math.floor(step / 16)) % tones.length | 0] + 12;
        this.tone({ type: 'sine', f0: midi(n), dur: sp * 3, vol: 0.05, at: t, dest: this.delay });
      }
      return;
    }
    // bass: pumping octaves
    if (s % 2 === 0) {
      const n = root + (s % 4 === 2 ? 12 : 0) - 12;
      this.tone({ type: 'sawtooth', f0: midi(n), dur: sp * 1.8, vol: 0.13, at: t, dest: M, filter: tr.hard ? 900 : 650 });
    }
    // arp lead
    const arpSeq = [0, 1, 2, 3, 2, 1, 0, 2];
    const n = tones[arpSeq[s % 8] % tones.length] + 12 + (tr.hard && s >= 8 ? 12 : 0);
    this.tone({ type: 'square', f0: midi(n), dur: sp * 0.9, vol: 0.022, at: t, dest: this.delay, filter: 2600 });
    if (tr.drums) {
      if (s % 4 === 0) this.tone({ type: 'sine', f0: 150, f1: 40, dur: 0.18, vol: 0.5, at: t, dest: M });
      if (s === 4 || s === 12) this.noise({ dur: 0.16, vol: 0.18, type: 'bandpass', f0: 1800, q: 0.8, at: t, dest: M });
      if (s % 2 === 1) this.noise({ dur: 0.04, vol: tr.hard ? 0.07 : 0.05, type: 'highpass', f0: 8000, at: t, dest: M });
    }
  }
}

// The bytes of a recording. Embedded data: URLs are decoded here instead of fetched, because sandboxed pages (the
// preview on claude.ai) may forbid fetch even for data: URLs. The web previews keep each track in a script of its own
// (assets/music-<name>.js, scripts/v2-assets.mjs) that puts its data: URL in window.__vbMusic.
function bytesOf(url) {
  if (url.endsWith('.js')) {
    return new Promise((ok, no) => { const s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = no; document.head.appendChild(s); })
      .then(() => bytesOf(window.__vbMusic[url]));
  }
  if (!url.startsWith('data:')) return fetch(url).then((r) => r.arrayBuffer());
  return new Promise((resolve) => {
    const bin = atob(url.slice(url.indexOf(',') + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    resolve(bytes.buffer);
  });
}
