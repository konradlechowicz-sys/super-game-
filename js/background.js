import { rand, TAU, rgba } from './util.js';

export class Background {
  constructor(app) {
    this.app = app;
    this.theme = null;
    this.setTheme({ top: '#16002e', bottom: '#030010', neb: ['#ff2d95', '#7a2dff', '#00b3ff'], grid: '#b04dff' });
  }

  setTheme(theme) {
    if (this.theme === theme) return;
    this.theme = theme;
    this.buildNebula();
    this.grad = null;
  }

  buildNebula() {
    const N = (this.tile = 900);
    const sc = 0.4;
    const c = (this.neb = document.createElement('canvas'));
    c.width = c.height = Math.ceil(N * sc);
    const g = c.getContext('2d');
    g.scale(sc, sc);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const x = rand(0, N), y = rand(0, N), r = rand(140, 360);
      const col = this.theme.neb[i % this.theme.neb.length];
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cx = x + ox * N, cy = y + oy * N;
          const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          grd.addColorStop(0, rgba(col, 0.16));
          grd.addColorStop(1, rgba(col, 0));
          g.fillStyle = grd;
          g.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
      }
    }
  }

  resize() {
    const { W, H } = this.app;
    this.grad = null;
    this.layers = [0.04, 0.12, 0.25].map((f, li) => {
      const n = Math.floor((W * H) / (li === 0 ? 3500 : li === 1 ? 7000 : 14000));
      const stars = [];
      for (let i = 0; i < n; i++) stars.push({ x: rand(0, W), y: rand(0, H), ph: rand(0, TAU), tw: rand(1, 3) });
      return { f, stars, size: [1, 1.5, 2.2][li], alpha: [0.45, 0.7, 0.95][li] };
    });
  }

  draw(ctx, camX, camY, t) {
    const { W, H, dpr } = this.app;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    if (!this.grad) {
      this.grad = ctx.createLinearGradient(0, 0, 0, H);
      this.grad.addColorStop(0, this.theme.top);
      this.grad.addColorStop(1, this.theme.bottom);
    }
    ctx.fillStyle = this.grad;
    ctx.fillRect(0, 0, W, H);

    // nebula tiles (parallax)
    const N = this.tile;
    const ox = ((-camX * 0.1) % N + N) % N - N;
    const oy = ((-camY * 0.1) % N + N) % N - N;
    for (let x = ox; x < W; x += N) for (let y = oy; y < H; y += N) ctx.drawImage(this.neb, x, y, N, N);

    // stars
    ctx.fillStyle = '#dff6ff';
    for (const L of this.layers) {
      const sx = -camX * L.f, sy = -camY * L.f;
      for (const s of L.stars) {
        const x = ((s.x + sx) % W + W) % W, y = ((s.y + sy) % H + H) % H;
        ctx.globalAlpha = L.alpha * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
        ctx.fillRect(x, y, L.size, L.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}
