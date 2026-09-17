import type { ReactNode } from "react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminAIAssistant from "@/components/admin/AdminAIAssistant";

export default function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/*
      |--------------------------------------------------------------------------
      | ADMIN SIDEBAR
      |--------------------------------------------------------------------------
      */}

      <AdminSidebar />

      {/*
      |--------------------------------------------------------------------------
      | ADMIN MAIN AREA
      |--------------------------------------------------------------------------
      */}

      <div className="min-h-screen lg:pl-72">
        {/*
        |--------------------------------------------------------------------------
        | ADMIN HEADER
        |--------------------------------------------------------------------------
        */}

        <AdminHeader />

        {/*
        |--------------------------------------------------------------------------
        | ADMIN PAGE CONTENT
        |--------------------------------------------------------------------------
        */}

        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | SILENTGEN ADMIN AI
      |--------------------------------------------------------------------------
      |
      | Separate Admin AI Agent.
      |
      | Available across the entire /admin panel.
      |
      | Supported languages:
      |
      | - Gujarati
      | - Hindi
      | - English
      |
      |--------------------------------------------------------------------------
      */}

      <AdminAIAssistant />
    </div>
  );
}