"use client";

import { useState } from "react";

type QAItem = { question: string; answer: string };
type ActionResult = { success: boolean; message: string };

export default function QAListEditor({
  initialItems,
  questionLabel,
  answerLabel,
  onSave,
}: {
  initialItems: QAItem[];
  questionLabel: string;
  answerLabel: string;
  onSave: (items: QAItem[]) => Promise<ActionResult>;
}) {
  const [items, setItems] = useState<QAItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  function updateItem(index: number, field: "question" | "answer", value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { question: "", answer: "" }]);
  }

  async function handleSave() {
    setSaving(true);
    const res = await onSave(items);
    setSaving(false);
    setResult(res);
  }

  return (
    <div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-storm-700 bg-storm-900 p-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">{questionLabel}</label>
              <button
                onClick={() => removeItem(index)}
                className="text-xs text-radar-red hover:underline"
              >
                Remove
              </button>
            </div>
            <input
              value={item.question}
              onChange={(e) => updateItem(index, "question", e.target.value)}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />
            <label className="mt-3 block text-xs text-gray-400">{answerLabel}</label>
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(index, "answer", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-800 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="mt-3 w-full rounded-lg border border-dashed border-storm-700 py-2 text-sm text-gray-400 hover:border-bolt-500 hover:text-bolt-400"
      >
        + Add Item
      </button>

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
