"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

export async function addAdmin(
  email: string,
  role: "admin" | "moderator"
): Promise<ActionResult> {
  const supabase = await createClient();
  const ownerId = await requireOwner(supabase);
  if (!ownerId) {
    return { success: false, message: "Only the owner can manage admins." };
  }

  const { data: foundId, error: lookupError } = await supabase.rpc(
    "get_user_id_by_email",
    { lookup_email: email }
  );

  if (lookupError || !foundId) {
    return {
      success: false,
      message: "No user found with that email. They need to sign up first.",
    };
  }

  const { error } = await supabase
    .from("admin_users")
    .insert({ id: foundId, role });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "That user is already an admin." };
    }
    return { success: false, message: "Failed to add admin." };
  }

  revalidatePath("/admin/admins");
  return { success: true, message: "Admin added." };
}

export async function removeAdmin(adminUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const ownerId = await requireOwner(supabase);
  if (!ownerId) {
    return { success: false, message: "Only the owner can manage admins." };
  }

  if (adminUserId === ownerId) {
    return { success: false, message: "You can't remove your own owner access." };
  }

  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", adminUserId);

  if (error) return { success: false, message: "Failed to remove admin." };

  revalidatePath("/admin/admins");
  return { success: true, message: "Admin removed." };
}
