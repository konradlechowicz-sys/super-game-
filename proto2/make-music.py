# Prepares the 2.0 music the game embeds (scripts/v2-assets.mjs) from Konrad's Suno tracks in art/2.0/audio, with
# ffmpeg. Each track plays its intro once and then loops a section (js/audio.js setRecording). The loop points were
# found by analysis (tempo, sections, the most similar sound at both ends, then aligned on the drum hits); around the
# loop end the file repeats the audio around the loop start (see below), so the jump back is seamless.
#   menu: the 2.0 theme (Konrad chose it for the menu): the 24 bars after the drop (142 BPM, drop at 35.5 s)
#   game: world 1 "Orbital Ruins" sector (140.6 BPM): bars 27-65 of the section after the intro (about 65 s)
#   boss: world 1 boss (147.6 BPM): bars 23-49 (about 42 s)
#   game2: world 2 "Siege of Earth" sector (146.4 BPM): from the drop (bar 24) 48 bars (about 79 s); quieter (0.72):
#          its loop is louder than world 1's, the gains match the two (loop RMS 0.207 vs 0.173)
#   boss2: world 2 boss (150.8 BPM): from bar 24 48 bars (about 76 s); its first 16 bars are cut (`trim`), so the
#          fight gets 8 bars of build-up (about 13 s) instead of 38 s
# A track's optional 5th value `trim` drops that many seconds from the start (the loop points are in the original's
# time and are moved with it).
# Writes proto2/assets/music-<name>.mp3 and music.json. Run from the repo root: python3 proto2/make-music.py
import json
import subprocess
import numpy as np

SR = 48000
FADE = 0.040
TRACKS = {
    'menu': ('art/2.0/audio/void-blaster-theme-suno.mp3', 35.5, 35.5 + 24 * 1.6875, 1.0),
    'game': ('art/2.0/audio/w01-orbital-ruins-sector.mp3', 46.686, 111.542, 0.85),
    'boss': ('art/2.0/audio/w01-orbital-ruins-boss.mp3', 37.7818, 80.0374, 0.85),
    'game2': ('art/2.0/audio/w02-siege-of-earth-sector.mp3', 39.6348, 118.3056, 0.72),
    'boss2': ('art/2.0/audio/w02-siege-of-earth-boss.mp3', 38.3124, 114.6934, 1.0, 25.58),
}

out = {}
for name, (src, start, end, gain, *rest) in TRACKS.items():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-t', f'{end + 0.5:.3f}', '-ac', '2', '-ar', str(SR),
                          '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    trim = rest[0] if rest else 0
    if trim:
        a = a[round(trim * SR):].copy()
        start, end = start - trim, end - trim
    s, e = round(start * SR), round(end * SR)
    fade, exact, tail = round(0.050 * SR), round(0.030 * SR), round(0.4 * SR)
    # Around the loop end the file is made identical to the audio around the loop start (from 30 ms before to 400 ms
    # after it), with a 50 ms equal-power cross-fade before that: so the jump is seamless even if a decoder shifts
    # the whole file by a few tens of milliseconds (MP3 encoder delay).
    k = np.linspace(0, 1, fade)[:, None]
    a0, a1 = e - exact - fade, e - exact
    a[a0:a1] = a[a0:a1] * np.cos(k * np.pi / 2) + a[s - exact - fade:s - exact] * np.sin(k * np.pi / 2)
    a = np.concatenate([a[:a1], a[s - exact:s + tail]])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-b:a', '112k',
                    f'proto2/assets/music-{name}.mp3'], input=a.tobytes(), check=True)
    out[name] = {'loopStart': round(start, 4), 'loopEnd': round(end, 4), 'gain': gain}
    print(name, 'loop', round(start, 2), '->', round(end, 2), 's')
json.dump(out, open('proto2/assets/music.json', 'w'))
