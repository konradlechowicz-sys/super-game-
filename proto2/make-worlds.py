# Prepares the textures of the 2.0 worlds 6-10 for the game from ChatGPT's sets (art/2.0/worlds/worldN, see their
# README, manifest.json and DELIVERY-REQUIREMENTS.json; Art Bible tasks P2-P8). One script for the five worlds, which
# all came in the same format: sheet backgrounds (#05010f) become transparency, sizes are reduced to what the game
# needs, every world's textures are named wN-... (enemies enemy-<id>, glow-<id>). Run from the repo root:
#   python3 proto2/make-worlds.py 6 7 8 9 10
# The bosses are the assembled drawings (their parts are separate renderings, not a pixel rig, as the READMEs say);
# the game lays glows over them where this script finds their magenta weak points (bright magenta blobs).
import json
import sys
import numpy as np
from PIL import Image, ImageFilter

OUT = 'proto2/assets'
BG = np.array([5, 1, 15], np.float32)

# Per world: far layer (file, size it is stored at), floor tile (keeps its alpha) or islands (separate pieces laid over
# the far layer), props (art name: max px), enemies (game id: (art name, px)), the elite's art, the boss drawing(s).
WORLDS = {
    6: dict(name='Storm Relay', far=('W6-P2-background', (1024, 512)), islands=('W6-P3-platforms/W6-P3-{}', 3, 700),
            props={'relay-antenna': 260, 'lightning-rod': 160, 'cable-tissue-tangle': 200, 'gas-mine-balloon': 140, 'coil-node': 200,
                   'broken-bronze-panel': 160, 'signal-amplifier-intact': 220, 'signal-amplifier-exploded': 220, 'gas-tank-intact': 200, 'gas-tank-exploded': 200},
            enemies={'ionkite': ('ion-kite', 96), 'gasmine': ('gas-mine', 102), 'jelly': ('relay-jelly', 108), 'staticray': ('static-ray', 138),
                     'vortex': ('vortex', 150), 'cloudwhale': ('cloud-whale', 198)},
            elite=('ionkite', 'ion-kite'), boss=['W6-P8-storm-eye']),
    7: dict(name='Abyss of Europa', far=('W7-P2-background', (1024, 1024)), floor='W7-P3-floor',
            props={'ice-spire-cluster': 260, 'frozen-hybrid-carcass': 240, 'green-lit-crevasse': 260, 'steaming-vent': 160, 'circuit-vine-knot': 160,
                   'ice-boulder': 160, 'spore-lantern-intact': 200, 'spore-lantern-shattered': 200, 'ice-locked-pod-intact': 220, 'ice-locked-pod-shattered': 220},
            enemies={'icewisp': ('ice-wisp', 84), 'frostcrab': ('frost-crab', 120), 'tmine': ('tentacle-mine', 108), 'lantern': ('spore-lantern', 132),
                     'eel': ('eel-hybrid', 150), 'lspawn': ('leviathan-spawn', 186)},
            elite=('frostcrab', 'frost-crab'), boss=['W7-P8-abyss-leviathan']),
    8: dict(name='The Rift Gate', far=('W8-P2-background', (1024, 1024)), islands=('W8-P3-reality-shards/W8-P3-{}', 6, 520),
            props={'gate-ring-segment': 260, 'guardian-pylon': 220, 'rift': 220, 'floating-ring-fragment': 220, 'shard-cluster': 160,
                   'dormant-sentinel-eye': 160, 'rift-anchor-intact': 220, 'rift-anchor-broken': 220, 'ring-capacitor-intact': 200, 'ring-capacitor-broken': 200},
            enemies={'shardunit': ('shard-swarm-unit', 66), 'echo': ('echo', 96), 'phasewalker': ('phase-walker', 120), 'nullorb': ('null-orb', 144),
                     'riftspawner': ('rift-spawner', 156), 'sentinel': ('gate-sentinel', 180)},
            elite=('phasewalker', 'phase-walker'), boss=['W8-P8-gatekeeper']),
    9: dict(name='Brood World', floor='W9-P3-floor',
            props={'nest': 260, 'egg-sac-cluster': 200, 'metal-rib-arch': 260, 'acid-pool-1': 260, 'acid-pool-2': 260, 'bioluminescent-fungi': 160,
                   'vein-knot': 160, 'small-egg': 90, 'brood-sac-intact': 200, 'brood-sac-burst': 200, 'nest-heart-intact': 230, 'nest-heart-burst': 230},
            enemies={'larva': ('larva', 78), 'leech': ('leech', 90), 'spitter': ('spitter', 108), 'nest': ('nest', 168),
                     'broodsac': ('brood-sac', 180), 'beetle': ('carapace-beetle', 192)},
            elite=('spitter', 'spitter'), boss=['W9-P8-brood-matriarch']),
    10: dict(name='The Nexus', far=('W10-P2-background', (1024, 1024)), floor='W10-P3-floor',
             props={'neuron-node': 200, 'impossible-floating-frame': 240, 'broken-ring-fragment': 240, 'synapse-knot': 160, 'eye-bud': 140,
                    'circuit-shard': 140, 'neuron-cluster-intact': 220, 'neuron-cluster-broken': 220, 'ring-anchor-intact': 220, 'ring-anchor-broken': 220},
             enemies={'synapse': ('synapse-swarm-unit', 66), 'voidling': ('voidling', 78), 'wraith': ('wraith', 120), 'eye': ('eye', 132),
                      'neuronnode': ('neuron-node', 144), 'overseer': ('overseer', 192)},
             elite=('wraith', 'wraith'), boss=['W10-P8-void-heart-phase-1', 'W10-P8-void-heart-phase-2', 'W10-P8-void-heart-phase-3']),
}


