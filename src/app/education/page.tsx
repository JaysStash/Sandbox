import { createClient } from "@/lib/supabase/server";
import { STORM_TYPES } from "@/lib/stormTypes";
import EducationBrowser from "@/components/EducationBrowser";
import FaqAccordion from "@/components/FaqAccordion";

export default async function EducationPage() {
  const supabase = await createClient();

  const [{ data: paramData }, { data: glossaryRow }] = await Promise.all([
    supabase
      .from("storm_parameter_definitions")
      .select("storm_type, category, name, description, unit")
      .order("sort_order"),
    supabase.from("site_content").select("content").eq("key", "glossary").single(),
  ]);

  const stormTypesWithParams = STORM_TYPES.map((type) => ({
    ...type,
    parameters: (paramData ?? []).filter((p) => p.storm_type === type.slug),
  }));

  const glossaryItems = Array.isArray(glossaryRow?.content)
    ? glossaryRow.content
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">Education</h1>
      <p className="mt-2 text-sm text-gray-400">
        Every storm type and every parameter, explained — plus a general
        weather glossary.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-bolt-400">
        Storm Types &amp; Parameters
      </h2>
      <p className="mt-1 text-sm text-gray-400">Tap a storm type to expand it.</p>
      <div className="mt-4">
        <EducationBrowser stormTypes={stormTypesWithParams} />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-bolt-400">
        Weather Glossary
      </h2>
      <p className="mt-1 text-sm text-gray-400">Tap a term to expand it.</p>
      <div className="mt-4">
        <FaqAccordion items={glossaryItems} />
      </div>
    </div>
  );
}
