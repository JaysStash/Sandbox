"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [aboutOpen, setAboutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-storm-700 bg-storm-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-bolt-500">
          Mother Nature&apos;s Sandbox
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/sandbox" className="hover:text-bolt-400">
            Sandbox
          </Link>
          <Link href="/education" className="hover:text-bolt-400">
            Education
          </Link>

          <div className="relative">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="hover:text-bolt-400"
            >
              About
            </button>
            {aboutOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-storm-700 bg-storm-900 p-2 shadow-xl">
                <Link href="/about" className="block rounded px-3 py-2 hover:bg-storm-800">
                  About Us
                </Link>
                <Link href="/about/faq" className="block rounded px-3 py-2 hover:bg-storm-800">
                  FAQ
                </Link>
                <Link href="/about/contact" className="block rounded px-3 py-2 hover:bg-storm-800">
                  Contact
                </Link>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="hover:text-bolt-400"
            >
              Account
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-storm-700 bg-storm-900 p-2 shadow-xl">
                <Link href="/account/profile" className="block rounded px-3 py-2 hover:bg-storm-800">
                  Profile
                </Link>
                <Link href="/sandbox/storms" className="block rounded px-3 py-2 hover:bg-storm-800">
                  My Storms
                </Link>
                <Link href="/account/refer" className="block rounded px-3 py-2 hover:bg-storm-800">
                  Refer
                </Link>
                <Link href="/account/rate" className="block rounded px-3 py-2 hover:bg-storm-800">
                  Rate
                </Link>
                {user && (
                  <Link href="/admin" className="block rounded px-3 py-2 hover:bg-storm-800">
                    Admin
                  </Link>
                )}
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="block w-full rounded px-3 py-2 text-left hover:bg-storm-800"
                  >
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className="block rounded px-3 py-2 hover:bg-storm-800">
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
