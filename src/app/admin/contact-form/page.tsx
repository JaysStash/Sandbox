import { createClient } from "@/lib/supabase/server";
import ContactFormConfigEditor from "@/components/ContactFormConfigEditor";

type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "textarea";
  required?: boolean;
};

export default async function AdminContactFormPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_form_config")
    .select("fields, destination_emails")
    .eq("id", 1)
    .single();

  const fields: FormField[] = data?.fields ?? [];
  const emails: string[] = data?.destination_emails ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">Contact Form</h2>
      <p className="mt-1 text-sm text-gray-400">
        Changes save directly to the live site — no deploy needed.
      </p>
      <div className="mt-5">
        <ContactFormConfigEditor initialFields={fields} initialEmails={emails} />
      </div>
    </div>
  );
}
