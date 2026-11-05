# Prepares the story scenes' pictures (Art Bible SC0a ... SC10d, story in the Claude Doc "Void Blaster 2.0 - Fabula")
# for the HTML story screen (js/story.js): ui-sc-<code>.webp, portrait 720x1280. ChatGPT's scenes go in
# art/2.0/common/SC/selected (file name starting with the code, e.g. SC3-mars-conversion.webp); until a scene has
# its picture, a stand-in is cut from the world's concept art (darkened, so the text stays readable).
# Run from the repo root: python3 proto2/make-story.py
import glob
from PIL import Image, ImageEnhance

OUT = 'proto2/assets'
W, H = 720, 1280
W2 = 'art/2.0/worlds/world{0}/graphics/W{0}-P1-arena-concept.webp'
STAND_IN = {
    '0a': 'teaser/assets/earth.webp', '0b': 'teaser/assets/earth.webp', '0c': 'art/2.0/worlds/world1/concept-orbital-ruins.webp',
    '0d': 'teaser/assets/hangar.webp',
    **{str(n - 1): W2.format(n) for n in range(2, 11)},
    '10a': W2.format(10), '10b': W2.format(3), '10c': W2.format(8), '10d': 'teaser/assets/earth.webp',
}


def cover(im):
    # scale to cover the portrait frame, centred
    k = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


made = []
for code, stand in STAND_IN.items():
    own = sorted(glob.glob(f'art/2.0/common/SC/selected/SC{code}-*.webp')) + sorted(glob.glob(f'art/2.0/common/SC/selected/SC{code}.webp'))
    if own:
        im = cover(Image.open(own[0]).convert('RGB'))
    else:
        im = ImageEnhance.Brightness(cover(Image.open(stand).convert('RGB'))).enhance(0.7)
    im.save(f'{OUT}/ui-sc-{code}.webp', 'WEBP', quality=78, method=6)
    made.append(code + ('' if own else '*'))
print('story scenes', ' '.join(made), '(* stand-in)')
