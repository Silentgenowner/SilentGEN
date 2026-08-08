type Props = {
  history: {
    status: string;
    date: string;
    note?: string;
  }[];
};

export default function OrderTimeline({
  history,
}: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">
          Order Timeline
        </h2>

        <p className="text-gray-500">
          No timeline available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        Order Timeline
      </h2>

      <div className="space-y-6">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-black" />

              {index !== history.length - 1 && (
                <div className="w-[2px] flex-1 bg-gray-300" />
              )}
            </div>

            <div className="pb-6">
              <h3 className="font-bold">
                {item.status}
              </h3>

              <p className="text-gray-500 text-sm">
                {new Date(
                  item.date
                ).toLocaleString()}
              </p>

              {item.note && (
                <p className="mt-2 text-gray-600">
                  {item.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
