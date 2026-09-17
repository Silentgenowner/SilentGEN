"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyOTPPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const savedMobile = localStorage.getItem("mobile");

    if (!savedMobile) {
      router.replace("/login");
      return;
    }

    setMobile(savedMobile);
  }, [router]);

  const verifyOTP = async () => {
    const cleanOTP = otp.replace(/\D/g, "");

    if (cleanOTP.length !== 6) {
      alert("Enter valid 6 digit OTP");
      return;
    }

    if (!mobile) {
      alert("Mobile number not found");
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile,
            otp: cleanOTP,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            "Invalid OTP. Please try again."
        );
        return;
      }

      /*
       * Login successful.
       *
       * Remove temporary mobile data.
       */
      localStorage.removeItem("mobile");

      /*
       * First-time customer
       */
      if (data.profileRequired) {
        router.replace("/account/profile");
      } else {
        router.replace("/account");
      }

      router.refresh();
    } catch (error) {
      console.error(
        "VERIFY OTP ERROR:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (!mobile) {
      router.replace("/login");
      return;
    }

    try {
      setResending(true);

      const res = await fetch(
        "/api/auth/send-otp",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            "Unable to resend OTP"
        );
        return;
      }

      setOtp("");

      /*
       * Development OTP
       */
      if (data.otp) {
        console.log(
          "NEW DEVELOPMENT OTP:",
          data.otp
        );
      }

      alert("New OTP generated successfully.");
    } catch (error) {
      console.error(
        "RESEND OTP ERROR:",
        error
      );

      alert(
        "Unable to resend OTP."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-3">
          Verify OTP
        </h1>

        <p className="text-gray-500 text-center mb-2">
          Enter the 6 digit OTP
        </p>

        {mobile && (
          <p className="text-center text-sm text-gray-600 mb-6">
            OTP sent for +91 {mobile}
          </p>
        )}

        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            const value = e.target.value
              .replace(/\D/g, "")
              .slice(0, 6);

            setOtp(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              verifyOTP();
            }
          }}
          placeholder="Enter OTP"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="button"
          onClick={verifyOTP}
          disabled={
            loading ||
            otp.length !== 6
          }
          className="mt-5 w-full bg-black text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Verifying..."
            : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={resendOTP}
          disabled={resending}
          className="mt-4 w-full border border-black text-black py-3 rounded-lg disabled:opacity-50"
        >
          {resending
            ? "Generating..."
            : "Resend OTP"}
        </button>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(
              "mobile"
            );

            router.replace("/login");
          }}
          className="mt-4 w-full text-sm text-gray-500 hover:text-black"
        >
          Change Mobile Number
        </button>
      </div>
    </div>
  );
}