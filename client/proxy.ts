import { NextRequest, NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/adminAuth";
import type { AdminRole } from "@/models/Admin";

const publicAdminRoutes = ["/admin/login", "/admin/setup"];

const rolePermissions: Record<AdminRole, string[]> = {
  super_admin: [
    "/admin/homepage",
    "/admin/products",
    "/admin/orders",
    "/admin/customers",
    "/admin/coupons",
    "/admin/reports",
    "/admin/settings",
    "/admin/admins",
    "/admin/accounts",
  ],

  product_manager: ["/admin/products"],

  order_manager: ["/admin/orders"],

  support_admin: ["/admin/orders", "/admin/customers"],

  finance_manager: ["/admin/reports", "/admin/coupons", "/admin/accounts"],
};

function canAccessRoute(role: AdminRole, pathname: string) {
  // બધા logged-in admins dashboard જોઈ શકે.
  if (pathname === "/admin") {
    return true;
  }

  return rolePermissions[role].some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("adminToken")?.value;

  const isPublicAdminRoute = publicAdminRoutes.includes(pathname);

  // પહેલેથી login થયેલો admin Login/Setup page ખોલે તો Dashboard પર મોકલો.
  if (isPublicAdminRoute) {
    if (!token) {
      return NextResponse.next();
    }

    try {
      await verifyAdminToken(token);

      return NextResponse.redirect(new URL("/admin", request.url));
    } catch {
      return NextResponse.next();
    }
  }

  // Protected admin routes માટે token જરૂરી છે.
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);

    return NextResponse.redirect(loginUrl);
  }

  try {
    const admin = await verifyAdminToken(token);

    if (!admin.adminId || !admin.role) {
      throw new Error("Invalid admin token");
    }

    // Role પાસે આ page માટે permission ન હોય તો dashboard પર redirect.
    if (!canAccessRoute(admin.role, pathname)) {
      const dashboardUrl = new URL("/admin", request.url);
      dashboardUrl.searchParams.set("error", "unauthorized");

      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);

    const response = NextResponse.redirect(loginUrl);

    response.cookies.delete("adminToken");

    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
