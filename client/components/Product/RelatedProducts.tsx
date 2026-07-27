"use client";

import Image from "next/image";
import Link from "next/link";

export type RelatedProduct = {
  _id: string;
  name: string;
  slug?: string;
  thumbnail?: string;
  images?: string[];
  price: number;
  mrp?: number;
  rating?: number;
};

type Props = {
  products: RelatedProduct[];
};

export default function RelatedProducts({
  products,
}: Props) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-20">

      <div className="mb-8 flex items-center justify-between">

        <h2 className="text-3xl font-bold">
          Related Products
        </h2>

        <Link
          href="/shop"
          className="text-sm font-medium hover:underline"
        >
          View All
        </Link>

      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">

        {products.map((product) => {

          const image =
            product.thumbnail ||
            product.images?.[0] ||
            "/images/no-image.png";

          const discount =
            product.mrp && product.mrp > product.price
              ? Math.round(
                  ((product.mrp - product.price) /
                    product.mrp) *
                    100
                )
              : 0;

          return (

            <Link
              key={product._id}
              href={`/product/${product._id}`}
              className="group overflow-hidden rounded-xl border bg-white transition hover:shadow-lg"
            >

              <div className="relative aspect-square overflow-hidden bg-gray-100">

                <Image
                  src={image}
                  alt={product.name}
                  fill
                  sizes="300px"
                  className="object-cover transition duration-300 group-hover:scale-110"
                />

                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                    {discount}% OFF
                  </span>
                )}

              </div>

              <div className="space-y-2 p-4">

                <h3 className="line-clamp-2 font-semibold">
                  {product.name}
                </h3>

                <div className="flex items-center gap-2">

                  <span className="text-lg font-bold">
                    ₹{product.price}
                  </span>

                  {product.mrp &&
                    product.mrp > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.mrp}
                      </span>
                    )}

                </div>

                <div className="flex items-center gap-2">

                  <span className="text-yellow-500">
                    ★
                  </span>

                  <span className="text-sm">
                    {(product.rating ?? 0).toFixed(1)}
                  </span>

                </div>

                <button
                  type="button"
                  className="mt-2 w-full rounded-lg bg-black py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  View Product
                </button>

              </div>

            </Link>

          );
        })}

      </div>

    </section>
  );
}
