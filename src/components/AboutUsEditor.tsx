"use client";

import { useState } from "react";

type ActionResult = { success: boolean; message: string };

export default function AboutUsEditor({
  initialTitle,
  initialBody,
  onSave,
}: {
  initialTitle: string;
  initialBody: string;
  onSave: (title: string, body: string) => Promise<ActionResult>;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  async function handleSave() {
    setSaving(true);
    const res = await onSave(title, body);
    setSaving(false);
    setResult(res);
  }

  return (
    <div className="rounded-lg border border-storm-700 bg-storm-900 p-4">
      <label className="text-xs text-gray-400">Page Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
      />

      <label className="mt-4 block text-xs text-gray-400">Body</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
      />

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
