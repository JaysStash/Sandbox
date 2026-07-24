// Standard NWS/NEXRAD Level-II style color tables. These are the widely
// recognized discrete-bin color ramps used across real radar display
// software (GRLevel3, RadarScope, NWS products) - discrete bins are
// intentional, not a rendering shortcut, since that's what real radar
// products actually look like.

export type RGBA = [number, number, number, number];

const REFLECTIVITY_BINS: { min: number; color: [number, number, number] }[] = [
  { min: -30, color: [0, 0, 0] }, // below this = no echo / transparent
  { min: 5, color: [4, 233, 231] },
  { min: 10, color: [1, 159, 244] },
  { min: 15, color: [3, 0, 244] },
  { min: 20, color: [2, 253, 2] },
  { min: 25, color: [1, 197, 1] },
  { min: 30, color: [0, 142, 0] },
  { min: 35, color: [253, 248, 2] },
  { min: 40, color: [229, 188, 0] },
  { min: 45, color: [253, 149, 0] },
  { min: 50, color: [253, 0, 0] },
  { min: 55, color: [212, 0, 0] },
  { min: 60, color: [188, 0, 0] },
  { min: 65, color: [248, 0, 253] },
  { min: 70, color: [152, 84, 198] },
  { min: 75, color: [253, 253, 253] },
];

export function reflectivityColor(dBZ: number): RGBA {
  if (dBZ < 5) return [0, 0, 0, 0];
  let chosen = REFLECTIVITY_BINS[1];
  for (const bin of REFLECTIVITY_BINS) {
    if (dBZ >= bin.min) chosen = bin;
  }
  return [chosen.color[0], chosen.color[1], chosen.color[2], 235];
}

// Velocity: green = inbound (negative, toward radar), red = outbound
// (positive, away from radar). A distinct bright color marks range-folded
// (aliased) values.
const VELOCITY_MAX = 50; // m/s scale endpoint for full color saturation

export function velocityColor(
  radialVelocityMs: number,
  isFolded: boolean
): RGBA {
  if (Math.abs(radialVelocityMs) < 1) return [0, 0, 0, 0];

  if (isFolded) {
    // Range-folded / aliased velocity - classic bright purple/white marker
    return [230, 210, 255, 235];
  }

  const t = Math.min(Math.abs(radialVelocityMs) / VELOCITY_MAX, 1);
  const intensity = 60 + t * 195; // ramps from a dim to a saturated color

  if (radialVelocityMs > 0) {
    // outbound - red
    return [intensity, 20, 20, 200 + t * 35];
  }
  // inbound - green
  return [20, intensity, 60, 200 + t * 35];
}
