export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-gray-200" />

          <div className="mt-3 h-4 w-72 rounded bg-gray-200" />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-gray-200" />

                <div className="mt-5 h-5 w-36 rounded bg-gray-200" />

                <div className="mt-3 h-4 w-full rounded bg-gray-200" />
                <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}