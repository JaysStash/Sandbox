"use client";

import { useState } from "react";
import BadgeIcon from "@/components/BadgeIcon";
import BadgeForm from "@/components/BadgeForm";
import { deleteBadge, type BadgeInput } from "@/app/admin/badges/actions";

type Badge = BadgeInput & { id: string };

const BLANK_BADGE: BadgeInput = {
  name: "",
  description: "",
  icon: "Award",
  tier: "bronze",
  animation_style: "glow",
  criteria: { type: "storm_count", count: 1 },
  is_active: true,
};

export default function BadgeManagerClient({
  initialBadges,
}: {
  initialBadges: Badge[];
}) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [editing, setEditing] = useState<Badge | BadgeInput | null>(null);
  const [creating, setCreating] = useState(false);

  function handleSaved() {
    setEditing(null);
    setCreating(false);
    // A full reload is simplest here to reflect create/edit/delete reliably
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this badge? This cannot be undone.")) return;
    const res = await deleteBadge(id);
    if (res.success) {
      setBadges((prev) => prev.filter((b) => b.id !== id));
    }
  }

  if (creating) {
    return (
      <BadgeForm
        initial={BLANK_BADGE}
        onSaved={handleSaved}
        onCancel={() => setCreating(false)}
      />
    );
  }

  if (editing) {
    return (
      <BadgeForm
        initial={editing}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-lg border border-dashed border-storm-700 py-2 text-sm text-gray-400 hover:border-bolt-500 hover:text-bolt-400"
      >
        + New Badge
      </button>

      <div className="mt-4 space-y-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-3 rounded-lg border border-storm-700 bg-storm-900 p-3"
          >
            <BadgeIcon icon={badge.icon} size={22} className="text-bolt-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-[#e8ecf5]">
                  {badge.name}
                </span>
                <span className="shrink-0 rounded-full bg-storm-800 px-2 py-0.5 text-[10px] uppercase text-gray-400">
                  {badge.tier}
                </span>
                {!badge.is_active && (
                  <span className="shrink-0 rounded-full bg-storm-700 px-2 py-0.5 text-[10px] text-gray-500">
                    inactive
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-gray-500">{badge.description}</p>
            </div>
            <button
              onClick={() => setEditing(badge)}
              className="shrink-0 text-xs text-bolt-500 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(badge.id)}
              className="shrink-0 text-xs text-radar-red hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
