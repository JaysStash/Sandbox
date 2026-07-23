import { createClient } from "@/lib/supabase/server";
import BadgeManagerClient from "@/components/BadgeManagerClient";
import type { BadgeInput } from "@/app/admin/badges/actions";

type BadgeRow = BadgeInput & { id: string };

export default async function AdminBadgesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("badges")
    .select("id, name, description, icon, tier, animation_style, criteria, is_active")
    .order("name");

  const badges: BadgeRow[] = data ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">
        Badges ({badges.length})
      </h2>
      <p className="mt-1 text-sm text-gray-400">
        Create, edit, and deactivate badges. To grant or revoke a badge for a
        specific member, use{" "}
        <a href="/admin/users" className="text-bolt-500 hover:underline">
          User Management
        </a>
        .
      </p>
      <div className="mt-5">
        <BadgeManagerClient initialBadges={badges} />
      </div>
    </div>
  );
}
