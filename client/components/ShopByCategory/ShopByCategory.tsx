"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = {
  name: string;
  count: number;
};

const categoryIcons: Record<string, string> = {
  "t-shirt": "👕",
  tshirt: "👕",
  tshirts: "👕",
  shirt: "👔",
  shirts: "👔",
  jeans: "👖",
  pant: "👖",
  pants: "👖",
  trousers: "👖",
  shorts: "🩳",
  jacket: "🧥",
  jackets: "🧥",
  top: "👚",
  tops: "👚",
  sweater: "🧶",
  sweaters: "🧶",
  hoodie: "🧥",
  hoodies: "🧥",
  accessories: "👜",
  accessory: "👜",
};

const defaultCategories = [
  "T-Shirts",
  "Shirts",
  "Jeans",
  "Trousers / Pants",
  "Shorts",
  "Jackets",
  "Tops",
  "Sweaters / Hoodies",
  "Accessories",
];

function getIcon(category: string) {
  const key = category
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (categoryIcons[key]) {
    return categoryIcons[key];
  }

  if (key.includes("t-shirt") || key.includes("tshirt")) {
    return "👕";
  }

  if (key.includes("shirt")) {
    return "👔";
  }

  if (key.includes("jean")) {
    return "👖";
  }

  if (
    key.includes("pant") ||
    key.includes("trouser")
  ) {
    return "👖";
  }

  if (key.includes("short")) {
    return "🩳";
  }

  if (
    key.includes("jacket") ||
    key.includes("hoodie")
  ) {
    return "🧥";
  }

  if (
    key.includes("top") ||
    key.includes("dress")
  ) {
    return "👚";
  }

  if (key.includes("sweater")) {
    return "🧶";
  }

  if (key.includes("accessor")) {
    return "👜";
  }

  return "🛍️";
}

function formatCategoryName(category: string) {
  return category
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getCategoryUrl(category: string) {
  return `/shop?category=${encodeURIComponent(
    category
  )}`;
}

export default function ShopByCategory() {
  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch(
        "/api/product/categories",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Category API failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (
        data?.success &&
        Array.isArray(data.categories)
      ) {
        const validCategories =
          data.categories
            .filter(
              (item: unknown) =>
                typeof item === "object" &&
                item !== null &&
                "name" in item
            )
            .map((item: any) => ({
              name: String(item.name),
              count: Number(item.count || 0),
            }))
            .filter(
              (item: Category) =>
                item.name.trim() !== ""
            );

        setCategories(validCategories);
      }
    } catch (error) {
      console.error(
        "SHOP BY CATEGORY ERROR:",
        error
      );

      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  const displayCategories =
    categories.length > 0
      ? categories
      : defaultCategories.map((name) => ({
          name,
          count: 0,
        }));

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">

        {/* Heading */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-gray-500">
              Explore Collection
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
              Shop by Category
            </h2>

            <p className="mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
              Find your style from our complete
              fashion collection.
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden shrink-0 text-sm font-semibold text-black underline underline-offset-4 transition hover:text-gray-500 sm:block"
          >
            View All Categories
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {defaultCategories.map(
              (_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl bg-gray-100"
                />
              )
            )}
          </div>
        )}

        {/* Categories */}
        {!loading && (
          <div
            className="
              flex
              gap-3
              overflow-x-auto
              pb-4
              sm:grid
              sm:grid-cols-3
              md:grid-cols-4
              lg:grid-cols-5
              sm:overflow-visible
              sm:pb-0
            "
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {displayCategories.map(
              (category) => (
                <Link
                  key={category.name}
                  href={getCategoryUrl(
                    category.name
                  )}
                  className="
                    group
                    w-[150px]
                    shrink-0
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-black
                    hover:bg-black
                    hover:text-white
                    sm:w-auto
                  "
                >
                  {/* Icon */}
                  <div
                    className="
                      flex
                      h-20
                      w-full
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      text-4xl
                      shadow-sm
                      transition
                      group-hover:bg-white/10
                    "
                  >
                    {getIcon(category.name)}
                  </div>

                  {/* Name */}
                  <div className="mt-4">
                    <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">
                      {formatCategoryName(
                        category.name
                      )}
                    </h3>

                    {category.count > 0 && (
                      <p className="mt-1 text-xs text-gray-500 group-hover:text-gray-400">
                        {category.count}{" "}
                        {category.count === 1
                          ? "Product"
                          : "Products"}
                      </p>
                    )}

                    <span className="mt-3 block text-xs font-medium opacity-0 transition group-hover:opacity-100">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-6 text-center sm:hidden">
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
            View All Categories
          </Link>
        </div>
      </div>
    </section>
  );
}