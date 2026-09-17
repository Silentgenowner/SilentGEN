"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useState,
} from "react";

import Footer from "@/components/Footer/Footer";

import {
  useWishlist,
} from "@/context/WishlistContext";

/*
|--------------------------------------------------------------------------
| WISHLIST PAGE
|--------------------------------------------------------------------------
*/

export default function WishlistPage() {
  const {
    wishlist,

    loading,

    removeFromWishlist,
  } = useWishlist();

  /*
  |--------------------------------------------------------------------------
  | REMOVE LOADING
  |--------------------------------------------------------------------------
  */

  const [
    removingId,
    setRemovingId,
  ] =
    useState<string | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | REMOVE PRODUCT
  |--------------------------------------------------------------------------
  */

  async function handleRemove(
    productId: string
  ) {
    try {
      setRemovingId(
        productId
      );

      await removeFromWishlist(
        productId
      );
    } finally {
      setRemovingId(
        null
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <>
        <main
          className="
            mx-auto
            max-w-7xl
            px-6
            py-10
          "
        >
          <h1
            className="
              mb-8
              text-3xl
              font-bold
            "
          >
            My Wishlist
          </h1>

          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="
                    animate-pulse
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                  "
                >
                  <div
                    className="
                      aspect-[3/4]
                      w-full
                      bg-gray-200
                    "
                  />

                  <div className="p-4">
                    <div
                      className="
                        h-5
                        w-3/4
                        rounded
                        bg-gray-200
                      "
                    />

                    <div
                      className="
                        mt-3
                        h-4
                        w-1/3
                        rounded
                        bg-gray-100
                      "
                    />

                    <div
                      className="
                        mt-4
                        h-10
                        rounded-lg
                        bg-gray-200
                      "
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </main>

        <Footer />
      </>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <main
        className="
          mx-auto
          max-w-7xl
          px-6
          py-10
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            mb-8
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <h1
              className="
                text-3xl
                font-bold
              "
            >
              My Wishlist
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              {wishlist.length}{" "}
              {wishlist.length === 1
                ? "item"
                : "items"}{" "}
              saved
            </p>
          </div>

          {wishlist.length >
            0 && (
            <Link
              href="/shop"
              className="
                rounded-full
                border
                border-black
                px-5
                py-2.5
                text-sm
                font-medium
                transition
                hover:bg-black
                hover:text-white
              "
            >
              Continue Shopping
            </Link>
          )}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | EMPTY WISHLIST
        |--------------------------------------------------------------------------
        */}

        {wishlist.length ===
        0 ? (
          <div
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              px-6
              py-16
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-gray-100
                text-3xl
              "
            >
              ♡
            </div>

            <h2
              className="
                mt-5
                text-xl
                font-semibold
              "
            >
              Your wishlist is
              empty
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
              "
            >
              Products you save
              will appear here.
            </p>

            <Link
              href="/shop"
              className="
                mt-6
                inline-block
                rounded-lg
                bg-black
                px-6
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-gray-800
              "
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          /*
          |--------------------------------------------------------------------------
          | PRODUCT GRID
          |--------------------------------------------------------------------------
          */

          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >
            {wishlist.map(
              (product) => {
                const productUrl =
                  `/product/${product.id}`;

                const removing =
                  removingId ===
                  product.id;

                return (
                  <article
                    key={
                      product.id
                    }
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      shadow-sm
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:shadow-lg
                    "
                  >
                    {/*
                    |--------------------------------------------------------------------------
                    | IMAGE
                    |--------------------------------------------------------------------------
                    */}

                    <Link
                      href={
                        productUrl
                      }
                      className="
                        block
                        overflow-hidden
                        bg-gray-100
                      "
                    >
                      <div
                        className="
                          relative
                          aspect-[3/4]
                          w-full
                        "
                      >
                        <Image
                          src={
                            product.image ||
                            "/images/no-image.png"
                          }
                          alt={
                            product.name
                          }
                          fill
                          sizes="
                            (max-width: 640px) 100vw,
                            (max-width: 1024px) 50vw,
                            25vw
                          "
                          className="
                            object-cover
                            transition-transform
                            duration-500
                            hover:scale-105
                          "
                        />
                      </div>
                    </Link>

                    {/*
                    |--------------------------------------------------------------------------
                    | DETAILS
                    |--------------------------------------------------------------------------
                    */}

                    <div className="p-4">
                      <Link
                        href={
                          productUrl
                        }
                      >
                        <h2
                          className="
                            line-clamp-2
                            min-h-[44px]
                            text-base
                            font-semibold
                            text-gray-900
                            transition
                            hover:text-blue-600
                          "
                        >
                          {
                            product.name
                          }
                        </h2>
                      </Link>

                      {/*
                      |--------------------------------------------------------------------------
                      | PRICE
                      |--------------------------------------------------------------------------
                      */}

                      <div
                        className="
                          mt-3
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >
                        <span
                          className="
                            text-base
                            font-bold
                            text-gray-900
                          "
                        >
                          ₹
                          {Number(
                            product.price ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        {Number(
                          product.mrp ||
                            0
                        ) >
                          Number(
                            product.price ||
                              0
                          ) && (
                          <span
                            className="
                              text-sm
                              text-gray-400
                              line-through
                            "
                          >
                            ₹
                            {Number(
                              product.mrp ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}
                      </div>

                      {/*
                      |--------------------------------------------------------------------------
                      | VIEW
                      |--------------------------------------------------------------------------
                      */}

                      <Link
                        href={
                          productUrl
                        }
                        className="
                          mt-4
                          block
                          w-full
                          rounded-lg
                          bg-black
                          py-2.5
                          text-center
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-gray-800
                        "
                      >
                        View Product
                      </Link>

                      {/*
                      |--------------------------------------------------------------------------
                      | REMOVE
                      |--------------------------------------------------------------------------
                      */}

                      <button
                        type="button"
                        disabled={
                          removing
                        }
                        onClick={() =>
                          void handleRemove(
                            product.id
                          )
                        }
                        className="
                          mt-2
                          w-full
                          rounded-lg
                          border
                          border-red-200
                          bg-white
                          py-2.5
                          text-sm
                          font-semibold
                          text-red-600
                          transition
                          hover:bg-red-50
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {removing
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}