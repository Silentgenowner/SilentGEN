"use client";

import { useEffect, useState } from "react";

type User = {
  _id: string;
  name: string;
  mobile: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch("/api/user/profile", {
          cache: "no-store",
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-semibold">
          Loading...
        </h2>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-semibold">
          Please Login First
        </h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">

      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold mb-8">
          My Profile
        </h1>

        <div className="space-y-5">

          <div>
            <p className="text-gray-500">
              Name
            </p>

            <p className="text-xl font-semibold">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-gray-500">
              Mobile
            </p>

            <p className="text-xl font-semibold">
              {user.mobile}
            </p>
          </div>

          <div>
            <p className="text-gray-500">
              Joined
            </p>

            <p className="text-xl font-semibold">
              {new Date(user.createdAt).toDateString()}
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}
