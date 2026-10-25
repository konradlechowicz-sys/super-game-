# Prepares the 2.0 teaser's textures from art/2.0/teaser: full-screen shots at the video size (1080x1920),
# satellites at about 2x their size on screen, the world-1 floor, the Harvester boss and the logo emblem.
# The Striker and the world-1 enemies come from proto2/assets (python3 proto2/make-assets.py).
# Run from the repo root: python3 teaser/make-assets.py
import os
from PIL import Image

ART = 'art/2.0'
OUT = 'teaser/assets'
W, H = 1080, 1920
os.makedirs(OUT, exist_ok=True)

def save(im, name, q=88):
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=q, method=6)

def cover(im):
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))

save(cover(Image.open(f'{ART}/teaser/teaser-earth-night.webp').convert('RGB')), 'earth', 90)
save(cover(Image.open(f'{ART}/teaser/teaser-hangar.webp').convert('RGB')), 'hangar', 90)
save(cover(Image.open(f'{ART}/teaser/teaser-collective-web.webp').convert('RGBA')), 'web', 90)

for i in range(1, 5):
    for v in ('', '-rewritten'):
        im = Image.open(f'{ART}/teaser/satellites/satellite-{i}{v}.png').convert('RGBA')
        save(im.resize((round(im.width * 0.6), round(im.height * 0.6)), Image.LANCZOS), f'sat-{i}{v}')

# World-1 floor tile (brief task A1), the Harvester (A6) and its engine flame, the logo emblem (E3)
Image.open(f'{ART}/worlds/world1/floor-tile.webp').convert('RGB').save(f'{OUT}/floor.webp', 'WEBP', quality=88, method=6)
HK = 640 / 1254  # the Harvester's sheets are 1254 px; in the teaser it is 640 px
save(Image.open(f'{ART}/bosses/world1/harvester.webp').convert('RGBA').resize((640, 640), Image.LANCZOS), 'harvester')
for part in ['flame']:
    im = Image.open(f'{ART}/bosses/world1/parts/harvester-{part}.png').convert('RGBA')
    save(im.resize((round(im.width * HK), round(im.height * HK)), Image.LANCZOS), f'h-{part}')
save(Image.open(f'{ART}/ui/logo-emblem.webp').convert('RGBA').resize((760, 760), Image.LANCZOS), 'emblem')
print('teaser assets ready')
