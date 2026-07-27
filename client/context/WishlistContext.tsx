"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp: number;
};

type WishlistContextType = {
  wishlist: WishlistItem[];

  addToWishlist: (
    item: WishlistItem
  ) => void;

  removeFromWishlist: (
    id: string
  ) => void;

  clearWishlist: () => void;

  isInWishlist: (
    id: string
  ) => boolean;

  totalItems: number;
};

const WishlistContext = createContext<
  WishlistContextType | undefined
>(undefined);

const STORAGE_KEY = "silentgen_wishlist";

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] =
    useState<WishlistItem[]>([]);

  useEffect(() => {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch {
        localStorage.removeItem(
          STORAGE_KEY
        );
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  const addToWishlist = (
    item: WishlistItem
  ) => {
    setWishlist((prev) => {
      const exists = prev.some(
        (product) =>
          product.id === item.id
      );

      if (exists) return prev;

      return [...prev, item];
    });
  };

  const removeFromWishlist = (
    id: string
  ) => {
    setWishlist((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const isInWishlist = (
    id: string
  ) => {
    return wishlist.some(
      (item) => item.id === id
    );
  };

  const totalItems = useMemo(() => {
    return wishlist.length;
  }, [wishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        totalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context =
    useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}
