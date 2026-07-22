import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content", label: "Site Content" },
  { href: "/admin/contact-form", label: "Contact Form" },
  { href: "/admin/contact-submissions", label: "Submissions" },
  { href: "/admin/ratings", label: "Ratings" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-bolt-500">Admin</h1>
        <p className="mt-3 text-gray-400">Please log in.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Log In
        </Link>
      </div>
    );
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!adminRow) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-bolt-500">Access Denied</h1>
        <p className="mt-3 text-gray-400">
          This account doesn&apos;t have admin access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bolt-500">Admin Command Center</h1>
        <span className="rounded-full bg-storm-800 px-3 py-1 text-xs uppercase tracking-wide text-gray-400">
          {adminRow.role}
        </span>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-storm-700 pb-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg bg-storm-900 px-3 py-1.5 text-sm text-gray-300 hover:bg-storm-800 hover:text-bolt-400"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
