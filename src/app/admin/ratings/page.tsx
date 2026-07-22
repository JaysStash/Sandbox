import { createClient } from "@/lib/supabase/server";

type RatingRow = {
  id: string;
  stars: number;
  review: string | null;
  created_at: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

export default async function AdminRatingsPage() {
  const supabase = await createClient();

  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("id, stars, review, created_at, user_id")
    .order("created_at", { ascending: false });

  const ratings: RatingRow[] = ratingsData ?? [];

  const userIds = Array.from(new Set(ratings.map((r: RatingRow) => r.user_id)));
  let profiles: ProfileRow[] = [];
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    profiles = profilesData ?? [];
  }
  const nameById = new Map(profiles.map((p: ProfileRow) => [p.id, p.display_name]));

  const avgStars =
    ratings.length > 0
      ? (ratings.reduce((sum: number, r: RatingRow) => sum + r.stars, 0) / ratings.length).toFixed(1)
      : "—";

  return (
    <div>
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-bolt-400">
          Ratings ({ratings.length})
        </h2>
        <span className="rounded-full bg-storm-800 px-3 py-1 text-sm text-bolt-500">
          Avg {avgStars} ★
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {ratings.length === 0 && (
          <p className="text-sm text-gray-500">No ratings yet.</p>
        )}
        {ratings.map((rating: RatingRow) => (
          <div
            key={rating.id}
            className="rounded-lg border border-storm-700 bg-storm-900 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-bolt-500">{"★".repeat(rating.stars)}{"☆".repeat(5 - rating.stars)}</span>
              <span className="text-xs text-gray-500">
                {new Date(rating.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {nameById.get(rating.user_id) ?? "A member"}
            </p>
            {rating.review && (
              <p className="mt-2 text-sm text-[#e8ecf5]">{rating.review}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
