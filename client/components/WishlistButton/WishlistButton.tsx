"use client";

import { useWishlist } from "@/context/WishlistContext";

type Props = {
  id: number;
  name: string;
  price: number;
  image: string;
};

export default function WishlistButton({
  id,
  name,
  price,
  image,
}: Props) {

  const {
    wishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();


  const isWishlisted = wishlist.some(
    (item) => item.id === id
  );


  return (
    <button
      type="button"

      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isWishlisted) {
          removeFromWishlist(id);
        } else {
          addToWishlist({
            id,
            name,
            price,
            image,
          });
        }
      }}

      className="
        absolute
        top-3
        right-3
        z-20
        bg-white
        rounded-full
        w-11
        h-11
        flex
        items-center
        justify-center
        shadow-md
        text-2xl
        hover:scale-110
        transition
      "
    >
      {isWishlisted ? "❤️" : "🤍"}
    </button>
  );
}
