type BadgeCriteria =
  | { type: "storm_count"; count: number }
  | { type: "storm_type_used"; storm_type: string }
  | { type: "risk_category_reached"; categories: string[] }
  | { type: "rating_given" }
  | { type: "rating_value"; stars: number }
  | { type: "unique_regions"; count: number }
  | { type: "manual" };

type BadgeRow = {
  id: string;
  name: string;
  criteria: BadgeCriteria | null;
};

type UserBadgeRow = {
  badge_id: string;
};

type StormRow = {
  storm_type: string;
  region: string;
  outlook_text: string | null;
};

type RatingRow = {
  stars: number;
};

// Checks every active badge's criteria against the user's current activity
// and awards any newly-earned ones. Safe to call repeatedly - already-earned
// badges are skipped, and the unique(user_id, badge_id) constraint prevents
// duplicates even under a race.
export async function checkAndAwardBadges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string[]> {
  const { data: badgesData } = await supabase
    .from("badges")
    .select("id, name, criteria")
    .eq("is_active", true);
  const badges: BadgeRow[] = badgesData ?? [];

  if (badges.length === 0) return [];

  const { data: existingData } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);
  const existing: UserBadgeRow[] = existingData ?? [];

  const alreadyEarned = new Set<string>(
    existing.map((row: UserBadgeRow) => row.badge_id)
  );

  const { data: stormsData } = await supabase
    .from("storms")
    .select("storm_type, region, outlook_text")
    .eq("user_id", userId);
  const stormList: StormRow[] = stormsData ?? [];

  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("stars")
    .eq("user_id", userId);
  const ratingList: RatingRow[] = ratingsData ?? [];

  const stormCount = stormList.length;
  const stormTypesUsed = new Set<string>(
    stormList.map((s: StormRow) => s.storm_type)
  );
  const uniqueRegions = new Set<string>(
    stormList.map((s: StormRow) => s.region)
  );
  const ratingGiven = ratingList.length > 0;
  const maxRating = ratingList.reduce(
    (max: number, r: RatingRow) => Math.max(max, r.stars),
    0
  );

  const reachedCategories = new Set<string>();
  for (const s of stormList) {
    const text = s.outlook_text ?? "";
    if (text.includes("High Risk")) reachedCategories.add("HIGH");
    if (text.includes("Moderate Risk")) reachedCategories.add("MDT");
    if (text.includes("Enhanced Risk")) reachedCategories.add("ENH");
  }

  const newlyAwarded: string[] = [];

  for (const badge of badges) {
    if (alreadyEarned.has(badge.id)) continue;
    const criteria = badge.criteria;
    if (!criteria) continue;

    let earned = false;
    switch (criteria.type) {
      case "storm_count":
        earned = stormCount >= criteria.count;
        break;
      case "storm_type_used":
        earned = stormTypesUsed.has(criteria.storm_type);
        break;
      case "risk_category_reached":
        earned = criteria.categories.some((c) => reachedCategories.has(c));
        break;
      case "rating_given":
        earned = ratingGiven;
        break;
      case "rating_value":
        earned = maxRating >= criteria.stars;
        break;
      case "unique_regions":
        earned = uniqueRegions.size >= criteria.count;
        break;
      default:
        earned = false;
    }

    if (earned) {
      const { error } = await supabase
        .from("user_badges")
        .insert({ user_id: userId, badge_id: badge.id });
      if (!error) newlyAwarded.push(badge.name);
    }
  }

  return newlyAwarded;
}
