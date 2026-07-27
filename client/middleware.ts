import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public Routes
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/create-admin"
  ) {
    return NextResponse.next();
  }

  // Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("adminToken")?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL("/admin/login", req.url)
      );
    }

    try {
      jwt.verify(token, JWT_SECRET);

      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(
        new URL("/admin/login", req.url)
      );

      response.cookies.delete("adminToken");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
