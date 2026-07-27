"use client";

import { useState } from "react";

type Props = {
  description?: string;
  category?: string;
  brand?: string;
  fabric?: string;
  fit?: string;
  gsm?: number;
  weight?: number;
  sku?: string;
  rating?: number;
  reviewCount?: number;
};

export default function ProductTabs({
  description,
  category,
  brand,
  fabric,
  fit,
  gsm,
  weight,
  sku,
  rating = 0,
  reviewCount = 0,
}: Props) {
  const [tab, setTab] = useState<
    "description" | "details" | "reviews"
  >("description");

  return (
    <div className="mt-16">

      <div className="flex flex-wrap gap-3 border-b">

        <button
          onClick={() => setTab("description")}
          className={`px-5 py-3 font-semibold ${
            tab === "description"
              ? "border-b-2 border-black"
              : "text-gray-500"
          }`}
        >
          Description
        </button>

        <button
          onClick={() => setTab("details")}
          className={`px-5 py-3 font-semibold ${
            tab === "details"
              ? "border-b-2 border-black"
              : "text-gray-500"
          }`}
        >
          Specifications
        </button>

        <button
          onClick={() => setTab("reviews")}
          className={`px-5 py-3 font-semibold ${
            tab === "reviews"
              ? "border-b-2 border-black"
              : "text-gray-500"
          }`}
        >
          Reviews
        </button>

      </div>

      <div className="mt-8">

        {tab === "description" && (

          <div className="prose max-w-none">

            <p className="leading-8 text-gray-700 whitespace-pre-line">
              {description ||
                "No description available."}
            </p>

          </div>

        )}

        {tab === "details" && (

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-lg border p-4">
              <p className="text-gray-500 text-sm">
                Category
              </p>

              <p className="font-semibold">
                {category || "-"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-gray-500 text-sm">
                Brand
              </p>

              <p className="font-semibold">
                {brand || "-"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-gray-500 text-sm">
                Fabric
              </p>

              <p className="font-semibold">
                {fabric || "-"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-gray-500 text-sm">
                Fit
              </p>

              <p className="font-semibold">
                {fit || "-"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-gray-500 text-sm">
                GSM
              </p>

              <p className="font-semibold">
                {gsm ? `${gsm} GSM` : "-"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-gray-500 text-sm">
                Weight
              </p>

              <p className="font-semibold">
                {weight ? `${weight} g` : "-"}
              </p>
            </div>

            <div className="rounded-lg border p-4 sm:col-span-2">
              <p className="text-gray-500 text-sm">
                SKU
              </p>

              <p className="font-semibold">
                {sku || "-"}
              </p>
            </div>

          </div>

        )}

        {tab === "reviews" && (

          <div className="rounded-xl border p-6">

            <div className="flex items-center gap-3">

              <span className="text-4xl text-yellow-500">
                ★
              </span>

              <div>

                <h3 className="text-3xl font-bold">
                  {rating.toFixed(1)}
                </h3>

                <p className="text-gray-500">
                  Based on {reviewCount} Reviews
                </p>

              </div>

            </div>

            <div className="mt-8 rounded-lg bg-gray-100 p-6 text-center">

              <p className="text-gray-500">
                Customer review system will be
                connected with completed orders.
              </p>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}
