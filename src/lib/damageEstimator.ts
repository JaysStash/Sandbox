import type { OutlookResult, TornadoParameters } from "@/lib/outlookEngine";

export type DamageEstimate = {
  efRatingLow: string;
  efRatingHigh: string;
  peakWindMph: number;
  pathLengthMiles: number;
  pathWidthMiles: number;
  durationMinutes: number;
  estimatedPopulationExposed: number;
  estimatedDamageUSD: number;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function efRatingFromStp(
  stp: number,
  supercellLikely: boolean
): { low: string; high: string } {
  if (!supercellLikely || stp <= 0.1) return { low: "N/A", high: "N/A" };
  if (stp < 0.5) return { low: "EF0", high: "EF0" };
  if (stp < 1) return { low: "EF0", high: "EF1" };
  if (stp < 2) return { low: "EF1", high: "EF2" };
  if (stp < 4) return { low: "EF2", high: "EF3" };
  if (stp < 6) return { low: "EF3", high: "EF4" };
  return { low: "EF4", high: "EF5" };
}

// Approximate peak wind speed (mph) associated with each EF rating,
// consistent with the public NWS Enhanced Fujita Scale wind estimates.
const EF_PEAK_WIND: Record<string, number> = {
  "N/A": 0,
  EF0: 80,
  EF1: 105,
  EF2: 130,
  EF3: 155,
  EF4: 190,
  EF5: 210,
};

// Very rough order-of-magnitude cost per person in the damage path, scaled
// by intensity - a heuristic, not an actuarial model.
const COST_PER_PERSON_BY_EF: Record<string, number> = {
  "N/A": 0,
  EF0: 500,
  EF1: 2000,
  EF2: 8000,
  EF3: 25000,
  EF4: 60000,
  EF5: 120000,
};

export function calculateDamageEstimate(
  parameters: TornadoParameters,
  outlook: OutlookResult,
  populationDensityPerSqKm: number
): DamageEstimate {
  const { stp } = outlook.diagnostics;
  const { low, high } = efRatingFromStp(stp, outlook.supercellLikely);

  if (!outlook.supercellLikely || stp <= 0.1) {
    return {
      efRatingLow: low,
      efRatingHigh: high,
      peakWindMph: 0,
      pathLengthMiles: 0,
      pathWidthMiles: 0,
      durationMinutes: 0,
      estimatedPopulationExposed: 0,
      estimatedDamageUSD: 0,
    };
  }

  const peakWindMph = EF_PEAK_WIND[high] ?? 0;

  // Stronger, better-organized setups statistically tend to be longer-lived.
  const durationMinutes = Math.round(5 + clamp(stp, 0, 6) * 6);

  // Translation speed derived from mid-level steering flow.
  const translationSpeedMph = 20 + (parameters.wind_speed_500mb / 100) * 25;
  const pathLengthMiles = (translationSpeedMph * durationMinutes) / 60;

  // Path width scales with low-level rotational strength.
  const pathWidthMiles = clamp(
    0.05 + (parameters.srh_0_1km / 600) * 0.95,
    0.05,
    1.2
  );

  const pathAreaSqKm = pathLengthMiles * 1.60934 * (pathWidthMiles * 1.60934);

  // Only a fraction of the swept area is actually built-up/populated.
  const estimatedPopulationExposed = Math.round(
    pathAreaSqKm * populationDensityPerSqKm * 0.4
  );

  const estimatedDamageUSD = Math.round(
    estimatedPopulationExposed * (COST_PER_PERSON_BY_EF[high] ?? 0)
  );

  return {
    efRatingLow: low,
    efRatingHigh: high,
    peakWindMph,
    pathLengthMiles: Math.round(pathLengthMiles * 10) / 10,
    pathWidthMiles: Math.round(pathWidthMiles * 100) / 100,
    durationMinutes,
    estimatedPopulationExposed,
    estimatedDamageUSD,
  };
}
