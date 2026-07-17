"use server";

import { createClient } from "@/lib/supabase/server";
import { checkAndAwardBadges } from "@/lib/badgeChecker";
import type { OutlookResult } from "@/lib/outlookEngine";

export type SaveStormResult = {
  success: boolean;
  message: string;
  stormId?: string;
  newBadges?: string[];
};

export async function saveStorm(
  stormType: string,
  region: string,
  parameters: Record<string, number>,
  outlook: OutlookResult
): Promise<SaveStormResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Please log in to save your storm.",
    };
  }

  const { data, error } = await supabase
    .from("storms")
    .insert({
      user_id: user.id,
      storm_type: stormType,
      region,
      parameters,
      outlook_text: `${outlook.headline} ${outlook.explanation}`,
      stats: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      message: "Something went wrong saving your storm. Please try again.",
    };
  }

  const newBadges = await checkAndAwardBadges(supabase, user.id);

  return {
    success: true,
    message: "Storm saved.",
    stormId: data.id,
    newBadges,
  };
}
