import { createClient } from "@/lib/supabase/server";
import ContactForm from "@/components/ContactForm";

type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "textarea";
  required?: boolean;
};

export default async function ContactPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_form_config")
    .select("fields")
    .eq("id", 1)
    .single();

  const fields: FormField[] = data?.fields ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">Contact Us</h1>
      <p className="mt-2 text-sm text-gray-400">
        Questions, suggestions, or issues — we&apos;d love to hear from you.
      </p>
      <div className="mt-8">
        <ContactForm fields={fields} />
      </div>
    </div>
  );
}
