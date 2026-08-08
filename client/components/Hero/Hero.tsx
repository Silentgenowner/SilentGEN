"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/home/hero-1.jpg",
    smallText: "SILENTGEN FASHION",
    title: "Premium Fashion",
    description:
      "Discover modern styles, premium quality and effortless fashion.",
    button: "Shop Now",
    link: "/shop",
  },
  {
    image: "/images/home/hero-2.jpg",
    smallText: "NEW COLLECTION",
    title: "Style That Speaks",
    description:
      "Explore our latest collection created for your everyday style.",
    button: "Explore Collection",
    link: "/shop",
  },
  {
    image: "/images/home/hero-3.jpg",
    smallText: "SPECIAL OFFERS",
    title: "Fashion At Better Prices",
    description:
      "Discover selected styles and exclusive offers from SilentGEN.",
    button: "View Offers",
    link: "/shop?offers=true",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] =
    useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((previous) =>
        previous === slides.length - 1
          ? 0
          : previous + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  function previousSlide() {
    setCurrentSlide((previous) =>
      previous === 0
        ? slides.length - 1
        : previous - 1
    );
  }

  function nextSlide() {
    setCurrentSlide((previous) =>
      previous === slides.length - 1
        ? 0
        : previous + 1
    );
  }

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full overflow-hidden bg-black text-white">

      {/* Background Image */}
      <div className="relative h-[560px] w-full sm:h-[620px] lg:h-[700px]">

        <Image
          key={slide.image}
          src={slide.image}
          alt={slide.title}
          fill
          priority={currentSlide === 0}
          sizes="100vw"
          className="object-cover transition-opacity duration-700"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-12">

          <div className="max-w-2xl">

            <p className="mb-4 text-xs font-semibold uppercase tracking-[4px] text-white/80 sm:text-sm">
              {slide.smallText}
            </p>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {slide.title}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base md:text-lg">
              {slide.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href={slide.link}
                className="rounded-lg bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 sm:px-9 sm:py-4"
              >
                {slide.button}
              </Link>

              <Link
                href="/shop"
                className="rounded-lg border border-white px-7 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black sm:px-9 sm:py-4"
              >
                Shop Collection
              </Link>

            </div>

          </div>

        </div>

        {/* Previous Button */}
        <button
          type="button"
          onClick={previousSlide}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-2xl backdrop-blur-sm transition hover:bg-white hover:text-black sm:left-6"
        >
          ‹
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-2xl backdrop-blur-sm transition hover:bg-white hover:text-black sm:right-6"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">

          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() =>
                setCurrentSlide(index)
              }
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50"
              }`}
            />
          ))}

        </div>

      </div>

    </section>
  );
}
