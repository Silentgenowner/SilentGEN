"use client";

import Link from "next/link";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type UserType = {
  name?: string;

  email?: string;

  mobile?: string;
};

type WishlistProduct = {
  _id?: string;

  id?: string;

  productId?: string;
};

type WishlistApiResponse = {
  success?: boolean;

  wishlist?: WishlistProduct[];

  products?: WishlistProduct[];

  items?: WishlistProduct[];

  count?: number;

  total?: number;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| ACCOUNT PAGE
|--------------------------------------------------------------------------
*/

export default function AccountPage() {
  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | USER
  |--------------------------------------------------------------------------
  */

  const [
    user,
    setUser,
  ] =
    useState<UserType>({});

  /*
  |--------------------------------------------------------------------------
  | ORDER COUNT
  |--------------------------------------------------------------------------
  */

  const [
    orders,
    setOrders,
  ] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | WISHLIST COUNT
  |--------------------------------------------------------------------------
  */

  const [
    wishlistCount,
    setWishlistCount,
  ] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadAccount();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD ACCOUNT
  |--------------------------------------------------------------------------
  */

  async function loadAccount() {
    try {
      setLoading(true);

      await Promise.all([
        loadProfile(),

        loadOrders(),

        loadWishlist(),
      ]);
    } catch (error) {
      console.error(
        "ACCOUNT LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD PROFILE
  |--------------------------------------------------------------------------
  */

  async function loadProfile() {
    try {
      const response =
        await fetch(
          "/api/user/profile",
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.success
      ) {
        setUser(
          data.user || {}
        );
      }
    } catch (error) {
      console.error(
        "PROFILE LOAD ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD ORDERS
  |--------------------------------------------------------------------------
  */

  async function loadOrders() {
    try {
      const response =
        await fetch(
          "/api/order/my-orders",
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.success
      ) {
        const orderList =
          Array.isArray(
            data.orders
          )
            ? data.orders
            : [];

        setOrders(
          orderList.length
        );
      }
    } catch (error) {
      console.error(
        "ORDERS LOAD ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD WISHLIST
  |--------------------------------------------------------------------------
  |
  | Account page now loads actual wishlist from API.
  |
  | Supports response shapes:
  |
  | { wishlist: [] }
  | { products: [] }
  | { items: [] }
  | { count: 2 }
  | { total: 2 }
  |
  |--------------------------------------------------------------------------
  */

  async function loadWishlist() {
    try {
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

      if (
        !response.ok ||
        !data?.success
      ) {
        setWishlistCount(
          0
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | DIRECT COUNT
      |--------------------------------------------------------------------------
      */

      if (
        typeof data.count ===
        "number"
      ) {
        setWishlistCount(
          data.count
        );

        return;
      }

      if (
        typeof data.total ===
        "number"
      ) {
        setWishlistCount(
          data.total
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | WISHLIST ARRAY
      |--------------------------------------------------------------------------
      */

      if (
        Array.isArray(
          data.wishlist
        )
      ) {
        setWishlistCount(
          data.wishlist.length
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PRODUCTS ARRAY
      |--------------------------------------------------------------------------
      */

      if (
        Array.isArray(
          data.products
        )
      ) {
        setWishlistCount(
          data.products.length
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | ITEMS ARRAY
      |--------------------------------------------------------------------------
      */

      if (
        Array.isArray(
          data.items
        )
      ) {
        setWishlistCount(
          data.items.length
        );

        return;
      }

      setWishlistCount(
        0
      );
    } catch (error) {
      console.error(
        "WISHLIST LOAD ERROR:",
        error
      );

      setWishlistCount(
        0
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  async function logout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method:
            "POST",

          credentials:
            "include",
        }
      );
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    } finally {
      router.push(
        "/login"
      );

      router.refresh();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="py-10">
        <div
          className="
            h-8
            w-64
            animate-pulse
            rounded-lg
            bg-gray-200
          "
        />

        <div
          className="
            mt-3
            h-4
            w-52
            animate-pulse
            rounded
            bg-gray-100
          "
        />

        <div
          className="
            mt-8
            grid
            grid-cols-1
            gap-6
            sm:grid-cols-2
          "
        >
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="
                  h-40
                  animate-pulse
                  rounded-3xl
                  bg-gray-100
                "
              />
            )
          )}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      {/*
      |--------------------------------------------------------------------------
      | WELCOME
      |--------------------------------------------------------------------------
      */}

      <h1
        className="
          mb-2
          text-3xl
          font-bold
        "
      >
        Welcome,{" "}
        {user.name ||
          "User"}
      </h1>

      <p
        className="
          mb-8
          text-gray-500
        "
      >
        Manage your
        SilentGEN account
      </p>

      {/*
      |--------------------------------------------------------------------------
      | ACCOUNT CARDS
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          grid
          grid-cols-1
          gap-6
          sm:grid-cols-2
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | ORDERS
        |--------------------------------------------------------------------------
        */}

        <Link
          href="/account/orders"
          className="
            group
            relative
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-gray-300
            hover:shadow-lg
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-gray-100
              transition
              group-hover:bg-black
              group-hover:text-white
            "
          >
            <Package
              size={25}
            />
          </div>

          <h2
            className="
              mt-4
              text-xl
              font-semibold
            "
          >
            My Orders
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            Track and manage
            your orders
          </p>

          <span
            className="
              absolute
              right-6
              top-6
              flex
              min-h-7
              min-w-7
              items-center
              justify-center
              rounded-full
              bg-black
              px-2
              text-xs
              font-bold
              text-white
            "
          >
            {orders}
          </span>
        </Link>

        {/*
        |--------------------------------------------------------------------------
        | ADDRESS
        |--------------------------------------------------------------------------
        */}

        <Link
          href="/account/address"
          className="
            group
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-gray-300
            hover:shadow-lg
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-gray-100
              transition
              group-hover:bg-black
              group-hover:text-white
            "
          >
            <MapPin
              size={25}
            />
          </div>

          <h2
            className="
              mt-4
              text-xl
              font-semibold
            "
          >
            My Addresses
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            Manage your
            delivery addresses
          </p>
        </Link>

        {/*
        |--------------------------------------------------------------------------
        | WISHLIST
        |--------------------------------------------------------------------------
        */}

        <Link
          href="/account/wishlist"
          className="
            group
            relative
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-gray-300
            hover:shadow-lg
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-red-50
              text-red-500
              transition
              group-hover:bg-red-500
              group-hover:text-white
            "
          >
            <Heart
              size={25}
            />
          </div>

          <h2
            className="
              mt-4
              text-xl
              font-semibold
            "
          >
            Wishlist
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            Your saved
            products
          </p>

          {/*
          |--------------------------------------------------------------------------
          | WISHLIST COUNT BADGE
          |--------------------------------------------------------------------------
          */}

          <span
            className="
              absolute
              right-6
              top-6
              flex
              min-h-7
              min-w-7
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-2
              text-xs
              font-bold
              text-white
            "
          >
            {
              wishlistCount
            }
          </span>
        </Link>

        {/*
        |--------------------------------------------------------------------------
        | PROFILE
        |--------------------------------------------------------------------------
        */}

        <Link
          href="/account/profile"
          className="
            group
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-gray-300
            hover:shadow-lg
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-gray-100
              transition
              group-hover:bg-black
              group-hover:text-white
            "
          >
            <User
              size={25}
            />
          </div>

          <h2
            className="
              mt-4
              text-xl
              font-semibold
            "
          >
            Profile
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            Update your
            personal details
          </p>
        </Link>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | ACCOUNT SUMMARY
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mt-10
          rounded-3xl
          border
          border-gray-200
          bg-white
          p-6
        "
      >
        <h2
          className="
            mb-4
            text-xl
            font-bold
          "
        >
          Account Summary
        </h2>

        <div
          className="
            grid
            grid-cols-2
            gap-4
          "
        >
          <Link
            href="/account/orders"
            className="
              rounded-2xl
              bg-gray-100
              p-5
              transition
              hover:bg-gray-200
            "
          >
            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Total Orders
            </p>

            <p
              className="
                mt-1
                text-3xl
                font-bold
              "
            >
              {orders}
            </p>
          </Link>

          <Link
            href="/account/wishlist"
            className="
              rounded-2xl
              bg-red-50
              p-5
              transition
              hover:bg-red-100
            "
          >
            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Wishlist Items
            </p>

            <p
              className="
                mt-1
                text-3xl
                font-bold
                text-red-500
              "
            >
              {
                wishlistCount
              }
            </p>
          </Link>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | LOGOUT
      |--------------------------------------------------------------------------
      */}

      <button
        type="button"
        onClick={
          logout
        }
        className="
          mt-8
          flex
          items-center
          gap-3
          rounded-full
          bg-black
          px-6
          py-3
          text-white
          transition
          hover:bg-gray-800
        "
      >
        <LogOut
          size={20}
        />

        Logout
      </button>
    </div>
  );
}