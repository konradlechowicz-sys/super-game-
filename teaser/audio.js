// The teaser's sound: the music track (from Suno, cut to the teaser by teaser/build.mjs) and sound effects
// synthesized with Web Audio like the game (no files, no licensing), rendered offline so they match the animation to
// the frame. The effects follow the events the animation logs; every effect is layered: a sharp transient, a body
// (often driven through a soft clipper), a low thump, and a tail in a room or hall reverb. Which effects play is a
// choice: 'shots' (only the guns, quietly under the music, as decided by Konrad) or 'all'.
import { T } from './timeline.js';

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const rr = (a, b) => a + rnd() * (b - a);

// the music (encoded audio bytes) and the effects as separate buffers, plus their mix; all three share one gain
// that puts the mix at -1 dBFS
export async function renderSoundtrack(events, length, musicBytes, { rate = 48000, effects = 'shots' } = {}) {
  const n = Math.ceil(length * rate);
  const music = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: rate });
  if (musicBytes) {
    const decoded = await new OfflineAudioContext(2, n, rate).decodeAudioData(musicBytes.slice(0));
    for (let ch = 0; ch < 2; ch++) music.getChannelData(ch).set(decoded.getChannelData(Math.min(ch, decoded.numberOfChannels - 1)).subarray(0, n));
  }
  const sfx = await renderEffects(effects, events, length, rate);
  const mix = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: rate });
  let peak = 0;
  for (let ch = 0; ch < 2; ch++) {
    const m = mix.getChannelData(ch), a = music.getChannelData(ch), b = sfx.getChannelData(ch);
    for (let i = 0; i < n; i++) { m[i] = a[i] + b[i]; peak = Math.max(peak, Math.abs(m[i])); }
  }
  const k = peak > 0 ? 0.89 / peak : 1;
  for (const buf of [music, sfx, mix]) for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < n; i++) d[i] *= k; }
  return { music, sfx, mix };
}

