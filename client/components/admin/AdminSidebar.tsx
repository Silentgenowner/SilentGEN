"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  LayoutTemplate,
  Package,
  Settings,
  ShoppingCart,
  TicketPercent,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";

type AdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

type MenuItem = {
  title: string;
  href?: string;
  icon?: any;
  allowedRoles: AdminRole[];
  children?: MenuItem[];
};

type CurrentAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
};

type CurrentAdminResponse = {
  success: boolean;
  admin?: CurrentAdmin;
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  product_manager: "Product Manager",
  order_manager: "Order Manager",
  support_admin: "Support Admin",
  finance_manager: "Finance Manager",
};

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    allowedRoles: [
      "super_admin",
      "product_manager",
      "order_manager",
      "support_admin",
      "finance_manager",
    ],
  },

  {
  title: "Home Page",
  href: "/admin/homepage",
  icon: LayoutTemplate,
  allowedRoles: [
    "super_admin",
  ],
},

  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
    allowedRoles: [
      "super_admin",
      "product_manager",
    ],
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    allowedRoles: [
      "super_admin",
      "order_manager",
      "support_admin",
    ],
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
    allowedRoles: [
      "super_admin",
      "support_admin",
    ],
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: TicketPercent,
    allowedRoles: [
      "super_admin",
      "finance_manager",
    ],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    allowedRoles: [
      "super_admin",
      "finance_manager",
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    allowedRoles: [
      "super_admin",
    ],
  },
  {
    title: "Admins",
    href: "/admin/admins",
    icon: UserCog,
    allowedRoles: [
      "super_admin",
    ],
  },

  // ==========================
  // Accounts
  // ==========================

  {
    title: "Accounts",
    icon: Wallet,
    allowedRoles: [
      "super_admin",
      "finance_manager",
    ],

    children: [

      {
        title: "Dashboard",
        href: "/admin/accounts",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },

      {
        title: "GST Reports",
        href: "/admin/accounts/gst",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },

      {
        title: "Ledger",
        href: "/admin/accounts/ledger",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },

      {
        title: "Sales Invoice",
        href: "/admin/accounts/sales",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },

      {
        title: "Purchase",
        href: "/admin/accounts/purchase",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },

      {
        title: "Expenses",
        href: "/admin/accounts/expenses",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },

      {
        title: "Reports",
        href: "/admin/accounts/reports",
        allowedRoles: [
          "super_admin",
          "finance_manager",
        ],
      },
    ],
  },
];

export default function AdminSidebar() {

  const pathname = usePathname();

  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [accountsOpen, setAccountsOpen] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [loadingAdmin, setLoadingAdmin] =
    useState(true);

  const [currentAdmin, setCurrentAdmin] =
    useState<CurrentAdmin | null>(null);
  useEffect(() => {
    let mounted = true;

    async function fetchCurrentAdmin() {
      try {
        const response = await fetch(
          "/api/admin/me",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: CurrentAdminResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.admin
        ) {
          router.replace("/admin/login");
          return;
        }

        if (mounted) {
          setCurrentAdmin(data.admin);
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        if (mounted) {
          setLoadingAdmin(false);
        }
      }
    }

    fetchCurrentAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (
      pathname.startsWith("/admin/accounts")
    ) {
      setAccountsOpen(true);
    }
  }, [pathname]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch(
        "/api/admin/logout",
        {
          method: "POST",
        }
      );
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const visibleMenuItems = currentAdmin
    ? menuItems.filter((item) =>
        item.allowedRoles.includes(
          currentAdmin.role
        )
      )
    : [];

  return (
    <>
      {/* Mobile Button */}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-black p-2 text-white lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-black text-white transition-transform duration-300 lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Header */}

        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">

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
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X size={22} />
          </button>

        </div>

        <nav className="mt-6 flex-1 overflow-y-auto px-4">
{loadingAdmin ? (
  <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400">
    <Loader2
      size={18}
      className="animate-spin"
    />
    <span>Loading menu...</span>
  </div>
) : (
  visibleMenuItems.map((item) => {
    // =========================
    // Parent Menu (Accounts)
    // =========================

    if (item.children) {
      return (
        <div key={item.title}>
          <button
            type="button"
            onClick={() =>
              setAccountsOpen(
                !accountsOpen
              )
            }
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <item.icon size={20} />
              )}

              <span>{item.title}</span>
            </div>

            {accountsOpen ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          {accountsOpen && (
            <div className="mt-2 ml-6 flex flex-col gap-1">
              {item.children
                .filter((child) =>
                  currentAdmin &&
                  child.allowedRoles.includes(
                    currentAdmin?.role
                  )
                )
                .map((child) => {
                  const active =
                     !!child.href &&
                     (
                     pathname === child.href ||
                     pathname.startsWith(`${child.href}/`)
                     );

                  return (
                    <Link
                      key={child.href}
                      href={child.href ?? "#"}
                      onClick={() =>
                        setOpen(false)
                      }
                      className={`rounded-lg px-4 py-2 text-sm transition ${
                        active
                          ? "bg-white font-semibold text-black"
                          : "text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {child.title}
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      );
    }

    // =========================
    // Normal Menu
    // =========================

    const Icon = item.icon!;

    const active =
      !!item.href &&
      (
       pathname === item.href ||
       pathname.startsWith(`${item.href}/`)
      );

    return (
      <Link
        key={`${item.title}-${item.href}`}
        href={item.href ?? "#"}
        onClick={() =>
          setOpen(false)
        }
        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
          active
            ? "bg-white font-semibold text-black"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon size={20} />
        <span>{item.title}</span>
      </Link>
    );
  })
)}
        {/* Logout */}

        <div className="mt-6 border-t border-white/10 pt-6">

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-300 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2
                size={20}
                className="animate-spin"
              />
            ) : (
              <LogOut size={20} />
            )}

            <span>
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </span>

          </button>

        </div>

      </nav>

      {/* Bottom Admin Info */}

      <div className="border-t border-white/10 px-6 py-5">

        {currentAdmin ? (

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-black">

              {currentAdmin.name
                .charAt(0)
                .toUpperCase()}

            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">

                {currentAdmin.name}

              </p>

              <p className="truncate text-xs text-gray-400">

                {roleLabels[currentAdmin.role]}

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
