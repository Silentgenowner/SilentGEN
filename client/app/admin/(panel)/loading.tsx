export default function AdminLoading() {
  return (
    <div className="min-h-[700px] bg-gray-50 p-4 sm:p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="h-8 w-52 rounded-lg bg-gray-200" />
            <div className="mt-3 h-4 w-72 rounded bg-gray-200" />
          </div>

          <div className="h-10 w-32 rounded-xl bg-gray-200" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="mt-4 h-8 w-32 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="h-[340px] rounded-2xl border border-gray-200 bg-white" />
          <div className="h-[340px] rounded-2xl border border-gray-200 bg-white" />
        </div>
      </div>
    </div>
  );
}