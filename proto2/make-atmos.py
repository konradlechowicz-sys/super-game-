# Prepares the atmosphere of worlds 3-10 (Art Bible tasks W3-P9 ... W10-P9: four soft shapes of the world's air, light
# on black) for js/v2/atmos.js. Originals in art/2.0/worlds/worldN/graphics/WN-P9-atmosphere/WN-P9-*-0K.webp.
# Brightness becomes alpha (black fully transparent), the colour is kept; stored small since the shapes are soft.
# ChatGPT's sheets are dim, so each world's four shapes get one common gain that brings their dense parts (95th
# percentile of alpha) to PEAK, as strong as the code-drawn banks the game's alphas were tuned on.
# Run from the repo root:  python3 proto2/make-atmos.py 3 4 5 6 7 8 9
import glob
import sys
import numpy as np
from PIL import Image

OUT = 'proto2/assets'
SIZE = 384
PEAK = 0.85


def light_to_alpha(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    al = a.max(axis=2, keepdims=True)
    al = np.clip((al - 6) / 249, 0, 1)
    rgb = np.where(al > 0.004, np.clip(a / np.maximum(al, 0.004), 0, 255), 0)
    return Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')


for n in (int(a) for a in sys.argv[1:]):
    files = sorted(glob.glob(f'art/2.0/worlds/world{n}/graphics/W{n}-P9-atmosphere/W{n}-P9-*-0[1-4].webp'))
    assert len(files) == 4, files
    ims = [light_to_alpha(Image.open(f).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)) for f in files]
    arrs = [np.asarray(im).astype(np.float32) for im in ims]
    gain = min(3.0, PEAK / np.mean([np.percentile(a[..., 3] / 255, 95) for a in arrs]))
    for k, a in enumerate(arrs, 1):
        a[..., 3] = np.clip(a[..., 3] * gain, 0, 255)
        Image.fromarray(a.astype(np.uint8), 'RGBA').save(f'{OUT}/w{n}-atmos-{k}.webp', 'WEBP', quality=84, method=6)
    print(n, 'atmosphere', len(files), 'gain', round(float(gain), 2))
