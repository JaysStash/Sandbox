"use server";

import { createClient } from "@/lib/supabase/server";
import type { OutlookResult } from "@/lib/outlookEngine";

export type SaveStormResult = {
  success: boolean;
  message: string;
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

  const { error } = await supabase.from("storms").insert({
    user_id: user.id,
    storm_type: stormType,
    region,
    parameters,
    outlook_text: `${outlook.headline} ${outlook.explanation}`,
    stats: null,
  });

  if (error) {
    return {
      success: false,
      message: "Something went wrong saving your storm. Please try again.",
    };
  }

  return { success: true, message: "Storm saved." };
}
