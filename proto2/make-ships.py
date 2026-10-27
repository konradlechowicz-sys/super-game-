# Prepares the 2.0 Phantom and Titan for the game from their ChatGPT parts sheets (art/2.0/ship/*-parts-sheet.webp).
# Each sheet carries the assembled ship in its bottom-right corner, drawn at one scale; that drawing becomes the ship's
# body, with its painted engine flames erased, and the sheet's separate flame part is placed on every nozzle so the
# game can animate it (js/v2/renderer.js). Writes proto2/assets/ship-<name>-body.webp, ship-<name>-flame.webp,
# ships.json (flame positions in body pixels) and ship-card-<name>.webp: the whole ship with its flames for the
# hangar and the sector briefing (the Striker's card is its full drawing, art/2.0/ship/striker.webp). Run from the repo root: python3 proto2/make-ships.py
import json
import numpy as np
from PIL import Image

ART = 'art/2.0/ship'
OUT = 'proto2/assets'
BODY_H = 300  # stored height of the body texture, in pixels (about 2x its on-screen size on a phone)

# per ship: the assembled drawing (sheet box), the flame part (sheet box), the nozzles (x, y of the nozzle's lower
# edge in the assembled drawing) and how far below the nozzles the painted flames are erased (sheet box, relative)
SHIPS = {
    'phantom': {
        'body': (985, 107, 1500, 961), 'flame': (380, 760, 485, 960),
        'nozzles': [(257, 690)], 'erase': [(185, 696, 330, 854)],
        'length': 690,  # nose to nozzle, in drawing pixels
        'flame_w': 95,  # width of one flame at its top, in drawing pixels
    },
    'titan': {
        'body': (880, 340, 1481, 981), 'flame': (440, 845, 535, 960),
        'nozzles': [(197, 562), (266, 562), (357, 562), (426, 562)], 'erase': [(150, 566, 475, 641), (0, 0, 60, 150)],  # flames; a corner of the loose wing part
        'length': 562,
        'flame_w': 56,
    },
}


def cut(im, box):
    """Crop and turn the near-black sheet background into transparency (soft edge, keeps glows)."""
    c = np.asarray(im.crop(box).convert('RGB')).astype(np.float32)
    a = np.clip((c.max(axis=2) - 20) / 45, 0, 1)
    rgba = np.dstack([c, a * 255]).astype(np.uint8)
    return rgba


out = {}
for name, s in SHIPS.items():
    sheet = Image.open(f'{ART}/{name}-parts-sheet.webp')
    body = cut(sheet, s['body'])
    for x0, y0, x1, y1 in s['erase']:
        body[y0:y1, x0:x1, 3] = 0
    flame = cut(sheet, s['flame'])
    # trim the flame to its visible pixels
    ys, xs = np.where(flame[:, :, 3] > 8)
    flame = flame[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = BODY_H / body.shape[0]
    b = Image.fromarray(body, 'RGBA')
    b = b.resize((round(b.width * k), BODY_H), Image.LANCZOS)
    b.save(f'{OUT}/ship-{name}-body.webp', 'WEBP', quality=90, method=6)
    fk = s['flame_w'] * k / flame.shape[1]
    f = Image.fromarray(flame, 'RGBA')
    f = f.resize((max(1, round(f.width * fk)), max(1, round(f.height * fk))), Image.LANCZOS)
    f.save(f'{OUT}/ship-{name}-flame.webp', 'WEBP', quality=90, method=6)
    out[name] = {
        'size': [b.width, b.height],
        'nozzles': [[round(x * k, 1), round(y * k, 1)] for x, y in s['nozzles']],
        'length': round(s['length'] * k, 1),
        'flame': [f.width, f.height],
    }
json.dump(out, open(f'{OUT}/ships.json', 'w'))

CARD = 240  # height of the hangar pictures, in pixels


def card(im, name):
    im = im.crop(im.getbbox())
    k = CARD / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(f'{OUT}/ship-card-{name}.webp', 'WEBP', quality=90, method=6)


card(Image.open(f'{ART}/striker.webp').convert('RGBA'), 'striker')
for name, d in out.items():
    b = Image.open(f'{OUT}/ship-{name}-body.webp').convert('RGBA')
    f = Image.open(f'{OUT}/ship-{name}-flame.webp').convert('RGBA')
    c = Image.new('RGBA', (b.width, b.height + f.height), (0, 0, 0, 0))
    for x, y in d['nozzles']:
        c.alpha_composite(f, (round(x - f.width / 2), round(y - 0.12 * f.height)))
    c.alpha_composite(b, (0, 0))
    card(c, name)
print(json.dumps(out))
