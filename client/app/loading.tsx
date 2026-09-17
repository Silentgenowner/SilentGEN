export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* HEADER SKELETON */}
        <div className="animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="h-8 w-40 rounded-lg bg-gray-200" />

            <div className="hidden gap-3 md:flex">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>

            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="h-9 w-9 rounded-full bg-gray-200" />
            </div>
          </div>

          {/* HERO SKELETON */}
          <div className="mt-8 overflow-hidden rounded-3xl bg-gray-200">
            <div className="aspect-[16/7] w-full" />
          </div>

          {/* TITLE */}
          <div className="mt-10">
            <div className="h-7 w-52 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-200" />
          </div>

          {/* PRODUCT GRID */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-[4/5] bg-gray-200" />

                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />

                  <div className="flex gap-2 pt-2">
                    <div className="h-8 w-20 rounded-lg bg-gray-200" />
                    <div className="h-8 w-20 rounded-lg bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}