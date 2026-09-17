"use client";

import { useState } from "react";
import SectionVisibility from "./SectionVisibility";

type HeroSlide = {
  id: string;
  desktopImage: string;
  mobileImage: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
  enabled: boolean;
};

type HeroData = {
  enabled?: boolean;
  autoSlide?: boolean;
  slideInterval?: number;
  slides?: HeroSlide[];
};

type HeroEditorProps = {
  hero?: HeroData;
  onChange: (hero: HeroData) => void;
};

const DEFAULT_SLIDE: HeroSlide = {
  id: "",
  desktopImage: "",
  mobileImage: "",
  title: "",
  subtitle: "",
  buttonText: "",
  buttonHref: "",
  enabled: true,
};

export default function HeroEditor({
  hero,
  onChange,
}: HeroEditorProps) {
  const data = hero || {};

  const slides = Array.isArray(data.slides)
    ? data.slides
    : [];

  const [selectedSlide, setSelectedSlide] =
    useState(0);

  function updateHero(
    changes: Partial<HeroData>
  ) {
    onChange({
      ...data,
      ...changes,
    });
  }

  function addSlide() {
    const newSlide: HeroSlide = {
      ...DEFAULT_SLIDE,
      id: `hero-${Date.now()}`,
    };

    const nextSlides = [
      ...slides,
      newSlide,
    ];

    updateHero({
      slides: nextSlides,
    });

    setSelectedSlide(
      nextSlides.length - 1
    );
  }

  function removeSlide(index: number) {
    const nextSlides = slides.filter(
      (_, slideIndex) =>
        slideIndex !== index
    );

    updateHero({
      slides: nextSlides,
    });

    setSelectedSlide((current) =>
      Math.max(
        0,
        Math.min(
          current,
          nextSlides.length - 1
        )
      )
    );
  }

  function updateSlide(
    index: number,
    changes: Partial<HeroSlide>
  ) {
    const nextSlides = slides.map(
      (slide, slideIndex) =>
        slideIndex === index
          ? {
              ...slide,
              ...changes,
            }
          : slide
    );

    updateHero({
      slides: nextSlides,
    });
  }

  const currentSlide =
    slides[selectedSlide];

  return (
    <div className="space-y-6">
      {/* VISIBILITY */}

      <SectionVisibility
        enabled={data.enabled ?? true}
        onChange={(enabled) =>
          updateHero({ enabled })
        }
      />

      {/* SLIDER SETTINGS */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">
            Hero Slider Settings
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Control automatic sliding and timing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* AUTO SLIDE */}

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Auto Slide
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Automatically change hero slides.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                updateHero({
                  autoSlide:
                    !(data.autoSlide ?? true),
                })
              }
              className={`relative h-7 w-12 rounded-full transition ${
                data.autoSlide ?? true
                  ? "bg-black"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  data.autoSlide ?? true
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          {/* INTERVAL */}

          <div className="rounded-lg border border-gray-200 p-4">
            <label
              htmlFor="hero-slide-interval"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Slide Interval
            </label>

            <div className="flex items-center gap-2">
              <input
                id="hero-slide-interval"
                type="number"
                min={1000}
                step={500}
                value={
                  data.slideInterval ??
                  5000
                }
                onChange={(e) =>
                  updateHero({
                    slideInterval:
                      Number(
                        e.target.value
                      ),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
              />

              <span className="text-sm text-gray-500">
                ms
              </span>
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              Example: 5000 = 5 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* SLIDES */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Hero Slides
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add and manage homepage banner slides.
            </p>
          </div>

          <button
            type="button"
            onClick={addSlide}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Add Slide
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm font-semibold text-gray-700">
              No hero slides yet
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Click "Add Slide" to create your first
              homepage banner.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            {/* SLIDE LIST */}

            <div className="space-y-2">
              {slides.map(
                (slide, index) => (
                  <button
                    key={
                      slide.id ||
                      `slide-${index}`
                    }
                    type="button"
                    onClick={() =>
                      setSelectedSlide(
                        index
                      )
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedSlide === index
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-bold text-white">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {slide.title ||
                            `Slide ${
                              index + 1
                            }`}
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            slide.enabled
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {slide.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>

            {/* SLIDE EDITOR */}

            {currentSlide && (
              <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
                {/* SLIDE HEADER */}

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Slide{" "}
                      {selectedSlide + 1}
                    </h4>

                    <p className="mt-1 text-xs text-gray-500">
                      Edit this hero banner.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateSlide(
                          selectedSlide,
                          {
                            enabled:
                              !currentSlide.enabled,
                          }
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        currentSlide.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {currentSlide.enabled
                        ? "Enabled"
                        : "Disabled"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeSlide(
                          selectedSlide
                        )
                      }
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* DESKTOP IMAGE */}

                <div>
                  <label
                    htmlFor="hero-desktop-image"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Desktop Image URL
                  </label>

                  <input
                    id="hero-desktop-image"
                    type="text"
                    value={
                      currentSlide.desktopImage
                    }
                    onChange={(e) =>
                      updateSlide(
                        selectedSlide,
                        {
                          desktopImage:
                            e.target.value,
                        }
                      )
                    }
                    placeholder="https://example.com/hero-desktop.jpg"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* MOBILE IMAGE */}

                <div>
                  <label
                    htmlFor="hero-mobile-image"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Mobile Image URL
                  </label>

                  <input
                    id="hero-mobile-image"
                    type="text"
                    value={
                      currentSlide.mobileImage
                    }
                    onChange={(e) =>
                      updateSlide(
                        selectedSlide,
                        {
                          mobileImage:
                            e.target.value,
                        }
                      )
                    }
                    placeholder="https://example.com/hero-mobile.jpg"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* TITLE */}

                <div>
                  <label
                    htmlFor="hero-title"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Title
                  </label>

                  <input
                    id="hero-title"
                    type="text"
                    value={
                      currentSlide.title
                    }
                    onChange={(e) =>
                      updateSlide(
                        selectedSlide,
                        {
                          title:
                            e.target.value,
                        }
                      )
                    }
                    placeholder="New Season Collection"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* SUBTITLE */}

                <div>
                  <label
                    htmlFor="hero-subtitle"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Subtitle
                  </label>

                  <textarea
                    id="hero-subtitle"
                    rows={3}
                    value={
                      currentSlide.subtitle
                    }
                    onChange={(e) =>
                      updateSlide(
                        selectedSlide,
                        {
                          subtitle:
                            e.target.value,
                        }
                      )
                    }
                    placeholder="Discover premium styles made for you."
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* BUTTON */}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="hero-button-text"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Button Text
                    </label>

                    <input
                      id="hero-button-text"
                      type="text"
                      value={
                        currentSlide.buttonText
                      }
                      onChange={(e) =>
                        updateSlide(
                          selectedSlide,
                          {
                            buttonText:
                              e.target.value,
                          }
                        )
                      }
                      placeholder="Shop Now"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="hero-button-href"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Button Link
                    </label>

                    <input
                      id="hero-button-href"
                      type="text"
                      value={
                        currentSlide.buttonHref
                      }
                      onChange={(e) =>
                        updateSlide(
                          selectedSlide,
                          {
                            buttonHref:
                              e.target.value,
                          }
                        )
                      }
                      placeholder="/shop"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* PREVIEW */}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Desktop Preview
                  </p>

                  <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {currentSlide.desktopImage ? (
                      <img
                        src={
                          currentSlide.desktopImage
                        }
                        alt={
                          currentSlide.title ||
                          "Hero banner"
                        }
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : null}

                    <div className="relative z-10 max-w-lg p-8 text-center">
                      <h5 className="text-2xl font-bold text-gray-900">
                        {currentSlide.title ||
                          "Hero Title"}
                      </h5>

                      {currentSlide.subtitle && (
                        <p className="mt-2 text-sm text-gray-600">
                          {
                            currentSlide.subtitle
                          }
                        </p>
                      )}

                      {currentSlide.buttonText && (
                        <span className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white">
                          {
                            currentSlide.buttonText
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}