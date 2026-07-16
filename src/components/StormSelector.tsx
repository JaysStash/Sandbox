"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORM_TYPES, REGIONS } from "@/lib/stormTypes";

export default function StormSelector() {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "region">("type");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [region, setRegion] = useState(REGIONS[0]);

  function handlePickType(slug: string) {
    setSelectedType(slug);
    setStep("region");
  }

  function handleContinue() {
    if (!selectedType) return;
    router.push(
      `/sandbox/create?type=${selectedType}&region=${encodeURIComponent(region)}`
    );
  }

  if (step === "region") {
    const type = STORM_TYPES.find((s) => s.slug === selectedType);
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <button
          onClick={() => setStep("type")}
          className="text-sm text-gray-400 hover:text-bolt-400"
        >
          ← Back
        </button>
        <h1 className="mt-3 text-2xl font-bold text-bolt-500">
          Choose a Region
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Creating: <span className="text-bolt-400">{type?.name}</span>
        </p>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="mt-6 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-3 text-[#e8ecf5] outline-none focus:border-bolt-500"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button
          onClick={handleContinue}
          className="mt-6 w-full rounded-lg bg-bolt-500 py-3 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Continue to Parameters
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">
        What do you want to create?
      </h1>
      <p className="mt-2 text-sm text-gray-400">
        Pick a storm type to get started.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STORM_TYPES.map((type) => (
          <button
            key={type.slug}
            onClick={() => handlePickType(type.slug)}
            className="rounded-xl border border-storm-700 bg-storm-900 p-4 text-left transition hover:border-bolt-500"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#e8ecf5]">
                {type.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  type.available
                    ? "bg-radar-green/20 text-radar-green"
                    : "bg-storm-700 text-gray-400"
                }`}
              >
                {type.available ? "Available" : "Coming Soon"}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
