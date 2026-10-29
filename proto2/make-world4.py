# Prepares the world-4 "Red Conversion" textures for the game from ChatGPT's W4 set (art/2.0/worlds/world4, see its
# metadata; Art Bible tasks P3a-P8, no P2: the dust of Mars fills the screen). Sheet backgrounds (#05010f) become
# transparency, sizes are reduced to what the game needs. Run from the repo root: python3 proto2/make-world4.py
# The boss is the assembled drawing: its parts are separate
# renderings that do not match it exactly (metadata/W4-P8-attachment-guide.json), so the game lays its glows over the
# drawing at the guide's mount points instead of building it from parts.
import json
import numpy as np
from PIL import Image, ImageFilter

SRC = 'art/2.0/worlds/world4/graphics'
OUT = 'proto2/assets'


def cut(im, lo=4, span=12, close=7):
    """The flat background (#05010f) -> transparent, keyed on the distance from that colour. The black crystal comes
    close to that colour in its darkest facets, so the small holes it would leave are closed (max, then min filter)."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    d = np.abs(a - np.array([5, 1, 15], np.float32)).max(axis=2)
    alpha = Image.fromarray((np.clip((d - lo) / span, 0, 1) * 255).astype(np.uint8), 'L')
    if close: alpha = alpha.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    return Image.fromarray(np.dstack([a, np.asarray(alpha)]).astype(np.uint8), 'RGBA')


def trim(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())


def fit(im, cap):
    k = min(1, cap / max(im.size))
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def save(im, name, q=90):
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=q, method=6)


# P3a / P3b: the dust of Mars and the same ground under the black crystal (the game blends them where the crystal
# network has grown); P4: wind-blown dust on black, added as light
save(Image.open(f'{SRC}/W4-P3a-martian-dust-1024.webp').convert('RGB'), 'w4-ground', 84)
save(Image.open(f'{SRC}/W4-P3b-crystal-conversion-1024.webp').convert('RGB'), 'w4-crystal', 84)
save(Image.open(f'{SRC}/W4-P4-dust-overlay-1024.webp').convert('RGB'), 'w4-near', 84)

# P5: props. The crystal cluster and the converted pylon are destructible (whole and shattered); the
# growth node is where the crystal network spreads from.
PROPS = {
    'crystal-spires': 300, 'half-converted-habitat': 300, 'growth-node': 300, 'buried-rover': 120, 'crystal-shards': 120,
    'supply-drop': 120, 'crystal-intact': 240, 'crystal-destroyed': 240, 'pylon-intact': 260, 'pylon-destroyed': 260,
}
for name, cap in PROPS.items():
    save(fit(trim(cut(Image.open(f'{SRC}/W4-P5-props/W4-P5-{name}.webp'))), cap), f'w4-prop-{name}')

# P6: the arena edge, red canyon walls with black crystal cliffs: 4 strips repeating lengthwise and 4 corners
for name in ('top', 'bottom', 'left', 'right'):
    save(cut(Image.open(f'{SRC}/W4-P6-border-pieces/W4-P6-border-{name}.webp'), 6, 12), f'w4-edge-{name}', 90)
for name in ('top-left', 'top-right', 'bottom-left', 'bottom-right'):
    save(cut(Image.open(f'{SRC}/W4-P6-border-pieces/W4-P6-corner-{name}.webp'), 6, 12), f'w4-edge-{name}', 90)

# P7: the converted, 6 enemies (facing up) with a glow each, the shard-drone elite and 4 debris shards per enemy.
# Game id <- art name; size in px (3 px per unit of the sheet's relative size, like worlds 1-3).
ENEMIES = {
    'mite': ('crystal-mite', 72), 'sdrone': ('shard-drone', 96), 'stalker': ('dust-stalker', 108),
    'prismnode': ('prism-node', 120), 'spreader': ('spreader', 150), 'cgolem': ('crystal-golem', 198),
}
GLOW = '#ff2d95'
for gid, (art, size) in ENEMIES.items():
    im = fit(trim(cut(Image.open(f'{SRC}/W4-P7-enemies/W4-P7-{art}.webp'))), size)
    save(im, f'enemy-{gid}')
    pad = size // 3
    a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
    a.paste(im.getchannel('A'), (pad, pad))
    a = a.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(size / 9))
    g = Image.new('RGBA', a.size, GLOW)
    g.putalpha(a.point(lambda v: min(255, int(v * 0.7))))
    save(g, f'glow-{gid}')
    for n in range(1, 5):
        save(fit(trim(cut(Image.open(f'{SRC}/W4-P7-elite-and-shards/W4-P7-{art}-shard-{n}.webp'))), 160), f'w4-debris-{gid}-{n}', 88)
save(fit(trim(cut(Image.open(f'{SRC}/W4-P7-elite-and-shards/W4-P7-shard-drone-elite.webp'))), 240), 'enemy-sdrone-elite')

# P8: the Red Colossus, the assembled drawing (1024 frame, facing up) and the guide's mount points of its glows
save(cut(Image.open(f'{SRC}/W4-P8-red-colossus-1024.webp')), 'w4-boss', 90)
guide = json.load(open('art/2.0/worlds/world4/metadata/W4-P8-attachment-guide.json'))['mount_reference_centers']
json.dump({'frame': 1024, 'weak': [guide[f'weak-point-{n}'] for n in ('nw', 'ne', 'sw', 'se')],
           'cannons': [guide['cannon-west'], guide['cannon-east']], 'core': [512, 470]}, open(f'{OUT}/w4-boss.json', 'w'))
print('world 4 assets ready')
