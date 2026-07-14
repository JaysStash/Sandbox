import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RatingForm from "@/components/RatingForm";

export default async function RatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-bolt-500">
        Rate Mother Nature&apos;s Sandbox
      </h1>
      <p className="mt-2 text-center text-sm text-gray-400">
        Your feedback helps us build a better storm simulator.
      </p>

      <div className="mt-8">
        {user ? (
          <RatingForm />
        ) : (
          <div className="rounded-2xl border border-storm-700 bg-storm-900 p-8 text-center">
            <p className="text-gray-300">
              Please log in to leave a rating.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
