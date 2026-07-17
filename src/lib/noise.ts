// Self-contained 2D value noise with fractal Brownian motion (fBm).
// Used to give the procedural storm shapes organic, non-geometric edges
// and internal texture instead of looking like a perfect circle/ellipse.

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class ValueNoise2D {
  private table: Float64Array;
  private size: number;

  constructor(seed: number, size = 256) {
    this.size = size;
    const rand = mulberry32(seed);
    this.table = new Float64Array(size * size);
    for (let i = 0; i < this.table.length; i++) {
      this.table[i] = rand();
    }
  }

  private smooth(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private sample(xi: number, yi: number): number {
    const s = this.size;
    const x = ((xi % s) + s) % s;
    const y = ((yi % s) + s) % s;
    return this.table[y * s + x];
  }

  // Returns a value in [0, 1]
  noise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const v00 = this.sample(xi, yi);
    const v10 = this.sample(xi + 1, yi);
    const v01 = this.sample(xi, yi + 1);
    const v11 = this.sample(xi + 1, yi + 1);

    const u = this.smooth(xf);
    const v = this.smooth(yf);

    const top = v00 + u * (v10 - v00);
    const bottom = v01 + u * (v11 - v01);
    return top + v * (bottom - top);
  }

  // Layers multiple octaves for richer, more organic detail. Returns [0, 1].
  fbm(x: number, y: number, octaves = 3): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return maxValue > 0 ? value / maxValue : 0;
  }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
