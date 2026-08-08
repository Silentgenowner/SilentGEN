"use client";

type OrderItem = {
  product?: {
    _id: string;
    name: string;
  };

  name: string;
  image: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
};

type Props = {
  items: OrderItem[];
};

export default function OrderItems({
  items,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        Ordered Products
      </h2>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-5 border-b last:border-none pb-6"
          >
            <img
              src={
                item.image ||
                "/images/no-image.png"
              }
              alt={item.name}
              className="w-28 h-28 rounded-lg object-cover border"
            />

            <div className="flex-1">
              <h3 className="font-bold text-lg">
                {item.name}
              </h3>

              <div className="flex flex-wrap gap-2 mt-3">
                {item.size && (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                    Size : {item.size}
                  </span>
                )}

                {item.color && (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                    Color : {item.color}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
                <div>
                  <p className="text-gray-500 text-sm">
                    Quantity
                  </p>

                  <p className="font-semibold">
                    {item.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Unit Price
                  </p>

                  <p className="font-semibold">
                    ₹{item.price}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Total
                  </p>

                  <p className="font-bold text-lg">
                    ₹
                    {item.price *
                      item.quantity}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}
