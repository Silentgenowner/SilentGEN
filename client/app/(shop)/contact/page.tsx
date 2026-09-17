import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Mail,
  MessageCircle,
  Package,
  Phone,
  RefreshCcw,
} from "lucide-react";

const CONTACTS = [
  {
    icon: Phone,
    title: "Product Query",
    description:
      "Questions about products, sizes, colours, availability or product details.",
    value: "+91 9998665658",
    href: "tel:+919998665658",
  },
  {
    icon: Package,
    title: "Delivery Query",
    description:
      "Need help with delivery, shipping or your order delivery status?",
    value: "+91 9998765658",
    href: "tel:+919998765658",
  },
  {
    icon: RefreshCcw,
    title: "Payment & Refund",
    description:
      "Questions regarding payments, refunds or payment-related issues.",
    value: "+91 9998665652",
    href: "tel:+919998665652",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* HEADER */}

      <section className="border-b border-gray-200 bg-gray-50">

        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">

          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            SilentGEN Support
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Contact Us
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
            We are here to help. Choose the department that
            matches your query and contact the SilentGEN team
            directly.
          </p>

        </div>

      </section>


      {/* CONTACT CARDS */}

      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">

        <div className="grid gap-6 lg:grid-cols-3">

          {CONTACTS.map((contact) => {

            const Icon = contact.icon;

            return (
              <div
                key={contact.title}
                className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
                  <Icon size={24} />
                </div>

                <h2 className="mt-6 text-xl font-bold">
                  {contact.title}
                </h2>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-gray-600">
                  {contact.description}
                </p>

                <a
                  href={contact.href}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <Phone size={16} />
                  {contact.value}
                </a>

              </div>
            );

          })}

        </div>

      </section>


      {/* EMAIL + WHATSAPP */}

      <section className="border-y border-gray-200 bg-gray-50">

        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">

          <div className="grid gap-6 md:grid-cols-2">

            {/* EMAIL */}

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <Mail size={22} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Email Support
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                For general questions and support, you can
                email our team.
              </p>

              <a
                href="mailto:silentgenofficial@gmail.com"
                className="mt-5 inline-block break-all text-sm font-semibold underline underline-offset-4"
              >
                silentgenofficial@gmail.com
              </a>

            </div>


            {/* WHATSAPP */}

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <MessageCircle size={22} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                WhatsApp
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                For quick assistance, you can contact SilentGEN
                through WhatsApp.
              </p>

              <a
                href="https://wa.me/message/UO35SXHV6J2FC1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <MessageCircle size={17} />
                Chat on WhatsApp
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* SUPPORT HOURS */}

      <section className="mx-auto max-w-4xl px-6 py-14 text-center sm:px-8 lg:px-10 lg:py-20">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Clock size={25} />
        </div>

        <h2 className="mt-6 text-2xl font-bold">
          Need help with an order?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600">
          Please keep your order number ready when contacting
          us about an existing order. This helps our support
          team assist you faster.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <Link
            href="/account/orders"
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            My Orders
          </Link>

          <Link
            href="/faq"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold transition hover:border-black"
          >
            View FAQ
          </Link>

        </div>

      </section>

    </main>
  );
}