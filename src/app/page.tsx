export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-bolt-500">Latest News</h1>
      <p className="mt-2 text-sm text-gray-400">
        This feed will be powered by the admin panel.
      </p>
      <div className="mt-8 rounded-xl border border-storm-700 bg-storm-900 p-6">
        <p className="text-gray-300">No news posts yet — check back soon.</p>
      </div>
    </div>
  );
}
