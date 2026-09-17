"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Headphones,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type CmsSection =
  | "help"
  | "policy";

type CmsPageType =
  | "content"
  | "external"
  | "whatsapp";

type CmsPage = {
  id: string;

  title: string;

  slug: string;

  section: CmsSection;

  pageType: CmsPageType;

  shortDescription: string;

  content: string;

  sortOrder: number;

  icon: string;

  seo: {
    title: string;

    description: string;
  };

  targetUrl: string;

  createdAt?: string;

  updatedAt?: string;
};

type CmsPageResponse = {
  success: boolean;

  page?: CmsPage;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type PublicCmsPageProps = {
  slug: string;

  expectedSection:
    | "help"
    | "policy";
};

/*
|--------------------------------------------------------------------------
| DATE FORMAT
|--------------------------------------------------------------------------
*/

function formatDate(
  value?: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",

      month: "long",

      year: "numeric",
    }
  ).format(date);
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function PublicCmsPage({
  slug,
  expectedSection,
}: PublicCmsPageProps) {
  const [
    page,
    setPage,
  ] =
    useState<CmsPage | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    async function loadPage() {
      try {
        setLoading(true);

        setError("");

        const response =
          await fetch(
            `/api/content/${encodeURIComponent(
              slug
            )}`,
            {
              method: "GET",

              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as
            CmsPageResponse;

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data.success ||
          !data.page
        ) {
          setError(
            data.message ||
              "Page not found."
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | SECTION SAFETY
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | /policies/contact-us
        |
        | should not show a help page.
        |
        |--------------------------------------------------------------------------
        */

        if (
          data.page.section !==
          expectedSection
        ) {
          setError(
            "Page not found."
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | EXTERNAL / WHATSAPP
        |--------------------------------------------------------------------------
        */

        if (
          data.page.pageType ===
            "external" ||
          data.page.pageType ===
            "whatsapp"
        ) {
          if (
            data.page.targetUrl
          ) {
            window.location.replace(
              data.page.targetUrl
            );

            return;
          }

          setError(
            data.page.pageType ===
              "whatsapp"
              ? "WhatsApp contact is not configured yet."
              : "This link is not configured yet."
          );

          return;
        }

        setPage(
          data.page
        );
      } catch (error) {
        console.error(
          "CMS PAGE LOAD ERROR:",
          error
        );

        if (
          !cancelled
        ) {
          setError(
            "Unable to load this page."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [
    slug,
    expectedSection,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-[65vh] bg-[#f8f8f8]">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-24">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2
              size={22}
              className="animate-spin"
            />

            <span>
              Loading...
            </span>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR / NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !page
  ) {
    return (
      <main className="min-h-[65vh] bg-[#f8f8f8]">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
            <FileText
              size={24}
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-950">
            Page Not Found
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-500">
            {error ||
              "The requested page is not available."}
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            <ArrowLeft
              size={18}
            />

            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LABEL
  |--------------------------------------------------------------------------
  */

  const sectionLabel =
    page.section ===
    "policy"
      ? "Policies"
      : "Help & Support";

  const updatedDate =
    formatDate(
      page.updatedAt
    );

  /*
  |--------------------------------------------------------------------------
  | CONTENT PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      {/*
      |--------------------------------------------------------------------------
      | HERO
      |--------------------------------------------------------------------------
      */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/"
            className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-black"
          >
            <ArrowLeft
              size={16}
            />

            Back to SilentGEN
          </Link>

          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white sm:flex">
              {page.section ===
              "policy" ? (
                <FileText
                  size={22}
                />
              ) : (
                <Headphones
                  size={22}
                />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                {sectionLabel}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                {page.title}
              </h1>

              {page.shortDescription && (
                <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600">
                  {
                    page.shortDescription
                  }
                </p>
              )}

              {updatedDate && (
                <p className="mt-4 text-xs text-gray-400">
                  Last updated:{" "}
                  {updatedDate}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | CONTENT
      |--------------------------------------------------------------------------
      */}

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div
            className="
              px-5 py-7
              text-[15px]
              leading-7
              text-gray-700

              sm:px-8
              sm:py-9

              md:px-10
              md:py-10

              [&_a]:font-medium
              [&_a]:text-black
              [&_a]:underline
              [&_a]:underline-offset-4

              [&_blockquote]:my-6
              [&_blockquote]:border-l-4
              [&_blockquote]:border-black
              [&_blockquote]:bg-gray-50
              [&_blockquote]:px-5
              [&_blockquote]:py-4

              [&_h1]:mb-5
              [&_h1]:mt-2
              [&_h1]:text-3xl
              [&_h1]:font-bold
              [&_h1]:tracking-tight
              [&_h1]:text-gray-950

              [&_h2]:mb-3
              [&_h2]:mt-8
              [&_h2]:text-xl
              [&_h2]:font-bold
              [&_h2]:text-gray-950

              [&_h3]:mb-2
              [&_h3]:mt-6
              [&_h3]:text-lg
              [&_h3]:font-semibold
              [&_h3]:text-gray-950

              [&_hr]:my-8
              [&_hr]:border-gray-200

              [&_li]:mb-2

              [&_ol]:my-4
              [&_ol]:list-decimal
              [&_ol]:pl-6

              [&_p]:mb-4

              [&_strong]:font-semibold
              [&_strong]:text-gray-950

              [&_table]:my-6
              [&_table]:w-full
              [&_table]:border-collapse

              [&_td]:border
              [&_td]:border-gray-200
              [&_td]:p-3

              [&_th]:border
              [&_th]:border-gray-200
              [&_th]:bg-gray-50
              [&_th]:p-3
              [&_th]:text-left
              [&_th]:font-semibold

              [&_ul]:my-4
              [&_ul]:list-disc
              [&_ul]:pl-6
            "
            dangerouslySetInnerHTML={{
              __html:
                page.content,
            }}
          />
        </article>

        {/*
        |--------------------------------------------------------------------------
        | SUPPORT CARD
        |--------------------------------------------------------------------------
        */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-gray-950">
                Need more help?
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Visit SilentGEN
                Help & Support.
              </p>
            </div>

            <Link
              href="/help/contact-us"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-black px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              Contact Us

              <ExternalLink
                size={15}
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}