"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

/* ============================================================
   TYPES
============================================================ */

type ImageData = {
  url: string;
  alt: string;
  title?: string;
};

type GenderData = {
  enabled: boolean;
  title: string;

  menImage: ImageData;
  womenImage: ImageData;
  kidsImage: ImageData;
};

type HomepageData = {
  gender?: Partial<GenderData>;
};

type HomepageApiResponse = {
  success?: boolean;
  homepage?: HomepageData;
  data?: HomepageData;
  message?: string;
};

/* ============================================================
   DEFAULT DATA
============================================================ */

const DEFAULT_IMAGE: ImageData = {
  url: "",
  alt: "",
  title: "",
};

const DEFAULT_GENDER: GenderData = {
  enabled: true,

  title: "Shop by Gender",

  menImage: {
    ...DEFAULT_IMAGE,
    alt: "Men",
  },

  womenImage: {
    ...DEFAULT_IMAGE,
    alt: "Women",
  },

  kidsImage: {
    ...DEFAULT_IMAGE,
    alt: "Kids",
  },
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeImage(
  image:
    | Partial<ImageData>
    | undefined,
  fallbackAlt: string
): ImageData {
  return {
    url:
      typeof image?.url === "string"
        ? image.url.trim()
        : "",

    alt:
      typeof image?.alt === "string" &&
      image.alt.trim()
        ? image.alt.trim()
        : fallbackAlt,

    title:
      typeof image?.title === "string"
        ? image.title.trim()
        : "",
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ShopByGender() {
  const [
    gender,
    setGender,
  ] =
    useState<GenderData>(
      DEFAULT_GENDER
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* ============================================================
     LOAD HOMEPAGE
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadHomepage() {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/homepage",
            {
              method: "GET",
              cache: "no-store",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data:
          HomepageApiResponse =
            await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load homepage."
          );
        }

        if (cancelled) {
          return;
        }

        const homepage =
          data?.homepage ||
          data?.data;

        const apiGender =
          homepage?.gender;

        if (!apiGender) {
          setGender(
            DEFAULT_GENDER
          );

          return;
        }

        setGender({
          enabled:
            typeof apiGender.enabled ===
            "boolean"
              ? apiGender.enabled
              : true,

          title:
            typeof apiGender.title ===
              "string" &&
            apiGender.title.trim()
              ? apiGender.title.trim()
              : "Shop by Gender",

          menImage:
            normalizeImage(
              apiGender.menImage,
              "Men"
            ),

          womenImage:
            normalizeImage(
              apiGender.womenImage,
              "Women"
            ),

          kidsImage:
            normalizeImage(
              apiGender.kidsImage,
              "Kids"
            ),
        });
      } catch (error) {
        console.error(
          "SHOP BY GENDER LOAD ERROR:",
          error
        );

        if (!cancelled) {
          setGender(
            DEFAULT_GENDER
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHomepage();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     GENDER CARDS
  ============================================================ */

  const genders =
    useMemo(
      () => [
        {
          name: "Men",

          description:
            "Explore Men's Collection",

          href:
            "/shop?gender=Men",

          image:
            gender.menImage,
        },

        {
          name: "Women",

          description:
            "Explore Women's Collection",

          href:
            "/shop?gender=Women",

          image:
            gender.womenImage,
        },

        {
          name: "Kids",

          description:
            "Explore Kids' Collection",

          href:
            "/shop?gender=Kids",

          image:
            gender.kidsImage,
        },
      ],
      [gender]
    );

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <section className="w-full bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
          <div className="mb-8">
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />

            <div className="mt-4 h-9 w-64 animate-pulse rounded bg-gray-200" />

            <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[0, 1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-[380px] animate-pulse rounded-2xl bg-gray-200"
                />
              )
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
     DISABLED
  ============================================================ */

  if (!gender.enabled) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section className="w-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">

        {/* ======================================================
            HEADING
        ====================================================== */}

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-gray-500">
            Find Your Style
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
            {gender.title}
          </h2>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Discover collections
            designed for everyone.
          </p>
        </div>

        {/* ======================================================
            CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {genders.map(
            (item) => (
              <GenderCard
                key={item.name}
                name={item.name}
                description={
                  item.description
                }
                href={item.href}
                image={item.image}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   GENDER CARD
============================================================ */

function GenderCard({
  name,
  description,
  href,
  image,
}: {
  name: string;

  description: string;

  href: string;

  image: ImageData;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image.url]);

  const hasImage =
    Boolean(image.url) &&
    !imageFailed;

  return (
    <Link
      href={href}
      className="
        group
        relative
        block
        min-h-[380px]
        overflow-hidden
        rounded-2xl
        bg-gray-200
        shadow-sm
        transition-all
        duration-500

        hover:-translate-y-1
        hover:shadow-2xl
      "
    >

      {/* ======================================================
          IMAGE
      ====================================================== */}

      {hasImage ? (
        <img
          src={image.url}
          alt={
            image.alt || name
          }
          title={
            image.title ||
            undefined
          }
          onError={() =>
            setImageFailed(true)
          }
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-transform
            duration-700
            ease-out

            group-hover:scale-105
          "
        />
      ) : (
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-gradient-to-br
            from-gray-100
            to-gray-300
          "
        >
          <span
            className="
              text-7xl
              font-black
              text-gray-300
            "
          >
            {name.charAt(0)}
          </span>
        </div>
      )}

      {/* ======================================================
          DARK GRADIENT
      ====================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/80
          via-black/20
          to-transparent
          transition
          duration-500

          group-hover:from-black/90
        "
      />

      {/* ======================================================
          TOP BADGE
      ====================================================== */}

      <div
        className="
          absolute
          left-5
          top-5
          z-10
        "
      >
        <span
          className="
            rounded-full
            border
            border-white/30
            bg-black/20
            px-3
            py-1.5
            text-[10px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-white
            backdrop-blur-md
          "
        >
          SilentGEN
        </span>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          z-10
          p-6

          sm:p-7
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.2em]
            text-white/70
          "
        >
          Collection
        </p>

        <h3
          className="
            mt-2
            text-3xl
            font-black
            tracking-tight
            text-white

            lg:text-4xl
          "
        >
          {name}
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-white/80
          "
        >
          {description}
        </p>

        {/* ====================================================
            BUTTON
        ==================================================== */}

        <div className="mt-5">
          <span
            className="
              inline-flex
              items-center
              gap-3
              rounded-full
              bg-white
              px-5
              py-2.5
              text-sm
              font-bold
              text-black
              transition-all
              duration-300

              group-hover:gap-4
              group-hover:bg-black
              group-hover:text-white
            "
          >
            Shop Now

            <span
              className="
                transition-transform
                duration-300

                group-hover:translate-x-1
              "
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}