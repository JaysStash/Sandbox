import { createClient } from "@/lib/supabase/server";
import SettingsToggle from "@/components/SettingsToggle";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("key, value");

  const settingsMap = new Map(
    (data ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value])
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">Site Settings</h2>
      <p className="mt-1 text-sm text-gray-400">
        Changes apply immediately, site-wide.
      </p>

      <div className="mt-5 space-y-3">
        <SettingsToggle
          settingKey="maintenance_mode"
          label="Maintenance Mode"
          description="Shows a maintenance page to everyone except admins. Use this during major updates."
          initialValue={settingsMap.get("maintenance_mode") === true}
        />
        <SettingsToggle
          settingKey="email_verification_required"
          label="Email Verification Required"
          description="Record-keeping toggle only right now — the actual signup behavior is still controlled in Supabase Dashboard → Authentication → Providers → Email → Confirm Email."
          initialValue={settingsMap.get("email_verification_required") === true}
        />
      </div>
    </div>
  );
}
