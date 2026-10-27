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
