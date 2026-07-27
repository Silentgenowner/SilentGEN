"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  thumbnail?: string;
  name: string;
};

export default function ProductGallery({
  images,
  thumbnail,
  name,
}: Props) {
  const gallery =
    images?.length > 0
      ? images
      : thumbnail
      ? [thumbnail]
      : ["/images/no-image.png"];

  const [selected, setSelected] = useState(gallery[0]);

  return (
    <div className="space-y-4">

      <div className="relative aspect-square overflow-hidden rounded-xl border bg-gray-100">

        <Image
          src={selected}
          alt={name}
          fill
          priority
          className="object-cover transition duration-300 hover:scale-110"
          sizes="(max-width:768px)100vw,50vw"
        />

      </div>

      <div className="grid grid-cols-5 gap-3">

        {gallery.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelected(image)}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
              selected === image
                ? "border-black"
                : "border-gray-200"
            }`}
          >
            <Image
              src={image}
              alt={`${name} ${index + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />
          </button>
        ))}

      </div>

    </div>
  );
}
