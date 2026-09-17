"use client";

import { useEffect, useState } from "react";

type Props = {
  value?: string[];
  onChange: (images: string[]) => void;
};

export default function Product360Images({
  value = [],
  onChange,
}: Props) {
  const [images, setImages] = useState<string[]>(value);

  useEffect(() => {
    setImages(value);
  }, [value]);

  function removeImage(index: number) {
    const updated = images.filter(
      (_, imageIndex) => imageIndex !== index
    );

    setImages(updated);
    onChange(updated);
  }

  function moveImage(
    index: number,
    direction: "left" | "right"
  ) {
    const newIndex =
      direction === "left"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= images.length
    ) {
      return;
    }

    const updated = [...images];

    [
      updated[index],
      updated[newIndex],
    ] = [
      updated[newIndex],
      updated[index],
    ];

    setImages(updated);
    onChange(updated);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          360° Product View
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Upload multiple product angle images for
          interactive 360° viewing.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div className="text-3xl">
          ↻
        </div>

        <p className="mt-2 text-sm font-medium text-gray-700">
          360° images
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Minimum 4 images recommended
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Upload will be connected to your existing
          Cloudinary uploader in the next step.
        </p>
      </div>

      {images.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">
              360 Frames
            </h3>

            <span className="text-xs text-gray-500">
              {images.length} images
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="aspect-square">
                  <img
                    src={image}
                    alt={`360 frame ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeImage(index)
                  }
                  className="absolute right-1 top-1 hidden rounded bg-red-600 px-2 py-1 text-[10px] text-white group-hover:block"
                >
                  Delete
                </button>

                <div className="flex items-center justify-center gap-1 border-t bg-white p-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      moveImage(index, "left")
                    }
                    className="rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    disabled={
                      index === images.length - 1
                    }
                    onClick={() =>
                      moveImage(index, "right")
                    }
                    className="rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}