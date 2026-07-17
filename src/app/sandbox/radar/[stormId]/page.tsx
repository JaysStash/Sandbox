import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REGION_COORDINATES, REGION_POPULATION_DENSITY } from "@/lib/regions";
import { calculateTornadoOutlook, type TornadoParameters } from "@/lib/outlookEngine";
import RadarViewer from "@/components/RadarViewer";

export default async function RadarPage({
  params,
}: {
  params: Promise<{ stormId: string }>;
}) {
  const { stormId } = await params;
  const supabase = await createClient();

  const { data: storm } = await supabase
    .from("storms")
    .select("id, storm_type, region, parameters")
    .eq("id", stormId)
    .single();

  if (!storm) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-bolt-500">Storm Not Found</h1>
        <p className="mt-3 text-gray-400">
          This storm doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <Link
          href="/sandbox"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Back to Sandbox
        </Link>
      </div>
    );
  }

  const parameters = storm.parameters as TornadoParameters;
  const outlook = calculateTornadoOutlook(parameters);
  const regionCenter = REGION_COORDINATES[storm.region] ?? {
    lat: 39.8283,
    lng: -98.5795,
  };
  const populationDensity = REGION_POPULATION_DENSITY[storm.region] ?? 50;

  return (
    <div>
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-bolt-500">
          {storm.storm_type === "tornado" ? "Tornado" : storm.storm_type} Radar
        </h1>
        <p className="text-sm text-gray-400">{storm.region}</p>
      </div>
      <div className="mt-4">
        <RadarViewer
          region={storm.region}
          regionCenter={regionCenter}
          parameters={parameters}
          outlook={outlook}
          populationDensity={populationDensity}
        />
      </div>
    </div>
  );
}
