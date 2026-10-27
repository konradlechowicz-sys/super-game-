# Prepares the world-1 "Orbital Ruins" textures for the game from the ChatGPT art in art/2.0/worlds/world1 (tasks of
# the Art Bible, tab "Prompty", world 1): the near-black sheet background becomes transparency, sizes are reduced to
# what the game needs. Run from the repo root: python3 proto2/make-world1.py
import numpy as np
from PIL import Image

SRC = 'art/2.0/worlds/world1'
OUT = 'proto2/assets'


def key(im):
    """Near-black background (#05010f) -> transparent, with a soft edge that keeps dark metal."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    alpha = np.clip((a.max(axis=2) - 18) / 34, 0, 1)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')


# P3a: the sparse field of small wreckage, a seamless tile (768 px; the game draws it at 1024 world units)
debris = key(Image.open(f'{SRC}/debris-tile.webp')).resize((768, 768), Image.LANCZOS)
debris.save(f'{OUT}/w1-debris.webp', 'WEBP', quality=90, method=6)
print('w1-debris', debris.size)

# P3b: 4 broken deck fragments of the defense stations, one per quadrant of the sheet, each cut to its own bounding
# box (stored at most 640 px; the game draws them 380-640 world units across)
sheet = key(Image.open(f'{SRC}/deck-islands-sheet.webp'))
W, H = sheet.size
for i, (qx, qy) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
    part = sheet.crop((qx * W // 2, qy * H // 2, (qx + 1) * W // 2, (qy + 1) * H // 2))
    part = part.crop(part.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    k = min(1, 640 / max(part.size))
    part = part.resize((round(part.width * k), round(part.height * k)), Image.LANCZOS)
    part.save(f'{OUT}/w1-island-{i + 1}.webp', 'WEBP', quality=90, method=6)
    print(f'w1-island-{i + 1}', part.size)

# P5: props, cut by their place on the sheet (3 large, 3 small, then the fuel tank and the ammo crate, each whole and
# destroyed), each to its own bounding box. Large ones are stored at most 320 px, the rest at most 200 px.
props = key(Image.open(f'{SRC}/props-sheet.webp'))
BOXES = {
    'mast': (100, 160, 420, 500), 'solar': (480, 180, 760, 480), 'turret': (840, 210, 1160, 470),
    'sat': (180, 640, 340, 790), 'pod': (560, 650, 690, 760), 'cables': (910, 660, 1090, 760),
    'tank': (90, 920, 300, 1080), 'tank-broken': (380, 920, 590, 1080),
    'crate': (670, 920, 860, 1080), 'crate-broken': (960, 920, 1150, 1080),
}
for name, box in BOXES.items():
    part = props.crop(box)
    part = part.crop(part.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    cap = 320 if name in ('mast', 'solar', 'turret') else 200
    k = min(1, cap / max(part.size))
    part = part.resize((round(part.width * k), round(part.height * k)), Image.LANCZOS)
    part.save(f'{OUT}/w1-prop-{name}.webp', 'WEBP', quality=90, method=6)
    print(f'w1-prop-{name}', part.size)

# P6: the arena edge, a ring of station wreckage with amber hexagonal shield fragments on the arena side. ChatGPT
# delivered the pieces ready (art/2.0/worlds/world1/border, see its README): 4 strips that repeat lengthwise
# (1024 x 160) and 4 corners (256); only the background becomes transparent.
for name in ('top', 'bottom', 'left', 'right'):
    size = '1024x160' if name in ('top', 'bottom') else '160x1024'
    key(Image.open(f'{SRC}/border/W1-P6-border-{name}-{size}.png')).save(f'{OUT}/w1-edge-{name}.webp', 'WEBP', quality=92, method=6)
for name in ('top-left', 'top-right', 'bottom-left', 'bottom-right'):
    key(Image.open(f'{SRC}/border/W1-P6-corner-{name}-256.png')).save(f'{OUT}/w1-edge-{name}.webp', 'WEBP', quality=92, method=6)
print('w1-edge: 4 strips, 4 corners')

# P2: the far background, night-side Earth from high orbit. The stars are left out (the game draws its own, with
# parallax): the Earth's circle is found from its blue rim and everything outside it, past a soft edge that keeps
# the rim's glow, becomes transparent. Stored at 1280 px.
src = Image.open(f'{SRC}/earth-far.webp').convert('RGB')
a = np.asarray(src).astype(np.float32)
ys, xs = np.nonzero((a[..., 2] > 140) & (a[..., 2] > a[..., 0] + 50))
A = np.c_[2 * xs, 2 * ys, np.ones(len(xs))]
ecx, ecy, c = np.linalg.lstsq(A, xs ** 2 + ys ** 2, rcond=None)[0]
er = np.sqrt(c + ecx ** 2 + ecy ** 2)
yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
alpha = np.clip(1 - (np.hypot(xx - ecx, yy - ecy) - er) / 40, 0, 1)
earth = Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA').resize((1280, 1280), Image.LANCZOS)
earth.save(f'{OUT}/w1-earth.webp', 'WEBP', quality=90, method=6)
print('w1-earth', earth.size, 'circle', round(ecx), round(ecy), round(er))

# P4: the near overlay (dust and small shards just in front of the camera), on black: the game adds it as light,
# so it keeps its black background. A seamless 1024 tile.
Image.open(f'{SRC}/near-overlay.webp').convert('RGB').save(f'{OUT}/w1-near.webp', 'WEBP', quality=90, method=6)
print('w1-near')

# P8: the world-1 boss, the Harvester (art/2.0/bosses/world1, made before the Art Bible and kept): the assembled ship,
# plus its glowing parts from the parts sheet, which the game lays over it and animates (core, pods, nose) and the
# engine flame. Everything shares the assembled ship's 1254 px frame, stored at 1024 px (scale 1024/1254).
BOSS = 'art/2.0/bosses/world1'
k = 1024 / 1254
Image.open(f'{BOSS}/harvester.webp').convert('RGBA').resize((1024, 1024), Image.LANCZOS).save(f'{OUT}/w1-boss.webp', 'WEBP', quality=90, method=6)
for part in ('glow-core', 'glow-pod-left', 'glow-pod-right', 'glow-nose', 'flame'):
    im = Image.open(f'{BOSS}/parts/harvester-{part}.png').convert('RGBA')
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.save(f'{OUT}/w1-boss-{part}.webp', 'WEBP', quality=90, method=6)
print('w1-boss + 5 parts')
