"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ProductCard from "@/components/ProductCard/ProductCard";

import type { Product } from "@/types/product";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    try {
      const res = await fetch("/api/product/featured", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(
          `Featured products request failed: ${res.status}`
        );
      }

      const data = await res.json();

      if (
        data?.success &&
        Array.isArray(data.products)
      ) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(
        "FEATURED PRODUCT ERROR:",
        error
      );

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">

        {/* Heading */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-gray-500">
              SilentGEN Collection
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
              Featured Products
            </h2>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Discover our selected premium fashion pieces.
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden shrink-0 text-sm font-semibold text-black underline underline-offset-4 transition hover:text-gray-500 sm:block"
          >
            View All
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="
              flex
              gap-5
              overflow-hidden
            "
          >
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    w-[250px]
                    shrink-0
                    animate-pulse
                    overflow-hidden
                    rounded-xl
                    bg-gray-100
                    sm:w-[280px]
                    lg:w-[300px]
                  "
                >
                  <div className="aspect-[3/4] bg-gray-200" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-5 w-1/3 rounded bg-gray-200" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Empty */}
        {!loading && products.length === 0 && (
          <div className="rounded-xl border border-gray-200 py-12 text-center text-gray-500">
            No Featured Products Found
          </div>
        )}

        {/* Horizontal Product Slider */}
        {!loading && products.length > 0 && (
          <div
            className="
              flex
              gap-4
              overflow-x-auto
              pb-5
              snap-x
              snap-mandatory
              scroll-smooth
              sm:gap-5
            "
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="
                  w-[250px]
                  shrink-0
                  snap-start
                  sm:w-[280px]
                  lg:w-[300px]
                "
              >
                <ProductCard
                  id={product._id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  mrp={product.mrp}
                  image={product.thumbnail}
                  category={product.category}
                  discount={product.discount}
                  rating={product.rating}
                  stock={product.stock}
                  sizes={product.sizes || []}
                  colors={product.colors || []}
                />
              </div>
            ))}
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href="/shop"
            className="
              inline-flex
              rounded-lg
              border
              border-black
              px-6
              py-3
              text-sm
              font-semibold
              text-black
              transition
              hover:bg-black
              hover:text-white
            "
          >
            View All Products
          </Link>
        </div>

      </div>
    </section>
  );
}
