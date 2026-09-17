"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/*
|--------------------------------------------------------------------------
| CART ITEM
|--------------------------------------------------------------------------
*/

export type CartItem = {
  productId: any;

  sku: string;

  name: string;

  brand: string;

  category: string;

  image: string;

  price: number;

  stock: number;

  status: string;

  quantity: number;

  size: string;

  color: string;
};

/*
|--------------------------------------------------------------------------
| CART SUMMARY
|--------------------------------------------------------------------------
*/

export type CartSummary = {
  totalItems: number;

  subtotal: number;

  shipping: number;

  grandTotal: number;
};

/*
|--------------------------------------------------------------------------
| DEFAULT SUMMARY
|--------------------------------------------------------------------------
*/

const EMPTY_SUMMARY: CartSummary = {
  totalItems: 0,
  subtotal: 0,
  shipping: 0,
  grandTotal: 0,
};

/*
|--------------------------------------------------------------------------
| CART CONTEXT TYPE
|--------------------------------------------------------------------------
*/

type CartContextType = {
  cart: CartItem[];

  loading: boolean;

  summary: CartSummary;

  refreshCart: () => Promise<void>;

  addToCart: (
    productId: string,
    quantity?: number,
    size?: string,
    color?: string
  ) => Promise<boolean>;

  updateQuantity: (
    productId: string,
    size: string,
    color: string,
    action: "increase" | "decrease"
  ) => Promise<boolean>;

  removeFromCart: (
    productId: string,
    size: string,
    color: string
  ) => Promise<boolean>;

  clearCart: () => void;
};

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

const CartContext =
  createContext<CartContextType | null>(null);

/*
|--------------------------------------------------------------------------
| SAFE PRODUCT ID
|--------------------------------------------------------------------------
*/

