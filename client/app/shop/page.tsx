"use client";

import { useEffect, useState } from "react";

import ProductCard from "@/components/ProductCard/ProductCard";
import type { Product } from "@/types/product";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    try {
      const res = await fetch("/api/product/list", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        console.log("SHOP DATA:", data.products);
        setProducts(data.products);
      }
    } catch (error) {
      console.error(
        "SHOP PRODUCT ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <section
        className="
          mx-auto
          max-w-7xl
          px-6
          py-12
        "
      >
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            Shop
          </h1>

          <p className="mt-2 text-gray-500">
            Premium Fashion & Accessories
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            Loading Products...
          </div>
        ) : products.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No Products Found
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-1
              gap-8
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                mrp={product.mrp}
                image={product.thumbnail}
                images={product.images || []}
                category={product.category}
                discount={product.discount}
                rating={product.rating}
                stock={product.stock}
                sizes={product.sizes || []}
                colors={product.colors || []}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
