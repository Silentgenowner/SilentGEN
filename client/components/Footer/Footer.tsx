import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-16">

      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <h2 className="text-2xl font-bold">
              SilentGEN
            </h2>

            <p className="text-gray-400 mt-4">
              Premium Fashion & Accessories
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">
              Quick Links
            </h3>

            <div className="flex flex-col gap-2">

              <Link href="/">Home</Link>

              <Link href="/shop">Shop</Link>

              <Link href="/wishlist">Wishlist</Link>

              <Link href="/cart">Cart</Link>

              <Link href="/login">Login</Link>

            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">
              Contact
            </h3>

            <p className="text-gray-400">
              support@silentgen.in
            </p>

            <p className="text-gray-400 mt-2">
              India
            </p>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-400">
          © 2026 SilentGEN. All Rights Reserved.
        </div>

      </div>

    </footer>
  );
}
