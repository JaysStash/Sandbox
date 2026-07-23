import { createClient } from "@/lib/supabase/server";
import StormParameterManager from "@/components/StormParameterManager";
import type { ParameterInput } from "@/app/admin/storm-parameters/actions";

type ParamRow = ParameterInput & { id: string };

export default async function AdminStormParametersPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("storm_parameter_definitions")
    .select(
      "id, storm_type, param_key, category, name, description, min_value, max_value, default_value, unit, sort_order"
    )
    .order("sort_order");

  const params: ParamRow[] = data ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">Storm Parameters</h2>
      <p className="mt-1 text-sm text-gray-400">
        Edit descriptions, ranges, and defaults for every parameter — changes
        apply to the live Sandbox immediately.
      </p>
      <div className="mt-5">
        <StormParameterManager initialParams={params} />
      </div>
    </div>
  );
}
