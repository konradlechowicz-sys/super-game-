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


# ---- EL1: elite trait rings (overlays, drawn around an elite by js/render-canvas.js) and their badges; they came
# with transparency.
for t in ('swift', 'bulwark', 'berserker', 'commander', 'shielded'):
    Image.open(f'{SRC}/EL1/selected/EL1-{t}-overlay.webp').convert('RGBA').resize((160, 160), Image.LANCZOS).save(f'{OUT}/fx-el-{t}.webp', 'WEBP', quality=88, method=6)
    Image.open(f'{SRC}/EL1/selected/EL1-{t}-badge.webp').convert('RGBA').resize((40, 40), Image.LANCZOS).save(f'{OUT}/fx-elb-{t}.webp', 'WEBP', quality=90, method=6)

# ---- PU1: pickups in the arena (pu-..., PixiJS textures in js/v2/renderer.js): their flat #05010f background
# becomes transparency.
BG = np.array([5, 1, 15], np.float32)


def cut(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    d = np.abs(a - BG).max(axis=2)
    alpha = np.clip((d - 6) / 14, 0, 1) * 255
    return Image.fromarray(np.dstack([a, alpha]).astype(np.uint8), 'RGBA')


for key, f in (('xp-s', 'xp-crystal-small'), ('xp-m', 'xp-crystal-medium'), ('xp-l', 'xp-crystal-large'), ('coin', 'coin'),
               ('heal', 'repair-kit'), ('magnet', 'magnet'), ('bomb', 'bomb'), ('chest', 'boss-chest-closed')):
    cut(Image.open(f'{SRC}/PU1/selected/PU1-{f}.webp').resize((96, 96), Image.LANCZOS)).save(f'{OUT}/pu-{key}.webp', 'WEBP', quality=88, method=6)
print('elite rings, badges and pickups')


# ---- FX1: projectiles (px-..., PixiJS textures: hundreds at once), pointing right, black -> transparency.
for key, f in (('bolt', 'pulse-blaster'), ('photon', 'photon-storm'), ('pellet', 'scatter-gun'), ('flak', 'flak-cannon'),
               ('missile', 'seeker-missile'), ('swarm', 'swarm-barrage'), ('dronebolt', 'wingman-drone-bolt'),
               ('squadbolt', 'drone-squadron-bolt')):
    light_to_alpha(Image.open(f'{SRC}/FX1/selected/FX1-{f}.webp').resize((64, 32), Image.LANCZOS)).save(f'{OUT}/px-{key}.webp', 'WEBP', quality=88, method=6)
for key, f in (('mine', 'proximity-mine'), ('gmine', 'gravity-mine')):
    im = Image.open(f'{SRC}/FX1/selected/FX1-{f}.webp')
    light_to_alpha(im.crop((64, 0, 192, 128)).resize((48, 48), Image.LANCZOS)).save(f'{OUT}/px-{key}.webp', 'WEBP', quality=88, method=6)

# ---- FX2-FX4, FX8, FX9: drawn by js/render-canvas.js (fx-...)
for c in ('cyan', 'orange', 'red-pink', 'violet', 'electric-blue', 'teal', 'green', 'gold', 'white-blue', 'fire-orange', 'dark-violet'):
    strip(f'FX2/selected/FX2-hit-{c}-8frames', f'hit-{c}', 8, 48)
for size, cell in (('small', 96), ('medium', 128), ('large', 192)):
    strip(f'FX3/selected/FX3-{size}-explosion-8frames', f'boom-{size}', 8, cell)
for i in range(1, 7):
    light_to_alpha(Image.open(f'{SRC}/FX4/selected/FX4-arc-coil-lightning-{i}.webp').resize((256, 32), Image.LANCZOS)).save(f'{OUT}/fx-arc-{i}.webp', 'WEBP', quality=86, method=6)
    light_to_alpha(Image.open(f'{SRC}/FX4/selected/FX4-tempest-lightning-{i}.webp').resize((256, 32), Image.LANCZOS)).save(f'{OUT}/fx-tempest-{i}.webp', 'WEBP', quality=86, method=6)
for src, out, cell in (('nova-ring', 'nova', 192), ('supernova-ring', 'supernova', 192), ('player-shield', 'pshield', 128),
                       ('shield-break', 'pshield-break', 128), ('enemy-shield', 'eshield', 128)):
    strip(f'FX8/selected/FX8-{src}-8frames', out, 8, cell)
for src, out, cell in (('spawn-portal', 'portal', 96), ('warning-circle', 'warn', 128), ('elite-arrival', 'elite-in', 160)):
    strip(f'FX9/selected/FX9-{src}-8frames', out, 8, cell)
print('projectiles and the other effects')
