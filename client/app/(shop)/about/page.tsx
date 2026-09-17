import Link from "next/link";
import {
  ArrowRight,
  Award,
  Heart,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* HERO */}

      <section className="border-b border-gray-200 bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">

          <div className="max-w-4xl">

            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              SilentGEN
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl">
              Fashion that speaks
              <span className="block text-gray-400">
                without saying a word.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              SilentGEN is a modern fashion brand built around
              confidence, simplicity and everyday style.
              We believe great clothing does not need to be loud.
              It simply needs to feel right.
            </p>

          </div>

        </div>
      </section>


      {/* INTRO */}

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              About SilentGEN
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the next generation.
            </h2>

            <div className="mt-6 space-y-5 text-sm leading-7 text-gray-600 sm:text-base">

              <p>
                SilentGEN is a fashion destination focused on
                contemporary clothing for people who value
                clean design, comfort and individuality.
              </p>

              <p>
                From everyday essentials to statement pieces,
                our goal is to make fashion simple, accessible
                and effortless.
              </p>

              <p>
                We carefully focus on design, fabric, fit and
                overall experience so that every SilentGEN
                product can become a reliable part of your wardrobe.
              </p>

            </div>

            <div className="mt-8">

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Explore Collection
                <ArrowRight size={17} />
              </Link>

            </div>

          </div>


          {/* BRAND CARD */}

          <div className="relative overflow-hidden rounded-3xl bg-gray-100">

            <div className="flex min-h-[420px] items-center justify-center p-10">

              <div className="text-center">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-black text-white">
                  <Shirt size={42} strokeWidth={1.5} />
                </div>

                <h3 className="mt-7 text-3xl font-black tracking-[0.2em]">
                  SilentGEN
                </h3>

                <p className="mt-3 text-sm uppercase tracking-[0.25em] text-gray-500">
                  Fashion • Identity • Lifestyle
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* VALUES */}

      <section className="border-y border-gray-200 bg-gray-50">

        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              What We Believe
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Our values
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Everything we build at SilentGEN starts with
              a simple idea: fashion should feel personal.
            </p>

          </div>


          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* VALUE 1 */}

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <Sparkles size={22} />
              </div>

              <h3 className="mt-6 text-lg font-bold">
                Modern Design
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Clean silhouettes and contemporary styles
                designed for today's generation.
              </p>

            </div>


            {/* VALUE 2 */}

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <Heart size={22} />
              </div>

              <h3 className="mt-6 text-lg font-bold">
                Comfort First
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Clothing should look good and feel good.
                Comfort is always part of the design.
              </p>

            </div>


            {/* VALUE 3 */}

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <Award size={22} />
              </div>

              <h3 className="mt-6 text-lg font-bold">
                Quality Focus
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                We pay attention to fabric, construction,
                fit and the complete product experience.
              </p>

            </div>


            {/* VALUE 4 */}

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <Users size={22} />
              </div>

              <h3 className="mt-6 text-lg font-bold">
                For Everyone
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Fashion made for different personalities,
                lifestyles and everyday moments.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* MISSION */}

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">

        <div className="rounded-3xl bg-black px-7 py-14 text-center text-white sm:px-12 lg:px-20 lg:py-20">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Our Mission
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            To make everyday fashion feel
            simple, confident and uniquely yours.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
            SilentGEN aims to build a fashion experience where
            customers can discover clothing they genuinely enjoy
            wearing — online and in everyday life.
          </p>

        </div>

      </section>


      {/* CTA */}

      <section className="border-t border-gray-200">

        <div className="mx-auto max-w-7xl px-6 py-16 text-center sm:px-8 lg:px-10">

          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to discover SilentGEN?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600">
            Explore our latest collection and find your
            next everyday favourite.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Shop Now
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-7 py-3.5 text-sm font-semibold text-gray-900 transition hover:border-black"
            >
              Contact Us
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}