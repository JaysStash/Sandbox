"use client";

import { useState } from "react";

type NewsPost = { id: string; title: string; body: string; published_at: string };
type ActionResult = { success: boolean; message: string };

export default function NewsPostEditor({
  initialPosts,
  onSave,
}: {
  initialPosts: NewsPost[];
  onSave: (posts: NewsPost[]) => Promise<ActionResult>;
}) {
  const [posts, setPosts] = useState<NewsPost[]>(initialPosts);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  function updatePost(index: number, field: keyof NewsPost, value: string) {
    setPosts((prev) =>
      prev.map((post, i) => (i === index ? { ...post, [field]: value } : post))
    );
  }

  function removePost(index: number) {
    setPosts((prev) => prev.filter((_, i) => i !== index));
  }

  function addPost() {
    setPosts((prev) => [
      {
        id: crypto.randomUUID(),
        title: "",
        body: "",
        published_at: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
  }

  async function handleSave() {
    setSaving(true);
    const res = await onSave(posts);
    setSaving(false);
    setResult(res);
  }

  return (
    <div>
      <button
        onClick={addPost}
        className="w-full rounded-lg border border-dashed border-storm-700 py-2 text-sm text-gray-400 hover:border-bolt-500 hover:text-bolt-400"
      >
        + New Post
      </button>

      <div className="mt-4 space-y-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="rounded-lg border border-storm-700 bg-storm-900 p-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Title</label>
              <button
                onClick={() => removePost(index)}
                className="text-xs text-radar-red hover:underline"
              >
                Delete Post
              </button>
            </div>
            <input
              value={post.title}
              onChange={(e) => updatePost(index, "title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />

            <label className="mt-3 block text-xs text-gray-400">Date</label>
            <input
              type="date"
              value={post.published_at}
              onChange={(e) => updatePost(index, "published_at", e.target.value)}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />

            <label className="mt-3 block text-xs text-gray-400">Body</label>
            <textarea
              value={post.body}
              onChange={(e) => updatePost(index, "body", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />
          </div>
        ))}
      </div>

      {result && (
        <p
          className={`mt-3 text-sm ${
            result.success ? "text-radar-green" : "text-radar-red"
          }`}
        >
          {result.message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-bolt-500 py-2.5 font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
