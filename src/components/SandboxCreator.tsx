"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ParameterSlider from "@/components/ParameterSlider";
import OutlookBox from "@/components/OutlookBox";
import {
  calculateTornadoOutlook,
  type TornadoParameters,
} from "@/lib/outlookEngine";
import { saveStorm } from "@/app/sandbox/create/actions";

type ParamDef = {
  param_key: string;
  category: string;
  name: string;
  description: string | null;
  min_value: number;
  max_value: number;
  default_value: number;
  unit: string | null;
  sort_order: number;
};

const CATEGORY_ORDER = [
  "Instability",
  "Moisture",
  "Kinematics & Shear",
  "Thermodynamic Structure",
  "Mesoscale Factors",
];

function inferStep(min: number, max: number, defaultValue: number): number {
  const hasDecimal = (n: number) => Math.abs(n - Math.round(n)) > 1e-9;
  return hasDecimal(min) || hasDecimal(max) || hasDecimal(defaultValue)
    ? 0.1
    : 1;
}

export default function SandboxCreator({
  stormType,
  region,
  definitions,
}: {
  stormType: string;
  region: string;
  definitions: ParamDef[];
}) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const def of definitions) {
      initial[def.param_key] = def.default_value;
    }
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const outlook = useMemo(() => {
    return calculateTornadoOutlook(values as unknown as TornadoParameters);
  }, [values]);

  const grouped = useMemo(() => {
    const map = new Map<string, ParamDef[]>();
    for (const def of definitions) {
      const list = map.get(def.category) ?? [];
      list.push(def);
      map.set(def.category, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [definitions]);

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    const res = await saveStorm(stormType, region, values, outlook);
    setSaving(false);
    setSaveResult(res);
  }

  if (saveResult?.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div
          className="mx-auto mb-4 h-3 w-3 rounded-full"
          style={{ backgroundColor: outlook.categoryColor }}
        />
        <h1 className="text-2xl font-bold text-bolt-500">Storm Saved!</h1>
        <p className="mt-3 text-gray-300">{outlook.headline}</p>
        <p className="mt-4 text-sm text-gray-500">
          Animated radar playback and damage statistics are coming with the
          Map &amp; Radar phase — your full parameter set and outlook are
          already saved to your account.
        </p>
        <Link
          href="/sandbox"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Create Another Storm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-44 pt-8">
      <h1 className="text-2xl font-bold text-bolt-500">
        Tornado Parameters
      </h1>
      <p className="mt-1 text-sm text-gray-400">Region: {region}</p>

      <div className="mt-6 space-y-8">
        {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((category) => (
          <div key={category}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
              {category}
            </h2>
            <div className="space-y-3">
              {grouped.get(category)!.map((def) => (
                <ParameterSlider
                  key={def.param_key}
                  name={def.name}
                  unit={def.unit}
                  description={def.description}
                  min={def.min_value}
                  max={def.max_value}
                  step={inferStep(def.min_value, def.max_value, def.default_value)}
                  value={values[def.param_key]}
                  onChange={(v) =>
                    setValues((prev) => ({ ...prev, [def.param_key]: v }))
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <OutlookBox
          outlook={outlook}
          onSave={handleSave}
          saving={saving}
          saveMessage={saveResult}
        />
      </div>
    </div>
  );
}
