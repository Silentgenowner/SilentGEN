"use client";

import Image from "next/image";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Props = {
  images: string[];

  thumbnail?: string;

  name: string;
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
| PRODUCT GALLERY
|--------------------------------------------------------------------------
*/

export default function ProductGallery({
  images = [],

  thumbnail = "",

  name,
}: Props) {
  /*
  |--------------------------------------------------------------------------
  | GALLERY IMAGES
  |--------------------------------------------------------------------------
  */

  const gallery =
    useMemo(() => {
      const cleanedImages =
        cleanImageArray(
          images
        );

      if (
        cleanedImages.length >
        0
      ) {
        return cleanedImages;
      }

      const cleanedThumbnail =
        String(
          thumbnail || ""
        ).trim();

      if (
        cleanedThumbnail
      ) {
        return [
          cleanedThumbnail,
        ];
      }

      return [];
    }, [
      images,
      thumbnail,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SELECTED IMAGE
  |--------------------------------------------------------------------------
  */

  const [
    selected,
    setSelected,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CURRENT INDEX
  |--------------------------------------------------------------------------
  */

  const currentIndex =
    useMemo(() => {
      const index =
        gallery.findIndex(
          (image) =>
            image === selected
        );

      return index >= 0
        ? index
        : 0;
    }, [
      gallery,
      selected,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RESET WHEN GALLERY CHANGES
  |--------------------------------------------------------------------------
  |
  | Very important for color switching.
  |
  | Example:
  |
  | Black selected
  | -> black images arrive
  |
  | White selected
  | -> white images arrive
  |
  | Gallery automatically switches to first white image.
  |
  */

  useEffect(() => {
    if (
      gallery.length ===
      0
    ) {
      setSelected("");

      return;
    }

    const selectedStillExists =
      gallery.includes(
        selected
      );

    if (
      !selectedStillExists
    ) {
      setSelected(
        gallery[0] || ""
      );
    }
  }, [
    gallery,
    selected,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PREVIOUS IMAGE
  |--------------------------------------------------------------------------
  */

  function previousImage() {
    if (
      gallery.length <= 1
    ) {
      return;
    }

    const nextIndex =
      currentIndex <= 0
        ? gallery.length - 1
        : currentIndex - 1;

    setSelected(
      gallery[nextIndex] ||
        gallery[0] ||
        ""
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NEXT IMAGE
  |--------------------------------------------------------------------------
  */

  function nextImage() {
    if (
      gallery.length <= 1
    ) {
      return;
    }

    const nextIndex =
      currentIndex >=
      gallery.length - 1
        ? 0
        : currentIndex + 1;

    setSelected(
      gallery[nextIndex] ||
        gallery[0] ||
        ""
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NO IMAGE
  |--------------------------------------------------------------------------
  */

  if (
    gallery.length === 0
  ) {
    return (
      <div className="space-y-4">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          <div className="text-center text-gray-400">
            <div className="text-5xl">
              🛍️
            </div>

            <p className="mt-3 text-sm">
              No product image
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIVE IMAGE
  |--------------------------------------------------------------------------
  */

  const activeImage =
    selected ||
    gallery[0] ||
    "";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-4">
      {/*
      |--------------------------------------------------------------------------
      | MAIN IMAGE
      |--------------------------------------------------------------------------
      */}

      <div className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <Image
          key={
            activeImage
          }
          src={
            activeImage
          }
          alt={name}
          fill
          priority
          className="object-contain transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/*
        |--------------------------------------------------------------------------
        | PREVIOUS
        |--------------------------------------------------------------------------
        */}

        {gallery.length >
          1 && (
          <button
            type="button"
            aria-label="Previous product image"
            onClick={
              previousImage
            }
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-light text-black shadow-md transition hover:bg-white"
          >
            ‹
          </button>
        )}

        {/*
        |--------------------------------------------------------------------------
        | NEXT
        |--------------------------------------------------------------------------
        */}

        {gallery.length >
          1 && (
          <button
            type="button"
            aria-label="Next product image"
            onClick={
              nextImage
            }
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-light text-black shadow-md transition hover:bg-white"
          >
            ›
          </button>
        )}

        {/*
        |--------------------------------------------------------------------------
        | IMAGE COUNTER
        |--------------------------------------------------------------------------
        */}

        {gallery.length >
          1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            {currentIndex +
              1}
            /
            {
              gallery.length
            }
          </div>
        )}
      </div>

      {/*
      |--------------------------------------------------------------------------
      | THUMBNAILS
      |--------------------------------------------------------------------------
      */}

      {gallery.length >
        1 && (
        <div className="grid grid-cols-5 gap-3">
          {gallery.map(
            (
              image,
              index
            ) => {
              const active =
                activeImage ===
                image;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  aria-label={`Show ${name} image ${
                    index + 1
                  }`}
                  onClick={() =>
                    setSelected(
                      image
                    )
                  }
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 transition ${
                    active
                      ? "border-black ring-1 ring-black/10"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={
                      image
                    }
                    alt={`${name} ${
                      index + 1
                    }`}
                    fill
                    className="object-contain"
                    sizes="120px"
                  />
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}