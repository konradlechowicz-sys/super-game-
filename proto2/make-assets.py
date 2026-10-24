# Prepares the 2.0 prototype's textures from art/2.0: scaled to the size they need in the game (about 2x the
# on-screen size, for sharp phones) plus a pre-blurred glow per enemy, so the game needs no live blur filters.
# Run from the repo root: python3 proto2/make-assets.py
import json
from PIL import Image, ImageFilter

ART = 'art/2.0'
OUT = 'proto2/assets'

def save(im, name):
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=88, method=6)

# Striker parts: positions from assembly.json are in striker.webp pixels; the whole ship becomes SHIP px tall.
SHIP = 240
asm = json.load(open(f'{ART}/ship/parts/assembly.json'))
ref_h = 1201  # height of the ship inside striker.webp
k = SHIP / ref_h
layout = {}
for part in ['hull', 'wing-left', 'wing-right', 'engine-left', 'engine-right', 'flame', 'glass', 'gun']:
    im = Image.open(f'{ART}/ship/parts/striker-{part}.png').convert('RGBA')
    w, h = round(im.width * asm['scale'] * k), round(im.height * asm['scale'] * k)
    save(im.resize((w, h), Image.LANCZOS), f'ship-{part}')
    layout[part] = [w, h]
json.dump({'k': k, 'scale': asm['scale'], 'pos': asm['pos'], 'size': layout}, open(f'{OUT}/ship.json', 'w'))

# Enemies (facing up) and their glow: the silhouette, widened, blurred and tinted in the enemy's color.
ENEMIES = {
    'drone': (96, '#ff2d95'), 'swarmer': (72, '#ffe23d'), 'dasher': (110, '#ff3d9a'), 'shooter': (110, '#ff2d95'),
    'tank': (190, '#b04dff'), 'splitter': (190, '#9dff3d'),
}
for name, (size, color) in ENEMIES.items():
    im = Image.open(f'{ART}/enemies/world1/{name}.png').convert('RGBA')
    s = size / max(im.size)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    save(im, f'enemy-{name}')
    pad = size // 3
    a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
    a.paste(im.getchannel('A'), (pad, pad))
    a = a.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(size / 9))
    g = Image.new('RGBA', a.size, color)
    g.putalpha(a.point(lambda v: min(255, int(v * 1.6))))
    save(g, f'glow-{name}')
elite = Image.open(f'{ART}/enemies/world1/drone-elite.webp').convert('RGBA')
save(elite.resize((300, round(300 * elite.height / elite.width)), Image.LANCZOS), 'enemy-drone-elite')

# The arena floor: the tech-ruin concept (rubble frame around a calm floor).
floor = Image.open(f'{ART}/worlds/tech-ruin-concept.webp').convert('RGB')
floor.save(f'{OUT}/floor-tech-ruin.webp', 'WEBP', quality=86, method=6)
print('assets ready')
