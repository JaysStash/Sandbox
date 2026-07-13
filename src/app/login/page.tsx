"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">Login</h1>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
          />
        </div>

        {error && <p className="text-sm text-radar-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-bolt-500 py-2 font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-storm-700" />
        <span className="text-xs text-gray-500">OR</span>
        <div className="h-px flex-1 bg-storm-700" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full rounded-lg border border-storm-700 bg-storm-900 py-2 font-medium hover:bg-storm-800"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-bolt-500 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
