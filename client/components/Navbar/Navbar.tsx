"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

import {
  useCart,
} from "@/context/CartContext";

import {
  useWishlist,
} from "@/context/WishlistContext";

import LogoutButton from "@/components/LogoutButton/LogoutButton";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type LogoData = {
  url?: string;

  alt?: string;
};

type ProfileData = {
  name?: string;

  firstName?: string;

  email?: string;
};

type NavbarProduct = {
  _id?: string;

  name?: string;

  slug?: string;

  category?: string;

  subCategory?: string;

  gender?: string;

  discount?: number;

  newArrival?: boolean;

  bestSeller?: boolean;

  trending?: boolean;

  status?: string;
};

type ProductListResponse = {
  success?: boolean;

  products?: NavbarProduct[];

  message?: string;
};

type DynamicNavItem = {
  key: string;

  label: string;

  href: string;

  type:
    | "gender"
    | "category"
    | "special";

  highlight?: boolean;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

/*
|--------------------------------------------------------------------------
| NORMALIZE VALUE
|--------------------------------------------------------------------------
*/

function normalizeValue(
  value: unknown
): string {
  return cleanString(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}

/*
|--------------------------------------------------------------------------
| FORMAT NAV LABEL
|--------------------------------------------------------------------------
*/

function formatLabel(
  value: string
): string {
  const cleaned =
    cleanString(value);

  if (!cleaned) {
    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | SPECIAL LABELS
  |--------------------------------------------------------------------------
  */

  const normalized =
    normalizeValue(cleaned);

  const specialLabels: Record<
    string,
    string
  > = {
    tshirt:
      "T-Shirt",

    tshirts:
      "T-Shirts",

    tshirtmen:
      "T-Shirts",

    tshirtwomen:
      "T-Shirts",

    mens:
      "Men",

    womens:
      "Women",

    kids:
      "Kids",

    unisex:
      "Unisex",
  };

  if (
    specialLabels[
      normalized
    ]
  ) {
    return specialLabels[
      normalized
    ];
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL TITLE CASE
  |--------------------------------------------------------------------------
  */

  return cleaned
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) {
        return "";
      }

      return (
        word
          .charAt(0)
          .toUpperCase() +
        word
          .slice(1)
          .toLowerCase()
      );
    })
    .join(" ");
}

/*
|--------------------------------------------------------------------------
| UNIQUE STRING VALUES
|--------------------------------------------------------------------------
*/

function uniqueValues(
  values: unknown[]
): string[] {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const rawValue of values
  ) {
    const value =
      cleanString(
        rawValue
      );

    if (!value) {
      continue;
    }

    const key =
      normalizeValue(
        value
      );

    if (!key) {
      continue;
    }

    if (
      !map.has(key)
    ) {
      map.set(
        key,
        value
      );
    }
  }

  return Array.from(
    map.values()
  );
}

/*
|--------------------------------------------------------------------------
| URL
|--------------------------------------------------------------------------
*/

function buildShopUrl(
  key: string,
  value: string
) {
  return `/shop?${key}=${encodeURIComponent(
    value
  )}`;
}

/*
|--------------------------------------------------------------------------
| NAVBAR
|--------------------------------------------------------------------------
*/

