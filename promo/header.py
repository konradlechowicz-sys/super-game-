# App Store "Header" asset (App Store Connect, product page, since 2026-11): 3840x1646, a band of the key art (ST3)
# with the Striker over Earth, scaled up. Run from the repo root: python3 promo/header.py
from PIL import Image, ImageFilter
k = Image.open('art/2.0/common/ST3/selected/ST3-key-art.webp').convert('RGB')
out = k.crop((0, 1000, 2048, 1878)).resize((3840, 1646), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
out.save('appstore/2.0/app-store-header-3840x1646.jpg', quality=92)
print('appstore/2.0/app-store-header-3840x1646.jpg')
