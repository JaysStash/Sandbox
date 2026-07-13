"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          referral_code: referralCode || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If Supabase's "Confirm email" setting is ON, there will be no session yet.
    if (data.user && !data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-bolt-500">Check your email</h1>
        <p className="mt-4 text-gray-300">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then come back and log in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-bolt-500 px-4 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">Create Account</h1>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm text-gray-400">Display Name</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400">
            Referral Code <span className="text-gray-600">(optional)</span>
          </label>
          <input
            type="text"
            maxLength={5}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="12345"
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
          />
        </div>

        {error && <p className="text-sm text-radar-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-bolt-500 py-2 font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-storm-700" />
        <span className="text-xs text-gray-500">OR</span>
        <div className="h-px flex-1 bg-storm-700" />
      </div>

      <button
        onClick={handleGoogleSignup}
        className="w-full rounded-lg border border-storm-700 bg-storm-900 py-2 font-medium hover:bg-storm-800"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-bolt-500 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
