import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BadgeCard from "@/components/BadgeCard";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-bolt-500">Profile</h1>
        <p className="mt-3 text-gray-400">Please log in to see your profile.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Log In
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, referral_code, created_at")
    .eq("id", user.id)
    .single();

  const { data: allBadges } = await supabase
    .from("badges")
    .select("id, name, description, icon, tier")
    .eq("is_active", true);

  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id));
  const earnedBadges = (allBadges ?? []).filter((b) => earnedIds.has(b.id));
  const lockedBadges = (allBadges ?? []).filter((b) => !earnedIds.has(b.id));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">
        {profile?.display_name ?? "Your Profile"}
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        Member since{" "}
        {profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            })
          : "—"}
      </p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-storm-700 bg-storm-900 px-4 py-2">
        <span className="text-xs text-gray-400">Referral Code</span>
        <span className="font-mono text-bolt-500">
          {profile?.referral_code ?? "—"}
        </span>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-bolt-400">
        Badges Earned ({earnedBadges.length})
      </h2>
      {earnedBadges.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          No badges yet — create a storm or leave a rating to earn your first one.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {earnedBadges.map((b) => (
            <BadgeCard
              key={b.id}
              name={b.name}
              description={b.description}
              icon={b.icon}
              tier={b.tier}
              earned
            />
          ))}
        </div>
      )}

      {lockedBadges.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-semibold text-gray-400">
            Locked ({lockedBadges.length})
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {lockedBadges.map((b) => (
              <BadgeCard
                key={b.id}
                name={b.name}
                description={b.description}
                icon={b.icon}
                tier={b.tier}
                earned={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
