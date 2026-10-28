# Prepares the world-2 "Siege of Earth" textures for the game from ChatGPT's approved W2 set (art/2.0/worlds/world2,
# see its README and metadata; Art Bible tasks P2-P8): sheet backgrounds (#05010f) become transparency, sizes are
# reduced to what the game needs. Run from the repo root: python3 proto2/make-world2.py
import json
import numpy as np
from PIL import Image, ImageFilter

SRC = 'art/2.0/worlds/world2/graphics'
OUT = 'proto2/assets'


def key(im, lo=18, span=34):
    """Near-black background -> transparent, with a soft edge that keeps dark metal."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    alpha = np.clip((a.max(axis=2) - lo) / span, 0, 1)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')


def cut(im):
    """The sheets' flat background (#05010f, exact in these lossless files) -> transparent. Keyed on the distance from
    that colour, not on brightness, so the dark brown hulls of this world stay opaque."""
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


# P2: night-side Earth seen from low orbit, a seamless tile (opaque; the far layer, 1024 px)
save(Image.open(f'{SRC}/W2-P2-earth-night-2048.webp').convert('RGB').resize((1024, 1024), Image.LANCZOS), 'w2-earth', 86)

# P3: the cloud layer we fly over, a seamless tile; its black gaps become see-through (alpha from brightness)
save(key(Image.open(f'{SRC}/W2-P3-cloud-tile-1024.webp'), 6, 70), 'w2-clouds', 88)

# P4: near overlay (cloud shreds, sparks, rain) on black, added as light: kept opaque
save(Image.open(f'{SRC}/W2-P4-foreground-overlay-1024.webp').convert('RGB'), 'w2-near', 86)

# P5: props. Large (tether node, crashed lander, anti-air wreck) at most 320 px, the rest 200 px. The flak battery and
# the beacon pylon are destructible, each whole and destroyed.
PROPS = {
    'tether-node': 320, 'crashed-lander': 320, 'anti-air-platform-wreck': 320, 'fighter-wreck': 200,
    'burning-debris': 200, 'drone-wreck': 200, 'flak-intact': 200, 'flak-destroyed': 200,
    'beacon-intact': 200, 'beacon-destroyed': 200,
}
for name, cap in PROPS.items():
    save(fit(trim(cut(Image.open(f'{SRC}/W2-P5-props/W2-P5-{name}.webp'))), cap), f'w2-prop-{name}')

# P6: the arena edge, storm-cloud walls lit by lightning: 4 strips repeating lengthwise (1024 x 160) and 4 corners
for name in ('top', 'bottom', 'left', 'right'):
    save(cut(Image.open(f'{SRC}/W2-P6-border-pieces/W2-P6-border-{name}.webp')), f'w2-edge-{name}', 92)
for name in ('top-left', 'top-right', 'bottom-left', 'bottom-right'):
    save(cut(Image.open(f'{SRC}/W2-P6-border-pieces/W2-P6-corner-{name}.webp')), f'w2-edge-{name}', 92)

# P7: the landing force, 6 enemies (facing up) with a glow each, the interceptor elite and 4 debris shards per enemy.
# Game id <- art name; size in px (3 px per unit of the sheet's relative size, like world 1).
ENEMIES = {
    'interceptor': ('interceptor', 90), 'lander': ('lander-pod', 102), 'gunship': ('gunship', 132),
    'skymine': ('sky-mine', 90), 'raider': ('bomber', 132), 'walker': ('siege-walker', 192),
}
GLOW = '#ff2d95'
for gid, (art, size) in ENEMIES.items():
    im = fit(trim(cut(Image.open(f'{SRC}/W2-P7-enemies/W2-P7-{art}.webp'))), size)
    save(im, f'enemy-{gid}')
    pad = size // 3
    a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
    a.paste(im.getchannel('A'), (pad, pad))
    a = a.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(size / 9))
    g = Image.new('RGBA', a.size, GLOW)
    g.putalpha(a.point(lambda v: min(255, int(v * 0.8))))  # softer than world 1: every enemy here glows magenta
    save(g, f'glow-{gid}')
    for n in range(1, 5):
        save(fit(trim(cut(Image.open(f'{SRC}/W2-P7-elite-and-shards/W2-P7-{art}-shard-{n}.webp'))), 160), f'w2-debris-{gid}-{n}', 88)
save(fit(trim(cut(Image.open(f'{SRC}/W2-P7-elite-and-shards/W2-P7-interceptor-elite.webp'))), 300), 'enemy-interceptor-elite')

# P8: the Landing Citadel. The assembled boss (1024 px frame) and its parts cut to their content, so each part's
# center in that frame is its position + half its size (metadata/P8-assembly.json); written to w2-boss.json.
boss = cut(Image.open(f'{SRC}/W2-P8-landing-citadel-1024.webp'))
save(boss, 'w2-boss')
asm = json.load(open('art/2.0/worlds/world2/metadata/P8-assembly.json'))
parts = {}
for p in asm['parts']:
    im = trim(cut(Image.open(f'{SRC}/W2-P8-parts/W2-P8-{p["name"]}.webp')))
    save(im, f'w2-boss-{p["name"]}')
    x, y = p['position_on_boss_png']
    w, h = p['content_size']
    parts[p['name']] = [x + w / 2, y + h / 2]
json.dump({'frame': 1024, 'parts': parts}, open(f'{OUT}/w2-boss.json', 'w'))
print('world 2 assets ready')