def cut(im, lo=4, span=12, close=5):
    """The flat background (#05010f) -> transparent, keyed on the distance from that colour; small holes in the darkest
    parts are closed (max, then min filter)."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    d = np.abs(a - BG).max(axis=2)
    alpha = Image.fromarray((np.clip((d - lo) / span, 0, 1) * 255).astype(np.uint8), 'L')
    if close: alpha = alpha.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    return Image.fromarray(np.dstack([a, np.asarray(alpha)]).astype(np.uint8), 'RGBA')


def trim(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())


def fit(im, cap):
    k = min(1, cap / max(im.size))
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def save(im, name, q=88):
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=q, method=6)


def weak_points(im, n=5):
    """Centres (in the 1024 frame) of the biggest bright magenta blobs of a boss drawing: its glowing weak points."""
    a = np.asarray(im.convert('RGB').resize((256, 256), Image.BILINEAR)).astype(int)
    m = (a[..., 0] > 190) & (a[..., 2] > 110) & (a[..., 1] < 120) & (a[..., 0] - a[..., 1] > 110)
    seen = np.zeros_like(m)
    blobs = []
    for y, x in zip(*np.nonzero(m)):
        if seen[y, x]: continue
        stack, pts = [(y, x)], []
        seen[y, x] = True
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < 256 and 0 <= nx < 256 and m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(pts) >= 3:
            ys, xs = zip(*pts)
            blobs.append((len(pts), sum(xs) / len(xs) * 4, sum(ys) / len(ys) * 4))
    blobs.sort(reverse=True)
    return [[round(x), round(y)] for _, x, y in blobs[:n]]


def make(w):
    c, src = WORLDS[w], f'art/2.0/worlds/world{w}/graphics'
    p = f'w{w}'
    if 'far' in c:
        name, size = c['far']
        save(Image.open(f'{src}/{name}.webp').convert('RGB').resize(size, Image.LANCZOS), f'{p}-far', 84)
    if 'floor' in c:
        im = Image.open(f'{src}/{c["floor"]}.webp')
        save(im.convert('RGBA') if im.mode == 'RGBA' else im.convert('RGB'), f'{p}-floor', 84)
    if 'islands' in c:
        pat, n, cap = c['islands']
        for i in range(1, n + 1):
            save(fit(trim(cut(Image.open(f'{src}/{pat.format(i)}.webp'))), cap), f'{p}-island-{i}')
    save(Image.open(f'{src}/W{w}-P4-overlay.webp').convert('RGB'), f'{p}-near', 84)
    for name, cap in c['props'].items():
        save(fit(trim(cut(Image.open(f'{src}/W{w}-P5-props/W{w}-P5-{name}.webp'))), cap), f'{p}-prop-{name}')
    for side in ('top', 'bottom', 'left', 'right'):
        save(cut(Image.open(f'{src}/W{w}-P6-border-pieces/W{w}-P6-border-{side}.webp'), close=0), f'{p}-edge-{side}', 88)
    for side in ('top-left', 'top-right', 'bottom-left', 'bottom-right'):
        save(cut(Image.open(f'{src}/W{w}-P6-border-pieces/W{w}-P6-corner-{side}.webp'), close=0), f'{p}-edge-{side}', 88)
    for gid, (art, size) in c['enemies'].items():
        im = fit(trim(cut(Image.open(f'{src}/W{w}-P7-enemies/W{w}-P7-{art}.webp'))), size)
        save(im, f'enemy-{gid}', 90)
        pad = size // 3
        a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
        a.paste(im.getchannel('A'), (pad, pad))
        a = a.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(size / 9))
        g = Image.new('RGBA', a.size, '#ff2d95')
        g.putalpha(a.point(lambda v: min(255, int(v * 0.7))))
        save(g, f'glow-{gid}')
        for n in range(1, 5):
            save(fit(trim(cut(Image.open(f'{src}/W{w}-P7-elite-and-shards/W{w}-P7-{art}-shard-{n}.webp'))), 160), f'{p}-debris-{gid}-{n}', 86)
    gid, art = c['elite']
    save(fit(trim(cut(Image.open(f'{src}/W{w}-P7-elite-and-shards/W{w}-P7-{art}-elite.webp'))), 240), f'enemy-{gid}-elite', 90)
    info = {'frame': 1024, 'phases': len(c['boss'])}
    for i, name in enumerate(c['boss']):
        im = Image.open(f'{src}/{name}.webp')
        save(cut(im), f'{p}-boss' + (f'-{i + 1}' if len(c['boss']) > 1 else ''), 90)
        if i == 0: info['weak'] = weak_points(im)
    json.dump(info, open(f'{OUT}/{p}-boss.json', 'w'))
    print(f'world {w} assets ready, weak points {info["weak"]}')


for arg in sys.argv[1:]:
    make(int(arg))
