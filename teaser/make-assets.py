# Prepares the 2.0 teaser's textures from art/2.0/teaser: full-screen shots at the video size (1080x1920),
# satellites at about 2x their size on screen, and a pre-blurred glow for the boss silhouette.
# The Striker, the world-1 enemies and the floor come from proto2/assets (python3 proto2/make-assets.py).
# Run from the repo root: python3 teaser/make-assets.py
import os
from PIL import Image, ImageFilter

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

# Boss stand-in until the Harvester (brief task A6) is drawn: the elite drone as a dark silhouette with a magenta rim.
elite = Image.open(f'{ART}/enemies/world1/drone-elite.webp').convert('RGBA')
elite = elite.resize((520, round(520 * elite.height / elite.width)), Image.LANCZOS)
save(elite, 'boss')
pad = 120
a = Image.new('L', (elite.width + 2 * pad, elite.height + 2 * pad), 0)
a.paste(elite.getchannel('A'), (pad, pad))
a = a.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(34))
g = Image.new('RGBA', a.size, '#ff2dd0')
g.putalpha(a.point(lambda v: min(255, int(v * 1.5))))
save(g, 'boss-glow')
print('teaser assets ready')