function getProductId(
  productId: unknown
): string {
  if (typeof productId === "string") {
    return productId;
  }

  if (
    productId &&
    typeof productId === "object" &&
    "_id" in productId
  ) {
    return String(
      (
        productId as {
          _id: unknown;
        }
      )._id
    );
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CART ITEM
|--------------------------------------------------------------------------
*/

function normalizeCartItem(
  item: any
): CartItem {
  return {
    productId: item?.productId ?? "",

    sku:
      typeof item?.sku === "string"
        ? item.sku
        : "",

    name:
      typeof item?.name === "string"
        ? item.name
        : "",

    brand:
      typeof item?.brand === "string"
        ? item.brand
        : "",

    category:
      typeof item?.category === "string"
        ? item.category
        : "",

    image:
      typeof item?.image === "string"
        ? item.image
        : "",

    price:
      Number(item?.price) || 0,

    stock:
      Number(item?.stock) || 0,

    status:
      typeof item?.status === "string"
        ? item.status
        : "",

    quantity:
      Math.max(
        1,
        Number(item?.quantity) || 1
      ),

    size:
      typeof item?.size === "string"
        ? item.size
        : "",

    color:
      typeof item?.color === "string"
        ? item.color
        : "",
  };
}

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
  |--------------------------------------------------------------------------
  | CART
  |--------------------------------------------------------------------------
  */

  const [cart, setCart] = useState<
    CartItem[]
  >([]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState<boolean>(true);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const [summary, setSummary] =
    useState<CartSummary>(
      EMPTY_SUMMARY
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL CART LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void refreshCart();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | REFRESH CART
  |--------------------------------------------------------------------------
  */

  async function refreshCart(): Promise<void> {
    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/cart/list",
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          }
        );

      /*
      |--------------------------------------------------------------------------
      | NOT LOGGED IN
      |--------------------------------------------------------------------------
      */

      if (response.status === 401) {
        setCart([]);

        setSummary(
          EMPTY_SUMMARY
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      const data =
        await response.json();

      /*
      |--------------------------------------------------------------------------
      | API ERROR
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Failed to load cart."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CART ITEMS
      |--------------------------------------------------------------------------
      */

      const items =
        Array.isArray(
          data?.items
        )
          ? data.items.map(
              normalizeCartItem
            )
          : [];

      setCart(items);

      /*
      |--------------------------------------------------------------------------
      | SUMMARY
      |--------------------------------------------------------------------------
      */

      const apiSummary =
        data?.summary;

      if (
        apiSummary &&
        typeof apiSummary ===
          "object"
      ) {
        setSummary({
          totalItems:
            Number(
              apiSummary.totalItems
            ) || 0,

          subtotal:
            Number(
              apiSummary.subtotal
            ) || 0,

          shipping:
            Number(
              apiSummary.shipping
            ) || 0,

          grandTotal:
            Number(
              apiSummary.grandTotal
            ) || 0,
        });
      } else {
        /*
        |--------------------------------------------------------------------------
        | FALLBACK SUMMARY
        |--------------------------------------------------------------------------
        */

        const calculatedSummary =
          calculateSummary(items);

        setSummary(
          calculatedSummary
        );
      }
    } catch (error) {
      console.error(
        "REFRESH CART ERROR:",
        error
      );

      setCart([]);

      setSummary(
        EMPTY_SUMMARY
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  async function addToCart(
    productId: string,
    quantity = 1,
    size = "",
    color = ""
  ): Promise<boolean> {
    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!productId) {
      alert(
        "Product ID is required."
      );

      return false;
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      alert(
        "Invalid quantity."
      );

      return false;
    }

    try {
      const response =
        await fetch(
          "/api/cart/add",
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId,

              quantity,

              size:
                typeof size ===
                "string"
                  ? size.trim()
                  : "",

              color:
                typeof color ===
                "string"
                  ? color.trim()
                  : "",
            }),
          }
        );

      /*
      |--------------------------------------------------------------------------
      | LOGIN REQUIRED
      |--------------------------------------------------------------------------
      */

      if (
        response.status ===
        401
      ) {
        return false;
      }

      const data =
        await response.json();

      /*
      |--------------------------------------------------------------------------
      | API FAILURE
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !data?.success
      ) {
        alert(
          data?.message ||
            "Unable to add product to cart."
        );

        return false;
      }

      /*
      |--------------------------------------------------------------------------
      | REFRESH CART
      |--------------------------------------------------------------------------
      */

      await refreshCart();

      return true;
    } catch (error) {
      console.error(
        "ADD TO CART ERROR:",
        error
      );

      alert(
        "Something went wrong while adding the product."
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE QUANTITY
  |--------------------------------------------------------------------------
  */

  async function updateQuantity(
    productId: string,
    size: string,
    color: string,
    action:
      | "increase"
      | "decrease"
  ): Promise<boolean> {
    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!productId) {
      alert(
        "Product ID is required."
      );

      return false;
    }

    if (
      action !== "increase" &&
      action !== "decrease"
    ) {
      alert(
        "Invalid cart action."
      );

      return false;
    }

    try {
      const response =
        await fetch(
          "/api/cart/update",
          {
            method: "PATCH",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId,

              size:
                typeof size ===
                "string"
                  ? size.trim()
                  : "",

              color:
                typeof color ===
                "string"
                  ? color.trim()
                  : "",

              action,
            }),
          }
        );

      /*
      |--------------------------------------------------------------------------
      | LOGIN REQUIRED
      |--------------------------------------------------------------------------
      */

      if (
        response.status ===
        401
      ) {
        return false;
      }

      const data =
        await response.json();

      /*
      |--------------------------------------------------------------------------
      | API FAILURE
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !data?.success
      ) {
        alert(
          data?.message ||
            "Unable to update cart."
        );

        return false;
      }

      /*
      |--------------------------------------------------------------------------
      | REFRESH
      |--------------------------------------------------------------------------
      */

      await refreshCart();

      return true;
    } catch (error) {
      console.error(
        "UPDATE CART ERROR:",
        error
      );

      alert(
        "Something went wrong while updating the cart."
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE FROM CART
  |--------------------------------------------------------------------------
  */

  async function removeFromCart(
    productId: string,
    size: string,
    color: string
  ): Promise<boolean> {
    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!productId) {
      alert(
        "Product ID is required."
      );

      return false;
    }

    try {
      const response =
        await fetch(
          "/api/cart/remove",
          {
            method: "DELETE",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId,

              size:
                typeof size ===
                "string"
                  ? size.trim()
                  : "",

              color:
                typeof color ===
                "string"
                  ? color.trim()
                  : "",
            }),
          }
        );

      /*
      |--------------------------------------------------------------------------
      | LOGIN REQUIRED
      |--------------------------------------------------------------------------
      */

      if (
        response.status ===
        401
      ) {
        return false;
      }

      const data =
        await response.json();

      /*
      |--------------------------------------------------------------------------
      | API FAILURE
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !data?.success
      ) {
        alert(
          data?.message ||
            "Unable to remove item from cart."
        );

        return false;
      }

      /*
      |--------------------------------------------------------------------------
      | REFRESH
      |--------------------------------------------------------------------------
      */

      await refreshCart();

      return true;
    } catch (error) {
      console.error(
        "REMOVE CART ERROR:",
        error
      );

      alert(
        "Something went wrong while removing the item."
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLEAR CART
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This clears local context state.
  | It does NOT call an API because your current
  | Cart API structure does not expose a clear endpoint.
  |
  |--------------------------------------------------------------------------
  */

  function clearCart(): void {
    setCart([]);

    setSummary(
      EMPTY_SUMMARY
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const contextValue =
    useMemo<CartContextType>(
      () => ({
        cart,

        loading,

        summary,

        refreshCart,

        addToCart,

        updateQuantity,

        removeFromCart,

        clearCart,
      }),
      [
        cart,
        loading,
        summary,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return (
    <CartContext.Provider
      value={contextValue}
    >
      {children}
    </CartContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| USE CART
|--------------------------------------------------------------------------
*/

export function useCart(): CartContextType {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}

/*
|--------------------------------------------------------------------------
| CALCULATE SUMMARY
|--------------------------------------------------------------------------
*/

function calculateSummary(
  items: CartItem[]
): CartSummary {
  const totalItems =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        Math.max(
          0,
          Number(
            item.quantity
          ) || 0
        ),
      0
    );

  const subtotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(
            item.price
          ) || 0
        ) *
          Math.max(
            0,
            Number(
              item.quantity
            ) || 0
          ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | SHIPPING
  |--------------------------------------------------------------------------
  |
  | Server API summary remains authoritative.
  | This fallback only provides a safe local calculation.
  |
  |--------------------------------------------------------------------------
  */

  const shipping =
    subtotal > 0
      ? 0
      : 0;

  const grandTotal =
    subtotal +
    shipping;

  return {
    totalItems,

    subtotal,

    shipping,

    grandTotal,
  };
}

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
|
| This is intentionally kept available for future Cart UI
| and prevents productId comparison problems when API returns
| populated product objects.
|
|--------------------------------------------------------------------------
*/

export function isSameCartVariant(
  item: CartItem,
  productId: string,
  size: string,
  color: string
): boolean {
  return (
    getProductId(
      item.productId
    ) === productId &&
    (item.size || "") ===
      (size || "") &&
    (item.color || "") ===
      (color || "")
  );
}