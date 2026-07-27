"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        router.push("/login");
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
      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
