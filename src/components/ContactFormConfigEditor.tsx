"use client";

import { useState } from "react";
import { saveContactFormConfig } from "@/app/admin/contact-form/actions";

type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "textarea";
  required?: boolean;
};

export default function ContactFormConfigEditor({
  initialFields,
  initialEmails,
}: {
  initialFields: FormField[];
  initialEmails: string[];
}) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [emails, setEmails] = useState<string[]>(initialEmails);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  function updateField(index: number, patch: Partial<FormField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addField() {
    setFields((prev) => [
      ...prev,
      { name: `field_${prev.length + 1}`, label: "New Field", type: "text", required: false },
    ]);
  }

  function addEmail() {
    const trimmed = newEmail.trim();
    if (trimmed && !emails.includes(trimmed)) {
      setEmails((prev) => [...prev, trimmed]);
      setNewEmail("");
    }
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleSave() {
    setSaving(true);
    const res = await saveContactFormConfig(fields, emails);
    setSaving(false);
    setResult(res);
  }

  return (
    <div>
      <h3 className="font-semibold text-bolt-400">Form Fields</h3>
      <div className="mt-3 space-y-3">
        {fields.map((field, index) => (
          <div
            key={index}
            className="rounded-lg border border-storm-700 bg-storm-900 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Label"
                className="flex-1 rounded-lg border border-storm-700 bg-storm-800 px-2 py-1.5 text-sm text-[#e8ecf5] outline-none focus:border-bolt-500"
              />
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(index, { type: e.target.value as FormField["type"] })
                }
                className="rounded-lg border border-storm-700 bg-storm-800 px-2 py-1.5 text-sm text-[#e8ecf5]"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="textarea">Textarea</option>
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                />
                Required
              </label>
              <div className="flex gap-3">
                <button onClick={() => moveField(index, -1)} className="hover:text-bolt-400">
                  ↑
                </button>
                <button onClick={() => moveField(index, 1)} className="hover:text-bolt-400">
                  ↓
                </button>
                <button
                  onClick={() => removeField(index)}
                  className="text-radar-red hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addField}
        className="mt-3 w-full rounded-lg border border-dashed border-storm-700 py-2 text-sm text-gray-400 hover:border-bolt-500 hover:text-bolt-400"
      >
        + Add Field
      </button>

      <h3 className="mt-8 font-semibold text-bolt-400">Destination Emails</h3>
      <p className="mt-1 text-xs text-gray-500">
        Every submission gets emailed to all of these addresses.
      </p>
      <div className="mt-3 space-y-2">
        {emails.map((email) => (
          <div
            key={email}
            className="flex items-center justify-between rounded-lg border border-storm-700 bg-storm-900 px-3 py-2"
          >
            <span className="text-sm text-[#e8ecf5]">{email}</span>
            <button
              onClick={() => removeEmail(email)}
              className="text-xs text-radar-red hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new-address@example.com"
          className="flex-1 rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-sm text-[#e8ecf5] outline-none focus:border-bolt-500"
        />
        <button
          onClick={addEmail}
          className="rounded-lg bg-storm-800 px-4 py-2 text-sm text-gray-200 hover:bg-storm-700"
        >
          Add
        </button>
      </div>

      {result && (
        <p
          className={`mt-4 text-sm ${
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
