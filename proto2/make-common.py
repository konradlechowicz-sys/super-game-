# Prepares the game textures of the shared 2.0 art (Art Bible tab "Prompty", section "Wspólne dla wszystkich światów";
# ChatGPT's set in art/2.0/common/<task>/selected, see its README.md and manifest.json). Run from the repo root:
#   python3 proto2/make-common.py
# Icons IC1-IC6 (weapons, evolutions, perks, weapon combos, perk sets, super combos): ui-w-<weapon>, ui-e-<weapon>,
# ui-p-<perk>, ui-c-<combo>, matched to the game by their names (js/weapons.js, js/data.js, js/combos.js). They are
# drawn on dark tiles, so they keep their background; the DOM shows them at 40-56 px, stored at 128 px.
import json
import os
import re
import subprocess
import numpy as np
from PIL import Image

SRC = 'art/2.0/common'
OUT = 'proto2/assets'
ICON = 128

names = json.loads(subprocess.run(['node', '-e', """
Promise.all([import('./js/weapons.js'), import('./js/data.js'), import('./js/combos.js')]).then(([w, d, c]) => console.log(JSON.stringify({
  w: Object.fromEntries(Object.entries(w.WEAPONS).map(([k, v]) => [k, v.name])),
  e: Object.fromEntries(Object.entries(w.WEAPONS).filter(([, v]) => v.evo).map(([k, v]) => [k, v.evo.name])),
  p: Object.fromEntries(Object.entries(d.PASSIVES).map(([k, v]) => [k, v.name])),
  c: Object.fromEntries(Object.entries(c.COMBOS).map(([k, v]) => [k, v.name])),
})));"""], check=True, capture_output=True, text=True).stdout)

slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower().replace('&', 'and')).strip('-')


def icon(task, key, name):
    path = f'{SRC}/{task}/selected/{task}-{slug(name)}.webp'
    im = Image.open(path).convert('RGB').resize((ICON, ICON), Image.LANCZOS)
    im.save(f'{OUT}/ui-{key}.webp', 'WEBP', quality=88, method=6)


made = 0
for kind, task in (('w', 'IC1'), ('e', 'IC2'), ('p', 'IC3')):
    for gid, name in names[kind].items():
        icon(task, f'{kind}-{gid}', name); made += 1
for gid, name in names['c'].items():
    for task in ('IC4', 'IC5', 'IC6'):
        if os.path.exists(f'{SRC}/{task}/selected/{task}-{slug(name)}.webp'):
            icon(task, f'c-{gid}', name); made += 1
            break
    else:
        raise SystemExit(f'no icon for combo {gid} ({name})')
# pickup icons the interface also shows (repair and salvage cards, the shop)
for key, f in (('pu-heal', 'repair-kit'), ('pu-coin', 'coin')):
    Image.open(f'{SRC}/PU1/selected/PU1-{f}.webp').convert('RGB').resize((ICON, ICON), Image.LANCZOS).save(f'{OUT}/ui-{key}.webp', 'WEBP', quality=88, method=6)
    made += 1
print(made, 'icons')


# ---- FX5-FX7: the 2.0 weapons' effects (fx-...), drawn by js/render-canvas.js (their black background becomes
# transparency, light_to_alpha). Frame strips are reduced to the size the game draws them at.
def light_to_alpha(im):
    # the effects are light on black: the game draws them on a transparent layer over the 2.0 look, where black would
    # stay black, so brightness becomes alpha and the colour is lifted back to full strength
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    al = a.max(axis=2, keepdims=True)
    al = np.clip((al - 6) / 249, 0, 1)
    rgb = np.where(al > 0.004, np.clip(a / np.maximum(al, 0.004), 0, 255), 0)
    return Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')


def strip(src, out, frames, cell):
    im = Image.open(f'{SRC}/{src}.webp').convert('RGB')
    h = im.height
    w = round(im.width / frames)
    ch = round(cell * h / w)
    light_to_alpha(im.resize((cell * frames, ch), Image.LANCZOS)).save(f'{OUT}/fx-{out}.webp', 'WEBP', quality=86, method=6)


FX = [
    ('FX5/selected/FX5-flame-cone-8frames', 'flame-cone', 8, 256),
    ('FX5/selected/FX5-inferno-flame-cone-8frames', 'inferno-cone', 8, 256),
    ('FX5/selected/FX5-burning-ground-8frames', 'fire-ground', 8, 128),
    ('FX5/selected/FX5-inferno-burning-ground-8frames', 'inferno-ground', 8, 128),
    ('FX5/selected/FX5-burn-8frames', 'burn', 8, 64),
    ('FX6/selected/FX6-orb-8frames', 'hole-orb', 8, 64),
    ('FX6/selected/FX6-event-horizon-orb-8frames', 'eh-orb', 8, 64),
    ('FX6/selected/FX6-black-hole-8frames', 'hole', 8, 192),
    ('FX6/selected/FX6-event-horizon-black-hole-8frames', 'eh-hole', 8, 192),
    ('FX6/selected/FX6-collapse-8frames', 'collapse', 8, 192),
    ('FX6/selected/FX6-event-horizon-collapse-8frames', 'eh-collapse', 8, 192),
    ('FX7/selected/FX7-railgun-beam-body', 'rail-beam', 1, 512),
    ('FX7/selected/FX7-gauss-lance-beam-body', 'gauss-beam', 1, 512),
    ('FX7/selected/FX7-railgun-charge-6frames', 'rail-charge', 6, 64),
    ('FX7/selected/FX7-gauss-lance-charge-6frames', 'gauss-charge', 6, 64),
    ('FX7/selected/FX7-railgun-muzzle-flash-6frames', 'rail-muzzle', 6, 128),
    ('FX7/selected/FX7-gauss-lance-muzzle-flash-6frames', 'gauss-muzzle', 6, 128),
    ('FX7/selected/FX7-railgun-end-blast-6frames', 'rail-end', 6, 128),
    ('FX7/selected/FX7-gauss-lance-end-blast-6frames', 'gauss-end', 6, 128),
]
for src, out, frames, cell in FX:
    strip(src, out, frames, cell)
print(len(FX), 'effect strips')
