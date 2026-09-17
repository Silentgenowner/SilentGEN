export default function ExchangeOrderLoading() {
  return (
    <div className="min-h-[60vh] bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />

          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Order Info */}
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

                <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>

          {/* Product */}
          <div className="p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="h-24 w-20 shrink-0 animate-pulse rounded-xl bg-gray-200 sm:h-28 sm:w-24" />

              <div className="flex-1 space-y-3">
                <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />

                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />

                <div className="h-4 w-1/4 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>

          {/* Exchange Form */}
          <div className="border-t border-gray-100 p-5 sm:p-6">
            <div className="mb-5 h-5 w-44 animate-pulse rounded bg-gray-200" />

            <div className="space-y-4">
              <div>
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-100" />

                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>

              <div>
                <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-100" />

                <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>

              <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200 sm:w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}