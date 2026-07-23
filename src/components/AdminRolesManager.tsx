"use client";

import { useState } from "react";
import { addAdmin, removeAdmin } from "@/app/admin/admins/actions";

type AdminEntry = {
  id: string;
  role: string;
  display_name: string | null;
};

export default function AdminRolesManager({
  initialAdmins,
  currentUserId,
}: {
  initialAdmins: AdminEntry[];
  currentUserId: string;
}) {
  const [admins, setAdmins] = useState<AdminEntry[]>(initialAdmins);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "moderator">("admin");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd() {
    if (!email.trim()) return;
    setSaving(true);
    setMessage(null);
    const res = await addAdmin(email.trim(), role);
    setSaving(false);
    setMessage(res.message);
    if (res.success) {
      window.location.reload();
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this admin's access?")) return;
    const res = await removeAdmin(id);
    if (res.success) {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } else {
      setMessage(res.message);
    }
  }

  return (
    <div>
      <div className="space-y-2">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center justify-between rounded-lg border border-storm-700 bg-storm-900 px-4 py-3"
          >
            <div>
              <p className="text-sm text-[#e8ecf5]">
                {admin.display_name ?? "Unnamed"}
              </p>
              <p className="text-xs uppercase text-gray-500">{admin.role}</p>
            </div>
            {admin.id !== currentUserId && (
              <button
                onClick={() => handleRemove(admin.id)}
                className="text-xs text-radar-red hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <h3 className="mt-6 font-semibold text-bolt-400">Add an Admin</h3>
      <p className="mt-1 text-xs text-gray-500">
        They must already have an account on the app.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="their-email@example.com"
          className="flex-1 rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-sm text-[#e8ecf5] outline-none focus:border-bolt-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "moderator")}
          className="rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-sm text-[#e8ecf5]"
        >
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-lg bg-bolt-500 px-4 py-2 text-sm font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-gray-300">{message}</p>}
    </div>
  );
}
