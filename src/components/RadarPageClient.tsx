"use client";

import { useState } from "react";
import RadarScope from "@/components/RadarScope";
import DamageStatsPanel from "@/components/DamageStatsPanel";
import { calculateDamageEstimate } from "@/lib/damageEstimator";
import type { OutlookResult, TornadoParameters } from "@/lib/outlookEngine";

export default function RadarPageClient({
  stormType,
  region,
  regionCenter,
  parameters,
  outlook,
  populationDensity,
}: {
  stormType: string;
  region: string;
  regionCenter: { lat: number; lng: number };
  parameters: TornadoParameters;
  outlook: OutlookResult;
  populationDensity: number;
}) {
  const [showStats, setShowStats] = useState(false);

  const damageEstimate = calculateDamageEstimate(
    stormType,
    parameters,
    outlook,
    populationDensity
  );

  return (
    <div className="mx-auto max-w-md px-4 pb-12">
      <RadarScope
        regionCenter={regionCenter}
        parameters={parameters}
        outlook={outlook}
      />

      {!showStats ? (
        <button
          onClick={() => setShowStats(true)}
          className="mt-4 w-full rounded-lg border border-storm-700 py-2 text-sm text-gray-300 hover:bg-storm-800"
        >
          View Damage Statistics
        </button>
      ) : (
        <div className="mt-4">
          <DamageStatsPanel
            estimate={damageEstimate}
            region={region}
            onClose={() => setShowStats(false)}
          />
        </div>
      )}
    </div>
  );
}
