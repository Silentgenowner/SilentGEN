"use client";

import Link from "next/link";

import {
  ArrowUp,
  ExternalLink,
  Heart,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  WalletCards,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/*
|--------------------------------------------------------------------------
| CMS TYPES
|--------------------------------------------------------------------------
*/

type CmsPageType =
  | "content"
  | "external"
  | "whatsapp";

type CmsSection =
  | "help"
  | "policy";

type CmsPage = {
  _id?: string;

  title: string;

  slug: string;

  section: CmsSection;

  pageType: CmsPageType;

  shortDescription?: string;

  sortOrder?: number;

  externalUrl?: string;

  whatsappNumber?: string;

  whatsappMessage?: string;

  icon?: string;
};

type CmsListResponse = {
  success: boolean;

  pages?: CmsPage[];

  message?: string;
};

/*
|--------------------------------------------------------------------------
| SITE SETTINGS
|--------------------------------------------------------------------------
*/

type SiteSettings = {
  storeName: string;

  businessName?: string;

  storeLogo: string;

  currency: string;

  supportEmail: string;

  contactEmail: string;

  orderEmail: string;

  returnRefundEmail: string;

  supportMobile: string;

  customerCareNumber: string;

  productQueryNumber: string;

  deliveryQueryNumber: string;

  paymentRefundNumber: string;

  whatsappNumber: string;

  whatsappMessage: string;

  businessAddress: string;

  legalBusinessName: string;

  supportHours: string;

  instagramUrl: string;

  facebookUrl: string;

  youtubeUrl: string;

  shippingCharge: number;

  freeShippingMinimum: number;

  returnDays: number;

  exchangeDays: number;
};

type SiteSettingsResponse = {
  success: boolean;

  settings?: Partial<SiteSettings>;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| ORIGINAL SILENTGEN DETAILS
|--------------------------------------------------------------------------
*/

const ORIGINAL_DETAILS = {
  instagram:
    "https://www.instagram.com/silentgenofficial/",

  facebook:
    "https://www.facebook.com/share/1AiwV1MKfb/",

  youtube:
    "https://www.youtube.com/@SilentGEN-org",

  whatsapp:
    "https://wa.me/message/UO35SXHV6J2FC1",

  email:
    "silentgenofficial@gmail.com",

  productPhone:
    "+919998665658",

  productPhoneDisplay:
    "+91 99986 65658",

  deliveryPhone:
    "+919998765658",

  deliveryPhoneDisplay:
    "+91 99987 65658",

  paymentPhone:
    "+919998665652",

  paymentPhoneDisplay:
    "+91 99986 65652",
};

/*
|--------------------------------------------------------------------------
| DEFAULT SETTINGS
|--------------------------------------------------------------------------
*/

const DEFAULT_SETTINGS: SiteSettings = {
  storeName:
    "SilentGEN",

  businessName:
    "SilentGEN",

  storeLogo: "",

  currency:
    "INR",

  supportEmail:
    ORIGINAL_DETAILS.email,

  contactEmail:
    ORIGINAL_DETAILS.email,

  orderEmail:
    ORIGINAL_DETAILS.email,

  returnRefundEmail:
    ORIGINAL_DETAILS.email,

  supportMobile: "",

  customerCareNumber: "",

  productQueryNumber:
    ORIGINAL_DETAILS.productPhone,

  deliveryQueryNumber:
    ORIGINAL_DETAILS.deliveryPhone,

  paymentRefundNumber:
    ORIGINAL_DETAILS.paymentPhone,

  whatsappNumber: "",

  whatsappMessage:
    "Hello SilentGEN, I need help.",

  businessAddress: "",

  legalBusinessName: "",

  supportHours: "",

  instagramUrl:
    ORIGINAL_DETAILS.instagram,

  facebookUrl:
    ORIGINAL_DETAILS.facebook,

  youtubeUrl:
    ORIGINAL_DETAILS.youtube,

  shippingCharge: 0,

  freeShippingMinimum: 0,

  returnDays: 7,

  exchangeDays: 7,
};

/*
|--------------------------------------------------------------------------
| FALLBACK HELP
|--------------------------------------------------------------------------
*/

const FALLBACK_HELP_PAGES: CmsPage[] = [
  {
    title:
      "Contact Us",

    slug:
      "contact-us",

    section:
      "help",

    pageType:
      "content",

    sortOrder: 1,
  },

  {
    title:
      "Size Guide",

    slug:
      "size-guide",

    section:
      "help",

    pageType:
      "content",

    sortOrder: 2,
  },

  {
    title:
      "FAQ",

    slug:
      "faq",

    section:
      "help",

    pageType:
      "content",

    sortOrder: 3,
  },

  {
    title:
      "WhatsApp",

    slug:
      "whatsapp",

    section:
      "help",

    pageType:
      "whatsapp",

    sortOrder: 4,
  },

  {
    title:
      "Product Query",

    slug:
      "product-query",

    section:
      "help",

    pageType:
      "content",

    sortOrder: 5,
  },

  {
    title:
      "Delivery Query",

    slug:
      "delivery-query",

    section:
      "help",

    pageType:
      "content",

    sortOrder: 6,
  },

  {
    title:
      "Payment & Refund",

    slug:
      "payment-refund",

    section:
      "help",

    pageType:
      "content",

    sortOrder: 7,
  },
];

/*
|--------------------------------------------------------------------------
| FALLBACK POLICIES
|--------------------------------------------------------------------------
*/

const FALLBACK_POLICY_PAGES: CmsPage[] = [
  {
    title:
      "Shipping Policy",

    slug:
      "shipping-policy",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 1,
  },

  {
    title:
      "Return Policy",

    slug:
      "return-policy",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 2,
  },

  {
    title:
      "Exchange Policy",

    slug:
      "exchange-policy",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 3,
  },

  {
    title:
      "Cancellation Policy",

    slug:
      "cancellation-policy",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 4,
  },

  {
    title:
      "Refund Policy",

    slug:
      "refund-policy",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 5,
  },

  {
    title:
      "Privacy Policy",

    slug:
      "privacy-policy",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 6,
  },

  {
    title:
      "Terms & Conditions",

    slug:
      "terms-conditions",

    section:
      "policy",

    pageType:
      "content",

    sortOrder: 7,
  },
];

/*
|--------------------------------------------------------------------------
| SOCIAL ICONS
|--------------------------------------------------------------------------
*/

function InstagramIcon({
  size = 18,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon({
  size = 18,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M13.7 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H17V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4V11H7.5v3h2.8v8h3.4Z" />
    </svg>
  );
}

function YoutubeIcon({
  size = 18,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

function WhatsAppIcon({
  size = 18,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2a9.7 9.7 0 0 0-8.4 14.6L2 22l5.6-1.5A9.9 9.9 0 1 0 12 2Zm0 17.8a7.8 7.8 0 0 1-4-1.1l-.3-.2-3.3.9.9-3.2-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-1.9-1.2 7.5 7.5 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.4c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| FOOTER COMPONENTS
|--------------------------------------------------------------------------
*/

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;

  children: ReactNode;

  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-black"
      >
        <span>
          {children}
        </span>

        <ExternalLink
          size={12}
          className="opacity-0 transition group-hover:opacity-100"
        />
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-black"
    >
      <span>
        {children}
      </span>
    </Link>
  );
}

function FooterSection({
  title,
  children,
}: {
  title: string;

  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-black">
        {title}
      </h3>

      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

function SocialButton({
  href,
  label,
  children,
}: {
  href: string;

  label: string;

  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
    >
      {children}
    </a>
  );
}

function ServiceItem({
  icon,
  title,
  description,
  className = "",
}: {
  icon: ReactNode;

  title: string;

  description: string;

  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-2 py-5 sm:px-5 ${className}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-black">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| HELP ICON
|--------------------------------------------------------------------------
*/

function HelpLinkIcon({
  slug,
}: {
  slug: string;
}) {
  switch (slug) {
    case "contact-us":
      return (
        <MessageCircle
          size={14}
        />
      );

    case "size-guide":
      return (
        <Ruler
          size={14}
        />
      );

    case "faq":
      return (
        <HelpCircle
          size={14}
        />
      );

    case "whatsapp":
      return (
        <WhatsAppIcon
          size={14}
        />
      );

    case "product-query":
      return (
        <Phone
          size={14}
        />
      );

    case "delivery-query":
      return (
        <Truck
          size={14}
        />
      );

    case "payment-refund":
      return (
        <WalletCards
          size={14}
        />
      );

    default:
      return (
        <HelpCircle
          size={14}
        />
      );
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function sortPages(
  pages: CmsPage[]
) {
  return [...pages].sort(
    (a, b) => {
      const aOrder =
        Number(
          a.sortOrder || 0
        );

      const bOrder =
        Number(
          b.sortOrder || 0
        );

      if (
        aOrder !==
        bOrder
      ) {
        return (
          aOrder -
          bOrder
        );
      }

      return a.title.localeCompare(
        b.title
      );
    }
  );
}

function phoneHref(
  value: string
) {
  const cleaned =
    String(value || "")
      .replace(
        /[^\d+]/g,
        ""
      );

  if (!cleaned) {
    return "#";
  }

  return `tel:${cleaned}`;
}

function formatPhone(
  value: string,
  fallbackDisplay: string
) {
  const cleaned =
    String(value || "")
      .replace(
        /\D/g,
        ""
      );

  if (!cleaned) {
    return fallbackDisplay;
  }

  if (
    cleaned.length === 12 &&
    cleaned.startsWith(
      "91"
    )
  ) {
    return (
      "+91 " +
      cleaned.slice(
        2,
        7
      ) +
      " " +
      cleaned.slice(7)
    );
  }

  if (
    cleaned.length === 10
  ) {
    return (
      "+91 " +
      cleaned.slice(
        0,
        5
      ) +
      " " +
      cleaned.slice(5)
    );
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| MAIN FOOTER
|--------------------------------------------------------------------------
*/

export default function Footer() {
  const [
    settings,
    setSettings,
  ] =
    useState<SiteSettings>(
      DEFAULT_SETTINGS
    );

  const [
    helpPages,
    setHelpPages,
  ] =
    useState<CmsPage[]>(
      FALLBACK_HELP_PAGES
    );

  const [
    policyPages,
    setPolicyPages,
  ] =
    useState<CmsPage[]>(
      FALLBACK_POLICY_PAGES
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD SETTINGS + CMS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    async function loadFooter() {
      try {
        const [
          settingsResponse,
          helpResponse,
          policyResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/site-settings",
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              "/api/content/list?section=help",
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              "/api/content/list?section=policy",
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        /*
        |--------------------------------------------------------------------------
        | SETTINGS
        |--------------------------------------------------------------------------
        */

        if (
          settingsResponse.ok
        ) {
          const data =
            (await settingsResponse.json()) as
              SiteSettingsResponse;

          if (
            !cancelled &&
            data.success &&
            data.settings
          ) {
            setSettings({
              ...DEFAULT_SETTINGS,

              ...data.settings,

              supportEmail:
                data.settings
                  .supportEmail ||
                ORIGINAL_DETAILS.email,

              contactEmail:
                data.settings
                  .contactEmail ||
                ORIGINAL_DETAILS.email,

              productQueryNumber:
                data.settings
                  .productQueryNumber ||
                ORIGINAL_DETAILS.productPhone,

              deliveryQueryNumber:
                data.settings
                  .deliveryQueryNumber ||
                ORIGINAL_DETAILS.deliveryPhone,

              paymentRefundNumber:
                data.settings
                  .paymentRefundNumber ||
                ORIGINAL_DETAILS.paymentPhone,

              instagramUrl:
                data.settings
                  .instagramUrl ||
                ORIGINAL_DETAILS.instagram,

              facebookUrl:
                data.settings
                  .facebookUrl ||
                ORIGINAL_DETAILS.facebook,

              youtubeUrl:
                data.settings
                  .youtubeUrl ||
                ORIGINAL_DETAILS.youtube,
            });
          }
        }

        /*
        |--------------------------------------------------------------------------
        | HELP
        |--------------------------------------------------------------------------
        */

        if (
          helpResponse.ok
        ) {
          const data =
            (await helpResponse.json()) as
              CmsListResponse;

          if (
            !cancelled &&
            data.success &&
            Array.isArray(
              data.pages
            ) &&
            data.pages.length >
              0
          ) {
            setHelpPages(
              sortPages(
                data.pages
              )
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | POLICIES
        |--------------------------------------------------------------------------
        */

        if (
          policyResponse.ok
        ) {
          const data =
            (await policyResponse.json()) as
              CmsListResponse;

          if (
            !cancelled &&
            data.success &&
            Array.isArray(
              data.pages
            ) &&
            data.pages.length >
              0
          ) {
            setPolicyPages(
              sortPages(
                data.pages
              )
            );
          }
        }
      } catch (error) {
        console.error(
          "FOOTER LOAD ERROR:",
          error
        );
      }
    }

    void loadFooter();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SCROLL TOP
  |--------------------------------------------------------------------------
  */

  function scrollToTop() {
    window.scrollTo({
      top: 0,

      behavior:
        "smooth",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | VALUES
  |--------------------------------------------------------------------------
  */

  const storeName =
    settings.storeName ||
    "SilentGEN";

  const supportEmail =
    settings.supportEmail ||
    settings.contactEmail ||
    ORIGINAL_DETAILS.email;

  const productQueryPhone =
    settings.productQueryNumber ||
    ORIGINAL_DETAILS.productPhone;

  const deliveryQueryPhone =
    settings.deliveryQueryNumber ||
    ORIGINAL_DETAILS.deliveryPhone;

  const paymentRefundPhone =
    settings.paymentRefundNumber ||
    ORIGINAL_DETAILS.paymentPhone;

  const productPhoneDisplay =
    formatPhone(
      productQueryPhone,
      ORIGINAL_DETAILS
        .productPhoneDisplay
    );

  const deliveryPhoneDisplay =
    formatPhone(
      deliveryQueryPhone,
      ORIGINAL_DETAILS
        .deliveryPhoneDisplay
    );

  const paymentPhoneDisplay =
    formatPhone(
      paymentRefundPhone,
      ORIGINAL_DETAILS
        .paymentPhoneDisplay
    );

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP
  |--------------------------------------------------------------------------
  */

  const whatsappUrl =
    useMemo(() => {
      const number =
        String(
          settings.whatsappNumber ||
            ""
        ).replace(
          /\D/g,
          ""
        );

      if (!number) {
        return (
          ORIGINAL_DETAILS.whatsapp
        );
      }

      const message =
        String(
          settings.whatsappMessage ||
            ""
        ).trim();

      if (!message) {
        return `https://wa.me/${number}`;
      }

      return (
        `https://wa.me/${number}` +
        `?text=${encodeURIComponent(
          message
        )}`
      );
    }, [
      settings.whatsappNumber,
      settings.whatsappMessage,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SOCIAL
  |--------------------------------------------------------------------------
  */

  const instagramUrl =
    settings.instagramUrl ||
    ORIGINAL_DETAILS.instagram;

  const facebookUrl =
    settings.facebookUrl ||
    ORIGINAL_DETAILS.facebook;

  const youtubeUrl =
    settings.youtubeUrl ||
    ORIGINAL_DETAILS.youtube;

  const returnText =
    settings.returnDays >
    0
      ? `${settings.returnDays}-day return support`
      : "Simple return process";

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <footer className="border-t border-gray-200 bg-white text-gray-900">
      {/*
      |--------------------------------------------------------------------------
      | TOP SERVICE STRIP
      |--------------------------------------------------------------------------
      */}

      <div className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 px-4 sm:grid-cols-2 lg:grid-cols-4">
          <ServiceItem
            icon={
              <Truck
                size={20}
              />
            }
            title="Fast Delivery"
            description="Reliable delivery service"
            className="border-b border-gray-200 sm:border-r lg:border-b-0"
          />

          <ServiceItem
            icon={
              <RotateCcw
                size={20}
              />
            }
            title="Easy Returns"
            description={
              returnText
            }
            className="border-b border-gray-200 lg:border-r lg:border-b-0"
          />

          <ServiceItem
            icon={
              <ShieldCheck
                size={20}
              />
            }
            title="Secure Shopping"
            description="Safe & secure checkout"
            className="border-b border-gray-200 sm:border-r sm:border-b-0"
          />

          <ServiceItem
            icon={
              <MessageCircle
                size={20}
              />
            }
            title="Customer Support"
            description={
              settings.supportHours ||
              "We're here to help"
            }
          />
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | MAIN FOOTER
      |--------------------------------------------------------------------------
      */}

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr_1.3fr]">
          {/*
          |--------------------------------------------------------------------------
          | BRAND
          |--------------------------------------------------------------------------
          */}

          <div>
            <Link
              href="/"
              className="inline-block text-3xl font-black tracking-[0.2em] text-black"
            >
              {storeName}
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-500">
              Premium fashion for
              the modern
              generation. Discover
              timeless styles,
              quality fabrics and
              effortless everyday
              fashion.
            </p>

            <a
              href={`mailto:${supportEmail}`}
              className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-gray-700 transition hover:text-black"
            >
              <Mail
                size={17}
              />

              <span className="break-all">
                {supportEmail}
              </span>
            </a>

            {settings.customerCareNumber && (
              <a
                href={phoneHref(
                  settings.customerCareNumber
                )}
                className="mt-3 flex w-fit items-center gap-3 text-sm font-medium text-gray-700 transition hover:text-black"
              >
                <Phone
                  size={17}
                />

                <span>
                  {formatPhone(
                    settings.customerCareNumber,
                    settings.customerCareNumber
                  )}
                </span>
              </a>
            )}

            <div className="mt-7">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-black">
                Follow{" "}
                {storeName}
              </p>

              <div className="flex flex-wrap gap-2.5">
                <SocialButton
                  href={
                    instagramUrl
                  }
                  label="Instagram"
                >
                  <InstagramIcon />
                </SocialButton>

                <SocialButton
                  href={
                    facebookUrl
                  }
                  label="Facebook"
                >
                  <FacebookIcon />
                </SocialButton>

                <SocialButton
                  href={
                    youtubeUrl
                  }
                  label="YouTube"
                >
                  <YoutubeIcon />
                </SocialButton>

                <SocialButton
                  href={
                    whatsappUrl
                  }
                  label="WhatsApp"
                >
                  <WhatsAppIcon />
                </SocialButton>
              </div>
            </div>

            {settings.businessAddress && (
              <div className="mt-6 flex items-start gap-3 text-sm text-gray-500">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p className="whitespace-pre-line leading-6">
                  {
                    settings.businessAddress
                  }
                </p>
              </div>
            )}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | SHOP
          |--------------------------------------------------------------------------
          */}

          <FooterSection title="Shop">
            <FooterLink href="/">
              Home
            </FooterLink>

            <FooterLink href="/shop">
              Shop All
            </FooterLink>

            <FooterLink href="/shop?sort=newest">
              New Arrivals
            </FooterLink>

            <FooterLink href="/shop?sort=best-sellers">
              Best Sellers
            </FooterLink>

            <FooterLink href="/shop?featured=true">
              Featured Collection
            </FooterLink>
          </FooterSection>

          {/*
          |--------------------------------------------------------------------------
          | CUSTOMER
          |--------------------------------------------------------------------------
          */}

          <FooterSection title="Customer">
            <FooterLink href="/account">
              <span className="inline-flex items-center gap-2">
                <User
                  size={14}
                />

                My Account
              </span>
            </FooterLink>

            <FooterLink href="/account/orders">
              <span className="inline-flex items-center gap-2">
                <Package
                  size={14}
                />

                My Orders
              </span>
            </FooterLink>

            <FooterLink href="/wishlist">
              <span className="inline-flex items-center gap-2">
                <Heart
                  size={14}
                />

                Wishlist
              </span>
            </FooterLink>

            <FooterLink href="/cart">
              <span className="inline-flex items-center gap-2">
                <ShoppingBag
                  size={14}
                />

                Bag
              </span>
            </FooterLink>

            <FooterLink href="/account/orders">
              <span className="inline-flex items-center gap-2">
                <MapPin
                  size={14}
                />

                Track Order
              </span>
            </FooterLink>
          </FooterSection>

          {/*
          |--------------------------------------------------------------------------
          | HELP & SUPPORT
          |--------------------------------------------------------------------------
          */}

          <FooterSection title="Help & Support">
            {helpPages.map(
              (page) => {
                if (
                  page.pageType ===
                    "whatsapp" ||
                  page.slug ===
                    "whatsapp"
                ) {
                  return (
                    <FooterLink
                      key={
                        page._id ||
                        page.slug
                      }
                      href={
                        whatsappUrl
                      }
                      external
                    >
                      <span className="inline-flex items-center gap-2">
                        <WhatsAppIcon
                          size={14}
                        />

                        {
                          page.title
                        }
                      </span>
                    </FooterLink>
                  );
                }

                if (
                  page.pageType ===
                    "external" &&
                  page.externalUrl
                ) {
                  return (
                    <FooterLink
                      key={
                        page._id ||
                        page.slug
                      }
                      href={
                        page.externalUrl
                      }
                      external
                    >
                      <span className="inline-flex items-center gap-2">
                        <HelpLinkIcon
                          slug={
                            page.slug
                          }
                        />

                        {
                          page.title
                        }
                      </span>
                    </FooterLink>
                  );
                }

                return (
                  <FooterLink
                    key={
                      page._id ||
                      page.slug
                    }
                    href={`/help/${page.slug}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <HelpLinkIcon
                        slug={
                          page.slug
                        }
                      />

                      {
                        page.title
                      }
                    </span>
                  </FooterLink>
                );
              }
            )}
          </FooterSection>

          {/*
          |--------------------------------------------------------------------------
          | POLICIES
          |--------------------------------------------------------------------------
          */}

          <FooterSection title="Policies">
            {policyPages.map(
              (page) => {
                if (
                  page.pageType ===
                    "external" &&
                  page.externalUrl
                ) {
                  return (
                    <FooterLink
                      key={
                        page._id ||
                        page.slug
                      }
                      href={
                        page.externalUrl
                      }
                      external
                    >
                      {
                        page.title
                      }
                    </FooterLink>
                  );
                }

                return (
                  <FooterLink
                    key={
                      page._id ||
                      page.slug
                    }
                    href={`/policies/${page.slug}`}
                  >
                    {
                      page.title
                    }
                  </FooterLink>
                );
              }
            )}
          </FooterSection>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | CONTACT BAR
      |--------------------------------------------------------------------------
      */}

      <div className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h3 className="text-sm font-bold text-black">
              Need Help?
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Contact{" "}
              {storeName}{" "}
              customer support.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={phoneHref(
                productQueryPhone
              )}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black"
            >
              <Phone
                size={14}
              />

              Product:

              <span>
                {
                  productPhoneDisplay
                }
              </span>
            </a>

            <a
              href={phoneHref(
                deliveryQueryPhone
              )}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black"
            >
              <Truck
                size={14}
              />

              Delivery:

              <span>
                {
                  deliveryPhoneDisplay
                }
              </span>
            </a>

            <a
              href={phoneHref(
                paymentRefundPhone
              )}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black"
            >
              <WalletCards
                size={14}
              />

              Payment:

              <span>
                {
                  paymentPhoneDisplay
                }
              </span>
            </a>

            <a
              href={
                whatsappUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black"
            >
              <WhatsAppIcon
                size={14}
              />

              WhatsApp
            </a>

            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
            >
              <Mail
                size={14}
              />

              Email Us
            </a>
          </div>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | SUPPORT HOURS
      |--------------------------------------------------------------------------
      */}

      {settings.supportHours && (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 text-xs text-gray-500 sm:px-6 lg:px-8">
            <MessageCircle
              size={15}
              className="shrink-0"
            />

            <span className="font-semibold text-gray-700">
              Support Hours:
            </span>

            <span>
              {
                settings.supportHours
              }
            </span>
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | BOTTOM BAR
      |--------------------------------------------------------------------------
      */}

      <div className="bg-black text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="text-xs text-gray-400">
            ©{" "}
            {new Date().getFullYear()}{" "}
            {storeName}. All
            rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/policies/privacy-policy"
              className="text-xs text-gray-400 transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/policies/terms-conditions"
              className="text-xs text-gray-400 transition hover:text-white"
            >
              Terms
            </Link>

            <Link
              href="/policies/refund-policy"
              className="text-xs text-gray-400 transition hover:text-white"
            >
              Refund
            </Link>

            <button
              type="button"
              onClick={
                scrollToTop
              }
              className="inline-flex items-center gap-2 text-xs font-semibold text-white transition hover:text-gray-300"
            >
              Back to top

              <ArrowUp
                size={14}
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}