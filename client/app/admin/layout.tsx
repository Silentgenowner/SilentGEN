"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/admin/login" || pathname === "/admin/setup";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex min-h-screen flex-col lg:ml-72">
        <AdminHeader />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
