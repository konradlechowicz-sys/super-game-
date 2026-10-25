// The teaser's sound, synthesized with Web Audio like the game (no files, no licensing) and rendered offline so it
// matches the animation to the frame. Two stems: the music (a stand-in until the Suno track) and the sound effects,
// which follow the events the animation logs. Every effect is layered: a sharp transient, a body (often driven
// through a soft clipper), a low thump, and a tail in a room or hall reverb.
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const BEAT = 1.7 / 4; // 141 BPM: the combo (5.2 s) lands on the 5th beat after the gameplay starts (3.5 s)
const GAME = 3.5;
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const rr = (a, b) => a + rnd() * (b - a);

// music and effects as separate buffers, plus their mix; all three share one gain that puts the mix at -1 dBFS
export async function renderSoundtrack(events, length, rate = 48000) {
  const music = await renderStem('music', events, length, rate);
  const sfx = await renderStem('sfx', events, length, rate);
  const mix = new AudioBuffer({ length: music.length, numberOfChannels: 2, sampleRate: rate });
  let peak = 0;
  for (let ch = 0; ch < 2; ch++) {
    const m = mix.getChannelData(ch), a = music.getChannelData(ch), b = sfx.getChannelData(ch);
    for (let i = 0; i < m.length; i++) { m[i] = a[i] + b[i]; peak = Math.max(peak, Math.abs(m[i])); }
  }
  const k = peak > 0 ? 0.89 / peak : 1;
  for (const buf of [music, sfx, mix]) for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return { music, sfx, mix };
}

