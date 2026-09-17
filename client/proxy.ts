import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import type {
  AdminRole,
} from "@/models/Admin";

/*
|--------------------------------------------------------------------------
| PUBLIC ADMIN ROUTES
|--------------------------------------------------------------------------
*/

const publicAdminRoutes = [
  "/admin/login",
  "/admin/setup",
];

/*
|--------------------------------------------------------------------------
| ROLE PERMISSIONS
|--------------------------------------------------------------------------
*/

const rolePermissions: Record<
  AdminRole,
  string[]
> = {
  /*
  |--------------------------------------------------------------------------
  | SUPER ADMIN
  |--------------------------------------------------------------------------
  */

  super_admin: [
    "/admin/homepage",

    "/admin/products",

    "/admin/orders",

    "/admin/customers",

    "/admin/coupons",

    "/admin/reports",

    "/admin/settings",

    /*
    |--------------------------------------------------------------------------
    | CONTENT MANAGEMENT
    |--------------------------------------------------------------------------
    */

    "/admin/content",

    "/admin/admins",

    "/admin/accounts",
  ],

  /*
  |--------------------------------------------------------------------------
  | PRODUCT MANAGER
  |--------------------------------------------------------------------------
  */

  product_manager: [
    "/admin/products",
  ],

  /*
  |--------------------------------------------------------------------------
  | ORDER MANAGER
  |--------------------------------------------------------------------------
  */

  order_manager: [
    "/admin/orders",
  ],

  /*
  |--------------------------------------------------------------------------
  | SUPPORT ADMIN
  |--------------------------------------------------------------------------
  */

  support_admin: [
    "/admin/orders",

    "/admin/customers",
  ],

  /*
  |--------------------------------------------------------------------------
  | FINANCE MANAGER
  |--------------------------------------------------------------------------
  */

  finance_manager: [
    "/admin/reports",

    "/admin/coupons",

    "/admin/accounts",
  ],
};

/*
|--------------------------------------------------------------------------
| CAN ACCESS ROUTE
|--------------------------------------------------------------------------
*/

function canAccessRoute(
  role: AdminRole,
  pathname: string
) {
  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  |
  | બધા valid logged-in admins Dashboard જોઈ શકે.
  |
  |--------------------------------------------------------------------------
  */

  if (
    pathname ===
    "/admin"
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | ROLE PERMISSIONS
  |--------------------------------------------------------------------------
  */

  const permissions =
    rolePermissions[
      role
    ] || [];

  return permissions.some(
    (
      allowedPath
    ) =>
      pathname ===
        allowedPath ||
      pathname.startsWith(
        `${allowedPath}/`
      )
  );
}

/*
|--------------------------------------------------------------------------
| ADMIN PROXY
|--------------------------------------------------------------------------
*/

export async function proxy(
  request: NextRequest
) {
  const {
    pathname,
  } =
    request.nextUrl;

  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  /*
  |--------------------------------------------------------------------------
  | PUBLIC ADMIN ROUTE
  |--------------------------------------------------------------------------
  */

  const isPublicAdminRoute =
    publicAdminRoutes.includes(
      pathname
    );

  /*
  |--------------------------------------------------------------------------
  | LOGIN / SETUP
  |--------------------------------------------------------------------------
  |
  | Admin already logged in હોય તો Login / Setup pageથી Dashboard પર મોકલો.
  |
  |--------------------------------------------------------------------------
  */

  if (
    isPublicAdminRoute
  ) {
    if (!token) {
      return NextResponse.next();
    }

    try {
      await verifyAdminToken(
        token
      );

      return NextResponse.redirect(
        new URL(
          "/admin",
          request.url
        )
      );
    } catch {
      /*
      |--------------------------------------------------------------------------
      | Invalid token હોય તો Login / Setup page access કરવાની permission.
      |--------------------------------------------------------------------------
      */

      return NextResponse.next();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PROTECTED ADMIN ROUTES
  |--------------------------------------------------------------------------
  |
  | Token વગર admin pages open ન થાય.
  |
  |--------------------------------------------------------------------------
  */

  if (!token) {
    const loginUrl =
      new URL(
        "/admin/login",
        request.url
      );

    loginUrl.searchParams.set(
      "from",
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VERIFY TOKEN
  |--------------------------------------------------------------------------
  */

  try {
    const admin =
      await verifyAdminToken(
        token
      );

    /*
    |--------------------------------------------------------------------------
    | BASIC PAYLOAD VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !admin.adminId ||
      !admin.role
    ) {
      throw new Error(
        "Invalid admin token"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALID ROLE
    |--------------------------------------------------------------------------
    */

    if (
      !Object.prototype.hasOwnProperty.call(
        rolePermissions,
        admin.role
      )
    ) {
      throw new Error(
        "Invalid admin role"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE ACCESS
    |--------------------------------------------------------------------------
    */

    if (
      !canAccessRoute(
        admin.role,
        pathname
      )
    ) {
      const dashboardUrl =
        new URL(
          "/admin",
          request.url
        );

      dashboardUrl.searchParams.set(
        "error",
        "unauthorized"
      );

      return NextResponse.redirect(
        dashboardUrl
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESS GRANTED
    |--------------------------------------------------------------------------
    */

    return NextResponse.next();
  } catch (error) {
    console.error(
      "ADMIN_PROXY_AUTH_ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | INVALID / EXPIRED TOKEN
    |--------------------------------------------------------------------------
    */

    const loginUrl =
      new URL(
        "/admin/login",
        request.url
      );

    loginUrl.searchParams.set(
      "from",
      pathname
    );

    const response =
      NextResponse.redirect(
        loginUrl
      );

    /*
    |--------------------------------------------------------------------------
    | REMOVE BROKEN TOKEN
    |--------------------------------------------------------------------------
    */

    response.cookies.delete(
      "adminToken"
    );

    return response;
  }
}

/*
|--------------------------------------------------------------------------
| MATCHER
|--------------------------------------------------------------------------
*/

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};