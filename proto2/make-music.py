# Prepares the 2.0 music the game embeds (scripts/v2-assets.mjs) from Konrad's Suno tracks in art/2.0/audio, with
# ffmpeg. Each track plays its intro once and then loops a section (js/audio.js setRecording). The loop points were
# found by analysis (tempo, sections, the most similar sound at both ends, then aligned on the drum hits); around the
# loop end the file repeats the audio around the loop start (see below), so the jump back is seamless.
#   menu: the 2.0 theme (Konrad chose it for the menu): the 24 bars after the drop (142 BPM, drop at 35.5 s)
#   game: world 1 "Orbital Ruins" sector (140.6 BPM): bars 27-65 of the section after the intro (about 65 s)
#   boss: world 1 boss (147.6 BPM): bars 23-49 (about 42 s)
#   game2: world 2 "Siege of Earth" sector (about 146 BPM): 48 bars of the main part (about 79 s); quieter (0.72): its
#          loop is louder than world 1's, the gains match the two (loop RMS 0.207 vs 0.173)
#   boss2: world 2 boss (about 151 BPM, the tempo drifts through the track): 24 bars (about 38 s) where both ends
#          sound most alike; the track starts 8 bars before the loop (`trim`), so the fight gets about 13 s of build-up
#   game3: world 3 "Lunar Bridgehead" sector (about 129.6 BPM): 36 bars (about 67 s) from the main part; 0.83 to
#          match the others (loop RMS 0.181)
#   boss3: world 3 boss (about 136.6 BPM): 40 bars (about 70 s); the track starts 30 bars before the loop (`trim`),
#          so the fight gets about 13 s of build-up
#   game4: world 4 "Red Conversion" sector (about 136.5 BPM): 44 bars (about 77 s) of the main part; 0.85 (loop RMS
#          0.177)
#   boss4: world 4 boss (about 140.5 BPM): 36 bars (about 61.5 s); the track starts 30 beats before the loop (`trim`),
#          about 13 s of build-up; 0.93 (loop RMS 0.162)
#   game5: world 5 "Foundry Belt" sector (about 136 BPM, Konrad's WAV kept as a 320k MP3): 36 bars (about 63.5 s);
#          0.72 (loop RMS 0.209)
#   boss5: world 5 boss (about 140.4 BPM): 24 bars (about 41 s); the track starts 30 beats before the loop (`trim`),
#          about 13 s of build-up; 0.74 (loop RMS 0.204)
#   game6: world 6 "Storm Relay" sector (about 113.8 BPM): 32 bars (about 67.5 s); boss6 (about 117 BPM): 36 bars
#          (about 74 s) with 13 s of build-up (`trim`)
#   game7 / boss7: world 7 "Abyss of Europa" (about 111 / 120 BPM): 32 bars / 24 bars, the boss with 13 s of build-up
#   game8 / boss8: world 8 "The Rift Gate" (about 129 / 137 BPM): 32 bars / 36 bars, the boss with 13 s of build-up
#   game9 / boss9: world 9 "Brood World" (about 137 / 144 BPM): 40 bars / 24 bars, the boss with 13 s of build-up
#   game10 / boss10: world 10 "The Nexus" (about 151 / 152 BPM): 40 bars / 24 bars, the boss with 13 s of build-up
# World 3's to 10's points were searched the same way as world 2's (below).
# The world-2 points (build 100, after Konrad heard a jump): Suno's tempo is not exact, so a loop end taken from the
# bar grid can sit a fraction of a beat off and the drums stumble at the jump. The ends were searched instead: every
# beat as a start, whole-bar lengths, the end tuned in 2.9 ms steps to the best match of the onset envelope (rhythm)
# and band energies (sound) over the 4 s after both points.
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
    'game2': ('art/2.0/audio/w02-siege-of-earth-sector.mp3', 54.3387, 133.1107, 0.72),
    'boss2': ('art/2.0/audio/w02-siege-of-earth-boss.mp3', 75.2972, 113.5889, 1.0, 62.567),
    'game3': ('art/2.0/audio/w03-lunar-bridgehead-sector.mp3', 54.6367, 121.4150, 0.83),
    'boss3': ('art/2.0/audio/w03-lunar-bridgehead-boss.mp3', 44.6934, 114.8890, 1.0, 31.5114),
    'game4': ('art/2.0/audio/w04-red-conversion-sector.mp3', 63.3850, 140.7244, 0.85),
    'boss4': ('art/2.0/audio/w04-red-conversion-boss.mp3', 56.9360, 118.4317, 0.93, 44.1260),
    'game5': ('art/2.0/audio/w05-foundry-belt-sector.mp3', 16.7618, 80.2995, 0.72),
    'boss5': ('art/2.0/audio/w05-foundry-belt-boss.mp3', 40.6500, 81.7792, 0.74, 27.8340),
    # worlds 6-10 (Konrad's WAVs kept as 320k MP3s): ends found by the same search, on half-bar starts
    'game6': ('art/2.0/audio/w06-storm-relay-sector.mp3', 40.1728, 107.6256, 0.92),
    'boss6': ('art/2.0/audio/w06-storm-relay-boss.mp3', 50.4090, 124.1209, 0.88, 37.0840),
    'game7': ('art/2.0/audio/w07-abyss-of-europa-sector.mp3', 62.9558, 132.0199, 0.94),
    'boss7': ('art/2.0/audio/w07-abyss-of-europa-boss.mp3', 69.2134, 117.2062, 0.96, 56.2316),
    'game8': ('art/2.0/audio/w08-rift-gate-sector.mp3', 57.0560, 116.5399, 0.69),
    'boss8': ('art/2.0/audio/w08-rift-gate-boss.mp3', 51.4021, 114.4478, 1.0, 38.2831),
    'game9': ('art/2.0/audio/w09-brood-world-sector.mp3', 43.7290, 113.6233, 0.67),
    'boss9': ('art/2.0/audio/w09-brood-world-boss.mp3', 40.0112, 80.0685, 0.94, 26.6582),
    'game10': ('art/2.0/audio/w10-nexus-sector.mp3', 72.7474, 136.3320, 0.91),
    'boss10': ('art/2.0/audio/w10-nexus-boss.mp3', 41.1736, 79.0553, 1.0, 28.5446),
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
