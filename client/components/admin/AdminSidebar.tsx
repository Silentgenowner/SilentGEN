"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  TicketPercent,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| ADMIN ROLE
|--------------------------------------------------------------------------
*/

type AdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

/*
|--------------------------------------------------------------------------
| MENU ITEM
|--------------------------------------------------------------------------
*/

type MenuItem = {
  title: string;

  href?: string;

  icon?: LucideIcon;

  allowedRoles:
    AdminRole[];

  children?:
    MenuItem[];
};

/*
|--------------------------------------------------------------------------
| CURRENT ADMIN
|--------------------------------------------------------------------------
*/

type CurrentAdmin = {
  id: string;

  name: string;

  email: string;

  role: AdminRole;

  isActive: boolean;
};

/*
|--------------------------------------------------------------------------
| CURRENT ADMIN RESPONSE
|--------------------------------------------------------------------------
*/

type CurrentAdminResponse = {
  success: boolean;

  admin?: CurrentAdmin;
};

/*
|--------------------------------------------------------------------------
| ROLE LABELS
|--------------------------------------------------------------------------
*/

const roleLabels: Record<
  AdminRole,
  string
> = {
  super_admin:
    "Super Admin",

  product_manager:
    "Product Manager",

  order_manager:
    "Order Manager",

  support_admin:
    "Support Admin",

  finance_manager:
    "Finance Manager",
};

/*
|--------------------------------------------------------------------------
| ADMIN MENU
|--------------------------------------------------------------------------
*/

