import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserBadgeManager from "@/components/UserBadgeManager";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, referral_code, created_at")
    .eq("id", userId)
    .single();

  if (!profile) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-bolt-400">User Not Found</h2>
        <Link href="/admin/users" className="mt-3 inline-block text-sm text-bolt-500 hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const [{ count: stormCount }, { data: allBadgesData }, { data: earnedData }] =
    await Promise.all([
      supabase
        .from("storms")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase.from("badges").select("id, name, icon, tier").order("name"),
      supabase.from("user_badges").select("badge_id").eq("user_id", userId),
    ]);

  type BadgeOption = { id: string; name: string; icon: string; tier: string };
  const allBadges: BadgeOption[] = allBadgesData ?? [];
  const earnedIds = (earnedData ?? []).map((row: { badge_id: string }) => row.badge_id);

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-gray-400 hover:text-bolt-400">
        ← Back to search
      </Link>

      <h2 className="mt-2 text-xl font-semibold text-bolt-400">
        {profile.display_name ?? "Unnamed Member"}
      </h2>
      <p className="mt-1 text-sm text-gray-400">
        Joined{" "}
        {new Date(profile.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        · Referral code <span className="font-mono text-bolt-500">{profile.referral_code}</span>
        {" "}· {stormCount ?? 0} storms created
      </p>

      <h3 className="mt-8 font-semibold text-bolt-400">Badges</h3>
      <p className="mt-1 text-xs text-gray-500">
        Tap any badge to grant or revoke it for this member.
      </p>
      <div className="mt-4">
        <UserBadgeManager
          userId={userId}
          allBadges={allBadges}
          initialEarnedIds={earnedIds}
        />
      </div>
    </div>
  );
}
