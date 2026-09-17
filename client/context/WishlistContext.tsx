"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type WishlistItem = {
  id: string;

  name: string;

  slug: string;

  image: string;

  price: number;

  mrp: number;

  stock?: number;
};

type WishlistContextType = {
  wishlist: WishlistItem[];

  loading: boolean;

  addToWishlist: (
    item: WishlistItem
  ) => Promise<boolean>;

  removeFromWishlist: (
    id: string
  ) => Promise<boolean>;

  clearWishlist: () => Promise<void>;

  isInWishlist: (
    id: string
  ) => boolean;

  totalItems: number;

  refreshWishlist: () => Promise<void>;
};

type ApiWishlistProduct = {
  _id?: string;

  id?: string;

  name?: string;

  slug?: string;

  thumbnail?: string;

  image?: string;

  price?: number;

  mrp?: number;

  stock?: number;

  status?: string;

  isDeleted?: boolean;
};

type WishlistApiResponse = {
  success?: boolean;

  wishlist?: ApiWishlistProduct[];

  message?: string;
};

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

const WishlistContext =
  createContext<
    WishlistContextType | undefined
  >(undefined);

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT
|--------------------------------------------------------------------------
*/

function normalizeWishlistProduct(
  product: ApiWishlistProduct
): WishlistItem | null {
  const id =
    typeof product?._id ===
    "string"
      ? product._id
      : typeof product?.id ===
          "string"
        ? product.id
        : "";

  if (!id) {
    return null;
  }

  return {
    id,

    name:
      typeof product?.name ===
      "string"
        ? product.name
        : "Product",

    slug:
      typeof product?.slug ===
      "string"
        ? product.slug
        : "",

    image:
      typeof product?.thumbnail ===
        "string" &&
      product.thumbnail
        ? product.thumbnail
        : typeof product?.image ===
              "string" &&
            product.image
          ? product.image
          : "/images/no-image.png",

    price:
      Number(
        product?.price || 0
      ),

    mrp:
      Number(
        product?.mrp ||
          product?.price ||
          0
      ),

    stock:
      Number(
        product?.stock || 0
      ),
  };
}

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    wishlist,
    setWishlist,
  ] =
    useState<WishlistItem[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | FETCH SERVER WISHLIST
  |--------------------------------------------------------------------------
  */

  const refreshWishlist =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              "/api/wishlist",
              {
                method:
                  "GET",

                cache:
                  "no-store",

                credentials:
                  "include",
              }
            );

          const data:
            WishlistApiResponse =
              await response.json();

          /*
          |--------------------------------------------------------------------------
          | NOT LOGGED IN
          |--------------------------------------------------------------------------
          */

          if (
            response.status ===
            401
          ) {
            setWishlist([]);

            return;
          }

          if (
            !response.ok ||
            !data?.success
          ) {
            console.error(
              "WISHLIST LOAD ERROR:",
              data?.message
            );

            return;
          }

          const products =
            Array.isArray(
              data.wishlist
            )
              ? data.wishlist
              : [];

          const normalized =
            products
              .map(
                normalizeWishlistProduct
              )
              .filter(
                (
                  item
                ): item is WishlistItem =>
                  Boolean(item)
              );

          setWishlist(
            normalized
          );
        } catch (error) {
          console.error(
            "WISHLIST LOAD ERROR:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void refreshWishlist();
  }, [refreshWishlist]);

  /*
  |--------------------------------------------------------------------------
  | ADD TO WISHLIST
  |--------------------------------------------------------------------------
  */

  async function addToWishlist(
    item: WishlistItem
  ): Promise<boolean> {
    /*
    |--------------------------------------------------------------------------
    | ALREADY EXISTS
    |--------------------------------------------------------------------------
    */

    const exists =
      wishlist.some(
        (product) =>
          product.id ===
          item.id
      );

    if (exists) {
      return true;
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIMISTIC UI
    |--------------------------------------------------------------------------
    */

    setWishlist(
      (previous) => [
        ...previous,

        item,
      ]
    );

    try {
      const response =
        await fetch(
          "/api/wishlist",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                productId:
                  item.id,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        /*
        |--------------------------------------------------------------------------
        | ROLLBACK
        |--------------------------------------------------------------------------
        */

        setWishlist(
          (previous) =>
            previous.filter(
              (product) =>
                product.id !==
                item.id
            )
        );

        if (
          response.status ===
          401
        ) {
          return false;
        }

        console.error(
          "WISHLIST ADD ERROR:",
          data?.message
        );

        return false;
      }

      /*
      |--------------------------------------------------------------------------
      | SYNC SERVER STATE
      |--------------------------------------------------------------------------
      */

      await refreshWishlist();

      return true;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | ROLLBACK
      |--------------------------------------------------------------------------
      */

      setWishlist(
        (previous) =>
          previous.filter(
            (product) =>
              product.id !==
              item.id
          )
      );

      console.error(
        "WISHLIST ADD ERROR:",
        error
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE FROM WISHLIST
  |--------------------------------------------------------------------------
  */

  async function removeFromWishlist(
    id: string
  ): Promise<boolean> {
    const existing =
      wishlist.find(
        (item) =>
          item.id === id
      );

    /*
    |--------------------------------------------------------------------------
    | OPTIMISTIC UI
    |--------------------------------------------------------------------------
    */

    setWishlist(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );

    try {
      const response =
        await fetch(
          "/api/wishlist",
          {
            method:
              "DELETE",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                productId:
                  id,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        /*
        |--------------------------------------------------------------------------
        | ROLLBACK
        |--------------------------------------------------------------------------
        */

        if (existing) {
          setWishlist(
            (previous) => {
              const exists =
                previous.some(
                  (item) =>
                    item.id ===
                    existing.id
                );

              if (exists) {
                return previous;
              }

              return [
                ...previous,

                existing,
              ];
            }
          );
        }

        console.error(
          "WISHLIST REMOVE ERROR:",
          data?.message
        );

        return false;
      }

      await refreshWishlist();

      return true;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | ROLLBACK
      |--------------------------------------------------------------------------
      */

      if (existing) {
        setWishlist(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  item.id ===
                  existing.id
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,

              existing,
            ];
          }
        );
      }

      console.error(
        "WISHLIST REMOVE ERROR:",
        error
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLEAR WISHLIST
  |--------------------------------------------------------------------------
  |
  | Current API does not have one "clear all" endpoint.
  | So remove products one-by-one.
  |--------------------------------------------------------------------------
  */

  async function clearWishlist() {
    const currentItems = [
      ...wishlist,
    ];

    setWishlist([]);

    try {
      await Promise.all(
        currentItems.map(
          async (item) => {
            await fetch(
              "/api/wishlist",
              {
                method:
                  "DELETE",

                credentials:
                  "include",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    productId:
                      item.id,
                  }),
              }
            );
          }
        )
      );

      await refreshWishlist();
    } catch (error) {
      console.error(
        "CLEAR WISHLIST ERROR:",
        error
      );

      await refreshWishlist();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | IS IN WISHLIST
  |--------------------------------------------------------------------------
  */

  function isInWishlist(
    id: string
  ) {
    return wishlist.some(
      (item) =>
        item.id === id
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TOTAL ITEMS
  |--------------------------------------------------------------------------
  */

  const totalItems =
    useMemo(
      () =>
        wishlist.length,
      [wishlist]
    );

  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return (
    <WishlistContext.Provider
      value={{
        wishlist,

        loading,

        addToWishlist,

        removeFromWishlist,

        clearWishlist,

        isInWishlist,

        totalItems,

        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useWishlist() {
  const context =
    useContext(
      WishlistContext
    );

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}