import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-black to-gray-900 text-white">

      <div className="max-w-7xl mx-auto px-6 py-24">

        <div className="max-w-2xl">

          <p className="uppercase tracking-[6px] text-gray-300 mb-4">
            SilentGEN Fashion
          </p>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Premium Fashion & Accessories
          </h1>

          <p className="mt-6 text-lg text-gray-300">
            Discover premium clothing, shoes, watches and accessories with modern style, top quality and fast delivery.
          </p>

          <div className="mt-10 flex gap-4">

            <Link
              href="/shop"
              className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Shop Now
            </Link>

            <Link
              href="/login"
              className="border border-white px-8 py-3 rounded-lg hover:bg-white hover:text-black transition"
            >
              Login
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}
