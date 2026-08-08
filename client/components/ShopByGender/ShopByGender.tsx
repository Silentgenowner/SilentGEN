"use client";

import Link from "next/link";

const genders = [
  {
    name: "Men",
    description: "Explore Men's Collection",
    href: "/shop?gender=Men",
    icon: "👨",
  },
  {
    name: "Women",
    description: "Explore Women's Collection",
    href: "/shop?gender=Women",
    icon: "👩",
  },
  {
    name: "Kids",
    description: "Explore Kids' Collection",
    href: "/shop?gender=Kids",
    icon: "🧒",
  },
];

export default function ShopByGender() {
  return (
    <section className="w-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">

        {/* Heading */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-gray-500">
            Find Your Style
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
            Shop by Gender
          </h2>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Discover collections designed for everyone.
          </p>
        </div>

        {/* Gender Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {genders.map((gender) => (
            <Link
              key={gender.name}
              href={gender.href}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-6
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-black
                hover:shadow-xl
              "
            >
              {/* Background */}
              <div
                className="
                  absolute
                  -right-8
                  -top-8
                  h-32
                  w-32
                  rounded-full
                  bg-gray-100
                  transition-all
                  duration-500
                  group-hover:scale-[2]
                "
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="
                    flex
                    h-20
                    w-20
                    items-center
                    justify-center
                    rounded-full
                    bg-gray-100
                    text-4xl
                    transition
                    duration-300
                    group-hover:bg-black
                    group-hover:grayscale
                  "
                >
                  {gender.icon}
                </div>

                {/* Content */}
                <h3 className="mt-6 text-2xl font-bold text-black">
                  {gender.name}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {gender.description}
                </p>

                <span
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-black
                  "
                >
                  Shop Now
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}