# Prepares the 2.0 music the game embeds (scripts/v2-assets.mjs) from art/2.0/audio, with ffmpeg.
# For now one track: the menu plays the 2.0 theme (Konrad's Suno track) until the M1 "Menu and hangar" track exists:
# its intro once, then the 24 bars after the drop in a loop (bars of 1.6875 s at about 142 BPM, the drop at 35.5 s, so
# the loop seam falls on a phrase start). Writes proto2/assets/music-menu.mp3 and music.json (loop points in seconds).
# Run from the repo root: python3 proto2/make-music.py
import json
import subprocess

SRC = 'art/2.0/audio/void-blaster-theme-suno.mp3'
BAR = 1.6875
DROP = 35.5
LOOP_BARS = 24
end = DROP + LOOP_BARS * BAR
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-t', f'{end + 0.5:.3f}', '-ac', '2', '-ar', '44100',
                '-b:a', '112k', 'proto2/assets/music-menu.mp3'], check=True)
json.dump({'menu': {'loopStart': DROP, 'loopEnd': round(end, 4), 'gain': 0.55}}, open('proto2/assets/music.json', 'w'))
print('menu loop', DROP, '->', round(end, 3), 's')
