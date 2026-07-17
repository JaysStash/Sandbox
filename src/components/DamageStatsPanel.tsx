"use client";

import type { DamageEstimate } from "@/lib/damageEstimator";

export default function DamageStatsPanel({
  estimate,
  region,
  onClose,
}: {
  estimate: DamageEstimate;
  region: string;
  onClose: () => void;
}) {
  const noTornado = estimate.efRatingHigh === "N/A";

  return (
    <div className="border-t border-storm-700 bg-storm-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-bolt-500">Storm Statistics</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-bolt-400"
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">Region: {region}</p>

      {noTornado ? (
        <p className="mt-4 text-gray-300">
          This setup did not support an organized, tornado-producing
          supercell — no tornado damage to report for this run.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="EF Rating" value={`${estimate.efRatingLow}–${estimate.efRatingHigh}`} />
          <Stat label="Peak Winds" value={`${estimate.peakWindMph} mph`} />
          <Stat label="Path Length" value={`${estimate.pathLengthMiles} mi`} />
          <Stat label="Path Width" value={`${estimate.pathWidthMiles} mi`} />
          <Stat label="Duration" value={`${estimate.durationMinutes} min`} />
          <Stat
            label="Population Exposed"
            value={estimate.estimatedPopulationExposed.toLocaleString()}
          />
          <Stat
            label="Est. Damage"
            value={`$${estimate.estimatedDamageUSD.toLocaleString()}`}
            wide
          />
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-gray-500">
        These are first-pass estimates from a regional population-density
        average and standard EF-scale wind ranges — not real building-level or
        census data yet. Deeper terrain/population modeling is a planned
        future upgrade.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-storm-700 bg-storm-800 p-3 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-0.5 font-mono text-lg text-bolt-500">{value}</div>
    </div>
  );
}
