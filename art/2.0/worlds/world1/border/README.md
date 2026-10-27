# Void Blaster — W1 P6 arena border pieces

Eight opaque PNG game assets with plain #05010f backgrounds, plus a sheet with generous separation.

- Top and bottom: 1024 x 160 px; repeat horizontally.
- Left and right: 160 x 1024 px; repeat vertically.
- Four corners: 256 x 256 px.
- Sheet: 1792 x 1792 px, all exported assets placed at native size.
- Atlas coordinates and arena-facing directions: atlas.json.

Amber hexagonal shield fragments face the arena: down on top, up on bottom, right on left, left on right. Corner names refer to their location around the arena. Every piece retains top-left lighting.

Each straight strip has a periodic 28-pixel endpoint transition. Opposite end rows/columns were verified identical, with zero differing pixels on all four strips. File dimensions were checked after export.

Artwork: built-in image_gen, using the approved W1 P1 Orbital Ruins concept. Technical export crops and resamples the artwork to the requested dimensions, normalizes near-black empty areas, and prepares the repeating strip ends. The complete generation prompt is included in W1-P6-prompts.txt.

