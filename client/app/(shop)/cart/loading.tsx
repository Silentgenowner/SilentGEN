export default function CartLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-gray-200" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="flex gap-4 rounded-2xl border border-gray-200 p-4"
                >
                  <div className="h-28 w-24 shrink-0 rounded-xl bg-gray-200" />

                  <div className="flex-1">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="mt-3 h-4 w-28 rounded bg-gray-200" />

                    <div className="mt-5 flex gap-3">
                      <div className="h-9 w-28 rounded-lg bg-gray-200" />
                      <div className="h-9 w-20 rounded-lg bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-2xl border border-gray-200 p-5">
              <div className="h-6 w-36 rounded bg-gray-200" />

              <div className="mt-6 space-y-4">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
              </div>

              <div className="mt-6 h-12 w-full rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}