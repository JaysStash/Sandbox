import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mother Nature's Sandbox",
  description: "Create and simulate severe weather in a realistic sandbox.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  const { data: settingRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "maintenance_mode")
    .single();

  const maintenanceMode = settingRow?.value === true;

  let isAdmin = false;
  if (maintenanceMode) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .single();
      isAdmin = !!adminRow;
    }
  }

  if (maintenanceMode && !isAdmin) {
    return (
      <html lang="en">
        <body className="flex min-h-screen items-center justify-center bg-storm-950 text-center text-[#e8ecf5] antialiased">
          <div className="px-4">
            <h1 className="text-3xl font-bold text-bolt-500">
              Under Maintenance
            </h1>
            <p className="mt-3 text-gray-400">
              Mother Nature&apos;s Sandbox is getting an update. Check back
              shortly.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-storm-950 text-[#e8ecf5] antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
