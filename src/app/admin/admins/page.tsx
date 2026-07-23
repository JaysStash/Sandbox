import { createClient } from "@/lib/supabase/server";
import AdminRolesManager from "@/components/AdminRolesManager";

type AdminRow = {
  id: string;
  role: string;
};

export default async function AdminRolesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentAdminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const isOwner = currentAdminRow?.role === "owner";

  const { data: adminRows } = await supabase
    .from("admin_users")
    .select("id, role")
    .order("role");

  const admins: AdminRow[] = adminRows ?? [];
  const adminIds = admins.map((a: AdminRow) => a.id);

  let profileMap = new Map<string, string | null>();
  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", adminIds);
    profileMap = new Map<string, string | null>(
      (profiles ?? []).map(
        (p: { id: string; display_name: string | null }): [string, string | null] => [
          p.id,
          p.display_name,
        ]
      )
    );
  }

  const enrichedAdmins = admins.map((a: AdminRow) => ({
    id: a.id,
    role: a.role,
    display_name: profileMap.get(a.id) ?? null,
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">Admin Roles</h2>
      <p className="mt-1 text-sm text-gray-400">
        {isOwner
          ? "As the owner, you can add or remove other admins."
          : "Only the owner can add or remove admins — you can view the list below."}
      </p>

      <div className="mt-5">
        {isOwner ? (
          <AdminRolesManager
            initialAdmins={enrichedAdmins}
            currentUserId={user?.id ?? ""}
          />
        ) : (
          <div className="space-y-2">
            {enrichedAdmins.map((admin) => (
              <div
                key={admin.id}
                className="rounded-lg border border-storm-700 bg-storm-900 px-4 py-3"
              >
                <p className="text-sm text-[#e8ecf5]">
                  {admin.display_name ?? "Unnamed"}
                </p>
                <p className="text-xs uppercase text-gray-500">{admin.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
