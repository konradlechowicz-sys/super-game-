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
