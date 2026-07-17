"use client";

import BadgeIcon from "@/components/BadgeIcon";

type Tier = "bronze" | "silver" | "gold" | "legendary";

const TIER_STYLES: Record<
  Tier,
  { ring: string; glow: string; iconColor: string; shimmer: boolean }
> = {
  bronze: {
    ring: "border-[#cd7f32]/50",
    glow: "shadow-[0_0_16px_rgba(205,127,50,0.35)]",
    iconColor: "text-[#cd7f32]",
    shimmer: false,
  },
  silver: {
    ring: "border-[#c0c0c0]/50",
    glow: "shadow-[0_0_18px_rgba(192,192,192,0.4)]",
    iconColor: "text-[#d8d8d8]",
    shimmer: false,
  },
  gold: {
    ring: "border-[#ffd700]/60",
    glow: "shadow-[0_0_22px_rgba(255,215,0,0.45)]",
    iconColor: "text-[#ffd700]",
    shimmer: true,
  },
  legendary: {
    ring: "border-fuchsia-400/60",
    glow: "shadow-[0_0_28px_rgba(213,0,249,0.55)]",
    iconColor: "text-fuchsia-400",
    shimmer: true,
  },
};

export default function BadgeCard({
  name,
  description,
  icon,
  tier,
  earned = true,
}: {
  name: string;
  description?: string | null;
  icon: string;
  tier: string;
  earned?: boolean;
}) {
  const style = TIER_STYLES[(tier as Tier) in TIER_STYLES ? (tier as Tier) : "bronze"];

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border bg-gradient-to-b from-storm-800 to-storm-900 p-4 text-center transition ${
        earned ? `${style.ring} ${style.glow}` : "border-storm-700 opacity-40 grayscale"
      }`}
    >
      <div
        className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 ${
          earned ? style.ring : "border-storm-700"
        } ${earned ? "badge-glow-pulse" : ""} ${
          earned && style.shimmer ? "badge-shimmer" : ""
        }`}
      >
        <BadgeIcon
          icon={icon}
          size={26}
          className={earned ? style.iconColor : "text-gray-600"}
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#e8ecf5]">{name}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
      {tier === "legendary" && earned && (
        <span className="mt-2 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">
          Legendary
        </span>
      )}
    </div>
  );
}
