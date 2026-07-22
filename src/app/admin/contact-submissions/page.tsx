import { createClient } from "@/lib/supabase/server";

type Submission = {
  id: string;
  form_data: Record<string, string>;
  status: string;
  created_at: string;
};

export default async function AdminSubmissionsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_submissions")
    .select("id, form_data, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const submissions: Submission[] = data ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">
        Contact Submissions ({submissions.length})
      </h2>

      <div className="mt-5 space-y-3">
        {submissions.length === 0 && (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        )}
        {submissions.map((sub: Submission) => (
          <div
            key={sub.id}
            className="rounded-lg border border-storm-700 bg-storm-900 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-storm-800 px-2 py-0.5 text-xs text-gray-400">
                {sub.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(sub.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {Object.entries(sub.form_data).map(([key, value]) => (
                <p key={key}>
                  <span className="text-gray-500">{key}: </span>
                  <span className="text-[#e8ecf5]">{value}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
