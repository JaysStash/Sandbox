import { createClient } from "@/lib/supabase/server";

type NewsPost = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("key", "homepage_news")
    .single();

  const posts: NewsPost[] = Array.isArray(data?.content) ? data.content : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">Latest News</h1>
      <p className="mt-2 text-sm text-gray-400">
        Updates on new storm types, features, and everything happening in the
        Sandbox.
      </p>

      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <div className="rounded-xl border border-storm-700 bg-storm-900 p-6">
            <p className="text-gray-300">
              No news posts yet — check back soon.
            </p>
          </div>
        )}

        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-xl border border-storm-700 bg-storm-900 p-6"
          >
            <h2 className="text-xl font-semibold text-bolt-400">
              {post.title}
            </h2>
            {post.published_at && (
              <p className="mt-1 text-xs text-gray-500">
                {new Date(post.published_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <p className="mt-3 whitespace-pre-line text-gray-300">
              {post.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
