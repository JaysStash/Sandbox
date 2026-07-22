"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };
type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "textarea";
  required?: boolean;
};

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

export async function saveContactFormConfig(
  fields: FormField[],
  destinationEmails: string[]
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { success: false, message: "Not authorized." };
  }

  const { error } = await supabase
    .from("contact_form_config")
    .update({ fields, destination_emails: destinationEmails })
    .eq("id", 1);

  if (error) return { success: false, message: "Failed to save." };

  revalidatePath("/about/contact");
  return { success: true, message: "Saved." };
}
