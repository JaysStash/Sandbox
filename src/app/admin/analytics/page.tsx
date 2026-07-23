import { createClient } from "@/lib/supabase/server";
import { getStormType } from "@/lib/stormTypes";

type StormTypeRow = { storm_type: string };
type ReferralCountRow = { referrer_id: string };
type ProfileRow = { id: string; display_name: string | null };
type ProfileDateRow = { created_at: string };

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [{ data: stormsData }, { data: referralsData }, { data: profilesData }] =
    await Promise.all([
      supabase.from("storms").select("storm_type"),
      supabase.from("referrals").select("referrer_id"),
      supabase.from("profiles").select("created_at"),
    ]);

  const storms: StormTypeRow[] = stormsData ?? [];
  const referrals: ReferralCountRow[] = referralsData ?? [];
  const profileDates: ProfileDateRow[] = profilesData ?? [];

  const stormsByType = new Map<string, number>();
  for (const s of storms) {
    stormsByType.set(s.storm_type, (stormsByType.get(s.storm_type) ?? 0) + 1);
  }

  const referralCounts = new Map<string, number>();
  for (const r of referrals) {
    referralCounts.set(
      r.referrer_id,
      (referralCounts.get(r.referrer_id) ?? 0) + 1
    );
  }
  const topReferrerIds = Array.from(referralCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let topReferrerNames = new Map<string, string | null>();
  if (topReferrerIds.length > 0) {
    const { data: referrerProfiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in(
        "id",
        topReferrerIds.map(([id]) => id)
      );
    topReferrerNames = new Map<string, string | null>(
      (referrerProfiles ?? []).map(
        (p: ProfileRow): [string, string | null] => [p.id, p.display_name]
      )
    );
  }

  const signupsByMonth = new Map<string, number>();
  for (const p of profileDates) {
    const month = p.created_at.slice(0, 7); // YYYY-MM
    signupsByMonth.set(month, (signupsByMonth.get(month) ?? 0) + 1);
  }
  const sortedMonths = Array.from(signupsByMonth.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const maxMonthlySignups = Math.max(1, ...sortedMonths.map(([, count]) => count));

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">Analytics</h2>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Storms by Type
      </h3>
      <div className="mt-2 space-y-1">
        {Array.from(stormsByType.entries()).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between text-sm">
            <span className="text-[#e8ecf5]">{getStormType(type)?.name ?? type}</span>
            <span className="font-mono text-bolt-500">{count}</span>
          </div>
        ))}
        {stormsByType.size === 0 && (
          <p className="text-sm text-gray-500">No storms created yet.</p>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Referral Leaderboard
      </h3>
      <div className="mt-2 space-y-1">
        {topReferrerIds.map(([id, count], i) => (
          <div key={id} className="flex items-center justify-between text-sm">
            <span className="text-[#e8ecf5]">
              #{i + 1} {topReferrerNames.get(id) ?? "Unnamed"}
            </span>
            <span className="font-mono text-bolt-500">{count}</span>
          </div>
        ))}
        {topReferrerIds.length === 0 && (
          <p className="text-sm text-gray-500">No referrals yet.</p>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Signups by Month
      </h3>
      <div className="mt-2 space-y-1.5">
        {sortedMonths.map(([month, count]) => (
          <div key={month} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-gray-400">{month}</span>
            <div className="h-2 flex-1 rounded-full bg-storm-800">
              <div
                className="h-2 rounded-full bg-bolt-500"
                style={{ width: `${(count / maxMonthlySignups) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-bolt-500">
              {count}
            </span>
          </div>
        ))}
        {sortedMonths.length === 0 && (
          <p className="text-sm text-gray-500">No signups yet.</p>
        )}
      </div>
    </div>
  );
}
