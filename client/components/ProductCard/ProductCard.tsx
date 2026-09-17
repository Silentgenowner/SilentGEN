"use client";

import Link from "next/link";

import {
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import WishlistButton from "@/components/WishlistButton/WishlistButton";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Product360Frame = {
  angle: number;

  name?: string;

  url?: string;

  base64?: string;

  mimeType?: string;
};

type Product360 = {
  enabled?: boolean;

  frames?: Product360Frame[];
};

/*
|--------------------------------------------------------------------------
| PRODUCT REEL VIDEO
|--------------------------------------------------------------------------
*/

type ProductReelVideo = {
  enabled?: boolean;

  url?: string;

  publicId?: string;

  duration?: number;

  poster?: string;
};

type ColorVariant = {
  color: string;

  images?: string[];

  view360Images?: string[];

  product360?: Product360;
};

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

  colorVariants?: ColorVariant[];

  product360?: Product360;

  /*
  |--------------------------------------------------------------------------
  | OPTIONAL REEL
  |--------------------------------------------------------------------------
  */

  reelVideo?: ProductReelVideo;
};

/*
|--------------------------------------------------------------------------
| CLEAN IMAGE ARRAY
|--------------------------------------------------------------------------
*/

function cleanImageArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map((item) =>
          item.trim()
        )
        .filter(Boolean)
    )
  );
}

/*
|--------------------------------------------------------------------------
| GET FRAME URL
|--------------------------------------------------------------------------
*/

