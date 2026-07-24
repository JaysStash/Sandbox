import { ValueNoise2D, clamp } from "@/lib/noise";
import type { OutlookResult, TornadoParameters } from "@/lib/outlookEngine";

const DEG2RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

export type RadarParams = {
  tiltDeg: number;
  nyquistMs: number;
};

export type StormPhysicalState = {
  centerXKm: number; // relative to radar site, east-positive
  centerYKm: number; // relative to radar site, north-positive
  motionBearingDeg: number;
  translationSpeedMs: number;
  sizeFactor: number;
  elongation: number;
  hookStrength: number;
  precipShieldBreadth: number;
  coreIntensity: number;
  vortexActive: boolean;
  vortexMaxTangentialMs: number;
  vortexCoreRadiusM: number;
  echoTopKm: number;
  lfcKm: number;
  lifecycleIntensity: number;
  time: number;
};

// ------------------------------------------------------------
// Standard 4/3-Earth-radius beam height model
// ------------------------------------------------------------
export function beamHeightKm(
  rangeKm: number,
  elevationDeg: number,
  radarHeightKm = 0.15
): number {
  const effectiveRe = (4 / 3) * EARTH_RADIUS_KM;
  const elevRad = elevationDeg * DEG2RAD;
  const h =
    Math.sqrt(
      rangeKm * rangeKm +
        effectiveRe * effectiveRe +
        2 * rangeKm * effectiveRe * Math.sin(elevRad)
    ) - effectiveRe;
  return h + radarHeightKm;
}

// ------------------------------------------------------------
// Doppler velocity folding (aliasing)
// ------------------------------------------------------------
export function foldVelocity(
  v: number,
  nyquist: number
): { value: number; folded: boolean } {
  if (Math.abs(v) <= nyquist) return { value: v, folded: false };
  const wrapped =
    (((v + nyquist) % (2 * nyquist)) + 2 * nyquist) % (2 * nyquist) - nyquist;
  return { value: wrapped, folded: true };
}

// ------------------------------------------------------------
// Z-R relationship: rain rate (mm/hr) -> dBZ
// ------------------------------------------------------------
export function rainRateToDbz(rainRateMmHr: number): number {
  if (rainRateMmHr < 0.05) return -30;
  const Z = 300 * Math.pow(rainRateMmHr, 1.4);
  return 10 * Math.log10(Z);
}

// ------------------------------------------------------------
// Vortex (mesocyclone/hook) center, expressed relative to storm center,
// in world-aligned km (not the motion-rotated frame) - kept in world frame
// so every other function can work in one consistent coordinate space.
// ------------------------------------------------------------
function stormFootprintRadiusKm(state: StormPhysicalState): number {
  const lifecycleScale = 0.35 + 0.65 * state.lifecycleIntensity;
  return 4 + state.sizeFactor * 26 * lifecycleScale;
}

function vortexOffsetKm(state: StormPhysicalState): { x: number; y: number } {
  const footprintKm = stormFootprintRadiusKm(state);
  const hookDistKm = footprintKm * 0.5;
  // Fixed position relative to the storm's OWN motion direction: rear-right
  // flank, ~123 degrees clockwise from the direction of travel.
  const hookLocalAngleRad = Math.PI * 0.68;
  const localForward = Math.cos(hookLocalAngleRad) * hookDistKm;
  const localRight = Math.sin(hookLocalAngleRad) * hookDistKm;

  const bearingRad = state.motionBearingDeg * DEG2RAD;
  // Rotate the local (forward, right) offset into world-relative-to-storm-
  // center coordinates.
  const worldX = localForward * Math.sin(bearingRad) + localRight * Math.cos(bearingRad);
  const worldY = localForward * Math.cos(bearingRad) - localRight * Math.sin(bearingRad);
  return { x: worldX, y: worldY };
}

