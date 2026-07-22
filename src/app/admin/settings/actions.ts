"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(supabase: any): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();
  return !!data;
}

export async function saveSetting(
  key: string,
  value: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { success: false, message: "Not authorized." };
  }

  const { error } = await supabase
    .from("app_settings")
    .update({ value })
    .eq("key", key);

  if (error) return { success: false, message: "Failed to save." };

  revalidatePath("/", "layout");
  return { success: true, message: "Saved." };
}
