"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

export type ParameterInput = {
  id?: string;
  storm_type: string;
  param_key: string;
  category: string;
  name: string;
  description: string;
  min_value: number;
  max_value: number;
  default_value: number;
  unit: string;
  sort_order: number;
};

export async function saveParameter(param: ParameterInput): Promise<ActionResult> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return { success: false, message: "Not authorized." };

  if (param.id) {
    const { error } = await supabase
      .from("storm_parameter_definitions")
      .update({
        category: param.category,
        name: param.name,
        description: param.description,
        min_value: param.min_value,
        max_value: param.max_value,
        default_value: param.default_value,
        unit: param.unit,
        sort_order: param.sort_order,
      })
      .eq("id", param.id);
    if (error) return { success: false, message: "Failed to save parameter." };
  } else {
    const { error } = await supabase.from("storm_parameter_definitions").insert({
      storm_type: param.storm_type,
      param_key: param.param_key,
      category: param.category,
      name: param.name,
      description: param.description,
      min_value: param.min_value,
      max_value: param.max_value,
      default_value: param.default_value,
      unit: param.unit,
      sort_order: param.sort_order,
    });
    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          message: "A parameter with this key already exists for this storm type.",
        };
      }
      return { success: false, message: "Failed to create parameter." };
    }
  }

  revalidatePath("/admin/storm-parameters");
  revalidatePath("/education");
  revalidatePath("/sandbox/create");
  return { success: true, message: "Saved." };
}

export async function deleteParameter(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const adminId = await requireAdmin(supabase);
  if (!adminId) return { success: false, message: "Not authorized." };

  const { error } = await supabase
    .from("storm_parameter_definitions")
    .delete()
    .eq("id", id);
  if (error) return { success: false, message: "Failed to delete parameter." };

  revalidatePath("/admin/storm-parameters");
  revalidatePath("/education");
  return { success: true, message: "Deleted." };
}
