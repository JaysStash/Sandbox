// Shared admin/owner access check, used by every admin server action.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireAdmin(supabase: any): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();
  return data ? user.id : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireOwner(supabase: any): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("id", user.id)
    .single();
  return data && data.role === "owner" ? user.id : null;
}
