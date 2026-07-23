"use client";

import { useState } from "react";
import Link from "next/link";
import { searchUsers, type UserSearchResult } from "@/app/admin/badges/actions";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setSearching(true);
    const res = await searchUsers(query);
    setResults(res);
    setSearching(false);
    setSearched(true);
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by display name..."
          className="flex-1 rounded-lg border border-storm-700 bg-storm-900 px-3 py-2 text-[#e8ecf5] outline-none focus:border-bolt-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg bg-bolt-500 px-4 py-2 text-sm font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {searched && results.length === 0 && (
          <p className="text-sm text-gray-500">No matching users.</p>
        )}
        {results.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="flex items-center justify-between rounded-lg border border-storm-700 bg-storm-900 px-4 py-3 hover:border-bolt-500"
          >
            <span className="text-[#e8ecf5]">{u.display_name ?? "Unnamed"}</span>
            <span className="font-mono text-xs text-gray-500">{u.referral_code}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
