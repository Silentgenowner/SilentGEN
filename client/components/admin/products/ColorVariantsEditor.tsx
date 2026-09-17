"use client";

import { Plus, Trash2 } from "lucide-react";

export type ColorVariant = {
  color: string;
  images: string[];
};

type ColorVariantsEditorProps = {
  colorVariants: ColorVariant[];
  saving: boolean;

  addColorVariant: () => void;

  removeColorVariant: (
    colorIndex: number
  ) => void;

  updateColorName: (
    colorIndex: number,
    value: string
  ) => void;

  addColorImage: (
    colorIndex: number
  ) => void;

  removeColorImage: (
    colorIndex: number,
    imageIndex: number
  ) => void;

  updateColorImage: (
    colorIndex: number,
    imageIndex: number,
    value: string
  ) => void;
};

export default function ColorVariantsEditor({
  colorVariants,
  saving,
  addColorVariant,
  removeColorVariant,
  updateColorName,
  addColorImage,
  removeColorImage,
  updateColorImage,
}: ColorVariantsEditorProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Color-wise Product Images
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Add separate product images for each color.
          </p>
        </div>

        <button
          type="button"
          onClick={addColorVariant}
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-black px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Plus size={15} />

          Add Color
        </button>
      </div>

      {/* EMPTY STATE */}
      {colorVariants.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm font-semibold text-gray-700">
            No color variants added
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Add colors like Black, White, Navy Blue, etc.
          </p>

          <button
            type="button"
            onClick={addColorVariant}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />

            Add First Color
          </button>
        </div>
      )}

      {/* COLOR LIST */}
      {colorVariants.length > 0 && (
        <div className="mt-5 space-y-5">
          {colorVariants.map(
            (variant, colorIndex) => (
              <div
                key={colorIndex}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                {/* COLOR HEADER */}
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`color-${colorIndex}`}
                      className="mb-2 block text-xs font-semibold text-gray-700"
                    >
                      Color Name
                    </label>

                    <input
                      id={`color-${colorIndex}`}
                      type="text"
                      value={variant.color}
                      onChange={(event) =>
                        updateColorName(
                          colorIndex,
                          event.target.value
                        )
                      }
                      placeholder="Example: Black"
                      autoComplete="off"
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeColorVariant(
                        colorIndex
                      )
                    }
                    disabled={saving}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Remove ${
                      variant.color || "color"
                    }`}
                    title="Remove color"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* IMAGES HEADER */}
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Product Images
                      </p>

                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Add one or more image URLs for this color.
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-500">
                      {variant.images.length}{" "}
                      {variant.images.length === 1
                        ? "image"
                        : "images"}
                    </span>
                  </div>
                </div>

                {/* IMAGE LIST */}
                <div className="mt-3 space-y-2">
                  {variant.images.map(
                    (image, imageIndex) => (
                      <div
                        key={imageIndex}
                        className="flex items-center gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <input
                            type="url"
                            value={image}
                            onChange={(event) =>
                              updateColorImage(
                                colorIndex,
                                imageIndex,
                                event.target.value
                              )
                            }
                            placeholder={`Image ${
                              imageIndex + 1
                            } URL`}
                            autoComplete="off"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeColorImage(
                              colorIndex,
                              imageIndex
                            )
                          }
                          disabled={
                            saving ||
                            variant.images.length <= 1
                          }
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`Remove image ${
                            imageIndex + 1
                          }`}
                          title="Remove image"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* ADD IMAGE */}
                <button
                  type="button"
                  onClick={() =>
                    addColorImage(colorIndex)
                  }
                  disabled={saving}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} />

                  Add Image
                </button>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}