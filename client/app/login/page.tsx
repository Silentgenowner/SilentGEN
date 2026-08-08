"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    const cleanMobile = mobile.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      alert("Enter valid 10 digit mobile number");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mobile: cleanMobile,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Unable to send OTP");
        return;
      }

      localStorage.setItem("mobile", cleanMobile);

      /*
       * Development OTP
       *
       * This is only for local testing.
       * It will be removed when real SMS OTP
       * provider is connected.
       */
      if (data.otp) {
        console.log("DEVELOPMENT OTP:", data.otp);
      }

      router.push("/verify-otp");
    } catch (error) {
      console.error("SEND OTP ERROR:", error);

      alert("Server Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center">
          Welcome Back
        </h1>

        <p className="text-gray-500 text-center mt-2 mb-8">
          Login with Mobile Number
        </p>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => {
            const value = e.target.value
              .replace(/\D/g, "")
              .slice(0, 10);

            setMobile(value);
          }}
          maxLength={10}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="button"
          onClick={sendOTP}
          disabled={loading || mobile.length !== 10}
          className="mt-5 w-full bg-black text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}