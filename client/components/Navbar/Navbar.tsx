"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LogoutButton from "@/components/LogoutButton/LogoutButton";

export default function Navbar() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      try {
        const res = await fetch("/api/user/profile", {
          cache: "no-store",
        });

        const data = await res.json();

        setLoggedIn(data.success === true);
      } catch {
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }

    checkLogin();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link
          href="/"
          className="text-2xl font-bold"
        >
          SilentGEN
        </Link>

        <div className="flex items-center gap-6">

          <Link href="/">
            Home
          </Link>

          <Link href="/shop">
            Shop
          </Link>

          <Link href="/wishlist">
            Wishlist
          </Link>

          <Link href="/cart">
            Cart
          </Link>

          {loading ? (
            <span className="text-sm text-gray-500">
              Loading...
            </span>
          ) : loggedIn ? (
            <>
              <Link href="/profile">
                Profile
              </Link>

              <LogoutButton />
            </>
          ) : (
            <Link href="/login">
              Login
            </Link>
          )}

        </div>

      </div>
    </nav>
  );
}