async function renderEffects(set, events, length, rate) {
  seed = 11;
  const ctx = new OfflineAudioContext(2, Math.ceil(length * rate), rate);
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -16; master.ratio.value = 3.5; master.attack.value = 0.003; master.release.value = 0.18;
  master.connect(ctx.destination);
  const bus = ctx.createGain();
  bus.connect(master);
  bus.gain.setValueAtTime(1, length - 0.45);
  bus.gain.linearRampToValueAtTime(0, length);

  // ---------- buffers: reverbs, noise, crackle (sparse sparks), debris (falling bits) ----------
  const buffer = (secs, chs, fill) => { const b = ctx.createBuffer(chs, Math.ceil(rate * secs), rate); for (let c = 0; c < chs; c++) fill(b.getChannelData(c)); return b; };
  const ir = (secs, power) => buffer(secs, 2, (d) => { for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * (1 - i / d.length) ** power; });
  const hall = ctx.createConvolver(); hall.buffer = ir(2.8, 3.2);
  const room = ctx.createConvolver(); room.buffer = ir(0.6, 2.5);
  hall.connect(bus); room.connect(bus);
  const noiseBuf = buffer(2, 1, (d) => { for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; });
  const sparks = (density) => (d) => {
    for (let i = 0; i < d.length; i++) {
      if (rnd() < density(i / d.length)) {
        const a = rr(0.3, 1) * (rnd() < 0.5 ? -1 : 1), n = 10 + Math.floor(rnd() * 40);
        for (let j = 0; j < n && i + j < d.length; j++) d[i + j] += a * Math.exp(-j / (n / 4)) * Math.cos(j * rr(0.6, 2.2));
      }
    }
  };
  const crackleBuf = buffer(1, 1, sparks(() => 0.006));
  const debrisBuf = buffer(1, 1, sparks((x) => 0.003 * (1 - x) ** 2 + 0.0002));
  const curve = (f) => { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) c[i] = f((i / 1023) * 2 - 1); return c; };
  const shapers = {};
  const shaper = (key, f) => { if (!shapers[key]) shapers[key] = curve(f); const s = ctx.createWaveShaper(); s.curve = shapers[key]; s.oversample = '2x'; return s; };

  const out = (dry, hallSend, roomSend = 0) => {
    const g = ctx.createGain(); g.gain.value = dry; g.connect(bus);
    if (hallSend) { const s = ctx.createGain(); s.gain.value = hallSend; g.connect(s).connect(hall); }
    if (roomSend) { const s = ctx.createGain(); s.gain.value = roomSend; g.connect(s).connect(room); }
    return g;
  };
  const fx = out(1, 0.12, 0.35), big = out(1, 0.6, 0.2);

  // ---------- one voice: source -> filters -> drive/crush -> envelope -> pan -> output ----------
  const voice = (src, t, dur, o) => {
    let node = src;
    for (const f of o.filters || []) {
      const b = ctx.createBiquadFilter();
      b.type = f.type || 'lowpass'; b.Q.value = f.q ?? 0.7;
      b.frequency.setValueAtTime(f.f0, t);
      if (f.f1) b.frequency.exponentialRampToValueAtTime(f.f1, t + (f.dur ?? dur));
      node.connect(b); node = b;
    }
    if (o.drive) { const s = shaper(`d${o.drive}`, (x) => Math.tanh(x * o.drive) / Math.tanh(o.drive)); node.connect(s); node = s; }
    if (o.crush) { const s = shaper(`c${o.crush}`, (x) => Math.round(x * o.crush) / o.crush); node.connect(s); node = s; }
    const g = ctx.createGain();
    const a = o.attack ?? 0.002, v = o.vol;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    if (o.release) { g.gain.setValueAtTime(v, Math.max(t + a, t + dur - o.release)); g.gain.linearRampToValueAtTime(0, t + dur); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(o.pan || 0, t);
    if (o.panTo !== undefined) p.pan.linearRampToValueAtTime(o.panTo, t + dur);
    g.connect(p).connect(o.dest || fx);
  };
  const osc = (type, f0, f1, t, dur, o = {}) => {
    const s = ctx.createOscillator();
    s.type = type;
    s.frequency.setValueAtTime(f0, t);
    if (f1) s.frequency.exponentialRampToValueAtTime(f1, t + (o.sweep ?? dur));
    if (o.detune) s.detune.value = o.detune;
    if (o.fm) { // frequency modulation: a modulator at ratio x the carrier, its depth falling from index to index1
      const m = ctx.createOscillator(), mg = ctx.createGain();
      m.frequency.setValueAtTime(f0 * o.fm.ratio, t);
      if (f1) m.frequency.exponentialRampToValueAtTime(f1 * o.fm.ratio, t + (o.sweep ?? dur));
      mg.gain.setValueAtTime(o.fm.index, t);
      mg.gain.exponentialRampToValueAtTime(o.fm.index1 || 1, t + dur);
      m.connect(mg).connect(s.frequency); m.start(t); m.stop(t + dur + 0.05);
    }
    if (o.vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vibrato[0]; lg.gain.value = o.vibrato[1]; l.connect(lg).connect(s.frequency); l.start(t); l.stop(t + dur + 0.05); }
    voice(s, t, dur, o);
    s.start(t); s.stop(t + dur + 0.05);
  };
  const noise = (t, dur, o = {}, buf = noiseBuf) => {
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true;
    s.playbackRate.value = o.rate || 1;
    voice(s, t, dur, o);
    s.start(t, rnd() * (buf.duration - 0.05)); s.stop(t + dur + 0.05);
  };

  effects();
  return ctx.startRendering();

  // =====================================================================================================
  // The sound effects.
  function effects() {
    // --- building blocks ---
    const impact = (t, size = 1) => { // a trailer hit: sub drop, a clipped crack, a body falling into the hall, metal ring
      osc('sine', 95, 24, t, 1.6 * size, { vol: 0.9 * size, dest: big, sweep: 0.6 });
      noise(t, 0.06, { vol: 0.7 * size, dest: big, drive: 8, filters: [{ f0: 7000 }] });
      noise(t, 1.1 * size, { vol: 0.5 * size, dest: big, drive: 2, filters: [{ f0: 2600, f1: 60 }] });
      for (const f of [1180, 1735, 2611]) osc('sine', f, null, t, 1.5 * size, { vol: 0.02 * size, dest: big });
    };
    const swell = (t0, t1, vol = 0.35) => { // reverse whoosh into a cut
      noise(t0, t1 - t0, { vol, attack: (t1 - t0) * 0.95, release: 0.02, dest: big, filters: [{ type: 'highpass', f0: 250, f1: 7000 }] });
      osc('sine', 220, 1100, t0, t1 - t0, { vol: vol * 0.12, attack: (t1 - t0) * 0.95, release: 0.02, dest: big });
    };
    const laser = (t, pan, ion, level) => {
      osc('sine', rr(1500, 1750), 260, t, 0.12, { vol: 0.07 * level, sweep: 0.09, fm: { ratio: 1.5, index: 700, index1: 40 }, drive: 2, pan, filters: [{ f0: 6000 }, { type: 'highpass', f0: 250 }] });
      noise(t, 0.012, { vol: 0.09 * level, pan, filters: [{ type: 'highpass', f0: 4000 }] });
      if (ion) {
        osc('square', 2600, 900, t, 0.05, { vol: 0.018 * level, pan });
        noise(t, 0.07, { vol: 0.08 * level, pan, filters: [{ type: 'bandpass', f0: 5000, q: 1.2 }] }, crackleBuf);
      }
    };
    const explosion = (t, size, pan) => {
      noise(t, 0.035, { vol: 0.32 * size, pan, drive: 6, filters: [{ type: 'bandpass', f0: rr(1500, 2200) }] });
      noise(t, 0.3 * size + 0.12, { vol: 0.3 * size, pan, drive: 3, filters: [{ f0: rr(2600, 3600), f1: 140 }] });
      osc('sine', rr(100, 120), 36, t, 0.3 * size + 0.1, { vol: 0.42 * size, sweep: 0.2 });
      noise(t + 0.02, 0.45 * size, { vol: 0.14 * size, pan: -pan * 0.5, rate: rr(0.8, 1.2), filters: [{ type: 'highpass', f0: 1400 }] }, debrisBuf);
      if (size > 1.2) noise(t, 1.1, { vol: 0.22, attack: 0.02, filters: [{ f0: 320, f1: 80 }], dest: big });
    };
    const zap = (t, pan) => {
      noise(t, 0.17, { vol: 0.55, pan, drive: 4, filters: [{ type: 'bandpass', f0: 3600, q: 0.9 }] }, crackleBuf);
      osc('sine', 3300, 700, t, 0.07, { vol: 0.045, pan });
      osc('sawtooth', 62, null, t, 0.13, { vol: 0.05, pan, filters: [{ f0: 500 }] });
    };
    const takeover = (t, pan) => { // a satellite is rewritten: a swell, a crushed falling tone, sparks, a thud
      noise(t - 0.16, 0.16, { vol: 0.12, attack: 0.15, release: 0.01, pan, filters: [{ type: 'bandpass', f0: 1200, f1: 3200, q: 1.5 }] });
      osc('square', 1400, 110, t, 0.38, { vol: 0.09, sweep: 0.3, crush: 6, pan, filters: [{ f0: 4000 }] });
      noise(t, 0.28, { vol: 0.38, pan, drive: 3, filters: [{ type: 'bandpass', f0: 2500 }] }, crackleBuf);
      osc('sine', 85, 34, t, 0.4, { vol: 0.4, dest: big });
    };
    const klaxon = (t, f, pan = 0) => {
      for (const d of [0, 7]) osc('sawtooth', f, null, t, 0.21, { vol: 0.07, detune: d, attack: 0.01, release: 0.05, drive: 3, pan, filters: [{ type: 'bandpass', f0: f * 2, q: 1.8 }], dest: fx });
    };
    const pod = (t, pan) => { // a launch bay fires: a pneumatic thunk and a hiss
      osc('sine', 180, 52, t, 0.14, { vol: 0.38, pan });
      noise(t, 0.06, { vol: 0.3, pan, drive: 3, filters: [{ type: 'bandpass', f0: 900, q: 1.5 }] });
      noise(t + 0.01, 0.35, { vol: 0.09, pan, filters: [{ type: 'highpass', f0: 3200 }] });
    };
    const metal = (t, pan) => {
      const f = rr(850, 1100);
      for (const k of [1, 1.47, 2.09, 2.76]) osc('sine', f * k, null, t, 0.25, { vol: 0.03, pan });
      noise(t, 0.01, { vol: 0.15, pan, filters: [{ type: 'highpass', f0: 2000 }] });
    };

    // --- the guns: the only effects in the 'shots' set, kept quiet under the music ---
    const all = set === 'all';
    const last = {};
    const every = (kind, t, gap) => { if (t - (last[kind] ?? -9) < gap) return false; last[kind] = t; return true; };
    let side = 1;
    for (const [t, kind] of events) {
      if ((kind === 'shot' || kind === 'ionshot') && every('shot', t, 0.055)) { side = -side; laser(t, side * 0.25, kind === 'ionshot', all ? 1 : 1.8); }
    }
    if (!all) return;

    // --- shot 1: whispers, satellites taken, a swell into the hangar ---
    const E = T.hangar, G = T.game, C = T.combo, B = T.boss, Ti = T.title;
    for (const [f0, f1, pan] of [[95, 88, -0.4], [71, 66, 0.4]]) { // the Collective's robotic whisper, under "IT REWRITES."
      const t0 = 1.4, t1 = E - 0.1;
      const s = ctx.createOscillator(); s.type = 'sawtooth';
      s.frequency.setValueAtTime(f0, t0); s.frequency.linearRampToValueAtTime(f1, t1);
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      const ng = ctx.createGain(); ng.gain.value = 0.6;
      const sum = ctx.createGain();
      s.connect(sum); n.connect(ng).connect(sum);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.09, t0 + 0.15); g.gain.setValueAtTime(0.09, t1 - 0.3); g.gain.linearRampToValueAtTime(0, t1);
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      for (const [f, q] of [[620, 9], [1150, 10], [2500, 12]]) { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; sum.connect(b).connect(g); }
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 7; lg.gain.value = 0.04; lfo.connect(lg).connect(g.gain);
      g.connect(p).connect(big);
      for (const x of [s, n, lfo]) { x.start(t0); x.stop(t1 + 0.05); }
    }
    swell(E - 0.75, E, 0.3);
    impact(E, 0.75);

    // --- shot 2: alarm, ignition, the engines spooling up, the launch, a swell into the gameplay ---
    for (let i = 0, t = E + 0.02; t < G - 0.18; i++, t += 0.27) klaxon(t, i % 2 ? 330 : 415, i % 2 ? -0.25 : 0.25);
    osc('sine', 72, 38, E + 0.05, 0.6, { vol: 0.5, dest: big });
    noise(E + 0.05, 0.55, { vol: 0.45, drive: 2, filters: [{ f0: 1400, f1: 180 }] });
    { // engine roar with a fast flutter, rising
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 0.8;
      b.frequency.setValueAtTime(260, E + 0.1); b.frequency.exponentialRampToValueAtTime(1800, G - 0.15);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, E + 0.1); g.gain.linearRampToValueAtTime(0.3, E + 0.5); g.gain.linearRampToValueAtTime(0.55, G - 0.2); g.gain.linearRampToValueAtTime(0, G - 0.05);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 23; lg.gain.value = 0.12; lfo.connect(lg).connect(g.gain);
      s.connect(b).connect(shaper('d2', (x) => Math.tanh(x * 2) / Math.tanh(2))).connect(g).connect(fx);
      s.start(E + 0.1); s.stop(G); lfo.start(E + 0.1); lfo.stop(G);
    }
    osc('sine', 420, 2400, E + 0.1, G - E - 0.2, { vol: 0.05, attack: 0.4, release: 0.08, vibrato: [11, 18] }); // turbine whine
    osc('sine', 60, 34, G - 0.85, 0.5, { vol: 0.6, dest: big }); // afterburner kick
    noise(G - 0.85, 0.06, { vol: 0.4, drive: 6, filters: [{ f0: 5000 }] });
    noise(G - 0.8, 0.8, { vol: 0.5, attack: 0.55, release: 0.1, pan: -0.3, panTo: 0.3, filters: [{ type: 'bandpass', f0: 500, f1: 6000, q: 1.2 }] });
    swell(G - 0.32, G - 0.03, 0.25);
    impact(G - 0.03, 0.9);

    // --- shots 3-4: the rest of the gameplay, from the logged events ---
    for (const [t, kind] of events) {
      if (kind === 'sat') takeover(t, rr(-0.4, 0.4));
      else if (kind === 'kill' && every(kind, t, 0.045)) explosion(t, rr(0.75, 1), rr(-0.5, 0.5));
      else if (kind === 'killbig' && every(kind, t, 0.1)) explosion(t, 1.5, rr(-0.4, 0.4));
      else if (kind === 'arc' && every(kind, t, 0.07)) zap(t, rr(-0.4, 0.4));
      else if (kind === 'pod') pod(t, rr(-0.5, 0.5));
      else if (kind === 'bosshit' && every(kind, t, 0.07)) metal(t, rr(-0.3, 0.3));
    }
    // the combo: a swell, a shockwave, an electric burst on both sides
    swell(C - 0.25, C, 0.25);
    osc('sine', 150, 28, C, 1.1, { vol: 0.85, dest: big, sweep: 0.5 });
    noise(C, 0.9, { vol: 0.5, drive: 3, dest: big, filters: [{ f0: 5500, f1: 100 }] });
    for (const pan of [-0.7, 0.7]) noise(C, 0.6, { vol: 0.45, pan, drive: 5, filters: [{ type: 'bandpass', f0: 4200, q: 0.8 }] }, crackleBuf);

    // --- the boss: a metal groan and a hum as it arrives, the siren, the core charging, cut to silence ---
    noise(B, 1.3, { vol: 0.55, attack: 0.08, drive: 2, dest: big, filters: [{ type: 'bandpass', f0: 330, f1: 140, q: 12 }] });
    for (const f of [41, 41.7]) osc('sawtooth', f, null, B, 1.4, { vol: 0.18, attack: 0.2, release: 0.3, filters: [{ f0: 200 }] });
    for (let i = 0, t = B; t < B + 0.9; i++, t += 0.225) klaxon(t, i % 2 ? 330 : 440);
    osc('sine', 180, 2000, Ti - 0.45, 0.39, { vol: 0.13, attack: 0.36, release: 0.02 });
    noise(Ti - 0.45, 0.39, { vol: 0.3, attack: 0.36, release: 0.02, filters: [{ type: 'highpass', f0: 900, f1: 9000 }] });
    noise(Ti - 0.45, 0.39, { vol: 0.4, attack: 0.36, release: 0.02, drive: 4, filters: [{ type: 'bandpass', f0: 3000, q: 1 }] }, crackleBuf);

    // --- shot 5: the big hit and a bright shimmer as the emblem lands ---
    impact(Ti, 1.3);
    noise(Ti + 0.02, 0.9, { vol: 0.12, attack: 0.05, dest: big, filters: [{ type: 'bandpass', f0: 6500, f1: 2000, q: 2 }] });
    for (const f of [2093, 3136, 4186]) osc('sine', f, null, Ti + 0.05, 1.4, { vol: 0.02, dest: big });
  }
}

// 16-bit PCM WAV, base64 (to hand the soundtrack from the page to teaser/record.mjs)
export function wavBase64(buf) {
  const n = buf.length, chs = buf.numberOfChannels, bytes = new DataView(new ArrayBuffer(44 + n * chs * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) bytes.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); bytes.setUint32(4, 36 + n * chs * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, chs, true);
  bytes.setUint32(24, buf.sampleRate, true); bytes.setUint32(28, buf.sampleRate * chs * 2, true);
  bytes.setUint16(32, chs * 2, true); bytes.setUint16(34, 16, true); str(36, 'data'); bytes.setUint32(40, n * chs * 2, true);
  const data = [...Array(chs)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < chs; c++) { bytes.setInt16(o, Math.max(-1, Math.min(1, data[c][i])) * 32767, true); o += 2; }
  let s = '';
  const u8 = new Uint8Array(bytes.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}
