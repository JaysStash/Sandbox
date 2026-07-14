import { createClient } from "@/lib/supabase/server";

type AboutContent = {
  title: string;
  body: string;
};

export default async function AboutPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("key", "about_us")
    .single();

  const content = data?.content as AboutContent | undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">
        {content?.title ?? "About Us"}
      </h1>
      <div className="mt-6 rounded-xl border border-storm-700 bg-storm-900 p-6">
        <p className="whitespace-pre-line leading-relaxed text-gray-300">
          {content?.body ?? "Content coming soon."}
        </p>
      </div>
    </div>
  );
}
