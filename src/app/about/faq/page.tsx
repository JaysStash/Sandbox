import { createClient } from "@/lib/supabase/server";
import FaqAccordion from "@/components/FaqAccordion";

type FaqItem = {
  question: string;
  answer: string;
};

export default async function FaqPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("key", "faq")
    .single();

  const items: FaqItem[] = Array.isArray(data?.content) ? data.content : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">
        Frequently Asked Questions
      </h1>
      <p className="mt-2 text-sm text-gray-400">Tap a question to expand it.</p>
      <div className="mt-8">
        <FaqAccordion items={items} />
      </div>
    </div>
  );
}
