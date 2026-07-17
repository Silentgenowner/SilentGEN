"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyOTPPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      alert("Enter valid OTP");
      return;
    }

    const mobile = localStorage.getItem("mobile");

    if (!mobile) {
      alert("Mobile number not found");
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile,
          otp,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("otp");
        localStorage.removeItem("mobile");

        router.replace("/profile");
        router.refresh();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-4">
          Verify OTP
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Enter the 6-digit OTP
        </p>

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <button
          onClick={verifyOTP}
          disabled={loading}
          className="mt-5 w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

      </div>
    </div>
  );
}
