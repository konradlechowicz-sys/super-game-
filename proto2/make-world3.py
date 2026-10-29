# Prepares the world-3 "Lunar Bridgehead" textures for the game from ChatGPT's approved W3 set (art/2.0/worlds/world3,
# see its README and metadata; Art Bible tasks P3-P8, no P2: the Moon's ground fills the screen). Sheet backgrounds
# (#05010f) become transparency, sizes are reduced to what the game needs. Run from the repo root:
# python3 proto2/make-world3.py
import json
import numpy as np
from PIL import Image, ImageFilter

SRC = 'art/2.0/worlds/world3/graphics'
OUT = 'proto2/assets'


def cut(im):
    """The sheets' flat background (#05010f, exact in these lossless files) -> transparent. Keyed on the distance from
    that colour, not on brightness, so the near-black shadows of the Moon stay opaque."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    d = np.abs(a - np.array([5, 1, 15], np.float32)).max(axis=2)
    alpha = np.clip((d - 4) / 12, 0, 1)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')


def trim(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())


def fit(im, cap):
    k = min(1, cap / max(im.size))
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def save(im, name, q=90):
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=q, method=6)


# P3: the regolith with rover tracks and small craters, a seamless tile (opaque, the floor of the arena)
save(Image.open(f'{SRC}/W3-P3-regolith-tile-1024.webp').convert('RGB'), 'w3-ground', 84)

# P4: drifting dust and small glints on black, added as light: kept opaque
save(Image.open(f'{SRC}/W3-P4-dust-overlay-1024.webp').convert('RGB'), 'w3-near', 84)

# P5: props. The craters are the world's cover (Game: enemy shots stop at them), so they stay big; the human mortar
# and the Collective's pump are destructible, each whole and destroyed; the supply crate breaks open.
PROPS = {
    'crater-1': 400, 'crater-2': 400, 'crater-3': 400, 'conduit-junction': 360, 'habitat-dome-broken': 260,
    'lunar-rover-wreck': 260, 'comms-antenna-array': 260, 'supply-crate': 120, 'solar-panel': 120,
    'conduit-segment': 120, 'mortar-intact': 220, 'mortar-destroyed': 220, 'pump-intact': 220, 'pump-destroyed': 220,
}
for name, cap in PROPS.items():
    save(fit(trim(cut(Image.open(f'{SRC}/W3-P5-props/W3-P5-{name}.webp'))), cap), f'w3-prop-{name}')

# P6: the arena edge, crater rims and rock ridges: 4 strips repeating lengthwise (1024 x 160) and 4 corners. The pieces'
# outer sides carry a thin light frame line (6 px); it is covered with the rock just inside it.
def unframe(im, sides, n=6):
    a = np.asarray(im.convert('RGB')).copy()
    if 'top' in sides: a[:n] = a[n:2 * n][::-1]
    if 'bottom' in sides: a[-n:] = a[-2 * n:-n][::-1]
    if 'left' in sides: a[:, :n] = a[:, n:2 * n][:, ::-1]
    if 'right' in sides: a[:, -n:] = a[:, -2 * n:-n][:, ::-1]
    return Image.fromarray(a)


for name in ('top', 'bottom', 'left', 'right'):
    save(cut(unframe(Image.open(f'{SRC}/W3-P6-border-pieces/W3-P6-border-{name}.webp'), name)), f'w3-edge-{name}', 90)
for name in ('top-left', 'top-right', 'bottom-left', 'bottom-right'):
    save(cut(unframe(Image.open(f'{SRC}/W3-P6-border-pieces/W3-P6-corner-{name}.webp'), name)), f'w3-edge-{name}', 90)

# P7: the bridgehead's garrison, 6 enemies (facing up) with a glow each, the crawler elite and 4 debris shards per
# enemy. Game id <- art name; size in px (3 px per unit of the sheet's relative size, like worlds 1-2).
ENEMIES = {
    'probe': ('probe-swarm-unit', 66), 'crawler': ('conduit-crawler', 96), 'hopper': ('lunar-hopper', 102),
    'mortarnode': ('mortar-node', 132), 'cturret': ('crater-turret', 144), 'rgolem': ('regolith-golem', 192),
}
GLOW = '#ff2d95'
for gid, (art, size) in ENEMIES.items():
    im = fit(trim(cut(Image.open(f'{SRC}/W3-P7-enemies/W3-P7-{art}.webp'))), size)
    save(im, f'enemy-{gid}')
    pad = size // 3
    a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
    a.paste(im.getchannel('A'), (pad, pad))
    a = a.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(size / 9))
    g = Image.new('RGBA', a.size, GLOW)
    g.putalpha(a.point(lambda v: min(255, int(v * 0.8))))
    save(g, f'glow-{gid}')
    for n in range(1, 5):
        save(fit(trim(cut(Image.open(f'{SRC}/W3-P7-elite-and-shards/W3-P7-{art}-shard-{n}.webp'))), 160), f'w3-debris-{gid}-{n}', 88)
save(fit(trim(cut(Image.open(f'{SRC}/W3-P7-elite-and-shards/W3-P7-conduit-crawler-elite.webp'))), 240), 'enemy-crawler-elite')

# P8: the Moon Spire, built in the game from its parts (the assembled drawing is only the reference, so it is not
# bundled). The parts keep their margin, so the center of each in the boss's 1024 px frame is its position + half its
# size (metadata/P8-assembly.json; checked against the assembled drawing); written to w3-boss.json in drawing order.
# The muzzle flash is an extra effect over the cannon.
asm = json.load(open('art/2.0/worlds/world3/metadata/P8-assembly.json'))
parts = {}
for p in asm['parts']:
    im = cut(Image.open(f'{SRC}/W3-P8-parts/W3-P8-{p["name"]}.webp'))
    save(im, f'w3-boss-{p["name"]}')
    x, y = p['position_on_boss_png']
    parts[p['name']] = [x + im.width / 2, y + im.height / 2]
parts['muzzle-flash'] = parts['cannon-core']
json.dump({'frame': 1024, 'parts': parts}, open(f'{OUT}/w3-boss.json', 'w'))
print('world 3 assets ready')