function getFrameUrl(
  frame: Product360Frame
): string {
  if (
    typeof frame?.url ===
      "string" &&
    frame.url.trim()
  ) {
    return frame.url.trim();
  }

  if (
    typeof frame?.base64 ===
      "string" &&
    frame.base64.trim()
  ) {
    const mimeType =
      typeof frame.mimeType ===
        "string" &&
      frame.mimeType.trim()
        ? frame.mimeType.trim()
        : "image/png";

    return `data:${mimeType};base64,${frame.base64}`;
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET 360 IMAGES
|--------------------------------------------------------------------------
*/

function get360Images(
  product360:
    | Product360
    | undefined
): string[] {
  if (
    !Array.isArray(
      product360?.frames
    )
  ) {
    return [];
  }

  const sortedFrames = [
    ...product360.frames,
  ]
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(
          a?.angle ?? 0
        ) -
        Number(
          b?.angle ?? 0
        )
    );

  return cleanImageArray(
    sortedFrames.map(
      (frame) =>
        getFrameUrl(frame)
    )
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT CARD
|--------------------------------------------------------------------------
*/

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

  colors = [],

  colorVariants = [],

  product360,

  reelVideo,
}: Props) {
  /*
  |--------------------------------------------------------------------------
  | PRODUCT URL
  |--------------------------------------------------------------------------
  */

  const productUrl =
    `/product/${id}`;

  /*
  |--------------------------------------------------------------------------
  | VIDEO REF
  |--------------------------------------------------------------------------
  */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | REEL MODE
  |--------------------------------------------------------------------------
  */

  const [
    showReel,
    setShowReel,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR
  |--------------------------------------------------------------------------
  */

  const [
    selectedColor,
    setSelectedColor,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | NORMAL IMAGE INDEX
  |--------------------------------------------------------------------------
  */

  const [
    currentImage,
    setCurrentImage,
  ] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | 360 INDEX
  |--------------------------------------------------------------------------
  */

  const [
    current360Frame,
    setCurrent360Frame,
  ] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | 360 DRAG STATE
  |--------------------------------------------------------------------------
  */

  const lastDragXRef =
    useRef<number | null>(
      null
    );

  const draggingRef =
    useRef(false);

  const [
    dragging360,
    setDragging360,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | REEL URL
  |--------------------------------------------------------------------------
  */

  const reelUrl =
    useMemo(() => {
      if (
        typeof reelVideo?.url !==
        "string"
      ) {
        return "";
      }

      return reelVideo.url.trim();
    }, [
      reelVideo?.url,
    ]);

  /*
  |--------------------------------------------------------------------------
  | HAS PRODUCT REEL
  |--------------------------------------------------------------------------
  |
  | enabled undefined + URL exists:
  | old/imported data પણ ચાલશે.
  |
  |--------------------------------------------------------------------------
  */

  const hasReel =
    useMemo(() => {
      if (!reelUrl) {
        return false;
      }

      if (
        reelVideo?.enabled ===
        false
      ) {
        return false;
      }

      return true;
    }, [
      reelUrl,
      reelVideo?.enabled,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  const selectedColorVariant =
    useMemo(() => {
      if (!selectedColor) {
        return null;
      }

      const normalizedColor =
        selectedColor
          .trim()
          .toLowerCase();

      return (
        colorVariants.find(
          (variant) =>
            typeof variant?.color ===
              "string" &&
            variant.color
              .trim()
              .toLowerCase() ===
              normalizedColor
        ) || null
      );
    }, [
      selectedColor,
      colorVariants,
    ]);

  /*
  |--------------------------------------------------------------------------
  | DEFAULT PRODUCT IMAGES
  |--------------------------------------------------------------------------
  */

  const defaultProductImages =
    useMemo(() => {
      const list =
        cleanImageArray([
          image,

          ...images,
        ]);

      if (
        list.length >
        0
      ) {
        return list;
      }

      return [
        "/images/no-image.png",
      ];
    }, [
      image,
      images,
    ]);

  /*
  |--------------------------------------------------------------------------
  | REEL POSTER
  |--------------------------------------------------------------------------
  */

  const reelPoster =
    useMemo(() => {
      const poster =
        typeof reelVideo?.poster ===
          "string"
          ? reelVideo.poster.trim()
          : "";

      return (
        poster ||
        defaultProductImages[0] ||
        "/images/no-image.png"
      );
    }, [
      reelVideo?.poster,
      defaultProductImages,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR IMAGES
  |--------------------------------------------------------------------------
  */

  const selectedColorImages =
    useMemo(() => {
      return cleanImageArray(
        selectedColorVariant
          ?.images
      );
    }, [
      selectedColorVariant,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE NORMAL IMAGES
  |--------------------------------------------------------------------------
  */

  const productImages =
    useMemo(() => {
      if (
        selectedColor &&
        selectedColorImages.length >
          0
      ) {
        return selectedColorImages;
      }

      return defaultProductImages;
    }, [
      selectedColor,
      selectedColorImages,
      defaultProductImages,
    ]);

  /*
  |--------------------------------------------------------------------------
  | MAIN 360
  |--------------------------------------------------------------------------
  */

  const main360Images =
    useMemo(() => {
      return get360Images(
        product360
      );
    }, [
      product360,
    ]);

  /*
  |--------------------------------------------------------------------------
  | COLOR AI 360
  |--------------------------------------------------------------------------
  */

  const colorProduct360Images =
    useMemo(() => {
      return get360Images(
        selectedColorVariant
          ?.product360
      );
    }, [
      selectedColorVariant,
    ]);

  /*
  |--------------------------------------------------------------------------
  | COLOR LEGACY 360
  |--------------------------------------------------------------------------
  */

  const legacyColor360Images =
    useMemo(() => {
      return cleanImageArray(
        selectedColorVariant
          ?.view360Images
      );
    }, [
      selectedColorVariant,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE COLOR 360
  |--------------------------------------------------------------------------
  */

  const color360Images =
    useMemo(() => {
      if (
        colorProduct360Images.length >
        1
      ) {
        return colorProduct360Images;
      }

      return legacyColor360Images;
    }, [
      colorProduct360Images,
      legacyColor360Images,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE 360
  |--------------------------------------------------------------------------
  |
  | No selected color:
  | -> Main 360
  |
  | Selected color own 360:
  | -> Color 360
  |
  | Selected color no 360:
  | -> Normal selected color images
  |
  |--------------------------------------------------------------------------
  */

  const active360Images =
    useMemo(() => {
      if (selectedColor) {
        if (
          color360Images.length >
          1
        ) {
          return color360Images;
        }

        return [];
      }

      return main360Images;
    }, [
      selectedColor,
      color360Images,
      main360Images,
    ]);

  const has360 =
    active360Images.length >
    1;

  /*
  |--------------------------------------------------------------------------
  | REEL AVAILABLE FOR CURRENT VIEW
  |--------------------------------------------------------------------------
  |
  | Product reel main product માટે છે.
  | Color select કર્યા પછી color images / 360 ને priority.
  |
  |--------------------------------------------------------------------------
  */

  const hasActiveReel =
    hasReel &&
    !selectedColor;

  /*
  |--------------------------------------------------------------------------
  | RESET ON PRODUCT CHANGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setSelectedColor("");

    setCurrentImage(0);

    setCurrent360Frame(0);

    setShowReel(false);
  }, [
    id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RESET ON COLOR CHANGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setCurrentImage(0);

    setCurrent360Frame(0);

    /*
     * Color select કરતાં reelમાંથી
     * color image / 360 પર પાછા જવું.
     */

    setShowReel(false);
  }, [
    selectedColor,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SAFE IMAGE INDEX
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      currentImage >=
      productImages.length
    ) {
      setCurrentImage(0);
    }
  }, [
    currentImage,
    productImages.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SAFE 360 INDEX
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      current360Frame >=
      active360Images.length
    ) {
      setCurrent360Frame(0);
    }
  }, [
    current360Frame,
    active360Images.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | VIDEO PLAY / PAUSE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    if (
      showReel &&
      hasActiveReel
    ) {
      video.muted = true;

      const playPromise =
        video.play();

      if (
        playPromise &&
        typeof playPromise.catch ===
          "function"
      ) {
        playPromise.catch(
          () => {
            /*
             * Browser may block autoplay.
             * Video remains available.
             */
          }
        );
      }

      return;
    }

    video.pause();

    try {
      video.currentTime = 0;
    } catch {
      //
    }
  }, [
    showReel,
    hasActiveReel,
    reelUrl,
  ]);

  /*
  |--------------------------------------------------------------------------
  | IMAGE NAVIGATION
  |--------------------------------------------------------------------------
  */

  function previousImage() {
    if (
      productImages.length <=
      1
    ) {
      return;
    }

    setCurrentImage(
      (previous) =>
        previous <= 0
          ? productImages.length -
            1
          : previous - 1
    );
  }

  function nextImage() {
    if (
      productImages.length <=
      1
    ) {
      return;
    }

    setCurrentImage(
      (previous) =>
        previous >=
        productImages.length -
          1
          ? 0
          : previous + 1
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 360 NAVIGATION
  |--------------------------------------------------------------------------
  */

  function previous360Frame() {
    if (
      active360Images.length <=
      1
    ) {
      return;
    }

    setCurrent360Frame(
      (previous) =>
        previous <= 0
          ? active360Images.length -
            1
          : previous - 1
    );
  }

  function next360Frame() {
    if (
      active360Images.length <=
      1
    ) {
      return;
    }

    setCurrent360Frame(
      (previous) =>
        previous >=
        active360Images.length -
          1
          ? 0
          : previous + 1
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TOGGLE REEL
  |--------------------------------------------------------------------------
  */

  function toggleReel() {
    if (!hasActiveReel) {
      return;
    }

    setShowReel(
      (previous) =>
        !previous
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR SELECT
  |--------------------------------------------------------------------------
  */

  function handleColorSelect(
    color: string
  ) {
    const current =
      selectedColor
        .trim()
        .toLowerCase();

    const next =
      color
        .trim()
        .toLowerCase();

    if (current === next) {
      setSelectedColor("");

      return;
    }

    setSelectedColor(
      color
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR VALUE
  |--------------------------------------------------------------------------
  */

  function getColorValue(
    color: string
  ) {
    const value =
      color
        .toLowerCase()
        .trim();

    const colorMap: Record<
      string,
      string
    > = {
      black: "#111111",

      white: "#ffffff",

      red: "#dc2626",

      blue: "#2563eb",

      "light blue":
        "#93c5fd",

      "premium blue":
        "#1d4ed8",

      "premium light blue":
        "#7dd3fc",

      navy:
        "#172554",

      "navy blue":
        "#172554",

      green:
        "#16a34a",

      "dark green":
        "#166534",

      yellow:
        "#facc15",

      gold:
        "#f3b61f",

      orange:
        "#f97316",

      pink:
        "#ec4899",

      purple:
        "#9333ea",

      violet:
        "#7c3aed",

      brown:
        "#78350f",

      beige:
        "#d6c5a5",

      cream:
        "#f5f0df",

      "off white":
        "#f8f5e9",

      grey:
        "#9ca3af",

      gray:
        "#9ca3af",

      charcoal:
        "#364152",

      maroon:
        "#7f1d1d",

      olive:
        "#737d3c",

      khaki:
        "#c3b091",

      silver:
        "#c0c0c0",
    };

    return (
      colorMap[value] ||
      color
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FIND COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  function findColorVariant(
    color: string
  ) {
    const normalized =
      color
        .trim()
        .toLowerCase();

    return (
      colorVariants.find(
        (variant) =>
          typeof variant?.color ===
            "string" &&
          variant.color
            .trim()
            .toLowerCase() ===
            normalized
      ) || null
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR HAS 360
  |--------------------------------------------------------------------------
  */

  function colorHas360(
    color: string
  ) {
    const variant =
      findColorVariant(
        color
      );

    if (!variant) {
      return false;
    }

    const new360Images =
      get360Images(
        variant.product360
      );

    if (
      new360Images.length >
      1
    ) {
      return true;
    }

    return (
      cleanImageArray(
        variant.view360Images
      ).length > 1
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 360 POINTER DOWN
  |--------------------------------------------------------------------------
  */

  function handle360PointerDown(
    event:
      PointerEvent<HTMLDivElement>
  ) {
    if (!has360) {
      return;
    }

    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );

    lastDragXRef.current =
      event.clientX;

    draggingRef.current =
      true;

    setDragging360(true);
  }

  /*
  |--------------------------------------------------------------------------
  | 360 POINTER MOVE
  |--------------------------------------------------------------------------
  */

  function handle360PointerMove(
    event:
      PointerEvent<HTMLDivElement>
  ) {
    if (
      !has360 ||
      !draggingRef.current ||
      lastDragXRef.current ===
        null
    ) {
      return;
    }

    const difference =
      event.clientX -
      lastDragXRef.current;

    const threshold =
      7;

    if (
      Math.abs(
        difference
      ) < threshold
    ) {
      return;
    }

    if (difference > 0) {
      previous360Frame();
    } else {
      next360Frame();
    }

    lastDragXRef.current =
      event.clientX;
  }

  /*
  |--------------------------------------------------------------------------
  | FINISH 360 DRAG
  |--------------------------------------------------------------------------
  */

  function finish360Drag() {
    draggingRef.current =
      false;

    lastDragXRef.current =
      null;

    setDragging360(false);
  }

  /*
  |--------------------------------------------------------------------------
  | RATING
  |--------------------------------------------------------------------------
  */

  function ProductRating() {
    const safeRating =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            rating || 0
          )
        )
      );

    return (
      <div
        className="
          flex
          items-center
          gap-[2px]
          text-[11px]
          leading-none
        "
        aria-label={`Rating ${safeRating.toFixed(
          1
        )} out of 5`}
      >
        {[0, 1, 2, 3, 4].map(
          (star) => {
            const fill =
              Math.max(
                0,
                Math.min(
                  1,
                  safeRating -
                    star
                )
              ) * 100;

            return (
              <span
                key={star}
                className="
                  relative
                  inline-block
                  h-[13px]
                  w-[13px]
                "
              >
                <span
                  className="
                    absolute
                    inset-0
                    text-gray-300
                  "
                >
                  ★
                </span>

                <span
                  className="
                    absolute
                    inset-0
                    overflow-hidden
                    text-[#F3B61F]
                  "
                  style={{
                    width:
                      `${fill}%`,
                  }}
                >
                  ★
                </span>
              </span>
            );
          }
        )}

        <span
          className="
            ml-1
            text-[11px]
            text-gray-500
          "
        >
          {safeRating.toFixed(
            1
          )}
        </span>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CURRENT DISPLAY IMAGE
  |--------------------------------------------------------------------------
  */

  const currentDisplayImage =
    has360
      ? active360Images[
          current360Frame
        ] ||
        productImages[0] ||
        "/images/no-image.png"
      : productImages[
          currentImage
        ] ||
        "/images/no-image.png";

  /*
  |--------------------------------------------------------------------------
  | WISHLIST IMAGE
  |--------------------------------------------------------------------------
  */

  const wishlistImage =
    selectedColorImages[0] ||
    productImages[0] ||
    active360Images[0] ||
    image ||
    "/images/no-image.png";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <article
      className="
        group
        relative
        min-w-0
        overflow-hidden
        rounded-2xl
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      {/* ======================================================
          MEDIA AREA
      ====================================================== */}

      <div
        className="
          relative
          overflow-hidden
          bg-[#f5f5f5]
        "
      >
        {/* ====================================================
            REEL VIDEO
        ==================================================== */}

        {showReel &&
        hasActiveReel ? (
          <Link
            href={
              productUrl
            }
            aria-label={`View ${name}`}
            className="
              relative
              block
              aspect-[3/4]
              w-full
              overflow-hidden
              bg-black
            "
          >
            <video
              ref={
                videoRef
              }
              src={
                reelUrl
              }
              poster={
                reelPoster
              }
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
              onError={() =>
                setShowReel(
                  false
                )
              }
              className="
                h-full
                w-full
                object-cover
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                bottom-3
                left-3
                z-20
                rounded-full
                bg-black/75
                px-3
                py-1.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-white
                backdrop-blur-sm
              "
            >
              Reel
            </div>
          </Link>
        ) : has360 ? (
          /* ==================================================
             360 PRODUCT VIEW
          ================================================== */

          <div
            className={`
              relative
              aspect-[3/4]
              w-full
              overflow-hidden
              bg-[#f5f5f5]
              select-none
              touch-pan-y

              ${
                dragging360
                  ? "cursor-grabbing"
                  : "cursor-grab"
              }
            `}
            onPointerDown={
              handle360PointerDown
            }
            onPointerMove={
              handle360PointerMove
            }
            onPointerUp={
              finish360Drag
            }
            onPointerCancel={
              finish360Drag
            }
            onPointerLeave={() => {
              if (
                draggingRef.current
              ) {
                finish360Drag();
              }
            }}
          >
            <img
              src={
                currentDisplayImage
              }
              alt={`${name} 360 degree view`}
              draggable={
                false
              }
              className="
                h-full
                w-full
                object-cover
                transition-opacity
                duration-75
              "
            />

            {/* 360 BADGE */}

            <div
              className="
                pointer-events-none
                absolute
                left-3
                top-3
                z-20
                rounded-full
                bg-black/85
                px-3
                py-1.5
                text-[10px]
                font-semibold
                tracking-wide
                text-white
                shadow-sm
                backdrop-blur-sm
              "
            >
              360°
            </div>

            {/* FRAME COUNTER */}

            <div
              className="
                pointer-events-none
                absolute
                right-3
                top-14
                z-20
                rounded-full
                bg-white/95
                px-2.5
                py-1
                text-[9px]
                font-semibold
                text-gray-700
                shadow-sm
                backdrop-blur-sm
              "
            >
              {current360Frame +
                1}
              /
              {
                active360Images.length
              }
            </div>

            {/* DRAG INFO */}

            <div
              className="
                pointer-events-none
                absolute
                bottom-4
                left-1/2
                z-20
                -translate-x-1/2
                whitespace-nowrap
                rounded-full
                bg-white/95
                px-3
                py-1.5
                text-[9px]
                font-semibold
                text-gray-700
                shadow-sm
                backdrop-blur-sm
              "
            >
              ↔ Drag to rotate
            </div>

            {/* PREVIOUS 360 */}

            <button
              type="button"
              aria-label="Previous 360 frame"
              onPointerDown={(
                event
              ) =>
                event.stopPropagation()
              }
              onClick={(
                event
              ) => {
                event.preventDefault();

                event.stopPropagation();

                previous360Frame();
              }}
              className="
                absolute
                left-2
                top-1/2
                z-30
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/95
                text-xl
                font-light
                text-black
                opacity-100
                shadow-md
                transition
                hover:scale-105
                hover:bg-white
                sm:opacity-0
                sm:group-hover:opacity-100
              "
            >
              ‹
            </button>

            {/* NEXT 360 */}

            <button
              type="button"
              aria-label="Next 360 frame"
              onPointerDown={(
                event
              ) =>
                event.stopPropagation()
              }
              onClick={(
                event
              ) => {
                event.preventDefault();

                event.stopPropagation();

                next360Frame();
              }}
              className="
                absolute
                right-2
                top-1/2
                z-30
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/95
                text-xl
                font-light
                text-black
                opacity-100
                shadow-md
                transition
                hover:scale-105
                hover:bg-white
                sm:opacity-0
                sm:group-hover:opacity-100
              "
            >
              ›
            </button>

            {/* VIEW PRODUCT */}

            <Link
              href={
                productUrl
              }
              aria-label={`Open ${name}`}
              onPointerDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="
                absolute
                bottom-4
                right-3
                z-30
                rounded-full
                bg-black/85
                px-3
                py-1.5
                text-[9px]
                font-semibold
                text-white
                shadow-sm
                backdrop-blur-sm
                transition
                hover:bg-black
              "
            >
              View
            </Link>
          </div>
        ) : (
          /* ==================================================
             NORMAL PRODUCT IMAGE
          ================================================== */

          <Link
            href={
              productUrl
            }
            aria-label={`View ${name}`}
          >
            <div
              className="
                relative
                aspect-[3/4]
                w-full
                cursor-pointer
                overflow-hidden
              "
            >
              <img
                src={
                  currentDisplayImage
                }
                alt={`${name} image ${
                  currentImage +
                  1
                }`}
                draggable={
                  false
                }
                className="
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-500
                  ease-out
                  group-hover:scale-[1.035]
                "
              />
            </div>
          </Link>
        )}

        {/* ====================================================
            REEL TOGGLE
        ==================================================== */}

        {hasActiveReel && (
          <button
            type="button"
            aria-label={
              showReel
                ? "Show product images"
                : "Play product reel"
            }
            onPointerDown={(
              event
            ) =>
              event.stopPropagation()
            }
            onClick={(
              event
            ) => {
              event.preventDefault();

              event.stopPropagation();

              toggleReel();
            }}
            className="
              absolute
              right-3
              top-14
              z-40
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-black/90
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.08em]
              text-white
              shadow-md
              backdrop-blur-sm
              transition
              hover:scale-105
              hover:bg-black
            "
          >
            {showReel ? (
              <>
                <span>
                  ▣
                </span>

                Photos
              </>
            ) : (
              <>
                <span>
                  ▶
                </span>

                Reel
              </>
            )}
          </button>
        )}

        {/* ====================================================
            NEW BADGE
        ==================================================== */}

        <span
          className={`
            absolute
            left-3
            z-20
            rounded-full
            bg-white/95
            px-2.5
            py-1
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.12em]
            text-black
            shadow-sm
            backdrop-blur-sm

            ${
              !showReel &&
              has360
                ? "top-12"
                : "top-3"
            }
          `}
        >
          New
        </span>

        {/* ====================================================
            DISCOUNT
        ==================================================== */}

        {discount > 0 && (
          <span
            className={`
              absolute
              left-3
              z-20
              rounded-full
              bg-[#111827]
              px-2.5
              py-1
              text-[9px]
              font-semibold
              tracking-wide
              text-white
              shadow-sm

              ${
                !showReel &&
                has360
                  ? "bottom-12"
                  : showReel
                    ? "bottom-12"
                    : "bottom-3"
              }
            `}
          >
            {discount}% OFF
          </span>
        )}

        {/* ====================================================
            WISHLIST
        ==================================================== */}

        <div
          className="
            absolute
            right-3
            top-3
            z-50
          "
          onPointerDown={(
            event
          ) =>
            event.stopPropagation()
          }
        >
          <WishlistButton
            id={id}
            name={name}
            slug={slug}
            image={
              wishlistImage
            }
            price={price}
            mrp={mrp}
          />
        </div>

        {/* ====================================================
            NORMAL IMAGE PREVIOUS
        ==================================================== */}

        {!showReel &&
          !has360 &&
          productImages.length >
            1 && (
            <button
              type="button"
              aria-label="Previous product image"
              onClick={(
                event
              ) => {
                event.preventDefault();

                event.stopPropagation();

                previousImage();
              }}
              className="
                absolute
                left-2
                top-1/2
                z-20
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/95
                text-xl
                font-light
                text-black
                opacity-100
                shadow-md
                transition
                hover:scale-105
                hover:bg-white
                sm:opacity-0
                sm:group-hover:opacity-100
              "
            >
              ‹
            </button>
          )}

        {/* ====================================================
            NORMAL IMAGE NEXT
        ==================================================== */}

        {!showReel &&
          !has360 &&
          productImages.length >
            1 && (
            <button
              type="button"
              aria-label="Next product image"
              onClick={(
                event
              ) => {
                event.preventDefault();

                event.stopPropagation();

                nextImage();
              }}
              className="
                absolute
                right-2
                top-1/2
                z-20
                flex
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/95
                text-xl
                font-light
                text-black
                opacity-100
                shadow-md
                transition
                hover:scale-105
                hover:bg-white
                sm:opacity-0
                sm:group-hover:opacity-100
              "
            >
              ›
            </button>
          )}

        {/* ====================================================
            NORMAL IMAGE DOTS
        ==================================================== */}

        {!showReel &&
          !has360 &&
          productImages.length >
            1 && (
            <div
              className="
                absolute
                bottom-3
                left-1/2
                z-20
                flex
                -translate-x-1/2
                items-center
                gap-1.5
              "
            >
              {productImages.map(
                (
                  _,
                  index
                ) => (
                  <button
                    key={
                      index
                    }
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
                      h-[5px]
                      rounded-full
                      shadow-sm
                      transition-all
                      duration-200

                      ${
                        currentImage ===
                        index
                          ? "w-6 bg-black"
                          : "w-[5px] bg-white"
                      }
                    `}
                  />
                )
              )}
            </div>
          )}
      </div>

      {/* ======================================================
          PRODUCT INFO
      ====================================================== */}

      <div
        className="
          relative
          px-4
          pb-5
          pt-4
        "
      >
        {/* CATEGORY + OPEN */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-2
          "
        >
          <Link
            href={
              productUrl
            }
            className="min-w-0"
          >
            <p
              className="
                truncate
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-gray-500
              "
            >
              {category}
            </p>
          </Link>

          <Link
            href={
              productUrl
            }
            aria-label={`View ${name}`}
            className="
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-gray-100
              text-lg
              font-light
              leading-none
              text-black
              transition
              hover:bg-black
              hover:text-white
            "
          >
            +
          </Link>
        </div>

        {/* NAME */}

        <Link
          href={
            productUrl
          }
        >
          <h2
            className="
              mt-2
              line-clamp-2
              min-h-[38px]
              pr-1
              text-[14px]
              font-medium
              leading-[1.35]
              text-gray-900
              transition
              hover:text-[#2563EB]
            "
          >
            {name}
          </h2>
        </Link>

        {/* RATING */}

        {rating > 0 && (
          <div className="mt-2">
            <ProductRating />
          </div>
        )}

        {/* PRICE */}

        <div
          className="
            mt-2.5
            flex
            flex-wrap
            items-center
            gap-x-2
            gap-y-1
          "
        >
          <span
            className="
              text-sm
              font-bold
              text-gray-900
            "
          >
            ₹
            {Number(
              price || 0
            ).toLocaleString(
              "en-IN"
            )}
          </span>

          {mrp > price && (
            <span
              className="
                text-xs
                text-gray-400
                line-through
              "
            >
              ₹
              {Number(
                mrp || 0
              ).toLocaleString(
                "en-IN"
              )}
            </span>
          )}

          {discount > 0 && (
            <span
              className="
                text-[10px]
                font-semibold
                text-green-600
              "
            >
              {discount}% off
            </span>
          )}
        </div>

        {/* ====================================================
            COLOR SWATCHES
        ==================================================== */}

        {colors.length > 0 && (
          <div
            className="
              mt-4
              flex
              flex-wrap
              items-start
              gap-x-3
              gap-y-3
            "
          >
            {colors
              .slice(0, 6)
              .map(
                (
                  color,
                  index
                ) => {
                  const isSelected =
                    selectedColor
                      .trim()
                      .toLowerCase() ===
                    color
                      .trim()
                      .toLowerCase();

                  const hasColor360 =
                    colorHas360(
                      color
                    );

                  return (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      title={
                        hasColor360
                          ? `${color} 360°`
                          : color
                      }
                      aria-label={`Select ${color}`}
                      aria-pressed={
                        isSelected
                      }
                      onClick={() =>
                        handleColorSelect(
                          color
                        )
                      }
                      className="
                        flex
                        min-w-[36px]
                        flex-col
                        items-center
                        gap-1.5
                      "
                    >
                      <span
                        className={`
                          flex
                          h-[27px]
                          w-[27px]
                          items-center
                          justify-center
                          rounded-full
                          transition-all
                          duration-200

                          ${
                            isSelected
                              ? "ring-2 ring-black ring-offset-2"
                              : "hover:scale-110"
                          }
                        `}
                      >
                        <span
                          className="
                            h-[19px]
                            w-[19px]
                            rounded-full
                            border
                            border-gray-300
                            shadow-sm
                          "
                          style={{
                            backgroundColor:
                              getColorValue(
                                color
                              ),
                          }}
                        />
                      </span>

                      <span
                        className={`
                          max-w-[62px]
                          truncate
                          text-center
                          text-[9px]
                          capitalize
                          leading-tight

                          ${
                            isSelected
                              ? "font-semibold text-black"
                              : "font-medium text-gray-500"
                          }
                        `}
                      >
                        {color}
                      </span>

                      {hasColor360 && (
                        <span
                          className="
                            -mt-0.5
                            text-[7px]
                            font-bold
                            leading-none
                            text-gray-700
                          "
                        >
                          360°
                        </span>
                      )}
                    </button>
                  );
                }
              )}

            {colors.length >
              6 && (
              <span
                className="
                  mt-1
                  flex
                  h-7
                  items-center
                  text-[10px]
                  font-medium
                  text-gray-500
                "
              >
                +
                {colors.length -
                  6}
              </span>
            )}
          </div>
        )}

        {/* STOCK */}

        {stock > 0 &&
          stock <= 5 && (
            <p
              className="
                mt-3
                text-[10px]
                font-semibold
                text-[#d97706]
              "
            >
              Only {stock} left
            </p>
          )}

        {stock <= 0 && (
          <p
            className="
              mt-3
              text-[10px]
              font-semibold
              text-red-600
            "
          >
            Out of stock
          </p>
        )}
      </div>
    </article>
  );
}