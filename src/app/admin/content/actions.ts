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

export async function saveAboutUs(
  title: string,
  body: string
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { success: false, message: "Not authorized." };
  }
  const { error } = await supabase
    .from("site_content")
    .update({ content: { title, body } })
    .eq("key", "about_us");
  if (error) return { success: false, message: "Failed to save." };
  revalidatePath("/about");
  return { success: true, message: "Saved." };
}

export async function saveFaq(
  items: { question: string; answer: string }[]
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { success: false, message: "Not authorized." };
  }
  const { error } = await supabase
    .from("site_content")
    .update({ content: items })
    .eq("key", "faq");
  if (error) return { success: false, message: "Failed to save." };
  revalidatePath("/about/faq");
  return { success: true, message: "Saved." };
}

export async function saveGlossary(
  items: { question: string; answer: string }[]
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { success: false, message: "Not authorized." };
  }
  const { error } = await supabase
    .from("site_content")
    .update({ content: items })
    .eq("key", "glossary");
  if (error) return { success: false, message: "Failed to save." };
  revalidatePath("/education");
  return { success: true, message: "Saved." };
}

export async function saveNews(
  posts: { id: string; title: string; body: string; published_at: string }[]
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { success: false, message: "Not authorized." };
  }
  const { error } = await supabase
    .from("site_content")
    .update({ content: posts })
    .eq("key", "homepage_news");
  if (error) return { success: false, message: "Failed to save." };
  revalidatePath("/");
  return { success: true, message: "Saved." };
}
