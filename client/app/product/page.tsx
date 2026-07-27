"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard/ProductCard";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      try {
        const res = await fetch("/api/product/list", {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("PRODUCT ERROR:", error);
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Shop Products</h1>

        {loading ? (
          <div className="text-center py-10">Loading Products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No Products Found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                mrp={product.mrp}
                image={product.thumbnail}
                category={product.category}
                discount={product.discount}
                rating={product.rating}
                sizes={product.sizes || []}
                colors={product.colors || []}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
