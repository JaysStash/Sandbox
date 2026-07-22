import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: stormCount },
    { count: ratingCount },
    { count: submissionCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("storms").select("id", { count: "exact", head: true }),
    supabase.from("ratings").select("id", { count: "exact", head: true }),
    supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  const stats = [
    { label: "Total Users", value: userCount ?? 0 },
    { label: "Storms Created", value: stormCount ?? 0 },
    { label: "Ratings Received", value: ratingCount ?? 0 },
    { label: "New Contact Messages", value: submissionCount ?? 0 },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-storm-700 bg-storm-900 p-4 text-center"
          >
            <div className="text-2xl font-bold text-bolt-500">{stat.value}</div>
            <div className="mt-1 text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-storm-700 bg-storm-900 p-5">
        <h2 className="font-semibold text-bolt-400">More modules coming</h2>
        <p className="mt-2 text-sm text-gray-400">
          Badge management, storm parameter editing, user management, admin
          roles, and analytics are next — this dashboard covers content,
          contact form, submissions, ratings, and site settings for now.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/content"
          className="rounded-xl border border-storm-700 bg-storm-900 p-4 hover:border-bolt-500"
        >
          <div className="font-semibold text-[#e8ecf5]">Site Content</div>
          <p className="mt-1 text-xs text-gray-400">
            About Us, FAQ, homepage news, glossary
          </p>
        </Link>
        <Link
          href="/admin/contact-form"
          className="rounded-xl border border-storm-700 bg-storm-900 p-4 hover:border-bolt-500"
        >
          <div className="font-semibold text-[#e8ecf5]">Contact Form</div>
          <p className="mt-1 text-xs text-gray-400">
            Fields and destination emails
          </p>
        </Link>
        <Link
          href="/admin/contact-submissions"
          className="rounded-xl border border-storm-700 bg-storm-900 p-4 hover:border-bolt-500"
        >
          <div className="font-semibold text-[#e8ecf5]">Submissions</div>
          <p className="mt-1 text-xs text-gray-400">
            Everything sent through the contact form
          </p>
        </Link>
        <Link
          href="/admin/ratings"
          className="rounded-xl border border-storm-700 bg-storm-900 p-4 hover:border-bolt-500"
        >
          <div className="font-semibold text-[#e8ecf5]">Ratings</div>
          <p className="mt-1 text-xs text-gray-400">
            Private star ratings and written reviews
          </p>
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-xl border border-storm-700 bg-storm-900 p-4 hover:border-bolt-500"
        >
          <div className="font-semibold text-[#e8ecf5]">Site Settings</div>
          <p className="mt-1 text-xs text-gray-400">
            Maintenance mode and other toggles
          </p>
        </Link>
      </div>
    </div>
  );
}
