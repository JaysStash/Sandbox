"use client";

import BadgeIcon from "@/components/BadgeIcon";

export default function BadgeEarnedNotice({
  badgeNames,
}: {
  badgeNames: string[];
}) {
  if (badgeNames.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-fuchsia-400/50 bg-gradient-to-br from-storm-900 to-fuchsia-950/30 p-4 text-center shadow-[0_0_24px_rgba(213,0,249,0.35)]">
      <div className="badge-glow-pulse mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-fuchsia-400/60">
        <BadgeIcon icon="Award" size={20} className="text-fuchsia-300" />
      </div>
      <p className="mt-2 text-sm font-bold uppercase tracking-wide text-fuchsia-300">
        {badgeNames.length === 1 ? "Badge Earned!" : "Badges Earned!"}
      </p>
      <p className="mt-1 text-[#e8ecf5]">{badgeNames.join(", ")}</p>
      <p className="mt-1 text-xs text-gray-400">
        Check your Profile to see it in your collection.
      </p>
    </div>
  );
}
