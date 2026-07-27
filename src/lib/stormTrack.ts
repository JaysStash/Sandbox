import { destinationPoint } from "@/lib/regions";
import { clamp } from "@/lib/noise";
import type {
  OutlookResult,
  TornadoParameters,
  DerechoParameters,
} from "@/lib/outlookEngine";

export type StormFrame = {
  lat: number;
  lng: number;
  intensity: number; // 0-1, storm lifecycle strength at this frame
  bearingDeg: number;
  showMesocyclone: boolean;
};

const FRAME_COUNT = 60;

// Simple lifecycle curve: ramp up, plateau near peak, decay.
function lifecycleIntensity(t: number): number {
  if (t < 0.4) return t / 0.4;
  if (t < 0.65) return 1;
  return Math.max(0.15, 1 - (t - 0.65) / 0.35);
}

export function generateStormTrack(
  center: { lat: number; lng: number },
  parameters: TornadoParameters,
  outlook: OutlookResult
): StormFrame[] {
  const baseBearing = 55; // typical US severe-storm motion: WSW to ENE
  const deviation = parameters.storm_motion_deviation ?? 15;
  const bearing = baseBearing + (deviation / 30) * 25;

  const windSpeed500 = parameters.wind_speed_500mb ?? 45;
  const totalDistanceKm = 40 + (windSpeed500 / 100) * 120;

  const start = destinationPoint(
    center.lat,
    center.lng,
    (bearing + 180) % 360,
    totalDistanceKm / 2
  );

  const showRotationSignature =
    outlook.supercellLikely &&
    (outlook.category === "ENH" ||
      outlook.category === "MDT" ||
      outlook.category === "HIGH");

  const frames: StormFrame[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / (FRAME_COUNT - 1);
    const distanceSoFar = t * totalDistanceKm;
    const pos = destinationPoint(start.lat, start.lng, bearing, distanceSoFar);
    const intensity = lifecycleIntensity(t);

    frames.push({
      lat: pos.lat,
      lng: pos.lng,
      intensity,
      bearingDeg: bearing,
      showMesocyclone: showRotationSignature && intensity > 0.55,
    });
  }

  return frames;
}

// ============================================================
// Derecho track - a much longer-distance system than a discrete cell,
// reusing the same lifecycle curve but scaled to a derecho's real
// hundreds-of-miles travel distance.
// ============================================================

export function generateDerechoTrack(
  center: { lat: number; lng: number },
  parameters: DerechoParameters,
  outlook: OutlookResult
): StormFrame[] {
  // Line-perpendicular shear nudges the overall bearing slightly, similar
  // to how storm motion deviation works for rotating storms.
  const baseBearing = 65; // derechoes classically move WSW to ENE
  const bearing = baseBearing + clamp((parameters.line_perpendicular_shear - 25) / 60, -1, 1) * 8;

  const totalDistanceKm = outlook.supercellLikely
    ? Math.min(700, Math.max(80, (outlook.diagnostics.swathMiles ?? 100) * 1.60934))
    : 80;

  const start = destinationPoint(
    center.lat,
    center.lng,
    (bearing + 180) % 360,
    totalDistanceKm / 2
  );

  const frames: StormFrame[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / (FRAME_COUNT - 1);
    const distanceSoFar = t * totalDistanceKm;
    const pos = destinationPoint(start.lat, start.lng, bearing, distanceSoFar);
    const intensity = lifecycleIntensity(t);

    frames.push({
      lat: pos.lat,
      lng: pos.lng,
      intensity,
      bearingDeg: bearing,
      showMesocyclone: false,
    });
  }

  return frames;
}
