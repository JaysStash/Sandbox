"use client";

import * as LucideIcons from "lucide-react";
import { Award } from "lucide-react";

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;
type IconMap = Record<string, IconComponent>;

export default function BadgeIcon({
  icon,
  size = 28,
  className,
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const icons = LucideIcons as unknown as IconMap;
  const Icon = icons[icon] ?? (Award as unknown as IconComponent);
  return <Icon size={size} className={className} />;
}
