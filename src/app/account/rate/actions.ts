"use server";

import { createClient } from "@/lib/supabase/server";

export type RatingActionResult = {
  success: boolean;
  message: string;
};

export async function submitRating(
  stars: number,
  review: string
): Promise<RatingActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be logged in to rate the app." };
  }

  if (stars < 1 || stars > 5) {
    return { success: false, message: "Please select a star rating." };
  }

  const { error } = await supabase.from("ratings").insert({
    user_id: user.id,
    stars,
    review: review.trim() || null,
  });

  if (error) {
    return {
      success: false,
      message: "Something went wrong submitting your rating. Please try again.",
    };
  }

  return { success: true, message: "Thanks for the feedback!" };
}
