"use client";

import { useState } from "react";
import { submitRating } from "@/app/account/rate/actions";
import BadgeEarnedNotice from "@/components/BadgeEarnedNotice";

function Star({ filled, size = 40 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`transition-all duration-200 ${
        filled
          ? "scale-110 fill-bolt-500 drop-shadow-[0_0_8px_rgba(245,197,24,0.7)]"
          : "scale-100 fill-storm-700"
      }`}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function RatingForm() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    newBadges?: string[];
  } | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    const res = await submitRating(rating, review);
    setSubmitting(false);
    setResult(res);
  }

  if (result?.success) {
    return (
      <div className="rounded-2xl border border-bolt-500/30 bg-gradient-to-b from-storm-900 to-storm-950 p-8 text-center shadow-[0_0_40px_rgba(245,197,24,0.15)]">
        <div className="mb-3 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} filled={i <= rating} size={28} />
          ))}
        </div>
        <p className="text-xl font-semibold text-bolt-500">{result.message}</p>
        <BadgeEarnedNotice badgeNames={result.newBadges ?? []} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-storm-700 bg-gradient-to-b from-storm-900 to-storm-950 p-8 shadow-[0_0_40px_rgba(20,26,43,0.6)]">
      <div
        className="flex justify-center gap-2"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(i)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star filled={i <= (hovered || rating)} />
          </button>
        ))}
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Tell us what you think (optional)..."
        rows={4}
        className="mt-6 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
      />

      {result && !result.success && (
        <p className="mt-3 text-center text-sm text-radar-red">
          {result.message}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="mt-4 w-full rounded-lg bg-bolt-500 py-3 font-semibold text-storm-950 transition hover:bg-bolt-400 disabled:opacity-40"
      >
        {submitting ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
}
