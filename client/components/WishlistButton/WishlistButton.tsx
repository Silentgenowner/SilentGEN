"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";

type Props = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp: number;
};

export default function WishlistButton({
  id,
  name,
  slug,
  image,
  price,
  mrp,
}: Props) {
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const wishlisted = isInWishlist(id);

  function handleClick(
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (wishlisted) {
      removeFromWishlist(id);
      return;
    }

    addToWishlist({
      id,
      name,
      slug,
      image,
      price,
      mrp,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        wishlisted
          ? "Remove from Wishlist"
          : "Add to Wishlist"
      }
      className="
        absolute
        top-3
        right-3
        z-20
        flex
        items-center
        justify-center
        w-10
        h-10
        rounded-full
        bg-white
        shadow-lg
        hover:scale-110
        transition-all
      "
    >
      <Heart
        size={20}
        className={
          wishlisted
            ? "fill-red-500 text-red-500"
            : "text-gray-600"
        }
      />
    </button>
  );
}
