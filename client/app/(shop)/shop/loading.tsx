export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          {/* PAGE TITLE */}
          <div className="h-8 w-44 rounded-lg bg-gray-200" />

          <div className="mt-3 h-4 w-72 max-w-full rounded bg-gray-200" />

          {/* SEARCH + FILTER */}
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div className="h-12 rounded-xl bg-gray-200" />

            <div className="h-12 w-full rounded-xl bg-gray-200 lg:w-44" />

            <div className="h-12 w-full rounded-xl bg-gray-200 lg:w-44" />
          </div>

          {/* CATEGORY FILTER */}
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-9 w-24 rounded-full bg-gray-200"
              />
            ))}
          </div>

          {/* PRODUCT GRID */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({
              length: 12,
            }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200"
              >
                <div className="aspect-[4/5] bg-gray-200" />

                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 rounded bg-gray-200" />

                  <div className="h-4 w-4/5 rounded bg-gray-200" />

                  <div className="h-4 w-1/2 rounded bg-gray-200" />

                  <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-24 rounded bg-gray-200" />
                    <div className="h-9 w-20 rounded-lg bg-gray-200" />
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