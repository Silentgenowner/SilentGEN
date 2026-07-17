"use client";

import { useState } from "react";

export default function AddressPage() {
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    pincode: "",
    state: "",
    city: "",
    area: "",
    house: "",
    landmark: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveAddress = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/address/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        alert("Address Saved Successfully");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8">
          Delivery Address
        </h1>

        <div className="grid gap-4">

          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="pincode"
            placeholder="Pincode"
            value={form.pincode}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="area"
            placeholder="Area"
            value={form.area}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="house"
            placeholder="House / Flat / Building"
            value={form.house}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <input
            name="landmark"
            placeholder="Landmark (Optional)"
            value={form.landmark}
            onChange={handleChange}
            className="border rounded-lg p-3"
          />

          <button
            onClick={saveAddress}
            disabled={loading}
            className="bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Address"}
          </button>

        </div>

      </div>
    </main>
  );
}
