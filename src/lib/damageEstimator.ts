import type { OutlookResult, TornadoParameters, DerechoParameters } from "@/lib/outlookEngine";

export type DamageEstimate = {
  headline: string;
  efRatingLow: string;
  efRatingHigh: string;
  peakWindMph: number;
  hailInches: number;
  pathLengthMiles: number;
  pathWidthMiles: number;
  durationMinutes: number;
  estimatedPopulationExposed: number;
  estimatedDamageUSD: number;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const emptyEstimate = (headline: string): DamageEstimate => ({
  headline,
  efRatingLow: "N/A",
  efRatingHigh: "N/A",
  peakWindMph: 0,
  hailInches: 0,
  pathLengthMiles: 0,
  pathWidthMiles: 0,
  durationMinutes: 0,
  estimatedPopulationExposed: 0,
  estimatedDamageUSD: 0,
});

function efRatingFromStp(stp: number): { low: string; high: string } {
  if (stp <= 0.1) return { low: "N/A", high: "N/A" };
  if (stp < 0.5) return { low: "EF0", high: "EF0" };
  if (stp < 1) return { low: "EF0", high: "EF1" };
  if (stp < 2) return { low: "EF1", high: "EF2" };
  if (stp < 4) return { low: "EF2", high: "EF3" };
  if (stp < 6) return { low: "EF3", high: "EF4" };
  return { low: "EF4", high: "EF5" };
}

const EF_PEAK_WIND: Record<string, number> = {
  "N/A": 0, EF0: 80, EF1: 105, EF2: 130, EF3: 155, EF4: 190, EF5: 210,
};
const COST_PER_PERSON_BY_EF: Record<string, number> = {
  "N/A": 0, EF0: 500, EF1: 2000, EF2: 8000, EF3: 25000, EF4: 60000, EF5: 120000,
};

function tornadoDamage(
  parameters: TornadoParameters,
  outlook: OutlookResult,
  populationDensityPerSqKm: number
): DamageEstimate {
  const { stp } = outlook.diagnostics;
  if (!outlook.supercellLikely || stp <= 0.1) {
    return emptyEstimate("No organized tornado threat from this setup.");
  }

  const { low, high } = efRatingFromStp(stp);
  const peakWindMph = EF_PEAK_WIND[high] ?? 0;
  const durationMinutes = Math.round(5 + clamp(stp, 0, 6) * 6);
  const translationSpeedMph = 20 + (parameters.wind_speed_500mb / 100) * 25;
  const pathLengthMiles = (translationSpeedMph * durationMinutes) / 60;
  const pathWidthMiles = clamp(0.05 + (parameters.srh_0_1km / 600) * 0.95, 0.05, 1.2);
  const pathAreaSqKm = pathLengthMiles * 1.60934 * (pathWidthMiles * 1.60934);
  const estimatedPopulationExposed = Math.round(pathAreaSqKm * populationDensityPerSqKm * 0.4);
  const estimatedDamageUSD = Math.round(estimatedPopulationExposed * (COST_PER_PERSON_BY_EF[high] ?? 0));

  return {
    headline: `${low}–${high} tornado potential`,
    efRatingLow: low,
    efRatingHigh: high,
    peakWindMph,
    hailInches: 0,
    pathLengthMiles: Math.round(pathLengthMiles * 10) / 10,
    pathWidthMiles: Math.round(pathWidthMiles * 100) / 100,
    durationMinutes,
    estimatedPopulationExposed,
    estimatedDamageUSD,
  };
}

function supercellDamage(
  parameters: TornadoParameters,
  outlook: OutlookResult,
  populationDensityPerSqKm: number
): DamageEstimate {
  if (!outlook.supercellLikely) {
    return emptyEstimate("No organized supercell threat from this setup.");
  }

  const hailInches = outlook.diagnostics.hailInches ?? 0;
  const gustMph = outlook.diagnostics.gustMph ?? 0;
  const durationMinutes = Math.round(20 + clamp(outlook.diagnostics.scp, 0, 6) * 12);
  const translationSpeedMph = 20 + (parameters.wind_speed_500mb / 100) * 25;
  const pathLengthMiles = (translationSpeedMph * durationMinutes) / 60;
  const pathWidthMiles = clamp(1 + (parameters.shear_0_6km / 90) * 4, 1, 6);
  const pathAreaSqKm = pathLengthMiles * 1.60934 * (pathWidthMiles * 1.60934);
  const estimatedPopulationExposed = Math.round(pathAreaSqKm * populationDensityPerSqKm * 0.5);
  const costPerPerson = 300 + hailInches * 900 + Math.max(0, gustMph - 50) * 40;
  const estimatedDamageUSD = Math.round(estimatedPopulationExposed * costPerPerson);

  return {
    headline: `Up to ${hailInches.toFixed(1)}" hail, ${Math.round(gustMph)} mph gusts`,
    efRatingLow: "N/A",
    efRatingHigh: "N/A",
    peakWindMph: Math.round(gustMph),
    hailInches: Math.round(hailInches * 10) / 10,
    pathLengthMiles: Math.round(pathLengthMiles * 10) / 10,
    pathWidthMiles: Math.round(pathWidthMiles * 10) / 10,
    durationMinutes,
    estimatedPopulationExposed,
    estimatedDamageUSD,
  };
}

function hailDamage(
  parameters: TornadoParameters,
  outlook: OutlookResult,
  populationDensityPerSqKm: number
): DamageEstimate {
  if (!outlook.supercellLikely) {
    return emptyEstimate("No organized hail-producing updraft from this setup.");
  }

  const hailInches = outlook.diagnostics.hailInches ?? 0;
  const durationMinutes = Math.round(15 + clamp(hailInches, 0, 4) * 10);
  const translationSpeedMph = 20 + (parameters.wind_speed_500mb / 100) * 25;
  const pathLengthMiles = (translationSpeedMph * durationMinutes) / 60;
  const pathWidthMiles = clamp(1.5 + hailInches * 1.5, 1.5, 8);
  const pathAreaSqKm = pathLengthMiles * 1.60934 * (pathWidthMiles * 1.60934);
  const estimatedPopulationExposed = Math.round(pathAreaSqKm * populationDensityPerSqKm * 0.5);
  const costPerPerson = 200 + hailInches * 1100;
  const estimatedDamageUSD = Math.round(estimatedPopulationExposed * costPerPerson);

  return {
    headline: `Hail up to ${hailInches.toFixed(1)}" in diameter`,
    efRatingLow: "N/A",
    efRatingHigh: "N/A",
    peakWindMph: 0,
    hailInches: Math.round(hailInches * 10) / 10,
    pathLengthMiles: Math.round(pathLengthMiles * 10) / 10,
    pathWidthMiles: Math.round(pathWidthMiles * 10) / 10,
    durationMinutes,
    estimatedPopulationExposed,
    estimatedDamageUSD,
  };
}

function derechoDamage(
  parameters: DerechoParameters,
  outlook: OutlookResult,
  populationDensityPerSqKm: number
): DamageEstimate {
  if (!outlook.supercellLikely) {
    return emptyEstimate("No organized derecho-producing line from this setup.");
  }

  const gustMph = outlook.diagnostics.gustMph ?? 0;
  const pathLengthMiles = clamp(parameters.system_length_km * 0.621 * 2, 50, 900);
  const pathWidthMiles = clamp(parameters.system_length_km / 15, 10, 60);
  const durationMinutes = Math.round(pathLengthMiles / Math.max(15, parameters.storm_motion_speed) * 60);
  const pathAreaSqKm = pathLengthMiles * 1.60934 * (pathWidthMiles * 1.60934);
  const estimatedPopulationExposed = Math.round(pathAreaSqKm * populationDensityPerSqKm * 0.35);
  const costPerPerson = 150 + Math.max(0, gustMph - 58) * 25;
  const estimatedDamageUSD = Math.round(estimatedPopulationExposed * costPerPerson);

  return {
    headline: `Widespread ${Math.round(gustMph)} mph gusts across a ${Math.round(pathLengthMiles)}-mile swath`,
    efRatingLow: "N/A",
    efRatingHigh: "N/A",
    peakWindMph: Math.round(gustMph),
    hailInches: 0,
    pathLengthMiles: Math.round(pathLengthMiles),
    pathWidthMiles: Math.round(pathWidthMiles),
    durationMinutes,
    estimatedPopulationExposed,
    estimatedDamageUSD,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateDamageEstimate(
  stormType: string,
  parameters: any,
  outlook: OutlookResult,
  populationDensityPerSqKm: number
): DamageEstimate {
  if (stormType === "supercell") {
    return supercellDamage(parameters as TornadoParameters, outlook, populationDensityPerSqKm);
  }
  if (stormType === "hail") {
    return hailDamage(parameters as TornadoParameters, outlook, populationDensityPerSqKm);
  }
  if (stormType === "derecho") {
    return derechoDamage(parameters as DerechoParameters, outlook, populationDensityPerSqKm);
  }
  return tornadoDamage(parameters as TornadoParameters, outlook, populationDensityPerSqKm);
}
