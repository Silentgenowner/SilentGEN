import type { ReactNode } from "react";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import SilentGenAI from "@/components/ai/SilentGenAI";

export default function ShopLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="min-h-[60vh]">
        {children}
      </main>
      <SilentGenAI />

      <Footer />
    </div>
  );
}