export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-gray-200" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="h-6 w-40 rounded bg-gray-200" />

                <div className="mt-5 space-y-4">
                  {Array.from({
                    length: 3,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="h-24 rounded-xl bg-gray-200"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="h-6 w-36 rounded bg-gray-200" />
                <div className="mt-5 h-20 rounded-xl bg-gray-200" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <div className="h-6 w-40 rounded bg-gray-200" />

              <div className="mt-6 space-y-4">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
              </div>

              <div className="mt-6 h-12 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}