async function renderStem(stem, events, length, rate) {
  seed = stem === 'music' ? 7 : 11;
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
  const mus = out(0.9, 0.45), fx = out(1, 0.12, 0.35), big = out(1, 0.6, 0.2);
  const echo = ctx.createDelay(1);
  echo.delayTime.value = BEAT * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.38;
  echo.connect(fb).connect(echo);
  echo.connect(mus);

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

  if (stem === 'music') music(); else effects();
  return ctx.startRendering();

  // =====================================================================================================
  // The music: a stand-in score until the Suno track arrives. Dm drone, groove at 141 BPM, braams, F major end.
  function music() {
    const pad = (notes, t, dur, vol, cut0, cut1, attack = 0.5, release = 0.3) => {
      for (const n of notes) for (const det of [-9, 9]) osc('sawtooth', midi(n), null, t, dur, { vol, attack, release, dest: mus, detune: det, pan: det / 30, filters: [{ f0: cut0, f1: cut1 }] });
    };
    const kick = (t) => { osc('sine', 155, 44, t, 0.28, { vol: 1, dest: mus, sweep: 0.12 }); noise(t, 0.02, { vol: 0.25, dest: mus, filters: [{ type: 'highpass', f0: 3000 }] }); };
    const snare = (t) => { noise(t, 0.2, { vol: 0.55, dest: mus, filters: [{ type: 'bandpass', f0: 1900 }] }); osc('triangle', 230, 130, t, 0.12, { vol: 0.3, dest: mus }); };
    const hat = (t, vol) => noise(t, 0.045, { vol, dest: mus, filters: [{ type: 'highpass', f0: 7500 }] });

    osc('sine', midi(26), null, 0, 2.05, { vol: 0.22, attack: 0.8, release: 0.08, dest: mus });
    osc('sawtooth', midi(38), null, 0, 2.05, { vol: 0.12, attack: 0.8, release: 0.08, dest: mus, filters: [{ f0: 160, f1: 420 }] });
    pad([50, 53, 57, 64], 0, 2.05, 0.045, 700, 2400, 0.6, 0.08);
    for (let i = 0, t = 2.48; t < 3.44; i++, t += BEAT / 4) {
      osc('sawtooth', midi(i % 4 === 2 ? 50 : 38), null, t, BEAT / 4, { vol: 0.03 + 0.07 * ((t - 2.48) / 0.96), dest: mus, filters: [{ f0: 300 + 1500 * ((t - 2.48) / 0.96) }] });
    }
    const roots = [38, 34, 36, 33];
    const chords = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]];
    for (let b = 0; GAME + b * BEAT < 6.99; b++) {
      const t = GAME + b * BEAT, ci = Math.floor(b / 2) % 4;
      kick(t);
      if (b % 2) snare(t);
      for (let h = 0; h < 2; h++) hat(t + (h * BEAT) / 2, h ? 0.2 : 0.1);
      for (let s = 0; s < 4; s++) osc('sawtooth', midi(roots[ci] + (s === 2 ? 12 : 0)), null, t + (s * BEAT) / 4, BEAT / 4, { vol: 0.15, dest: mus, filters: [{ f0: 1400, f1: 320, dur: BEAT / 4 }] });
      const ch = chords[ci];
      for (let s = 0; s < 2; s++) osc('square', midi(ch[(b * 2 + s) % 3] + 12), null, t + (s * BEAT) / 2, BEAT / 2.2, { vol: 0.055, dest: echo, filters: [{ f0: 3000 }] });
      if (t >= 5.19) pad(ch, t + BEAT / 2, BEAT / 2, 0.028, 3200, 900, 0.01, 0.12);
    }
    noise(5.2, 1.4, { vol: 0.22, dest: mus, filters: [{ type: 'highpass', f0: 4500 }] });
    [74, 77, 81, 86, 89, 93].forEach((n, i) => osc('triangle', midi(n), null, 5.2 + i * 0.045, 0.5, { vol: 0.07, dest: echo }));
    for (const t of [7.0, 7.85]) {
      for (const n of [26, 38, 45]) for (const det of [-12, 0, 12]) osc('sawtooth', midi(n), null, t, 0.85, { vol: 0.04, attack: 0.04, release: 0.4, dest: mus, detune: det, filters: [{ f0: 160, f1: 1500, dur: 0.35 }] });
      osc('sine', midi(26), null, t, 0.9, { vol: 0.25, attack: 0.02, release: 0.4, dest: mus });
    }
    for (const t of [7.425, 8.06, 8.17, 8.27, 8.34]) osc('sine', 120, 62, t, 0.32, { vol: 0.45, dest: mus, sweep: 0.2 });
    pad([53, 57, 60, 67, 69], 8.5, 1.5, 0.026, 2400, 1200, 0.12, 0.4);
    osc('sine', midi(29), null, 8.5, 1.5, { vol: 0.35, attack: 0.05, release: 0.5, dest: mus });
    [84, 89, 96].forEach((n, i) => osc('triangle', midi(n), null, 8.95 + i * 0.05, 0.9, { vol: 0.06, dest: echo }));
    [65, 69, 72, 77, 81, 84].forEach((n, i) => osc('triangle', midi(n), null, 9.2 + (i * BEAT) / 4, 0.3, { vol: 0.05, dest: echo }));
  }

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
    const laser = (t, pan, ion) => {
      osc('sine', rr(1500, 1750), 260, t, 0.12, { vol: 0.07, sweep: 0.09, fm: { ratio: 1.5, index: 700, index1: 40 }, drive: 2, pan, filters: [{ f0: 6000 }] });
      noise(t, 0.012, { vol: 0.09, pan, filters: [{ type: 'highpass', f0: 4000 }] });
      if (ion) {
        osc('square', 2600, 900, t, 0.05, { vol: 0.018, pan });
        noise(t, 0.07, { vol: 0.08, pan, filters: [{ type: 'bandpass', f0: 5000, q: 1.2 }] }, crackleBuf);
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

    // --- shot 1: whispers, satellites taken, a swell into the hangar ---
    for (const [f0, f1, pan] of [[95, 88, -0.4], [71, 66, 0.4]]) { // the Collective's robotic whisper
      const s = ctx.createOscillator(); s.type = 'sawtooth';
      s.frequency.setValueAtTime(f0, 0.85); s.frequency.linearRampToValueAtTime(f1, 1.75);
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      const ng = ctx.createGain(); ng.gain.value = 0.6;
      const sum = ctx.createGain();
      s.connect(sum); n.connect(ng).connect(sum);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, 0.85); g.gain.linearRampToValueAtTime(0.09, 1.0); g.gain.setValueAtTime(0.09, 1.5); g.gain.linearRampToValueAtTime(0, 1.78);
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      for (const [f, q] of [[620, 9], [1150, 10], [2500, 12]]) { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; sum.connect(b).connect(g); }
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 7; lg.gain.value = 0.04; lfo.connect(lg).connect(g.gain);
      g.connect(p).connect(big);
      for (const x of [s, n, lfo]) { x.start(0.85); x.stop(1.8); }
    }
    swell(1.25, 2.0, 0.3);
    impact(2.0, 0.75);

    // --- shot 2: alarm, ignition, the engines spooling up, the launch, a swell into the gameplay ---
    for (let i = 0, t = 2.02; t < 3.32; i++, t += 0.27) klaxon(t, i % 2 ? 330 : 415, i % 2 ? -0.25 : 0.25);
    osc('sine', 72, 38, 2.05, 0.6, { vol: 0.5, dest: big });
    noise(2.05, 0.55, { vol: 0.45, drive: 2, filters: [{ f0: 1400, f1: 180 }] });
    { // engine roar with a fast flutter, rising
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 0.8;
      b.frequency.setValueAtTime(260, 2.1); b.frequency.exponentialRampToValueAtTime(1800, 3.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, 2.1); g.gain.linearRampToValueAtTime(0.3, 2.5); g.gain.linearRampToValueAtTime(0.55, 3.3); g.gain.linearRampToValueAtTime(0, 3.45);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 23; lg.gain.value = 0.12; lfo.connect(lg).connect(g.gain);
      s.connect(b).connect(shaper('d2', (x) => Math.tanh(x * 2) / Math.tanh(2))).connect(g).connect(fx);
      s.start(2.1); s.stop(3.5); lfo.start(2.1); lfo.stop(3.5);
    }
    osc('sine', 420, 2400, 2.1, 1.3, { vol: 0.05, attack: 0.4, release: 0.08, vibrato: [11, 18] }); // turbine whine
    osc('sine', 60, 34, 2.55, 0.5, { vol: 0.6, dest: big }); // afterburner kick
    noise(2.55, 0.06, { vol: 0.4, drive: 6, filters: [{ f0: 5000 }] });
    noise(2.6, 0.8, { vol: 0.5, attack: 0.55, release: 0.1, pan: -0.3, panTo: 0.3, filters: [{ type: 'bandpass', f0: 500, f1: 6000, q: 1.2 }] });
    swell(3.15, 3.47, 0.25);
    impact(3.47, 0.9);

    // --- shots 3-4: the gameplay, from the logged events ---
    const last = {};
    const every = (kind, t, gap) => { if (t - (last[kind] ?? -9) < gap) return false; last[kind] = t; return true; };
    let side = 1;
    for (const [t, kind] of events) {
      if (kind === 'sat') takeover(t, rr(-0.4, 0.4));
      else if ((kind === 'shot' || kind === 'ionshot') && every('shot', t, 0.055)) { side = -side; laser(t, side * 0.25, kind === 'ionshot'); }
      else if (kind === 'kill' && every(kind, t, 0.045)) explosion(t, rr(0.75, 1), rr(-0.5, 0.5));
      else if (kind === 'killbig' && every(kind, t, 0.1)) explosion(t, 1.5, rr(-0.4, 0.4));
      else if (kind === 'arc' && every(kind, t, 0.07)) zap(t, rr(-0.4, 0.4));
      else if (kind === 'pod') pod(t, rr(-0.5, 0.5));
      else if (kind === 'bosshit' && every(kind, t, 0.07)) metal(t, rr(-0.3, 0.3));
    }
    // the combo: a swell, a shockwave, an electric burst on both sides
    swell(4.95, 5.2, 0.25);
    osc('sine', 150, 28, 5.2, 1.1, { vol: 0.85, dest: big, sweep: 0.5 });
    noise(5.2, 0.9, { vol: 0.5, drive: 3, dest: big, filters: [{ f0: 5500, f1: 100 }] });
    for (const pan of [-0.7, 0.7]) noise(5.2, 0.6, { vol: 0.45, pan, drive: 5, filters: [{ type: 'bandpass', f0: 4200, q: 0.8 }] }, crackleBuf);

    // --- the boss: a metal groan and a hum as it arrives, the siren, the core charging, cut to silence ---
    noise(7.0, 1.3, { vol: 0.55, attack: 0.08, drive: 2, dest: big, filters: [{ type: 'bandpass', f0: 330, f1: 140, q: 12 }] });
    for (const f of [41, 41.7]) osc('sawtooth', f, null, 7.0, 1.4, { vol: 0.18, attack: 0.2, release: 0.3, filters: [{ f0: 200 }] });
    for (let i = 0, t = 7.0; t < 7.9; i++, t += 0.225) klaxon(t, i % 2 ? 330 : 440);
    osc('sine', 180, 2000, 8.05, 0.39, { vol: 0.13, attack: 0.36, release: 0.02 });
    noise(8.05, 0.39, { vol: 0.3, attack: 0.36, release: 0.02, filters: [{ type: 'highpass', f0: 900, f1: 9000 }] });
    noise(8.05, 0.39, { vol: 0.4, attack: 0.36, release: 0.02, drive: 4, filters: [{ type: 'bandpass', f0: 3000, q: 1 }] }, crackleBuf);

    // --- shot 5: the big hit and a bright shimmer as the emblem lands ---
    impact(8.5, 1.3);
    noise(8.52, 0.9, { vol: 0.12, attack: 0.05, dest: big, filters: [{ type: 'bandpass', f0: 6500, f1: 2000, q: 2 }] });
    for (const f of [2093, 3136, 4186]) osc('sine', f, null, 8.55, 1.4, { vol: 0.02, dest: big });
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
