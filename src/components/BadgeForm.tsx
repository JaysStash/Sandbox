"use client";

import { useState } from "react";
import IconPicker from "@/components/IconPicker";
import { saveBadge, type BadgeInput } from "@/app/admin/badges/actions";
import { STORM_TYPES } from "@/lib/stormTypes";

const CRITERIA_TYPES = [
  { value: "storm_count", label: "Created N storms" },
  { value: "storm_type_used", label: "Used a specific storm type" },
  { value: "risk_category_reached", label: "Reached a risk category" },
  { value: "rating_given", label: "Left any rating" },
  { value: "rating_value", label: "Left a rating of N stars" },
  { value: "unique_regions", label: "Created storms in N regions" },
  { value: "referral_count", label: "Referred N friends" },
  { value: "manual", label: "Manual only (admin grants by hand)" },
];

const RISK_CATEGORIES = ["TSTM", "MRGL", "SLGT", "ENH", "MDT", "HIGH"];

type EditableBadge = BadgeInput & { id?: string };

export default function BadgeForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: EditableBadge;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState(initial.icon);
  const [tier, setTier] = useState(initial.tier);
  const [animationStyle, setAnimationStyle] = useState(initial.animation_style);
  const [isActive, setIsActive] = useState(initial.is_active);
  const [criteriaType, setCriteriaType] = useState<string>(
    (initial.criteria?.type as string) ?? "storm_count"
  );
  const [count, setCount] = useState<number>(
    (initial.criteria?.count as number) ?? 1
  );
  const [stormType, setStormType] = useState<string>(
    (initial.criteria?.storm_type as string) ?? STORM_TYPES[0].slug
  );
  const [stars, setStars] = useState<number>(
    (initial.criteria?.stars as number) ?? 5
  );
  const [categories, setCategories] = useState<string[]>(
    (initial.criteria?.categories as string[]) ?? ["HIGH"]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function buildCriteria(): Record<string, unknown> {
    switch (criteriaType) {
      case "storm_count":
      case "unique_regions":
      case "referral_count":
        return { type: criteriaType, count };
      case "storm_type_used":
        return { type: criteriaType, storm_type: stormType };
      case "risk_category_reached":
        return { type: criteriaType, categories };
      case "rating_value":
        return { type: criteriaType, stars };
      case "rating_given":
      case "manual":
        return { type: criteriaType };
      default:
        return { type: "manual" };
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await saveBadge({
      id: initial.id,
      name,
      description,
      icon,
      tier,
      animation_style: animationStyle,
      criteria: buildCriteria(),
      is_active: isActive,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="rounded-lg border border-storm-700 bg-storm-900 p-4">
      <label className="text-xs text-gray-400">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
      />

      <label className="mt-3 block text-xs text-gray-400">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
      />

      <label className="mt-3 block text-xs text-gray-400">Icon</label>
      <div className="mt-1">
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as BadgeInput["tier"])}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">Animation</label>
          <select
            value={animationStyle}
            onChange={(e) =>
              setAnimationStyle(e.target.value as BadgeInput["animation_style"])
            }
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
          >
            <option value="glow">Glow</option>
            <option value="shimmer">Shimmer</option>
          </select>
        </div>
      </div>

      <label className="mt-4 block text-xs font-semibold text-bolt-400">
        Unlock Criteria
      </label>
      <select
        value={criteriaType}
        onChange={(e) => setCriteriaType(e.target.value)}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
      >
        {CRITERIA_TYPES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {(criteriaType === "storm_count" ||
        criteriaType === "unique_regions" ||
        criteriaType === "referral_count") && (
        <div className="mt-2">
          <label className="text-xs text-gray-400">Count needed</label>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5]"
          />
        </div>
      )}

      {criteriaType === "storm_type_used" && (
        <div className="mt-2">
          <label className="text-xs text-gray-400">Storm type</label>
          <select
            value={stormType}
            onChange={(e) => setStormType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
          >
            {STORM_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {criteriaType === "risk_category_reached" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {RISK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs ${
                categories.includes(cat)
                  ? "bg-bolt-500 text-storm-950"
                  : "bg-storm-800 text-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {criteriaType === "rating_value" && (
        <div className="mt-2">
          <label className="text-xs text-gray-400">Stars needed</label>
          <input
            type="number"
            min={1}
            max={5}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5]"
          />
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active (visible and awardable)
      </label>

      {error && <p className="mt-3 text-sm text-radar-red">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-storm-700 py-2 text-sm text-gray-300 hover:bg-storm-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 rounded-lg bg-bolt-500 py-2 text-sm font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Badge"}
        </button>
      </div>
    </div>
  );
}