// ------------------------------------------------------------
// Procedural rain-rate field (storm shape: shield, core, hook notch)
// ------------------------------------------------------------
export function computeRainRate(
  relXKm: number,
  relYKm: number,
  state: StormPhysicalState,
  noise: ValueNoise2D
): number {
  const bearingRad = state.motionBearingDeg * DEG2RAD;
  const cosA = Math.cos(bearingRad);
  const sinA = Math.sin(bearingRad);

  // Rotate into storm-aligned frame (motion direction = local +x)
  const rx = relXKm * sinA + relYKm * cosA;
  const ry = relXKm * cosA - relYKm * sinA;

  const footprintKm = stormFootprintRadiusKm(state);
  const elongationRatio = 1 + state.elongation * 0.9;
  const ellDist = Math.sqrt((rx / elongationRatio) ** 2 + ry * ry);

  const noiseVal = noise.fbm(
    relXKm * 0.15 + state.time * 0.12,
    relYKm * 0.15 - state.time * 0.05,
    3
  );
  const edgeNoise = (noiseVal - 0.5) * footprintKm * 0.4;

  const shieldRadius = footprintKm * (0.82 + state.precipShieldBreadth * 0.45);
  const coreRadius = footprintKm * 0.35;

  let shapeIntensity = 0;
  const effectiveShield = shieldRadius + edgeNoise;
  if (ellDist < effectiveShield) {
    const shieldFalloff = clamp(1 - ellDist / (effectiveShield + 0.0001), 0, 1);
    const coreFalloff = clamp(1 - ellDist / coreRadius, 0, 1);
    shapeIntensity =
      shieldFalloff * 0.4 + coreFalloff * 0.6 * (0.5 + 0.5 * state.coreIntensity);
    shapeIntensity *= 0.55 + 0.45 * noiseVal;
  }

  if (state.hookStrength > 0.04) {
    const offset = vortexOffsetKm(state);
    const hdx = relXKm - offset.x;
    const hdy = relYKm - offset.y;
    const hookDistKm = Math.sqrt(hdx * hdx + hdy * hdy);
    const hookRadiusKm = footprintKm * 0.38 * state.hookStrength;
    const hookFalloff = clamp(1 - hookDistKm / (hookRadiusKm + 0.0001), 0, 1);
    shapeIntensity *= 1 - hookFalloff * 0.92;
  }

  shapeIntensity = clamp(shapeIntensity, 0, 1);

  const maxRainRateMmHr = 180;
  return shapeIntensity * maxRainRateMmHr;
}

// ------------------------------------------------------------
// Vertical structure: bounded weak echo region (vault) + echo top cutoff
// ------------------------------------------------------------
export function applyVerticalStructure(
  rainRate: number,
  distFromVortexCenterKm: number,
  beamHeightKmVal: number,
  state: StormPhysicalState
): number {
  let result = rainRate;

  if (state.vortexActive) {
    const bandLow = state.lfcKm;
    const bandHigh = Math.min(state.lfcKm + 5, state.echoTopKm - 2);
    if (beamHeightKmVal > bandLow && beamHeightKmVal < bandHigh) {
      const vaultRadiusKm = 2.5;
      const vaultFalloff = clamp(1 - distFromVortexCenterKm / vaultRadiusKm, 0, 1);
      result *= 1 - vaultFalloff * 0.75;
    }
  }

  if (beamHeightKmVal > state.echoTopKm) {
    result = 0;
  }

  return result;
}

// ------------------------------------------------------------
// Tornadic Debris Signature: weak-echo eye + high-dBZ debris ring
// ------------------------------------------------------------
export function applyTdsEffect(
  rainRate: number,
  distFromVortexCenterKm: number,
  state: StormPhysicalState
): { rainRate: number; debrisDbzBoost: number } {
  if (!state.vortexActive || state.vortexMaxTangentialMs < 35) {
    return { rainRate, debrisDbzBoost: 0 };
  }

  const eyeRadiusKm = 0.15 + (state.vortexCoreRadiusM / 1000) * 0.3;
  const debrisRingOuterKm = eyeRadiusKm * 2.2;

  if (distFromVortexCenterKm < eyeRadiusKm) {
    return { rainRate: rainRate * 0.15, debrisDbzBoost: 0 };
  }
  if (distFromVortexCenterKm < debrisRingOuterKm) {
    const ringCenter = (eyeRadiusKm + debrisRingOuterKm) / 2;
    const ringHalfWidth = (debrisRingOuterKm - eyeRadiusKm) / 2;
    const ringFalloff = clamp(
      1 - Math.abs(distFromVortexCenterKm - ringCenter) / ringHalfWidth,
      0,
      1
    );
    return { rainRate, debrisDbzBoost: ringFalloff * 25 };
  }
  return { rainRate, debrisDbzBoost: 0 };
}

