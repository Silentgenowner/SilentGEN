export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* GALLERY */}
            <div>
              <div className="aspect-square rounded-3xl bg-gray-200" />

              <div className="mt-4 grid grid-cols-4 gap-3">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-xl bg-gray-200"
                  />
                ))}
              </div>
            </div>

            {/* PRODUCT INFO */}
            <div>
              <div className="h-4 w-24 rounded bg-gray-200" />

              <div className="mt-4 h-9 w-4/5 rounded-lg bg-gray-200" />

              <div className="mt-4 h-6 w-36 rounded bg-gray-200" />

              <div className="mt-8 h-4 w-20 rounded bg-gray-200" />

              <div className="mt-3 flex gap-3">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 w-14 rounded-lg bg-gray-200"
                  />
                ))}
              </div>

              <div className="mt-8 h-4 w-20 rounded bg-gray-200" />

              <div className="mt-3 flex gap-3">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-9 w-9 rounded-full bg-gray-200"
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="h-12 rounded-xl bg-gray-200" />
                <div className="h-12 rounded-xl bg-gray-200" />
              </div>

              <div className="mt-8 space-y-3">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}