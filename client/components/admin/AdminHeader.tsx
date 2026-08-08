"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Search, UserCircle } from "lucide-react";

type AdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

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

type AdminHeaderProps = {
  title?: string;
};

export default function AdminHeader({
  title = "Dashboard",
}: AdminHeaderProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentAdmin() {
      try {
        const response = await fetch("/api/admin/me", {
          method: "GET",
          cache: "no-store",
        });

        const data: CurrentAdminResponse = await response.json();

        if (!response.ok || !data.success || !data.admin) {
          router.replace("/admin/login");
          return;
        }

        if (isMounted) {
          setAdmin(data.admin);
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCurrentAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <header className="flex h-20 items-center justify-between border-b bg-white px-6">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {title}
        </h1>

        <p className="mt-1 text-xs text-gray-500 sm:text-sm">{today}</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg border p-2 transition hover:bg-gray-100"
        >
          <Bell size={20} />

          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        </button>

        {loading ? (
          <Loader2 size={22} className="animate-spin text-gray-500" />
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-semibold text-white">
              {admin?.name?.charAt(0).toUpperCase() || (
                <UserCircle size={25} />
              )}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-36 truncate font-semibold text-gray-900">
                {admin?.name || "Admin"}
              </p>

              <p className="text-sm text-gray-500">
                {admin ? roleLabels[admin.role] : "Loading..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