const menuItems: MenuItem[] = [
  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Dashboard",

    href:
      "/admin",

    icon:
      LayoutDashboard,

    allowedRoles: [
      "super_admin",

      "product_manager",

      "order_manager",

      "support_admin",

      "finance_manager",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | HOMEPAGE
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Homepage",

    href:
      "/admin/homepage",

    icon:
      Home,

    allowedRoles: [
      "super_admin",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Products",

    href:
      "/admin/products",

    icon:
      Package,

    allowedRoles: [
      "super_admin",

      "product_manager",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | ORDERS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Orders",

    href:
      "/admin/orders",

    icon:
      ShoppingCart,

    allowedRoles: [
      "super_admin",

      "order_manager",

      "support_admin",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | CUSTOMERS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Customers",

    href:
      "/admin/customers",

    icon:
      Users,

    allowedRoles: [
      "super_admin",

      "support_admin",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | COUPONS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Coupons",

    href:
      "/admin/coupons",

    icon:
      TicketPercent,

    allowedRoles: [
      "super_admin",

      "finance_manager",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | REPORTS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Reports",

    href:
      "/admin/reports",

    icon:
      BarChart3,

    allowedRoles: [
      "super_admin",

      "finance_manager",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | CONTENT MANAGEMENT
  |--------------------------------------------------------------------------
  |
  | Help & Support
  | Policies
  | FAQ
  | Contact Us
  | WhatsApp
  |
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Content Management",

    href:
      "/admin/content",

    icon:
      FileText,

    allowedRoles: [
      "super_admin",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | SETTINGS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Settings",

    href:
      "/admin/settings",

    icon:
      Settings,

    allowedRoles: [
      "super_admin",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | ADMINS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Admins",

    href:
      "/admin/admins",

    icon:
      UserCog,

    allowedRoles: [
      "super_admin",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | ACCOUNTS
  |--------------------------------------------------------------------------
  */

  {
    title:
      "Accounts",

    icon:
      Wallet,

    allowedRoles: [
      "super_admin",

      "finance_manager",
    ],

    children: [
      /*
      |--------------------------------------------------------------------------
      | ACCOUNTS DASHBOARD
      |--------------------------------------------------------------------------
      */

      {
        title:
          "Dashboard",

        href:
          "/admin/accounts",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | GST REPORTS
      |--------------------------------------------------------------------------
      */

      {
        title:
          "GST Reports",

        href:
          "/admin/accounts/gst",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | LEDGER
      |--------------------------------------------------------------------------
      */

      {
        title:
          "Ledger",

        href:
          "/admin/accounts/ledger",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | SALES INVOICE
      |--------------------------------------------------------------------------
      */

      {
        title:
          "Sales Invoice",

        href:
          "/admin/accounts/sales-invoice",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | PURCHASE
      |--------------------------------------------------------------------------
      */

      {
        title:
          "Purchase",

        href:
          "/admin/accounts/purchase",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | EXPENSES
      |--------------------------------------------------------------------------
      */

      {
        title:
          "Expenses",

        href:
          "/admin/accounts/expenses",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | ACCOUNTS REPORTS
      |--------------------------------------------------------------------------
      */

      {
        title:
          "Reports",

        href:
          "/admin/accounts/reports",

        allowedRoles: [
          "super_admin",

          "finance_manager",
        ],
      },
    ],
  },
];

/*
|--------------------------------------------------------------------------
| ADMIN SIDEBAR
|--------------------------------------------------------------------------
*/

export default function AdminSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | MOBILE SIDEBAR
  |--------------------------------------------------------------------------
  */

  const [
    open,
    setOpen,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ACCOUNTS DROPDOWN
  |--------------------------------------------------------------------------
  */

  const [
    accountsOpen,
    setAccountsOpen,
  ] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | CURRENT ADMIN
  |--------------------------------------------------------------------------
  */

  const [
    loadingAdmin,
    setLoadingAdmin,
  ] =
    useState(true);

  const [
    currentAdmin,
    setCurrentAdmin,
  ] =
    useState<
      CurrentAdmin | null
    >(null);

  /*
  |--------------------------------------------------------------------------
  | GET CURRENT ADMIN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted =
      true;

    async function fetchCurrentAdmin() {
      try {
        const response =
          await fetch(
            "/api/admin/me",
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
          CurrentAdminResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.admin
        ) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | INACTIVE ADMIN
        |--------------------------------------------------------------------------
        */

        if (
          data.admin
            .isActive ===
          false
        ) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        if (mounted) {
          setCurrentAdmin(
            data.admin
          );
        }
      } catch (
        error
      ) {
        console.error(
          "ADMIN SIDEBAR ME ERROR:",
          error
        );

        router.replace(
          "/admin/login"
        );
      } finally {
        if (mounted) {
          setLoadingAdmin(
            false
          );
        }
      }
    }

    void fetchCurrentAdmin();

    return () => {
      mounted =
        false;
    };
  }, [
    router,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AUTOMATICALLY OPEN ACCOUNTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      pathname.startsWith(
        "/admin/accounts"
      )
    ) {
      setAccountsOpen(
        true
      );
    }
  }, [
    pathname,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CLOSE MOBILE SIDEBAR WHEN ROUTE CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setOpen(false);
  }, [
    pathname,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  async function handleLogout() {
    try {
      setLoggingOut(
        true
      );

      await fetch(
        "/api/admin/logout",
        {
          method:
            "POST",

          credentials:
            "include",
        }
      );
    } catch (
      error
    ) {
      console.error(
        "ADMIN LOGOUT ERROR:",
        error
      );
    } finally {
      router.replace(
        "/admin/login"
      );

      router.refresh();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | VISIBLE MENU
  |--------------------------------------------------------------------------
  */

  const visibleMenuItems =
    currentAdmin
      ? menuItems.filter(
          (
            item
          ) =>
            item.allowedRoles.includes(
              currentAdmin.role
            )
        )
      : [];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      {/*
      =========================================================
      MOBILE MENU BUTTON
      =========================================================
      */}

      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="Open admin menu"
        className="
          fixed
          left-4
          top-4
          z-50
          rounded-lg
          bg-black
          p-2
          text-white
          shadow-lg
          lg:hidden
        "
      >
        <Menu
          size={22}
        />
      </button>

      {/*
      =========================================================
      MOBILE OVERLAY
      =========================================================
      */}

      {open && (
        <button
          type="button"
          onClick={() =>
            setOpen(false)
          }
          aria-label="Close admin menu"
          className="
            fixed
            inset-0
            z-40
            bg-black/40
            lg:hidden
          "
        />
      )}

      {/*
      =========================================================
      SIDEBAR
      =========================================================
      */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-72
          flex-col
          bg-black
          text-white
          shadow-2xl
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/*
        =======================================================
        HEADER
        =======================================================
        */}

        <div
          className="
            flex
            h-20
            shrink-0
            items-center
            justify-between
            border-b
            border-white/10
            px-6
          "
        >
          <div>
            <h2 className="text-2xl font-bold">
              SilentGEN
            </h2>

            <p className="text-xs text-gray-400">
              Admin Panel
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close sidebar"
            className="lg:hidden"
          >
            <X
              size={22}
            />
          </button>
        </div>

        {/*
        =======================================================
        NAVIGATION
        =======================================================
        */}

        <nav
          className="
            mt-6
            flex-1
            overflow-y-auto
            px-4
            pb-6
          "
        >
          {loadingAdmin ? (
            <div
              className="
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                text-sm
                text-gray-400
              "
            >
              <Loader2
                size={18}
                className="animate-spin"
              />

              <span>
                Loading menu...
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              {visibleMenuItems.map(
                (
                  item
                ) => {
                  /*
                  |--------------------------------------------------------------------------
                  | PARENT MENU WITH CHILDREN
                  |--------------------------------------------------------------------------
                  */

                  if (
                    item.children
                  ) {
                    const visibleChildren =
                      item.children.filter(
                        (
                          child
                        ) =>
                          Boolean(
                            currentAdmin
                          ) &&
                          child.allowedRoles.includes(
                            currentAdmin!
                              .role
                          )
                      );

                    /*
                    |--------------------------------------------------------------------------
                    | PARENT ACTIVE
                    |--------------------------------------------------------------------------
                    */

                    const parentActive =
                      visibleChildren.some(
                        (
                          child
                        ) =>
                          Boolean(
                            child.href
                          ) &&
                          (
                            pathname ===
                              child.href ||
                            pathname.startsWith(
                              `${child.href}/`
                            )
                          )
                      );

                    return (
                      <div
                        key={`parent-${item.title}`}
                      >
                        {/*
                        |--------------------------------------------------------------------------
                        | PARENT BUTTON
                        |--------------------------------------------------------------------------
                        */}

                        <button
                          type="button"
                          onClick={() =>
                            setAccountsOpen(
                              (
                                previous
                              ) =>
                                !previous
                            )
                          }
                          className={`
                            flex
                            w-full
                            items-center
                            justify-between
                            rounded-xl
                            px-4
                            py-3
                            transition
                            ${
                              parentActive
                                ? "bg-white/10 text-white"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <item.icon
                                size={
                                  20
                                }
                              />
                            )}

                            <span>
                              {
                                item.title
                              }
                            </span>
                          </div>

                          {accountsOpen ? (
                            <ChevronDown
                              size={
                                18
                              }
                            />
                          ) : (
                            <ChevronRight
                              size={
                                18
                              }
                            />
                          )}
                        </button>

                        {/*
                        |--------------------------------------------------------------------------
                        | CHILD MENU
                        |--------------------------------------------------------------------------
                        */}

                        {accountsOpen &&
                          visibleChildren.length >
                            0 && (
                            <div
                              className="
                                mt-2
                                ml-6
                                flex
                                flex-col
                                gap-1
                                border-l
                                border-white/10
                                pl-2
                              "
                            >
                              {visibleChildren.map(
                                (
                                  child
                                ) => {
                                  const active =
                                    Boolean(
                                      child.href
                                    ) &&
                                    (
                                      pathname ===
                                        child.href ||
                                      pathname.startsWith(
                                        `${child.href}/`
                                      )
                                    );

                                  return (
                                    <Link
                                      key={`child-${child.title}-${child.href ?? "no-link"}`}
                                      href={
                                        child.href ??
                                        "#"
                                      }
                                      onClick={() =>
                                        setOpen(
                                          false
                                        )
                                      }
                                      className={`
                                        rounded-lg
                                        px-4
                                        py-2
                                        text-sm
                                        transition
                                        ${
                                          active
                                            ? "bg-white font-semibold text-black"
                                            : "text-gray-400 hover:bg-white/10 hover:text-white"
                                        }
                                      `}
                                    >
                                      {
                                        child.title
                                      }
                                    </Link>
                                  );
                                }
                              )}
                            </div>
                          )}
                      </div>
                    );
                  }

                  /*
                  |--------------------------------------------------------------------------
                  | NORMAL MENU
                  |--------------------------------------------------------------------------
                  */

                  const Icon =
                    item.icon;

                  /*
                  |--------------------------------------------------------------------------
                  | IMPORTANT:
                  |
                  | Dashboard /admin only exact match.
                  |
                  | Otherwise Dashboard would remain active on every /admin/* page.
                  |
                  |--------------------------------------------------------------------------
                  */

                  const active =
                    item.href ===
                    "/admin"
                      ? pathname ===
                        "/admin"
                      : Boolean(
                          item.href
                        ) &&
                        (
                          pathname ===
                            item.href ||
                          pathname.startsWith(
                            `${item.href}/`
                          )
                        );

                  return (
                    <Link
                      key={`menu-${item.title}-${item.href ?? "no-link"}`}
                      href={
                        item.href ??
                        "#"
                      }
                      onClick={() =>
                        setOpen(
                          false
                        )
                      }
                      className={`
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-4
                        py-3
                        transition
                        ${
                          active
                            ? "bg-white font-semibold text-black"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        }
                      `}
                    >
                      {Icon && (
                        <Icon
                          size={
                            20
                          }
                        />
                      )}

                      <span>
                        {
                          item.title
                        }
                      </span>
                    </Link>
                  );
                }
              )}
            </div>
          )}

          {/*
          =====================================================
          LOGOUT
          =====================================================
          */}

          {!loadingAdmin && (
            <div
              className="
                mt-6
                border-t
                border-white/10
                pt-6
              "
            >
              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-gray-300
                  transition
                  hover:bg-red-600
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loggingOut ? (
                  <Loader2
                    size={
                      20
                    }
                    className="animate-spin"
                  />
                ) : (
                  <LogOut
                    size={
                      20
                    }
                  />
                )}

                <span>
                  {loggingOut
                    ? "Logging out..."
                    : "Logout"}
                </span>
              </button>
            </div>
          )}
        </nav>

        {/*
        =======================================================
        ADMIN INFORMATION
        =======================================================
        */}

        <div
          className="
            shrink-0
            border-t
            border-white/10
            px-6
            py-5
          "
        >
          {currentAdmin ? (
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  font-bold
                  text-black
                "
              >
                {currentAdmin.name
                  ?.charAt(
                    0
                  )
                  .toUpperCase() ||
                  "A"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {
                    currentAdmin.name
                  }
                </p>

                <p className="truncate text-xs text-gray-400">
                  {
                    roleLabels[
                      currentAdmin.role
                    ]
                  }
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400">
              SilentGEN Admin
            </p>
          )}
        </div>
      </aside>
    </>
  );
}