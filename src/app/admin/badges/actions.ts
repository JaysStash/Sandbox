"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

export type BadgeInput = {
  id?: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "legendary";
  animation_style: "glow" | "shimmer";
  criteria: Record<string, unknown>;
  is_active: boolean;
};

export async function saveBadge(badge: BadgeInput): Promise<ActionResult> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return { success: false, message: "Not authorized." };

  if (badge.id) {
    const { error } = await supabase
      .from("badges")
      .update({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
        animation_style: badge.animation_style,
        criteria: badge.criteria,
        is_active: badge.is_active,
      })
      .eq("id", badge.id);
    if (error) return { success: false, message: "Failed to save badge." };
  } else {
    const { error } = await supabase.from("badges").insert({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,
      animation_style: badge.animation_style,
      criteria: badge.criteria,
      is_active: badge.is_active,
    });
    if (error) return { success: false, message: "Failed to create badge." };
  }

  revalidatePath("/admin/badges");
  revalidatePath("/account/profile");
  return { success: true, message: "Saved." };
}

export async function deleteBadge(badgeId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return { success: false, message: "Not authorized." };

  const { error } = await supabase.from("badges").delete().eq("id", badgeId);
  if (error) return { success: false, message: "Failed to delete badge." };

  revalidatePath("/admin/badges");
  revalidatePath("/account/profile");
  return { success: true, message: "Deleted." };
}

export type UserSearchResult = {
  id: string;
  display_name: string | null;
  referral_code: string;
};

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, referral_code")
    .ilike("display_name", `%${query}%`)
    .limit(20);

  return data ?? [];
}

export async function grantBadge(
  userId: string,
  badgeId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return { success: false, message: "Not authorized." };

  const { error } = await supabase
    .from("user_badges")
    .insert({ user_id: userId, badge_id: badgeId, awarded_by: adminId });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "User already has this badge." };
    }
    return { success: false, message: "Failed to grant badge." };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "Badge granted." };
}

export async function revokeBadge(
  userId: string,
  badgeId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return { success: false, message: "Not authorized." };

  const { error } = await supabase
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId);

  if (error) return { success: false, message: "Failed to revoke badge." };

  revalidatePath("/admin/users");
  return { success: true, message: "Badge revoked." };
}
