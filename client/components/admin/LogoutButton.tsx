"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/logout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("token");
        router.push("/admin/login");
        router.refresh();
      } else {
        alert(data.message || "Logout Failed");
      }
    } catch (error) {
      console.error(error);
      alert("Logout Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}