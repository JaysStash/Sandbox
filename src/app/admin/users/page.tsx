import UserSearch from "@/components/UserSearch";

export default function AdminUsersPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">User Management</h2>
      <p className="mt-1 text-sm text-gray-400">
        Search for a member to view their profile and manage their badges.
      </p>
      <div className="mt-5">
        <UserSearch />
      </div>
    </div>
  );
}
