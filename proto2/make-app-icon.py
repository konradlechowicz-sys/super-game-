# The 2.0 app icon (Art Bible ST1, appstore/2.0/app-icon-1024.png) in every size the apps need:
# iOS: one 1024x1024 PNG without transparency (Apple refuses an alpha channel);
# Android: the legacy square and round launcher icons per density, and the adaptive icon's foreground (108 dp with
# the art at 80%, so the launcher's mask, which shows about the middle 72 dp, keeps the whole ship; the background
# colour res/values/ic_launcher_background.xml stays the deep space #05010F). Run from the repo root:
#   python3 proto2/make-app-icon.py
from PIL import Image, ImageDraw

SRC = 'appstore/2.0/app-icon-1024.png'
art = Image.open(SRC).convert('RGB')
art.save('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 'PNG', optimize=True)

RES = 'android/app/src/main/res'
for d, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    sq = art.resize((px, px), Image.LANCZOS).convert('RGBA')
    sq.save(f'{RES}/mipmap-{d}/ic_launcher.png', optimize=True)
    big = art.resize((px * 4, px * 4), Image.LANCZOS).convert('RGBA')
    mask = Image.new('L', big.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big.size[0] - 1, big.size[1] - 1), fill=255)
    big.putalpha(mask)
    big.resize((px, px), Image.LANCZOS).save(f'{RES}/mipmap-{d}/ic_launcher_round.png', optimize=True)
    fg = round(px * 108 / 48)
    layer = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
    inner = round(fg * 0.8)
    layer.paste(art.resize((inner, inner), Image.LANCZOS).convert('RGBA'), ((fg - inner) // 2, (fg - inner) // 2))
    layer.save(f'{RES}/mipmap-{d}/ic_launcher_foreground.png', optimize=True)
print('app icon: iOS 1024 + Android 5 densities')
