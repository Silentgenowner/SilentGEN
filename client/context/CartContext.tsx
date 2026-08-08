"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type CartItem = {
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

type CartSummary = {
  totalItems: number;

  subtotal: number;

  shipping: number;

  grandTotal: number;
};

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
  ) => Promise<void>;

  removeFromCart: (
    productId: string,
    size: string,
    color: string
  ) => Promise<void>;

  clearCart: () => void;
};

const CartContext =
  createContext<CartContextType | null>(
    null
  );

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<
    CartItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [summary, setSummary] =
    useState<CartSummary>({
      totalItems: 0,
      subtotal: 0,
      shipping: 0,
      grandTotal: 0,
    });

  useEffect(() => {
    refreshCart();
  }, []);
// ===============================
// REFRESH CART
// ===============================

async function refreshCart() {
  try {
    setLoading(true);

    const res = await fetch(
      "/api/cart/list",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (res.status === 401) {
      setCart([]);

      setSummary({
        totalItems: 0,
        subtotal: 0,
        shipping: 0,
        grandTotal: 0,
      });

      return;
    }

    if (!data.success) {
      throw new Error(
        data.message ||
          "Failed to load cart"
      );
    }

    setCart(data.items || []);

    setSummary(
      data.summary || {
        totalItems: 0,
        subtotal: 0,
        shipping: 0,
        grandTotal: 0,
      }
    );
  } catch (error) {
    console.error(
      "REFRESH CART ERROR:",
      error
    );

    setCart([]);

    setSummary({
      totalItems: 0,
      subtotal: 0,
      shipping: 0,
      grandTotal: 0,
    });
  } finally {
    setLoading(false);
  }
}
// ===============================
// ADD TO CART
// ===============================

async function addToCart(
  productId: string,
  quantity = 1,
  size = "",
  color = ""
): Promise<boolean> {
  try {
    const res = await fetch(
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
          size,
          color,
        }),
      }
    );

    if (res.status === 401) {
      return false;
    }

    const data = await res.json();

    if (!data.success) {
      alert(
        data.message ||
          "Unable to add product"
      );

      return true;
    }

    await refreshCart();

    return true;
  } catch (error) {
    console.error(
      "ADD TO CART ERROR:",
      error
    );

    alert("Something went wrong.");

    return true;
  }
}
// ===============================
// UPDATE QUANTITY
// ===============================

async function updateQuantity(
  productId: string,
  size: string,
  color: string,
  action: "increase" | "decrease"
): Promise<void> {
  try {
    const res = await fetch(
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
          size,
          color,
          action,
        }),
      }
    );

    if (res.status === 401) {
      return;
    }

    const data = await res.json();

    if (!data.success) {
      alert(
        data.message ||
          "Unable to update cart"
      );

      return;
    }

    await refreshCart();
  } catch (error) {
    console.error(
      "UPDATE CART ERROR:",
      error
    );

    alert("Something went wrong.");
  }
}
// ===============================
// REMOVE FROM CART
// ===============================

async function removeFromCart(
  productId: string,
  size: string,
  color: string
): Promise<void> {
  try {
    const res = await fetch(
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
          size,
          color,
        }),
      }
    );

    if (res.status === 401) {
      return;
    }

    const data = await res.json();

    if (!data.success) {
      alert(
        data.message ||
          "Unable to remove item"
      );

      return;
    }

    await refreshCart();
  } catch (error) {
    console.error(
      "REMOVE CART ERROR:",
      error
    );

    alert("Something went wrong.");
  }
}

// ===============================
// CLEAR CART
// ===============================

function clearCart() {
  setCart([]);

  setSummary({
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    grandTotal: 0,
  });
}
  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        summary,

        refreshCart,

        addToCart,

        updateQuantity,

        removeFromCart,

        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
