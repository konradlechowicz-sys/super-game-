# App Store "Header" asset (App Store Connect, product page, since 2026-11): 3840x1646, a band of the key art (ST3)
# with the Striker over Earth, scaled up. Run from the repo root: python3 promo/header.py
from PIL import Image, ImageFilter
k = Image.open('art/2.0/common/ST3/selected/ST3-key-art.webp').convert('RGB')
out = k.crop((0, 1000, 2048, 1878)).resize((3840, 1646), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
out.save('appstore/2.0/app-store-header-3840x1646.jpg', quality=92)
print('appstore/2.0/app-store-header-3840x1646.jpg')
# "Search Results" asset (optional; without it the screenshots are used): 1920x1280, a 3:2 band of the key art, scaled down
k.crop((0, 683, 2048, 2048)).resize((1920, 1280), Image.LANCZOS).save('appstore/2.0/app-store-search-1920x1280.jpg', quality=92)
print('appstore/2.0/app-store-search-1920x1280.jpg')
