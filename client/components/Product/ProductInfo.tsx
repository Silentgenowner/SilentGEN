"use client";

type ProductInfoProps = {
  name: string;
  brand?: string;
  category?: string;
  shortDescription?: string;

  price: number;
  mrp: number;
  discount?: number;

  rating?: number;
  reviewCount?: number;

  stock: number;

  fabric?: string;
  fit?: string;
  gsm?: number;
  weight?: number;
};

export default function ProductInfo({
  name,
  brand,
  category,
  shortDescription,

  price,
  mrp,
  discount = 0,

  rating = 0,
  reviewCount = 0,

  stock,

  fabric,
  fit,
  gsm,
  weight,
}: ProductInfoProps) {
  const savePercent =
    mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : discount;

  return (
    <div className="space-y-6">
      <div>
        {brand && (
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {brand}
          </p>
        )}

        <h1 className="mt-2 text-4xl font-bold">
          {name}
        </h1>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-yellow-500 text-lg">
            ★
          </span>

          <span className="font-medium">
            {rating.toFixed(1)}
          </span>

          <span className="text-gray-500">
            ({reviewCount} Reviews)
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-4xl font-bold">
          ₹{price}
        </span>

        {mrp > price && (
          <>
            <span className="text-2xl text-gray-400 line-through">
              ₹{mrp}
            </span>

            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
              {savePercent}% OFF
            </span>
          </>
        )}
      </div>

      <div>
        {stock > 0 ? (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
           Only {stock} Left
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
            Out of Stock
          </span>
        )}
      </div>

      {shortDescription && (
        <p className="leading-7 text-gray-600">
          {shortDescription}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-xl border p-5">
        <div>
          <p className="text-sm text-gray-500">
            Category
          </p>

          <p className="font-semibold">
            {category || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Brand
          </p>

          <p className="font-semibold">
            {brand || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Fabric
          </p>

          <p className="font-semibold">
            {fabric || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Fit
          </p>

          <p className="font-semibold">
            {fit || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            GSM
          </p>

          <p className="font-semibold">
            {gsm ? `${gsm} GSM` : "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Weight
          </p>

          <p className="font-semibold">
            {weight ? `${weight} g` : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
