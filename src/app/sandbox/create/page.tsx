import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStormType } from "@/lib/stormTypes";
import SandboxCreator from "@/components/SandboxCreator";

export default async function SandboxCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string }>;
}) {
  const params = await searchParams;
  const typeSlug = params.type ?? "";
  const region = params.region ?? "Unspecified Region";
  const stormType = getStormType(typeSlug);

  const supabase = await createClient();
  const { data } = await supabase
    .from("storm_parameter_definitions")
    .select("param_key, category, name, description, min_value, max_value, default_value, unit, sort_order")
    .eq("storm_type", typeSlug)
    .order("sort_order");

  const definitions = data ?? [];

  if (definitions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-bolt-500">
          {stormType?.name ?? "This Storm Type"} — Coming Soon
        </h1>
        <p className="mt-3 text-gray-400">
          The exhaustive parameter set for this storm type hasn&apos;t been
          built yet. Tornadoes are live now — check back soon for this one.
        </p>
        <Link
          href="/sandbox"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Back to Storm Selection
        </Link>
      </div>
    );
  }

  return (
    <SandboxCreator
      stormType={typeSlug}
      region={region}
      definitions={definitions}
    />
  );
}
