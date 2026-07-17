import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export const metadata: Metadata = {
  title: "SilentGEN",
  description: "SilentGEN Fashion & Accessories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-black">

        <CartProvider>

          <WishlistProvider>

            <Navbar />

            <main>{children}</main>

            <Footer />

          </WishlistProvider>

        </CartProvider>

      </body>
    </html>
  );
}
