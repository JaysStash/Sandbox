import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateTornadoOutlook, type TornadoParameters } from "@/lib/outlookEngine";
import { getStormType } from "@/lib/stormTypes";

export default async function MyStormsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-bolt-500">My Storms</h1>
        <p className="mt-3 text-gray-400">Please log in to see your saved storms.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Log In
        </Link>
      </div>
    );
  }

  const { data: storms } = await supabase
    .from("storms")
    .select("id, storm_type, region, parameters, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">My Storms</h1>
      <p className="mt-2 text-sm text-gray-400">
        Every storm you&apos;ve created, ready to replay.
      </p>

      <div className="mt-8 space-y-3">
        {(!storms || storms.length === 0) && (
          <div className="rounded-xl border border-storm-700 bg-storm-900 p-6 text-center">
            <p className="text-gray-300">
              You haven&apos;t created any storms yet.
            </p>
            <Link
              href="/sandbox"
              className="mt-4 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
            >
              Create One
            </Link>
          </div>
        )}

        {storms?.map((storm) => {
          const outlook = calculateTornadoOutlook(
            storm.parameters as TornadoParameters
          );
          const typeInfo = getStormType(storm.storm_type);
          return (
            <Link
              key={storm.id}
              href={`/sandbox/radar/${storm.id}`}
              className="flex items-center justify-between rounded-xl border border-storm-700 bg-storm-900 p-4 hover:border-bolt-500"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: outlook.categoryColor }}
                  />
                  <span className="font-semibold text-[#e8ecf5]">
                    {typeInfo?.name ?? storm.storm_type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{storm.region}</p>
                <p className="text-xs text-gray-500">
                  {new Date(storm.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="text-sm text-bolt-500">Replay →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
