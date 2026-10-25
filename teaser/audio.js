// The teaser's soundtrack: music and effects synthesized with Web Audio (like the game: no files, no licensing),
// rendered offline into one buffer that matches the animation to the frame. The score follows the five shots;
// the effects follow the events the animation logs (shots, kills, lightning, satellites taken, boss hits).
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const BEAT = 1.7 / 4; // 141 BPM: the combo (5.2 s) lands on the 5th beat after the gameplay starts (3.5 s)
const GAME = 3.5;
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export async function renderAudio(events, length, rate = 48000) {
  seed = 7;
  const ctx = new OfflineAudioContext(2, Math.ceil(length * rate), rate);
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -18; master.ratio.value = 4; master.attack.value = 0.004; master.release.value = 0.2;
  master.connect(ctx.destination);
  const bus = ctx.createGain();
  bus.connect(master);
  // ending: fade the last 0.4 s
  bus.gain.setValueAtTime(1, length - 0.45);
  bus.gain.linearRampToValueAtTime(0, length);
  // reverb from a decaying noise impulse
  const verb = ctx.createConvolver();
  const ir = ctx.createBuffer(2, rate * 2.6, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * (1 - i / d.length) ** 3.2;
  }
  verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = 0.32;
  verb.connect(wet).connect(bus);
  const out = (dry, send) => { const g = ctx.createGain(); g.gain.value = dry; g.connect(bus); const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(verb); return g; };
  const music = out(0.9, 0.5), sfx = out(1, 0.25), dryHit = out(1, 0.7);
  // a dotted-eighth echo for the leads
  const echo = ctx.createDelay(1);
  echo.delayTime.value = BEAT * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.38;
  echo.connect(fb).connect(echo);
  echo.connect(music);
  const noiseBuf = ctx.createBuffer(1, rate * 2, rate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;

  const env = (g, t, dur, vol, attack, release) => {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    if (release) {
      g.gain.setValueAtTime(vol, Math.max(t + attack, t + dur - release));
      g.gain.linearRampToValueAtTime(0, t + dur);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
  };
  const chain = (src, t, dur, { vol, attack = 0.004, release = 0, dest = sfx, filter, pan = 0 }) => {
    let node = src;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.Q.value = filter.q ?? 0.8;
      f.frequency.setValueAtTime(filter.f0, t);
      if (filter.f1) f.frequency.exponentialRampToValueAtTime(filter.f1, t + (filter.dur ?? dur));
      node.connect(f); node = f;
    }
    const g = ctx.createGain();
    env(g, t, dur, vol, attack, release);
    node.connect(g);
    let last = g;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); last = p; }
    last.connect(dest);
  };
  const osc = (type, f0, f1, t, dur, opts) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + (opts.sweep ?? dur));
    if (opts.detune) o.detune.value = opts.detune;
    chain(o, t, dur, opts);
    o.start(t); o.stop(t + dur + 0.05);
  };
  const noise = (t, dur, opts) => {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    chain(s, t, dur, opts);
    s.start(t, rnd()); s.stop(t + dur + 0.05);
  };
  const pad = (notes, t, dur, vol, cut0, cut1, attack = 0.5, release = 0.3) => {
    for (const n of notes) for (const det of [-9, 9]) {
      osc('sawtooth', midi(n), null, t, dur, { vol, attack, release, dest: music, detune: det, pan: det / 30, filter: { f0: cut0, f1: cut1 } });
    }
  };
  const impact = (t, size = 1) => {
    osc('sine', 72, 26, t, 1.1 * size, { vol: 0.8 * size, dest: dryHit, sweep: 0.5 });
    noise(t, 0.9 * size, { vol: 0.5 * size, dest: dryHit, filter: { f0: 4200, f1: 90 } });
    noise(t, 1.6 * size, { vol: 0.16 * size, dest: dryHit, filter: { type: 'highpass', f0: 5000 } });
  };
  const kick = (t, vol = 1) => { osc('sine', 155, 44, t, 0.28, { vol, dest: music, sweep: 0.12 }); noise(t, 0.02, { vol: 0.25, dest: music, filter: { type: 'highpass', f0: 3000 } }); };
  const snare = (t) => { noise(t, 0.2, { vol: 0.55, dest: music, filter: { type: 'bandpass', f0: 1900, q: 0.7 } }); osc('triangle', 230, 130, t, 0.12, { vol: 0.3, dest: music }); };
  const hat = (t, vol) => noise(t, 0.045, { vol, dest: music, filter: { type: 'highpass', f0: 7500 } });

  // ---- shot 1 (0-2 s): a dark drone, the pad opening up, the Collective's whisper, a riser into the cut ----
  osc('sine', midi(26), null, 0, 2.05, { vol: 0.22, attack: 0.8, release: 0.08, dest: music });
  osc('sawtooth', midi(38), null, 0, 2.05, { vol: 0.12, attack: 0.8, release: 0.08, dest: music, filter: { f0: 160, f1: 420 } });
  pad([50, 53, 57, 64], 0, 2.05, 0.045, 700, 2400, 0.6, 0.08);
  for (const [t, kind] of events) if (kind === 'sat') {
    osc('square', 1500, 160, t, 0.24, { vol: 0.06, dest: sfx, filter: { f0: 3200 } });
    osc('sine', 95, 38, t, 0.35, { vol: 0.25, dest: sfx });
    noise(t, 0.09, { vol: 0.1, dest: sfx, filter: { type: 'bandpass', f0: 2600, q: 2 } });
  }
  // whisper: noise through two "vowel" bands, trembling
  for (const [f, pan] of [[720, -0.35], [1180, 0.35]]) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 9;
    const trem = ctx.createGain(); trem.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 9; const depth = ctx.createGain(); depth.gain.value = 0.5;
    lfo.connect(depth).connect(trem.gain);
    s.connect(bp).connect(trem);
    const g = ctx.createGain(); env(g, 0.9, 0.85, 0.5, 0.15, 0.3);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    trem.connect(g).connect(p).connect(sfx);
    s.start(0.9); s.stop(1.8); lfo.start(0.9); lfo.stop(1.8);
  }
  osc('sawtooth', 110, 92, 0.95, 0.8, { vol: 0.05, attack: 0.1, release: 0.3, dest: sfx, filter: { f0: 420 } });
  noise(1.15, 0.85, { vol: 0.28, attack: 0.83, release: 0.02, dest: music, filter: { type: 'highpass', f0: 300, f1: 7000 } });
  impact(2.0, 0.8);

  // ---- shot 2 (2-3.5 s): the alarm, the engines, the launch, the bass building up ----
  for (let i = 0, t = 2.02; t < 3.32; i++, t += 0.27) osc('square', i % 2 ? 660 : 880, null, t, 0.15, { vol: 0.045, release: 0.04, dest: sfx, filter: { f0: 2200 }, pan: i % 2 ? -0.2 : 0.2 });
  noise(2.05, 1.38, { vol: 0.3, attack: 0.5, release: 0.05, dest: sfx, filter: { f0: 180, f1: 1400 } });
  osc('sawtooth', 42, 120, 2.05, 1.38, { vol: 0.14, attack: 0.4, release: 0.05, dest: sfx, filter: { f0: 320 } });
  noise(2.55, 0.88, { vol: 0.45, attack: 0.75, release: 0.06, dest: sfx, filter: { type: 'bandpass', f0: 380, f1: 5200, q: 1.4 } });
  osc('sawtooth', 130, 700, 2.55, 0.88, { vol: 0.05, attack: 0.6, release: 0.06, dest: sfx, filter: { f0: 2500 } });
  for (let i = 0, t = 2.48; t < 3.44; i++, t += BEAT / 4) {
    osc('sawtooth', midi(i % 4 === 2 ? 50 : 38), null, t, BEAT / 4, { vol: 0.03 + 0.07 * ((t - 2.48) / 0.96), dest: music, filter: { f0: 300 + 1500 * ((t - 2.48) / 0.96) } });
  }
  impact(3.47, 1);

  // ---- shots 3-4 (3.5-7 s): the groove; Dm Bb C Am, two beats each ----
  const roots = [38, 34, 36, 33];
  const chords = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]];
  for (let b = 0; GAME + b * BEAT < 6.99; b++) {
    const t = GAME + b * BEAT, ci = Math.floor(b / 2) % 4;
    kick(t);
    if (b % 2) snare(t);
    for (let h = 0; h < 2; h++) hat(t + h * BEAT / 2, h ? 0.2 : 0.1);
    for (let s = 0; s < 4; s++) {
      const n = roots[ci] + (s === 2 ? 12 : 0);
      osc('sawtooth', midi(n), null, t + s * BEAT / 4, BEAT / 4, { vol: 0.15, dest: music, filter: { f0: 1400, f1: 320, dur: BEAT / 4 } });
    }
    // lead arpeggio, echoed
    const ch = chords[ci];
    for (let s = 0; s < 2; s++) osc('square', midi(ch[(b * 2 + s) % 3] + 12), null, t + s * BEAT / 2, BEAT / 2.2, { vol: 0.055, dest: echo, filter: { f0: 3000 } });
    // after the combo: a wide chord stab on every beat
    if (t >= 5.19) pad(ch, t + BEAT / 2, BEAT / 2, 0.028, 3200, 900, 0.01, 0.12);
  }
  // the combo
  impact(5.2, 0.7);
  noise(5.2, 1.4, { vol: 0.22, dest: music, filter: { type: 'highpass', f0: 4500 } });
  osc('sawtooth', 220, 2400, 5.05, 0.18, { vol: 0.06, dest: sfx, filter: { f0: 4000 } });
  [74, 77, 81, 86, 89, 93].forEach((n, i) => osc('triangle', midi(n), null, 5.2 + i * 0.045, 0.5, { vol: 0.07, dest: echo }));

  // ---- the boss (7-8.5 s): drums drop out, a brass "braam", a siren, toms, the core charging ----
  for (const t of [7.0, 7.85]) {
    for (const n of [26, 38, 45]) for (const det of [-12, 0, 12]) {
      osc('sawtooth', midi(n), null, t, 0.85, { vol: 0.04, attack: 0.04, release: 0.4, dest: music, detune: det, filter: { f0: 160, f1: 1500, dur: 0.35 } });
    }
    osc('sine', midi(26), null, t, 0.9, { vol: 0.25, attack: 0.02, release: 0.4, dest: music });
  }
  for (let i = 0, t = 7.0; t < 7.9; i++, t += 0.225) osc('sawtooth', i % 2 ? 330 : 440, null, t, 0.2, { vol: 0.045, release: 0.05, dest: sfx, filter: { f0: 1800 } });
  for (const t of [7.425, 8.06, 8.17, 8.27, 8.34]) osc('sine', 120, 62, t, 0.32, { vol: 0.45, dest: music, sweep: 0.2 });
  osc('sine', 180, 1700, 8.05, 0.39, { vol: 0.14, attack: 0.36, release: 0.02, dest: sfx });
  noise(8.05, 0.39, { vol: 0.32, attack: 0.36, release: 0.02, dest: sfx, filter: { type: 'highpass', f0: 900, f1: 8000 } });

  // ---- shot 5 (8.5-10 s): the big hit, a bright F major chord, a chime on "2.0", a rising pluck ----
  impact(8.5, 1.3);
  pad([53, 57, 60, 67, 69], 8.5, 1.5, 0.026, 2400, 1200, 0.12, 0.4);
  osc('sine', midi(29), null, 8.5, 1.5, { vol: 0.35, attack: 0.05, release: 0.5, dest: music });
  [84, 89, 96].forEach((n, i) => osc('triangle', midi(n), null, 8.95 + i * 0.05, 0.9, { vol: 0.06, dest: echo }));
  [65, 69, 72, 77, 81, 84].forEach((n, i) => osc('triangle', midi(n), null, 9.2 + i * BEAT / 4, 0.3, { vol: 0.05, dest: echo }));

  // ---- effects from the animation's events ----
  const last = {};
  const every = (kind, t, gap) => { if (t - (last[kind] ?? -9) < gap) return false; last[kind] = t; return true; };
  for (const [t, kind] of events) {
    if (kind === 'shot' && every(kind, t, 0.06)) osc('square', 1300, 520, t, 0.05, { vol: 0.025, dest: sfx, pan: rnd() * 0.5 - 0.25, filter: { f0: 3500 } });
    else if (kind === 'kill' && every(kind, t, 0.05)) {
      noise(t, 0.22, { vol: 0.14, dest: sfx, filter: { f0: 1800, f1: 120 }, pan: rnd() * 0.6 - 0.3 });
      osc('sine', 140, 45, t, 0.18, { vol: 0.08, dest: sfx });
    } else if (kind === 'arc' && every(kind, t, 0.08)) {
      noise(t, 0.11, { vol: 0.07, dest: sfx, filter: { type: 'highpass', f0: 3200 } });
      osc('sawtooth', 1000, 240, t, 0.09, { vol: 0.025, dest: sfx });
    } else if (kind === 'bosshit' && every(kind, t, 0.07)) {
      osc('square', 320, 120, t, 0.06, { vol: 0.03, dest: sfx, filter: { f0: 2000 } });
      noise(t, 0.05, { vol: 0.04, dest: sfx, filter: { type: 'bandpass', f0: 2600, q: 2 } });
    }
  }

  const buf = await ctx.startRendering();
  // normalize to -1 dBFS
  let peak = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) for (const v of buf.getChannelData(ch)) peak = Math.max(peak, Math.abs(v));
  const k = peak > 0 ? 0.89 / peak : 1;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return buf;
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
