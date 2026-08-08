"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import WishlistButton from "@/components/WishlistButton/WishlistButton";
import { useCart } from "@/context/CartContext";

type Props = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  image: string;
  images?: string[];
  category: string;
  discount?: number;
  rating?: number;
  stock?: number;
  sizes?: string[];
  colors?: string[];
};

export default function ProductCard({
  id,
  name,
  slug,
  price,
  mrp,
  image,
  images = [],
  category,
  discount = 0,
  rating = 0,
  stock = 0,
  sizes = [],
  colors = [],
}: Props) {
  const router = useRouter();

  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [adding, setAdding] = useState(false);

  const [selectedSize, setSelectedSize] = useState("");

  const [selectedColor, setSelectedColor] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Product Images
  |--------------------------------------------------------------------------
  */

  const productImages = useMemo(() => {
    const allImages = [
      image,
      ...images,
    ];

    const validImages = allImages.filter(
      (img) =>
        typeof img === "string" &&
        img.trim() !== ""
    );

    const uniqueImages = Array.from(
      new Set(validImages)
    );

    if (uniqueImages.length === 0) {
      return ["/images/no-image.png"];
    }

    return uniqueImages;
  }, [image, images]);

  /*
  |--------------------------------------------------------------------------
  | Reset Image When Product Changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setCurrentImage(0);
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Auto Image Slider
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (productImages.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentImage((previous) => {
        if (
          previous >=
          productImages.length - 1
        ) {
          return 0;
        }

        return previous + 1;
      });
    }, 3500);

    return () => {
      clearInterval(timer);
    };
  }, [productImages.length]);

  /*
  |--------------------------------------------------------------------------
  | Previous Image
  |--------------------------------------------------------------------------
  */

  function previousImage() {
    setCurrentImage((previous) => {
      if (previous <= 0) {
        return productImages.length - 1;
      }

      return previous - 1;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Next Image
  |--------------------------------------------------------------------------
  */

  function nextImage() {
    setCurrentImage((previous) => {
      if (
        previous >=
        productImages.length - 1
      ) {
        return 0;
      }

      return previous + 1;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Safe Product ID
  |--------------------------------------------------------------------------
  */

  function getProductId(
    productId: unknown
  ) {
    if (
      typeof productId ===
      "string"
    ) {
      return productId;
    }

    if (
      productId &&
      typeof productId ===
        "object" &&
      "_id" in productId
    ) {
      return String(
        (
          productId as {
            _id: string;
          }
        )._id
      );
    }

    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | Cart Item
  |--------------------------------------------------------------------------
  */

  const cartItem = cart.find(
    (item: any) =>
      getProductId(item.productId) ===
        id &&
      (item.size || "") ===
        selectedSize &&
      (item.color || "") ===
        selectedColor
  );

  /*
  |--------------------------------------------------------------------------
  | Stock
  |--------------------------------------------------------------------------
  */

  const isOutOfStock =
    stock <= 0;

  const isLowStock =
    stock > 0 && stock <= 5;

  /*
  |--------------------------------------------------------------------------
  | Add To Cart
  |--------------------------------------------------------------------------
  */

  async function handleAddCart() {
    if (
      sizes.length > 0 &&
      !selectedSize
    ) {
      alert(
        "Please select size"
      );

      return;
    }

    if (
      colors.length > 0 &&
      !selectedColor
    ) {
      alert(
        "Please select color"
      );

      return;
    }

    if (isOutOfStock) {
      alert(
        "Product is out of stock"
      );

      return;
    }

    try {
      setAdding(true);

      const success =
        await addToCart(
          id,
          1,
          selectedSize,
          selectedColor
        );

      if (!success) {
        router.push("/login");
      }
    } catch (error) {
      console.error(
        "ADD CART ERROR:",
        error
      );
    } finally {
      setAdding(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Stock Status
  |--------------------------------------------------------------------------
  */

  function StockStatus() {
    if (stock <= 0) {
      return (
        <span
          className="
            rounded-full
            bg-red-100
            px-3
            py-1
            text-xs
            font-semibold
            text-red-600
          "
        >
          Out Of Stock
        </span>
      );
    }

    if (isLowStock) {
      return (
        <span
          className="
            rounded-full
            bg-orange-100
            px-3
            py-1
            text-xs
            font-semibold
            text-orange-600
          "
        >
          Only {stock} Left
        </span>
      );
    }

    return (
      <span
        className="
          rounded-full
          bg-green-100
          px-3
          py-1
          text-xs
          font-semibold
          text-green-600
        "
      >
        In Stock
      </span>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Rating
  |--------------------------------------------------------------------------
  */

  function ProductRating() {
    return (
      <div
        className="
          flex
          items-center
          gap-1
        "
      >
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <span
              key={star}
              className={
                star <=
                Math.round(
                  rating
                )
                  ? "text-yellow-500"
                  : "text-gray-300"
              }
            >
              ★
            </span>
          )
        )}

        <span
          className="
            ml-1
            text-xs
            text-gray-500
          "
        >
          {rating.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-xl
        bg-white
        shadow
        transition
        hover:shadow-xl
      "
    >
      {/* =====================================================
          WISHLIST
      ===================================================== */}

      <WishlistButton
        id={id}
        name={name}
        slug={slug}
        image={productImages[0]}
        price={price}
        mrp={mrp}
      />

      {/* =====================================================
          IMAGE SLIDER
      ===================================================== */}

      <Link href={`/product/${id}`}>
        <div
          className="
            group
            relative
            h-72
            w-full
            overflow-hidden
            bg-gray-100
          "
        >
          <Image
            src={
              productImages[
                currentImage
              ]
            }
            alt={`${name} ${
              currentImage + 1
            }`}
            fill
            priority={
              currentImage === 0
            }
            sizes="
              (max-width: 768px) 100vw,
              (max-width: 1200px) 50vw,
              25vw
            "
            className="
              object-cover
              transition
              duration-500
              group-hover:scale-105
            "
          />

          {/* =================================================
              PREVIOUS BUTTON
          ================================================= */}

          {productImages.length >
            1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                previousImage();
              }}
              className="
                absolute
                left-3
                top-1/2
                z-10
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/90
                text-xl
                font-bold
                text-black
                opacity-0
                shadow
                transition
                group-hover:opacity-100
              "
            >
              ‹
            </button>
          )}

          {/* =================================================
              NEXT BUTTON
          ================================================= */}

          {productImages.length >
            1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                nextImage();
              }}
              className="
                absolute
                right-3
                top-1/2
                z-10
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/90
                text-xl
                font-bold
                text-black
                opacity-0
                shadow
                transition
                group-hover:opacity-100
              "
            >
              ›
            </button>
          )}

          {/* =================================================
              IMAGE DOTS
          ================================================= */}

          {productImages.length >
            1 && (
            <div
              className="
                absolute
                bottom-3
                left-1/2
                z-10
                flex
                -translate-x-1/2
                gap-1.5
              "
            >
              {productImages.map(
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Show image ${
                      index + 1
                    }`}
                    onClick={(
                      event
                    ) => {
                      event.preventDefault();
                      event.stopPropagation();

                      setCurrentImage(
                        index
                      );
                    }}
                    className={`
                      h-2
                      w-2
                      rounded-full
                      border
                      transition
                      ${
                        currentImage ===
                        index
                          ? "scale-125 bg-black"
                          : "bg-white"
                      }
                    `}
                  />
                )
              )}
            </div>
          )}

          {/* =================================================
              IMAGE COUNT
          ================================================= */}

          {productImages.length >
            1 && (
            <span
              className="
                absolute
                right-3
                top-3
                z-10
                rounded-full
                bg-black/70
                px-2
                py-1
                text-xs
                font-medium
                text-white
              "
            >
              {currentImage + 1}/
              {productImages.length}
            </span>
          )}
        </div>
      </Link>

      {/* =====================================================
          PRODUCT DETAILS
      ===================================================== */}

      <div className="p-5">
        {/* CATEGORY + STOCK */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-2
          "
        >
          <p
            className="
              text-sm
              text-gray-500
            "
          >
            {category}
          </p>

          <StockStatus />
        </div>

        {/* PRODUCT NAME */}

        <Link href={`/product/${id}`}>
          <h2
            className="
              mt-3
              line-clamp-2
              text-xl
              font-semibold
              transition
              hover:text-gray-600
            "
          >
            {name}
          </h2>
        </Link>

        {/* RATING */}

        <div className="mt-2">
          <ProductRating />
        </div>

        {/* PRICE */}

        <div
          className="
            mt-4
            flex
            items-center
            gap-3
          "
        >
          <span
            className="
              text-xl
              font-bold
            "
          >
            ₹{price}
          </span>

          {mrp > price && (
            <span
              className="
                text-gray-400
                line-through
              "
            >
              ₹{mrp}
            </span>
          )}
        </div>

        {/* DISCOUNT */}

        {discount > 0 && (
          <p
            className="
              mt-2
              text-sm
              font-semibold
              text-green-600
            "
          >
            {discount}% OFF
          </p>
        )}

        {/* ===================================================
            SIZE
        =================================================== */}

        {sizes.length > 0 && (
          <div className="mt-5">
            <p
              className="
                mb-2
                text-sm
                font-semibold
              "
            >
              Select Size
            </p>

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              {sizes.map(
                (size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setSelectedSize(
                        size
                      )
                    }
                    className={`
                      rounded
                      border
                      px-3
                      py-1
                      text-sm
                      transition
                      ${
                        selectedSize ===
                        size
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }
                    `}
                  >
                    {size}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            COLOR
        =================================================== */}

        {colors.length > 0 && (
          <div className="mt-5">
            <p
              className="
                mb-2
                text-sm
                font-semibold
              "
            >
              Select Color
            </p>

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              {colors.map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setSelectedColor(
                        color
                      )
                    }
                    className={`
                      rounded
                      border
                      px-3
                      py-1
                      text-sm
                      transition
                      ${
                        selectedColor ===
                        color
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }
                    `}
                  >
                    {color}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            CART
        =================================================== */}

        {cartItem ? (
          <div
            className="
              mt-5
              space-y-3
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                rounded-lg
                border
                p-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    id,
                    selectedSize,
                    selectedColor,
                    "decrease"
                  )
                }
                className="
                  h-10
                  w-10
                  rounded
                  bg-gray-200
                  text-xl
                  transition
                  hover:bg-gray-300
                "
              >
                -
              </button>

              <span
                className="
                  text-xl
                  font-bold
                "
              >
                {cartItem.quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    id,
                    selectedSize,
                    selectedColor,
                    "increase"
                  )
                }
                className="
                  h-10
                  w-10
                  rounded
                  bg-gray-200
                  text-xl
                  transition
                  hover:bg-gray-300
                "
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                removeFromCart(
                  id,
                  selectedSize,
                  selectedColor
                )
              }
              className="
                w-full
                rounded-lg
                bg-red-600
                py-3
                text-white
                transition
                hover:bg-red-700
              "
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={
              handleAddCart
            }
            disabled={
              adding ||
              isOutOfStock
            }
            className="
              mt-5
              w-full
              rounded-lg
              bg-black
              py-3
              text-white
              transition
              hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {adding
              ? "Adding..."
              : isOutOfStock
              ? "Out Of Stock"
              : "Add To Cart"}
          </button>
        )}
      </div>
    </div>
  );
}