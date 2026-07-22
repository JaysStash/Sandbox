"use client";

import { useState } from "react";
import { saveSetting } from "@/app/admin/settings/actions";

export default function SettingsToggle({
  settingKey,
  label,
  description,
  initialValue,
}: {
  settingKey: string;
  label: string;
  description: string;
  initialValue: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !value;
    setValue(next);
    setSaving(true);
    await saveSetting(settingKey, next);
    setSaving(false);
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-storm-700 bg-storm-900 p-4">
      <div>
        <p className="font-medium text-[#e8ecf5]">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          value ? "bg-bolt-500" : "bg-storm-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
