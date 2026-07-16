"use client";

import { useState } from "react";

type ParamDef = {
  category: string;
  name: string;
  description: string | null;
  unit: string | null;
};

type StormTypeWithParams = {
  slug: string;
  name: string;
  description: string;
  available: boolean;
  parameters: ParamDef[];
};

const CATEGORY_ORDER = [
  "Instability",
  "Moisture",
  "Kinematics & Shear",
  "Thermodynamic Structure",
  "Mesoscale Factors",
];

export default function EducationBrowser({
  stormTypes,
}: {
  stormTypes: StormTypeWithParams[];
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {stormTypes.map((type) => {
        const isOpen = openSlug === type.slug;
        const grouped = new Map<string, ParamDef[]>();
        for (const p of type.parameters) {
          const list = grouped.get(p.category) ?? [];
          list.push(p);
          grouped.set(p.category, list);
        }

        return (
          <div
            key={type.slug}
            className="overflow-hidden rounded-xl border border-storm-700 bg-storm-900"
          >
            <button
              onClick={() => setOpenSlug(isOpen ? null : type.slug)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <span className="font-semibold text-[#e8ecf5]">
                  {type.name}
                </span>
                <p className="mt-0.5 text-xs text-gray-400">
                  {type.description}
                </p>
              </div>
              <span
                className={`ml-4 shrink-0 text-bolt-500 transition-transform ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5">
                {type.parameters.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Parameters for this storm type are coming soon.
                  </p>
                ) : (
                  CATEGORY_ORDER.filter((c) => grouped.has(c)).map(
                    (category) => (
                      <div key={category} className="mt-4 first:mt-0">
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {grouped.get(category)!.map((p) => (
                            <div
                              key={p.name}
                              className="rounded-lg bg-storm-800 p-3"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-sm font-medium text-[#e8ecf5]">
                                  {p.name}
                                </span>
                                {p.unit && (
                                  <span className="font-mono text-xs text-bolt-500">
                                    {p.unit}
                                  </span>
                                )}
                              </div>
                              {p.description && (
                                <p className="mt-1 text-xs text-gray-400">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
