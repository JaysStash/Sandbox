"use client";

import { useState, useTransition } from "react";
import { submitContactForm } from "@/app/about/contact/actions";

type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "textarea";
  required?: boolean;
};

export default function ContactForm({ fields }: { fields: FormField[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await submitContactForm(formData);
      setResult(res);
    });
  }

  if (result?.success) {
    return (
      <div className="rounded-xl border border-storm-700 bg-storm-900 p-6 text-center">
        <p className="text-lg font-semibold text-bolt-500">{result.message}</p>
        <p className="mt-2 text-sm text-gray-400">
          We&apos;ll get back to you as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm text-gray-400">
            {field.label}
            {field.required && <span className="text-radar-red"> *</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              required={field.required}
              rows={5}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />
          ) : (
            <input
              type={field.type}
              name={field.name}
              required={field.required}
              className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
            />
          )}
        </div>
      ))}

      {result && !result.success && (
        <p className="text-sm text-radar-red">{result.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-bolt-500 py-2 font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