export default function Navbar() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  /*
  |--------------------------------------------------------------------------
  | HYDRATION
  |--------------------------------------------------------------------------
  */

  const [
    mounted,
    setMounted,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | USER
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loggedIn,
    setLoggedIn,
  ] = useState(false);

  const [
    userName,
    setUserName,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | MOBILE MENU
  |--------------------------------------------------------------------------
  */

  const [
    mobileMenu,
    setMobileMenu,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOGO
  |--------------------------------------------------------------------------
  */

  const [
    logo,
    setLogo,
  ] =
    useState<LogoData | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT MENU
  |--------------------------------------------------------------------------
  */

  const [
    showAccountMenu,
    setShowAccountMenu,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | NAVBAR PRODUCTS
  |--------------------------------------------------------------------------
  */

  const [
    navbarProducts,
    setNavbarProducts,
  ] = useState<
    NavbarProduct[]
  >([]);

  const [
    navLoading,
    setNavLoading,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | CART
  |--------------------------------------------------------------------------
  */

  const {
    summary,
    refreshCart,
  } = useCart();

  const cartCount =
    summary?.totalItems || 0;

  /*
  |--------------------------------------------------------------------------
  | WISHLIST
  |--------------------------------------------------------------------------
  */

  const {
    totalItems:
      wishlistCount,
  } = useWishlist();

  /*
  |--------------------------------------------------------------------------
  | MOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD LOGO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadLogo();
  }, []);

  async function loadLogo() {
    try {
      const response =
        await fetch(
          "/api/homepage",
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      const homepage =
        data?.homepage ||
        data?.data ||
        data;

      const logoData =
        homepage?.logo;

      if (
        logoData &&
        typeof logoData ===
          "object" &&
        logoData.url
      ) {
        setLogo({
          url:
            String(
              logoData.url
            ),

          alt:
            String(
              logoData.alt ||
                "SilentGEN"
            ),
        });
      }
    } catch (error) {
      console.error(
        "NAVBAR LOGO ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS FOR DYNAMIC NAVIGATION
  |--------------------------------------------------------------------------
  |
  | Only active products are returned by /api/product/list.
  |
  | Therefore:
  |
  | No product = no menu option.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadNavbarProducts();
  }, []);

  async function loadNavbarProducts() {
    try {
      setNavLoading(true);

      const response =
        await fetch(
          "/api/product/list",
          {
            method:
              "GET",

            cache:
              "no-store",

            headers: {
              Accept:
                "application/json",
            },
          }
        );

      const data =
        (await response.json()) as
          ProductListResponse;

      if (
        !response.ok ||
        !data?.success
      ) {
        console.error(
          "NAVBAR PRODUCTS ERROR:",
          data?.message ||
            response.status
        );

        setNavbarProducts(
          []
        );

        return;
      }

      if (
        Array.isArray(
          data.products
        )
      ) {
        setNavbarProducts(
          data.products
        );

        return;
      }

      setNavbarProducts(
        []
      );
    } catch (error) {
      console.error(
        "NAVBAR PRODUCTS ERROR:",
        error
      );

      setNavbarProducts(
        []
      );
    } finally {
      setNavLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DYNAMIC GENDERS
  |--------------------------------------------------------------------------
  */

  const genders =
    useMemo(() => {
      const values =
        uniqueValues(
          navbarProducts.map(
            (product) =>
              product.gender
          )
        );

      /*
      |--------------------------------------------------------------------------
      | PREFERRED ORDER
      |--------------------------------------------------------------------------
      */

      const preferredOrder =
        [
          "men",
          "women",
          "kids",
          "unisex",
        ];

      return values.sort(
        (a, b) => {
          const aIndex =
            preferredOrder.indexOf(
              normalizeValue(a)
            );

          const bIndex =
            preferredOrder.indexOf(
              normalizeValue(b)
            );

          if (
            aIndex === -1 &&
            bIndex === -1
          ) {
            return a.localeCompare(
              b
            );
          }

          if (
            aIndex === -1
          ) {
            return 1;
          }

          if (
            bIndex === -1
          ) {
            return -1;
          }

          return (
            aIndex -
            bIndex
          );
        }
      );
    }, [navbarProducts]);

  /*
  |--------------------------------------------------------------------------
  | DYNAMIC CATEGORIES
  |--------------------------------------------------------------------------
  */

  const categories =
    useMemo(() => {
      return uniqueValues(
        navbarProducts.map(
          (product) =>
            product.category
        )
      );
    }, [navbarProducts]);

  /*
  |--------------------------------------------------------------------------
  | SPECIAL FILTER AVAILABILITY
  |--------------------------------------------------------------------------
  */

  const hasNewArrivals =
    useMemo(() => {
      return navbarProducts.some(
        (product) =>
          product.newArrival ===
          true
      );
    }, [navbarProducts]);

  const hasBestSellers =
    useMemo(() => {
      return navbarProducts.some(
        (product) =>
          product.bestSeller ===
          true
      );
    }, [navbarProducts]);

  const hasOffers =
    useMemo(() => {
      return navbarProducts.some(
        (product) =>
          Number(
            product.discount ??
              0
          ) > 0
      );
    }, [navbarProducts]);

  const hasTrending =
    useMemo(() => {
      return navbarProducts.some(
        (product) =>
          product.trending ===
          true
      );
    }, [navbarProducts]);

  /*
  |--------------------------------------------------------------------------
  | DYNAMIC NAV ITEMS
  |--------------------------------------------------------------------------
  */

  const dynamicNavItems =
    useMemo<
      DynamicNavItem[]
    >(() => {
      const items:
        DynamicNavItem[] =
        [];

      /*
      |--------------------------------------------------------------------------
      | GENDERS
      |--------------------------------------------------------------------------
      */

      for (
        const gender of genders
      ) {
        items.push({
          key:
            `gender-${normalizeValue(
              gender
            )}`,

          label:
            formatLabel(
              gender
            ),

          href:
            buildShopUrl(
              "gender",
              gender
            ),

          type:
            "gender",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CATEGORIES
      |--------------------------------------------------------------------------
      */

      for (
        const category of
          categories
      ) {
        items.push({
          key:
            `category-${normalizeValue(
              category
            )}`,

          label:
            formatLabel(
              category
            ),

          href:
            buildShopUrl(
              "category",
              category
            ),

          type:
            "category",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | NEW ARRIVALS
      |--------------------------------------------------------------------------
      */

      if (hasNewArrivals) {
        items.push({
          key:
            "new-arrivals",

          label:
            "New Arrivals",

          href:
            "/shop?newArrival=true",

          type:
            "special",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | BEST SELLERS
      |--------------------------------------------------------------------------
      */

      if (hasBestSellers) {
        items.push({
          key:
            "best-sellers",

          label:
            "Best Sellers",

          href:
            "/shop?bestSeller=true",

          type:
            "special",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | TRENDING
      |--------------------------------------------------------------------------
      */

      if (hasTrending) {
        items.push({
          key:
            "trending",

          label:
            "Trending",

          href:
            "/shop?trending=true",

          type:
            "special",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | OFFERS
      |--------------------------------------------------------------------------
      */

      if (hasOffers) {
        items.push({
          key:
            "offers",

          label:
            "Offers",

          href:
            "/shop?offer=true",

          type:
            "special",

          highlight:
            true,
        });
      }

      return items;
    }, [
      categories,
      genders,
      hasBestSellers,
      hasNewArrivals,
      hasOffers,
      hasTrending,
    ]);

  /*
  |--------------------------------------------------------------------------
  | LOGIN CHECK
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void checkLogin();

    const handleFocus =
      () => {
        void checkLogin();
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  async function checkLogin() {
    try {
      const response =
        await fetch(
          "/api/user/profile",
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        setLoggedIn(
          false
        );

        setUserName(
          ""
        );

        return;
      }

      const data =
        await response.json();

      if (data?.success) {
        setLoggedIn(
          true
        );

        const profile:
          ProfileData =
          data?.user || {};

        setUserName(
          profile.name ||
            profile.firstName ||
            "User"
        );

        try {
          await refreshCart();
        } catch {
          /*
          |--------------------------------------------------------------------------
          | Ignore navbar cart refresh error.
          |--------------------------------------------------------------------------
          */
        }
      } else {
        setLoggedIn(
          false
        );

        setUserName(
          ""
        );
      }
    } catch (error) {
      console.error(
        "NAVBAR LOGIN CHECK ERROR:",
        error
      );

      setLoggedIn(
        false
      );

      setUserName(
        ""
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  function handleSearch() {
    const value =
      search.trim();

    if (!value) {
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );

    setSearch("");

    setMobileMenu(
      false
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE MENUS ON ROUTE CHANGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMobileMenu(false);

    setShowAccountMenu(
      false
    );
  }, [pathname]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE LINK
  |--------------------------------------------------------------------------
  */

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return (
        pathname === "/"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  /*
  |--------------------------------------------------------------------------
  | HYDRATION
  |--------------------------------------------------------------------------
  */

  if (!mounted) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <header className="sticky top-0 z-50 w-full">
      {/*
      |--------------------------------------------------------------------------
      | MAIN HEADER
      |--------------------------------------------------------------------------
      */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[72px] items-center gap-5">
            {/*
            |--------------------------------------------------------------------------
            | LOGO
            |--------------------------------------------------------------------------
            */}

            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="SilentGEN Home"
            >
              {logo?.url ? (
                <img
                  src={
                    logo.url
                  }
                  alt={
                    logo.alt ||
                    "SilentGEN"
                  }
                  className="max-h-12 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <div className="text-2xl font-black tracking-[-0.04em] text-black sm:text-3xl">
                  SilentGEN
                </div>
              )}
            </Link>

            {/*
            |--------------------------------------------------------------------------
            | DESKTOP SEARCH
            |--------------------------------------------------------------------------
            */}

            <div className="hidden min-w-0 flex-1 md:flex">
              <div className="flex h-11 w-full overflow-hidden rounded-md border border-gray-300 bg-white focus-within:border-black">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/shop"
                    )
                  }
                  className="hidden items-center gap-1 border-r border-gray-300 bg-gray-50 px-4 text-sm text-gray-600 lg:flex"
                >
                  All

                  <ChevronDown
                    size={14}
                  />
                </button>

                <input
                  type="text"
                  value={search}
                  placeholder="Search SilentGEN"
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  className="min-w-0 flex-1 px-4 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={
                    handleSearch
                  }
                  className="flex w-14 shrink-0 items-center justify-center bg-[#6FA8DC] text-black transition hover:bg-[#5c97cf]"
                  aria-label="Search"
                >
                  <Search
                    size={22}
                  />
                </button>
              </div>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | ACCOUNT
            |--------------------------------------------------------------------------
            */}

            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() =>
                  setShowAccountMenu(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="flex items-center gap-2 px-2 py-1 text-left"
              >
                <User
                  size={24}
                  strokeWidth={
                    1.8
                  }
                />

                <div className="leading-tight">
                  <p className="text-[11px] text-gray-500">
                    Hello,
                    {loggedIn
                      ? ` ${userName}`
                      : " sign in"}
                  </p>

                  <p className="text-sm font-bold text-gray-900">
                    Account
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className="text-gray-500"
                />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  {loggedIn ? (
                    <>
                      <Link
                        href="/account"
                        className="block rounded-lg px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        My Account
                      </Link>

                      <Link
                        href="/account/profile"
                        className="block rounded-lg px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        My Profile
                      </Link>

                      <Link
                        href="/account/orders"
                        className="block rounded-lg px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        My Orders
                      </Link>

                      <Link
                        href="/account/address"
                        className="block rounded-lg px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        My Addresses
                      </Link>

                      <Link
                        href="/wishlist"
                        className="block rounded-lg px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        My Wishlist
                      </Link>

                      <div className="my-2 border-t border-gray-200" />

                      <div className="px-3 py-2">
                        <LogoutButton />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block rounded-lg bg-black px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        Sign In
                      </Link>

                      <p className="px-4 py-3 text-center text-xs text-gray-500">
                        New to
                        SilentGEN?
                      </p>

                      <Link
                        href="/register"
                        className="block rounded-lg px-4 py-2 text-center text-sm hover:bg-gray-100"
                      >
                        Create
                        Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/*
            |--------------------------------------------------------------------------
            | RETURNS / ORDERS
            |--------------------------------------------------------------------------
            */}

            <Link
              href="/account/orders"
              className="hidden leading-tight lg:block"
            >
              <p className="text-[11px] text-gray-500">
                Returns
              </p>

              <p className="text-sm font-bold text-gray-900">
                & Orders
              </p>
            </Link>

            {/*
            |--------------------------------------------------------------------------
            | WISHLIST
            |--------------------------------------------------------------------------
            */}

            <Link
              href="/wishlist"
              className="relative hidden shrink-0 lg:flex"
              aria-label="Wishlist"
            >
              <Heart
                size={25}
                strokeWidth={
                  1.8
                }
              />

              {wishlistCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {
                    wishlistCount
                  }
                </span>
              )}
            </Link>

            {/*
            |--------------------------------------------------------------------------
            | BAG
            |--------------------------------------------------------------------------
            */}

            <Link
              href="/cart"
              className="relative flex shrink-0 items-center gap-2"
              aria-label="Shopping Bag"
            >
              <ShoppingBag
                size={28}
                strokeWidth={
                  1.8
                }
              />

              {cartCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f3b61f] px-1 text-[10px] font-bold text-black">
                  {
                    cartCount
                  }
                </span>
              )}

              <span className="hidden text-sm font-bold lg:block">
                Bag
              </span>
            </Link>

            {/*
            |--------------------------------------------------------------------------
            | MOBILE MENU BUTTON
            |--------------------------------------------------------------------------
            */}

            <button
              type="button"
              onClick={() =>
                setMobileMenu(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="ml-auto rounded-lg p-2 lg:hidden"
              aria-label="Menu"
            >
              {mobileMenu ? (
                <X
                  size={27}
                />
              ) : (
                <Menu
                  size={27}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | DESKTOP DYNAMIC NAVIGATION
      |--------------------------------------------------------------------------
      */}

      <div className="hidden border-b border-gray-200 bg-white lg:block">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <nav className="flex min-h-[48px] items-center gap-7 overflow-x-auto whitespace-nowrap">
            {/*
            |--------------------------------------------------------------------------
            | HOME
            |--------------------------------------------------------------------------
            */}

            <Link
              href="/"
              className={`text-sm font-semibold ${
                isActive("/")
                  ? "border-b-2 border-black"
                  : ""
              }`}
            >
              Home
            </Link>

            {/*
            |--------------------------------------------------------------------------
            | SHOP
            |--------------------------------------------------------------------------
            */}

            <Link
              href="/shop"
              className={`text-sm font-semibold ${
                isActive(
                  "/shop"
                )
                  ? "border-b-2 border-black"
                  : ""
              }`}
            >
              Shop
            </Link>

            {/*
            |--------------------------------------------------------------------------
            | DYNAMIC ITEMS
            |--------------------------------------------------------------------------
            */}

            {!navLoading &&
              dynamicNavItems.map(
                (item) => (
                  <Link
                    key={
                      item.key
                    }
                    href={
                      item.href
                    }
                    className={`text-sm transition hover:text-gray-600 ${
                      item.highlight
                        ? "font-bold text-red-600 hover:text-red-500"
                        : "font-medium text-gray-900"
                    }`}
                  >
                    {
                      item.label
                    }
                  </Link>
                )
              )}
          </nav>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | MOBILE MENU
      |--------------------------------------------------------------------------
      */}

      {mobileMenu && (
        <div className="border-b border-gray-200 bg-white lg:hidden">
          <div className="space-y-4 p-4">
            {/*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */}

            <div className="flex h-11 overflow-hidden rounded-lg border border-gray-300">
              <input
                type="text"
                value={search}
                placeholder="Search SilentGEN"
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleSearch();
                  }
                }}
                className="min-w-0 flex-1 px-4 text-sm outline-none"
              />

              <button
                type="button"
                onClick={
                  handleSearch
                }
                className="flex w-12 items-center justify-center bg-[#6FA8DC]"
                aria-label="Search"
              >
                <Search
                  size={20}
                />
              </button>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | MAIN LINKS
            |--------------------------------------------------------------------------
            */}

            <div className="grid grid-cols-2 gap-2">
              <MobileLink
                href="/"
                label="Home"
                onClick={() =>
                  setMobileMenu(
                    false
                  )
                }
              />

              <MobileLink
                href="/shop"
                label="Shop"
                onClick={() =>
                  setMobileMenu(
                    false
                  )
                }
              />

              {/*
              |--------------------------------------------------------------------------
              | DYNAMIC MOBILE LINKS
              |--------------------------------------------------------------------------
              */}

              {!navLoading &&
                dynamicNavItems.map(
                  (item) => (
                    <MobileLink
                      key={
                        item.key
                      }
                      href={
                        item.href
                      }
                      label={
                        item.label
                      }
                      highlight={
                        item.highlight
                      }
                      onClick={() =>
                        setMobileMenu(
                          false
                        )
                      }
                    />
                  )
                )}
            </div>

            {/*
            |--------------------------------------------------------------------------
            | ACCOUNT LINKS
            |--------------------------------------------------------------------------
            */}

            <div className="border-t border-gray-200 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <MobileLink
                  href="/wishlist"
                  label={`Wishlist (${wishlistCount})`}
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                />

                <MobileLink
                  href="/cart"
                  label={`Bag (${cartCount})`}
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                />

                <MobileLink
                  href={
                    loggedIn
                      ? "/account"
                      : "/login"
                  }
                  label={
                    loggedIn
                      ? "My Account"
                      : "Sign In"
                  }
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                />

                <MobileLink
                  href="/account/orders"
                  label="My Orders"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                />

                <MobileLink
                  href="/account/address"
                  label="My Address"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                />

                <MobileLink
                  href="/help"
                  label="Help"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                />
              </div>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | LOGIN / LOGOUT
            |--------------------------------------------------------------------------
            */}

            <div className="border-t border-gray-200 pt-4">
              {loading ? (
                <div className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm text-gray-500">
                  Checking
                  account...
                </div>
              ) : loggedIn ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">
                      Signed in as
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {
                        userName
                      }
                    </p>
                  </div>

                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                  className="block rounded-lg bg-black px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Login / Sign
                  In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/*
|--------------------------------------------------------------------------
| MOBILE LINK
|--------------------------------------------------------------------------
*/

function MobileLink({
  href,

  label,

  onClick,

  highlight = false,
}: {
  href: string;

  label: string;

  onClick: () => void;

  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
        highlight
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}