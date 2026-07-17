import { ValueNoise2D, clamp } from "@/lib/noise";

export type ReflectivityParams = {
  sizeFactor: number; // 0-1, from CAPE - overall storm footprint
  elongation: number; // 0-1, from deep-layer shear - stretch along motion axis
  hookStrength: number; // 0-1, from SRH/shear - hook echo notch prominence (0 = none)
  precipShieldBreadth: number; // 0-1, from PWAT - how broad/filled-in the precip shield is
  coreIntensity: number; // 0-1, from CAPE/precip efficiency - how hot the core reads
  orientationRad: number; // radians - storm motion bearing
  lifecycleIntensity: number; // 0-1 - current point in the storm's life
  time: number; // seconds-like counter, drives subtle organic texture evolution
};

export type VelocityParams = {
  sizeFactor: number; // 0-1, from SRH magnitude - couplet size
  strength: number; // 0-1, from SRH + shear - color/intensity saturation
  orientationRad: number; // radians - storm motion bearing (couplet sits perpendicular)
  lifecycleIntensity: number;
  active: boolean; // whether a couplet should render at all
};

const REFLECTIVITY_STOPS: { t: number; color: [number, number, number] }[] = [
  { t: 0.0, color: [20, 90, 50] },
  { t: 0.18, color: [46, 204, 113] },
  { t: 0.4, color: [241, 196, 15] },
  { t: 0.62, color: [230, 126, 34] },
  { t: 0.82, color: [231, 76, 60] },
  { t: 1.0, color: [213, 0, 249] },
];

function reflectivityColor(t: number): [number, number, number, number] {
  if (t <= 0.03) return [0, 0, 0, 0];
  const alpha = Math.round(clamp(t * 1.25, 0, 1) * 235);
  for (let i = 0; i < REFLECTIVITY_STOPS.length - 1; i++) {
    const a = REFLECTIVITY_STOPS[i];
    const b = REFLECTIVITY_STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t || 1);
      const r = Math.round(a.color[0] + (b.color[0] - a.color[0]) * localT);
      const g = Math.round(a.color[1] + (b.color[1] - a.color[1]) * localT);
      const bl = Math.round(a.color[2] + (b.color[2] - a.color[2]) * localT);
      return [r, g, bl, alpha];
    }
  }
  const last = REFLECTIVITY_STOPS[REFLECTIVITY_STOPS.length - 1].color;
  return [last[0], last[1], last[2], alpha];
}

export function drawReflectivity(
  ctx: CanvasRenderingContext2D,
  size: number,
  noise: ValueNoise2D,
  params: ReflectivityParams
): void {
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const cx = size / 2;
  const cy = size / 2;

  const lifecycleScale = 0.35 + 0.65 * params.lifecycleIntensity;
  const maxRadius = size * 0.42 * (0.45 + 0.55 * params.sizeFactor) * lifecycleScale;

  const cosA = Math.cos(params.orientationRad);
  const sinA = Math.sin(params.orientationRad);
  const elongationRatio = 1 + params.elongation * 0.9;

  // Hook echo sits on the rear flank, roughly 115-135 degrees off the
  // direction of motion for a right-moving supercell.
  const hookAngle = params.orientationRad + Math.PI * 0.68;
  const hookDist = maxRadius * 0.5;
  const hookCx = cx + Math.cos(hookAngle) * hookDist;
  const hookCy = cy + Math.sin(hookAngle) * hookDist;
  const hookRadius = maxRadius * 0.38 * params.hookStrength;

  const shieldRadius = maxRadius * (0.82 + params.precipShieldBreadth * 0.45);
  const coreRadius = maxRadius * 0.38;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const rx = dx * cosA + dy * sinA;
      const ry = -dx * sinA + dy * cosA;

      const ellDist = Math.sqrt((rx / elongationRatio) ** 2 + ry * ry);

      const noiseVal = noise.fbm(
        px * 0.045 + params.time * 0.12,
        py * 0.045 - params.time * 0.05,
        3
      );
      const edgeNoise = (noiseVal - 0.5) * maxRadius * 0.4;

      let intensity = 0;
      const effectiveShield = shieldRadius + edgeNoise;
      if (ellDist < effectiveShield) {
        const shieldFalloff = clamp(1 - ellDist / (effectiveShield + 0.001), 0, 1);
        const coreFalloff = clamp(1 - ellDist / coreRadius, 0, 1);
        intensity =
          shieldFalloff * 0.45 + coreFalloff * 0.55 * (0.5 + 0.5 * params.coreIntensity);
        intensity *= 0.55 + 0.45 * noiseVal;
      }

      if (params.hookStrength > 0.04) {
        const hdx = px - hookCx;
        const hdy = py - hookCy;
        const hookDistPx = Math.sqrt(hdx * hdx + hdy * hdy);
        const hookFalloff = clamp(1 - hookDistPx / (hookRadius + 0.001), 0, 1);
        intensity *= 1 - hookFalloff * 0.92;
      }

      intensity = clamp(intensity, 0, 1);

      const [r, g, b, a] = reflectivityColor(intensity);
      const idx = (py * size + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function drawVelocity(
  ctx: CanvasRenderingContext2D,
  size: number,
  params: VelocityParams
): void {
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  if (!params.active || params.strength < 0.04) {
    ctx.putImageData(imageData, 0, 0);
    return;
  }

  const cx = size / 2;
  const cy = size / 2;
  const lifecycleScale = 0.35 + 0.65 * params.lifecycleIntensity;

  const coupletRadius = size * 0.2 * (0.5 + 0.5 * params.sizeFactor) * lifecycleScale;
  const separation = coupletRadius * 1.1;
  const perpAngle = params.orientationRad + Math.PI / 2;

  const inCx = cx - Math.cos(perpAngle) * separation * 0.5;
  const inCy = cy - Math.sin(perpAngle) * separation * 0.5;
  const outCx = cx + Math.cos(perpAngle) * separation * 0.5;
  const outCy = cy + Math.sin(perpAngle) * separation * 0.5;

  const strength = clamp(params.strength * lifecycleScale, 0, 1);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dIn = Math.hypot(px - inCx, py - inCy);
      const dOut = Math.hypot(px - outCx, py - outCy);

      const inFalloff = Math.pow(clamp(1 - dIn / coupletRadius, 0, 1), 1.4);
      const outFalloff = Math.pow(clamp(1 - dOut / coupletRadius, 0, 1), 1.4);

      let r = 0,
        g = 0,
        b = 0,
        a = 0;

      if (inFalloff > 0.02 || outFalloff > 0.02) {
        if (inFalloff >= outFalloff) {
          r = 34;
          g = 197;
          b = 94;
          a = Math.round(inFalloff * strength * 225);
        } else {
          r = 239;
          g = 68;
          b = 68;
          a = Math.round(outFalloff * strength * 225);
        }
      }

      const idx = (py * size + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
