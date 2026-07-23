"use client";

import { useState } from "react";
import { STORM_TYPES } from "@/lib/stormTypes";
import {
  saveParameter,
  deleteParameter,
  type ParameterInput,
} from "@/app/admin/storm-parameters/actions";

type Param = ParameterInput & { id: string };

const BLANK: ParameterInput = {
  storm_type: "tornado",
  param_key: "",
  category: "",
  name: "",
  description: "",
  min_value: 0,
  max_value: 100,
  default_value: 50,
  unit: "",
  sort_order: 0,
};

function ParamEditor({
  initial,
  onSaved,
  onCancel,
}: {
  initial: ParameterInput;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ParameterInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ParameterInput>(key: K, value: ParameterInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.param_key.trim() || !form.name.trim()) {
      setError("Key and name are required.");
      return;
    }
    setSaving(true);
    const res = await saveParameter(form);
    setSaving(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="rounded-lg border border-storm-700 bg-storm-900 p-4">
      {!initial.id && (
        <>
          <label className="text-xs text-gray-400">Machine Key (no spaces)</label>
          <input
            value={form.param_key}
            onChange={(e) => set("param_key", e.target.value)}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
          />
        </>
      )}

      <label className="mt-3 block text-xs text-gray-400">Display Name</label>
      <input
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
      />

      <label className="mt-3 block text-xs text-gray-400">Category</label>
      <input
        value={form.category}
        onChange={(e) => set("category", e.target.value)}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
      />

      <label className="mt-3 block text-xs text-gray-400">Description</label>
      <textarea
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
      />

      <div className="mt-3 grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-gray-400">Min</label>
          <input
            type="number"
            value={form.min_value}
            onChange={(e) => set("min_value", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-2 py-1.5 text-sm text-[#e8ecf5]"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Max</label>
          <input
            type="number"
            value={form.max_value}
            onChange={(e) => set("max_value", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-2 py-1.5 text-sm text-[#e8ecf5]"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Default</label>
          <input
            type="number"
            value={form.default_value}
            onChange={(e) => set("default_value", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-2 py-1.5 text-sm text-[#e8ecf5]"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-2 py-1.5 text-sm text-[#e8ecf5]"
          />
        </div>
      </div>

      <label className="mt-3 block text-xs text-gray-400">Unit</label>
      <input
        value={form.unit}
        onChange={(e) => set("unit", e.target.value)}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
      />

      {error && <p className="mt-3 text-sm text-radar-red">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-storm-700 py-2 text-sm text-gray-300 hover:bg-storm-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-bolt-500 py-2 text-sm font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Parameter"}
        </button>
      </div>
    </div>
  );
}

export default function StormParameterManager({
  initialParams,
}: {
  initialParams: Param[];
}) {
  const [stormType, setStormType] = useState("tornado");
  const [params, setParams] = useState<Param[]>(initialParams);
  const [editing, setEditing] = useState<Param | ParameterInput | null>(null);
  const [creating, setCreating] = useState(false);

  function refresh() {
    setEditing(null);
    setCreating(false);
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this parameter? This affects the live Sandbox immediately."))
      return;
    const res = await deleteParameter(id);
    if (res.success) setParams((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = params.filter((p) => p.storm_type === stormType);
  const grouped = new Map<string, Param[]>();
  for (const p of filtered) {
    const list = grouped.get(p.category) ?? [];
    list.push(p);
    grouped.set(p.category, list);
  }

  if (creating) {
    return (
      <ParamEditor
        initial={{ ...BLANK, storm_type: stormType }}
        onSaved={refresh}
        onCancel={() => setCreating(false)}
      />
    );
  }
  if (editing) {
    return (
      <ParamEditor initial={editing} onSaved={refresh} onCancel={() => setEditing(null)} />
    );
  }

  return (
    <div>
      <select
        value={stormType}
        onChange={(e) => setStormType(e.target.value)}
        className="w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5]"
      >
        {STORM_TYPES.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>

      <button
        onClick={() => setCreating(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-storm-700 py-2 text-sm text-gray-400 hover:border-bolt-500 hover:text-bolt-400"
      >
        + Add Parameter
      </button>

      {filtered.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          No parameters defined for this storm type yet.
        </p>
      )}

      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category} className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {category}
          </h3>
          <div className="mt-2 space-y-2">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-storm-700 bg-storm-900 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#e8ecf5]">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.min_value}–{p.max_value} {p.unit} (default {p.default_value})
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-bolt-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-radar-red hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