// ------------------------------------------------------------
// Rankine combined vortex velocity field
// ------------------------------------------------------------
export function computeVortexVelocity(
  vortexRelXKm: number,
  vortexRelYKm: number,
  state: StormPhysicalState
): { vx: number; vy: number } {
  if (!state.vortexActive) return { vx: 0, vy: 0 };

  const rKm = Math.sqrt(vortexRelXKm * vortexRelXKm + vortexRelYKm * vortexRelYKm);
  const rM = rKm * 1000;
  if (rM < 1) return { vx: 0, vy: 0 };

  const Rmax = state.vortexCoreRadiusM;
  const Vmax = state.vortexMaxTangentialMs * state.lifecycleIntensity;

  const Vt = rM <= Rmax ? Vmax * (rM / Rmax) : Vmax * (Rmax / rM);

  // Cyclonic (counterclockwise) rotation: tangential unit vector is the
  // radius vector rotated 90 degrees counterclockwise.
  const tangentialUnitX = -vortexRelYKm / rKm;
  const tangentialUnitY = vortexRelXKm / rKm;

  return { vx: Vt * tangentialUnitX, vy: Vt * tangentialUnitY };
}

// ------------------------------------------------------------
// RFD-style divergent outflow surge near the mesocyclone
// ------------------------------------------------------------
function computeDivergenceVelocity(
  relXKm: number,
  relYKm: number,
  offset: { x: number; y: number },
  state: StormPhysicalState
): { vx: number; vy: number } {
  const rfdX = offset.x * 1.3;
  const rfdY = offset.y * 1.3;
  const dx = relXKm - rfdX;
  const dy = relYKm - rfdY;
  const r = Math.sqrt(dx * dx + dy * dy);
  if (r < 0.05) return { vx: 0, vy: 0 };

  const maxDivRadiusKm = 6;
  const divFalloff = clamp(1 - r / maxDivRadiusKm, 0, 1);
  const divSpeed = 15 * divFalloff * state.lifecycleIntensity;

  return { vx: (dx / r) * divSpeed, vy: (dy / r) * divSpeed };
}

// ------------------------------------------------------------
// Full per-cell computation: dBZ + radial velocity (Doppler-projected)
// ------------------------------------------------------------
export function computeCell(
  relXKm: number,
  relYKm: number,
  azimuthRad: number,
  beamHeightKmVal: number,
  state: StormPhysicalState,
  radarParams: RadarParams,
  noise: ValueNoise2D
): { dBZ: number; radialVelocityMs: number; isFolded: boolean } {
  const offset = vortexOffsetKm(state);
  const vortexRelX = relXKm - offset.x;
  const vortexRelY = relYKm - offset.y;
  const distFromVortexCenterKm = Math.sqrt(
    vortexRelX * vortexRelX + vortexRelY * vortexRelY
  );

  let rainRate = computeRainRate(relXKm, relYKm, state, noise);
  rainRate = applyVerticalStructure(
    rainRate,
    distFromVortexCenterKm,
    beamHeightKmVal,
    state
  );
  const tds = applyTdsEffect(rainRate, distFromVortexCenterKm, state);
  rainRate = tds.rainRate;

  const baseDbz =
    rainRate < 0.05 && tds.debrisDbzBoost === 0
      ? -30
      : rainRateToDbz(rainRate) + tds.debrisDbzBoost;

  const vortexVel = computeVortexVelocity(vortexRelX, vortexRelY, state);
  const divVel = computeDivergenceVelocity(relXKm, relYKm, offset, state);
  const bearingRad = state.motionBearingDeg * DEG2RAD;
  const translationVx = state.translationSpeedMs * Math.sin(bearingRad);
  const translationVy = state.translationSpeedMs * Math.cos(bearingRad);

  const totalVx = translationVx + vortexVel.vx + divVel.vx;
  const totalVy = translationVy + vortexVel.vy + divVel.vy;

  const radialUnitX = Math.sin(azimuthRad);
  const radialUnitY = Math.cos(azimuthRad);
  const rawRadialVel = totalVx * radialUnitX + totalVy * radialUnitY;

  const { value: foldedVel, folded } = foldVelocity(
    rawRadialVel,
    radarParams.nyquistMs
  );

  return { dBZ: baseDbz, radialVelocityMs: foldedVel, isFolded: folded };
}

