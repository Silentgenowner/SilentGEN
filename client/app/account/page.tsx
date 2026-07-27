"use client";

import Link from "next/link";
import {
  Package,
  MapPin,
  Heart,
  User,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";

type UserType = {
  name?: string;
  email?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType>({});
  const [orders, setOrders] = useState(0);
  const { wishlist } = useWishlist();

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
    try {
      const profileRes = await fetch("/api/user/profile", { cache: "no-store" });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setUser(profileData.user);
      }

      const orderRes = await fetch("/api/order/my-orders", { cache: "no-store" });
      const orderData = await orderRes.json();
      if (orderData.success) {
        setOrders(orderData.orders.length);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Welcome, {user.name || "User"}</h1>
      <p className="mb-8 text-gray-500">Manage your SilentGEN account</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link href="/account/orders" className="rounded-3xl border border-gray-200 p-6 transition hover:shadow-lg">
          <Package size={32} />
          <h2 className="mt-4 text-xl font-semibold">My Orders</h2>
          <p className="mt-2 text-gray-500">Track and manage your orders</p>
        </Link>

        <Link href="/account/address" className="rounded-3xl border border-gray-200 p-6 transition hover:shadow-lg">
          <MapPin size={32} />
          <h2 className="mt-4 text-xl font-semibold">My Addresses</h2>
          <p className="mt-2 text-gray-500">Manage delivery addresses</p>
        </Link>

        <Link href="/account/wishlist" className="rounded-3xl border border-gray-200 p-6 transition hover:shadow-lg">
          <Heart size={32} />
          <h2 className="mt-4 text-xl font-semibold">Wishlist</h2>
          <p className="mt-2 text-gray-500">Your saved products</p>
        </Link>

        <Link href="/account/profile" className="rounded-3xl border border-gray-200 p-6 transition hover:shadow-lg">
          <User size={32} />
          <h2 className="mt-4 text-xl font-semibold">Profile</h2>
          <p className="mt-2 text-gray-500">Update your personal details</p>
        </Link>
      </div>

      <div className="mt-10 rounded-3xl border border-gray-200 p-6">
        <h2 className="mb-4 text-xl font-bold">Account Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gray-100 p-5">
            <p className="text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold">{orders}</p>
          </div>
          <div className="rounded-2xl bg-gray-100 p-5">
            <p className="text-gray-500">Wishlist Items</p>
            <p className="text-3xl font-bold">{wishlist.length}</p>
          </div>
        </div>
      </div>

      <button onClick={logout} className="mt-8 flex items-center gap-3 rounded-full bg-black px-6 py-3 text-white">
        <LogOut size={20} />
        Logout
      </button>
    </div>
  );
}
