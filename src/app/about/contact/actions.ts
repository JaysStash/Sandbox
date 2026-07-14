"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export type ContactActionResult = {
  success: boolean;
  message: string;
};

export async function submitContactForm(
  formData: FormData
): Promise<ContactActionResult> {
  const supabase = await createClient();

  // Pull the live form config so we always validate/send against what's
  // currently configured in the admin panel (once Phase 10 exists).
  const { data: configRow } = await supabase
    .from("contact_form_config")
    .select("fields, destination_emails")
    .eq("id", 1)
    .single();

  const fields: { name: string; label: string; required?: boolean }[] =
    configRow?.fields ?? [];
  const destinationEmails: string[] = configRow?.destination_emails ?? [];

  const submission: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field.name);
    submission[field.name] = typeof value === "string" ? value : "";
    if (field.required && !submission[field.name]) {
      return { success: false, message: `${field.label} is required.` };
    }
  }

  // Always save the submission, even if email sending fails below.
  const { error: insertError } = await supabase
    .from("contact_submissions")
    .insert({ form_data: submission, status: "new" });

  if (insertError) {
    return {
      success: false,
      message: "Something went wrong saving your message. Please try again.",
    };
  }

  // Best-effort email notification - failure here should not fail the whole
  // submission, since the message is already safely stored above.
  if (destinationEmails.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const bodyLines = Object.entries(submission)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      await resend.emails.send({
        from: "Mother Nature's Sandbox <onboarding@resend.dev>",
        to: destinationEmails,
        subject: `New contact form submission`,
        text: bodyLines,
      });
    } catch (err) {
      console.error("Resend email failed:", err);
    }
  }

  return { success: true, message: "Thanks — your message has been sent!" };
}