// ------------------------------------------------------------
// One full radial (ray) of range bins, with path-integrated attenuation
// ------------------------------------------------------------
export function computeRadial(
  azimuthRad: number,
  rangeBinsKm: number[],
  state: StormPhysicalState,
  radarParams: RadarParams,
  noise: ValueNoise2D
): { dBZ: number[]; velocityMs: number[]; folded: boolean[] } {
  const dBZArr: number[] = [];
  const velArr: number[] = [];
  const foldedArr: boolean[] = [];

  let cumulativeAttenuation = 0;

  for (const rangeKm of rangeBinsKm) {
    const cellXKm = rangeKm * Math.sin(azimuthRad);
    const cellYKm = rangeKm * Math.cos(azimuthRad);
    const relXKm = cellXKm - state.centerXKm;
    const relYKm = cellYKm - state.centerYKm;

    const beamH = beamHeightKm(rangeKm, radarParams.tiltDeg);
    const result = computeCell(
      relXKm,
      relYKm,
      azimuthRad,
      beamH,
      state,
      radarParams,
      noise
    );

    let dBZ = result.dBZ - cumulativeAttenuation;
    if (dBZ > 50) {
      cumulativeAttenuation += (dBZ - 50) * 0.08;
    }

    dBZArr.push(dBZ);
    velArr.push(result.radialVelocityMs);
    foldedArr.push(result.isFolded);
  }

  return { dBZ: dBZArr, velocityMs: velArr, folded: foldedArr };
}

// ------------------------------------------------------------
// Build the physical storm state for the current frame from real
// tornado parameters + outlook diagnostics.
// ------------------------------------------------------------
export function buildStormState(
  parameters: TornadoParameters,
  outlook: OutlookResult,
  frameLat: number,
  frameLng: number,
  frameIntensity: number,
  frameBearingDeg: number,
  radarSite: { lat: number; lng: number },
  timeCounter: number
): StormPhysicalState {
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos(radarSite.lat * DEG2RAD);
  const centerXKm = (frameLng - radarSite.lng) * kmPerDegLng;
  const centerYKm = (frameLat - radarSite.lat) * kmPerDegLat;

  const sizeFactor = clamp(parameters.sbcape / 4000, 0.2, 1);
  const elongation = clamp(parameters.shear_0_6km / 70, 0.1, 1);
  const hookStrength = outlook.supercellLikely
    ? clamp(parameters.srh_0_1km / 400, 0.15, 1)
    : 0;
  const precipShieldBreadth = clamp(parameters.pwat / 2.0, 0.2, 1);
  const coreIntensity = clamp(parameters.mucape / 5000, 0.3, 1);

  const vortexActive = outlook.supercellLikely;
  const vortexMaxTangentialMs = vortexActive
    ? clamp(
        (parameters.srh_0_1km / 400) * 25 + (parameters.shear_0_6km / 70) * 20,
        8,
        90
      )
    : 0;
  const vortexCoreRadiusM = vortexActive
    ? clamp(900 - (parameters.srh_0_1km / 400) * 500, 150, 900)
    : 500;

  const echoTopKm = clamp(parameters.el_height / 1000, 6, 18);
  const lfcKm = clamp(parameters.lfc_height / 1000, 0.5, 5);

  return {
    centerXKm,
    centerYKm,
    motionBearingDeg: frameBearingDeg,
    translationSpeedMs: 12 + (parameters.wind_speed_500mb / 100) * 15,
    sizeFactor,
    elongation,
    hookStrength,
    precipShieldBreadth,
    coreIntensity,
    vortexActive,
    vortexMaxTangentialMs,
    vortexCoreRadiusM,
    echoTopKm,
    lfcKm,
    lifecycleIntensity: frameIntensity,
    time: timeCounter,
  };
}
