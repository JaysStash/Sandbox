"use client";

import { useState } from "react";
import BadgeIcon from "@/components/BadgeIcon";
import { BADGE_ICON_OPTIONS } from "@/lib/badgeIconList";

export default function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = BADGE_ICON_OPTIONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-sm text-[#e8ecf5]"
      >
        <BadgeIcon icon={value} size={18} className="text-bolt-500" />
        {value}
        <span className="ml-auto text-xs text-gray-500">
          {open ? "Close" : "Change"}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-storm-700 bg-storm-900 p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-1.5 text-sm text-[#e8ecf5] outline-none focus:border-bolt-500"
          />
          <div className="mt-3 grid max-h-64 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-6">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-storm-800 ${
                  name === value ? "bg-storm-800 ring-1 ring-bolt-500" : ""
                }`}
                title={name}
              >
                <BadgeIcon icon={name} size={20} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
