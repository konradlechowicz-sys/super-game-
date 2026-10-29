# Prepares the world-5 "Foundry Belt" textures for the game from ChatGPT's W5 set (art/2.0/worlds/world5, see its README
# and metadata; Art Bible tasks P2-P8). Sheet backgrounds (#05010f) become transparency, sizes are reduced to what the
# game needs. Run from the repo root: python3 proto2/make-world5.py
# The boss is the assembled drawing: its parts are separate renderings that do not match it exactly
# (metadata/W5-P8-attachment-guide.json), so the game lays its glows over the drawing at the guide's mount points.
import json
import numpy as np
from PIL import Image, ImageFilter

SRC = 'art/2.0/worlds/world5/graphics'
OUT = 'proto2/assets'


def cut(im, lo=4, span=12, close=5):
    """The flat background (#05010f) -> transparent, keyed on the distance from that colour; small holes in the darkest
    rock are closed (max, then min filter)."""
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


# P2: deep space with far factory asteroids, seen through the chasms (opaque, the far layer, 1024 px)
save(Image.open(f'{SRC}/W5-P2-factory-space-2048.webp').convert('RGB').resize((1024, 1024), Image.LANCZOS), 'w5-space', 86)
# P3: the terraced factory floor; its chasms are transparent (the RGBA version), so P2 shows through
save(Image.open(f'{SRC}/W5-P3-factory-floor-1024-rgba.webp').convert('RGBA'), 'w5-floor', 86)
# P4: embers, ash and welding sparks on black, added as light
save(Image.open(f'{SRC}/W5-P4-embers-overlay-1024.webp').convert('RGB'), 'w5-near', 84)

# P5: props. The drifting asteroids are the world's moving cover (js/cover.js); the fuel tank and the power capacitor
# are destructible (whole and exploded); the rest is machinery to fly over.
PROPS = {
    'assembly-gantry': 300, 'furnace-pit': 300, 'ore-conveyor': 300, 'drifting-asteroid-1': 240, 'drifting-asteroid-2': 240,
    'drifting-asteroid-3': 240, 'welding-arm': 120, 'ore-cart': 120, 'hull-plates': 120, 'fuel-tank-intact': 220,
    'fuel-tank-destroyed': 220, 'power-capacitor-intact': 220, 'power-capacitor-destroyed': 220,
}
for name, cap in PROPS.items():
    save(fit(trim(cut(Image.open(f'{SRC}/W5-P5-props/W5-P5-{name}.webp'))), cap), f'w5-prop-{name}')

# P6: the arena edge, terrace cliffs with scaffolding, pipes and warning lights: 4 strips and 4 corners
for name in ('top', 'bottom', 'left', 'right'):
    save(cut(Image.open(f'{SRC}/W5-P6-border-pieces/W5-P6-border-{name}.webp'), close=0), f'w5-edge-{name}', 90)
for name in ('top-left', 'top-right', 'bottom-left', 'bottom-right'):
    save(cut(Image.open(f'{SRC}/W5-P6-border-pieces/W5-P6-corner-{name}.webp'), close=0), f'w5-edge-{name}', 90)

# P7: the factory's workers, 6 enemies (facing up) with a glow each, the forge-drone elite and 4 debris shards per
# enemy. Game id <- art name; size in px (3 px per unit of the sheet's relative size, like worlds 1-4).
ENEMIES = {
    'fdrone': ('forge-drone', 96), 'welder': ('welder', 102), 'aturret': ('assembler-turret', 144),
    'drifter': ('rock-drifter', 168), 'hauler': ('ore-hauler', 180), 'wmech': ('worker-mech', 120),
}
GLOW = '#ff2d95'
for gid, (art, size) in ENEMIES.items():
    im = fit(trim(cut(Image.open(f'{SRC}/W5-P7-enemies/W5-P7-{art}.webp'))), size)
    save(im, f'enemy-{gid}')
    pad = size // 3
    a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
    a.paste(im.getchannel('A'), (pad, pad))
    a = a.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(size / 9))
    g = Image.new('RGBA', a.size, GLOW)
    g.putalpha(a.point(lambda v: min(255, int(v * 0.7))))
    save(g, f'glow-{gid}')
    for n in range(1, 5):
        save(fit(trim(cut(Image.open(f'{SRC}/W5-P7-elite-and-shards/W5-P7-{art}-shard-{n}.webp'))), 160), f'w5-debris-{gid}-{n}', 88)
save(fit(trim(cut(Image.open(f'{SRC}/W5-P7-elite-and-shards/W5-P7-forge-drone-elite.webp'))), 240), 'enemy-fdrone-elite')

# P8: the Foundry Mother, the assembled drawing (1024 frame, facing up) and the guide's mount points of its glows:
# the two assembly-bay locks and the two furnace vents (weak points), the bays (where it builds enemies)
save(cut(Image.open(f'{SRC}/W5-P8-foundry-mother-1024.webp')), 'w5-boss', 90)
guide = json.load(open('art/2.0/worlds/world5/metadata/W5-P8-attachment-guide.json'))['mount_reference_centers']
json.dump({'frame': 1024, 'weak': [guide[f'weak-point-{n}'] for n in ('bay-west', 'bay-east', 'furnace-west', 'furnace-east')],
           'bays': [guide['bay-west'], guide['bay-east']], 'core': [512, 512]}, open(f'{OUT}/w5-boss.json', 'w'))
print('world 5 assets ready')
