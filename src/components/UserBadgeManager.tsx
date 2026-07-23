"use client";

import { useState } from "react";
import BadgeIcon from "@/components/BadgeIcon";
import { grantBadge, revokeBadge } from "@/app/admin/badges/actions";

type Badge = {
  id: string;
  name: string;
  icon: string;
  tier: string;
};

export default function UserBadgeManager({
  userId,
  allBadges,
  initialEarnedIds,
}: {
  userId: string;
  allBadges: Badge[];
  initialEarnedIds: string[];
}) {
  const [earnedIds, setEarnedIds] = useState<Set<string>>(
    new Set(initialEarnedIds)
  );
  const [pending, setPending] = useState<string | null>(null);

  async function handleToggle(badgeId: string, currentlyEarned: boolean) {
    setPending(badgeId);
    const res = currentlyEarned
      ? await revokeBadge(userId, badgeId)
      : await grantBadge(userId, badgeId);
    setPending(null);
    if (res.success) {
      setEarnedIds((prev) => {
        const next = new Set(prev);
        if (currentlyEarned) next.delete(badgeId);
        else next.add(badgeId);
        return next;
      });
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {allBadges.map((badge) => {
        const earned = earnedIds.has(badge.id);
        return (
          <button
            key={badge.id}
            onClick={() => handleToggle(badge.id, earned)}
            disabled={pending === badge.id}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center ${
              earned
                ? "border-bolt-500/50 bg-storm-800"
                : "border-storm-700 bg-storm-900 opacity-50"
            }`}
          >
            <BadgeIcon
              icon={badge.icon}
              size={22}
              className={earned ? "text-bolt-500" : "text-gray-600"}
            />
            <span className="text-xs text-[#e8ecf5]">{badge.name}</span>
            <span className="text-[10px] text-gray-500">
              {pending === badge.id ? "..." : earned ? "Tap to revoke" : "Tap to grant"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
