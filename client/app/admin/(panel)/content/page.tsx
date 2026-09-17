"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  CirclePlus,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import RichTextEditor from "@/components/admin/RichTextEditor";

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

type CmsPageStatus =
  | "Draft"
  | "Published";

type CmsPage = {
  _id: string;

  title: string;

  slug: string;

  section: CmsSection;

  pageType: CmsPageType;

  shortDescription: string;

  content: string;

  status: CmsPageStatus;

  sortOrder: number;

  seoTitle: string;

  seoDescription: string;

  externalUrl: string;

  whatsappNumber: string;

  whatsappMessage: string;

  icon: string;

  isSystem: boolean;

  createdAt?: string;

  updatedAt?: string;
};

type CmsListResponse = {
  success: boolean;

  pages?: CmsPage[];

  message?: string;
};

type CmsSingleResponse = {
  success: boolean;

  page?: CmsPage;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| EDITOR FORM
|--------------------------------------------------------------------------
*/

type EditorForm = {
  _id: string;

  title: string;

  slug: string;

  section: CmsSection;

  pageType: CmsPageType;

  shortDescription: string;

  content: string;

  status: CmsPageStatus;

  sortOrder: number;

  seoTitle: string;

  seoDescription: string;

  externalUrl: string;

  whatsappNumber: string;

  whatsappMessage: string;

  icon: string;

  isSystem: boolean;
};

/*
|--------------------------------------------------------------------------
| EMPTY FORM
|--------------------------------------------------------------------------
*/

const EMPTY_FORM: EditorForm = {
  _id: "",

  title: "",

  slug: "",

  section:
    "help",

  pageType:
    "content",

  shortDescription:
    "",

  content:
    "",

  status:
    "Draft",

  sortOrder:
    0,

  seoTitle:
    "",

  seoDescription:
    "",

  externalUrl:
    "",

  whatsappNumber:
    "",

  whatsappMessage:
    "",

  icon:
    "",

  isSystem:
    false,
};

/*
|--------------------------------------------------------------------------
| CMS VARIABLES
|--------------------------------------------------------------------------
*/

const CMS_VARIABLES = [
  "{{storeName}}",

  "{{businessName}}",

  "{{businessAddress}}",

  "{{legalBusinessName}}",

  "{{gstNumber}}",

  "{{supportEmail}}",

  "{{contactEmail}}",

  "{{orderEmail}}",

  "{{returnRefundEmail}}",

  "{{supportMobile}}",

  "{{customerCareNumber}}",

  "{{productQueryNumber}}",

  "{{deliveryQueryNumber}}",

  "{{paymentRefundNumber}}",

  "{{whatsappNumber}}",

  "{{supportHours}}",

  "{{currency}}",

  "{{returnDays}}",

  "{{exchangeDays}}",

  "{{shippingCharge}}",

  "{{freeShippingMinimum}}",
];

/*
|--------------------------------------------------------------------------
| CREATE SLUG
|--------------------------------------------------------------------------
*/

function createSlug(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function AdminContentPage() {
  /*
  |--------------------------------------------------------------------------
  | PAGES
  |--------------------------------------------------------------------------
  */

  const [
    pages,
    setPages,
  ] =
    useState<CmsPage[]>(
      []
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | SELECTED PAGE
  |--------------------------------------------------------------------------
  */

  const [
    selectedId,
    setSelectedId,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] =
    useState<EditorForm>(
      EMPTY_FORM
    );

  const [
    isCreating,
    setIsCreating,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    sectionFilter,
    setSectionFilter,
  ] =
    useState<
      | "all"
      | CmsSection
    >("all");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | "all"
      | CmsPageStatus
    >("all");

  /*
  |--------------------------------------------------------------------------
  | MESSAGE
  |--------------------------------------------------------------------------
  */

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadPages();
  }, []);

  async function loadPages() {
    try {
      setLoading(
        true
      );

      setMessage(
        ""
      );

      const response =
        await fetch(
          "/api/admin/content",
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data =
        (await response.json()) as
          CmsListResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        setSuccess(
          false
        );

        setMessage(
          data.message ||
            "Unable to load content."
        );

        return;
      }

      const nextPages =
        Array.isArray(
          data.pages
        )
          ? data.pages
          : [];

      setPages(
        nextPages
      );

      /*
      |--------------------------------------------------------------------------
      | AUTO SELECT FIRST PAGE
      |--------------------------------------------------------------------------
      */

      if (
        !selectedId &&
        nextPages.length >
          0 &&
        !isCreating
      ) {
        selectPage(
          nextPages[0]
        );
      }
    } catch (
      error
    ) {
      console.error(
        "CONTENT LOAD ERROR:",
        error
      );

      setSuccess(
        false
      );

      setMessage(
        "Unable to load content."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILTERED PAGES
  |--------------------------------------------------------------------------
  */

  const filteredPages =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return pages.filter(
        (page) => {
          /*
          |--------------------------------------------------------------------------
          | SECTION
          |--------------------------------------------------------------------------
          */

          if (
            sectionFilter !==
              "all" &&
            page.section !==
              sectionFilter
          ) {
            return false;
          }

          /*
          |--------------------------------------------------------------------------
          | STATUS
          |--------------------------------------------------------------------------
          */

          if (
            statusFilter !==
              "all" &&
            page.status !==
              statusFilter
          ) {
            return false;
          }

          /*
          |--------------------------------------------------------------------------
          | SEARCH
          |--------------------------------------------------------------------------
          */

          if (!query) {
            return true;
          }

          return (
            page.title
              .toLowerCase()
              .includes(
                query
              ) ||
            page.slug
              .toLowerCase()
              .includes(
                query
              ) ||
            page.shortDescription
              ?.toLowerCase()
              .includes(
                query
              )
          );
        }
      );
    }, [
      pages,
      search,
      sectionFilter,
      statusFilter,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SELECT PAGE
  |--------------------------------------------------------------------------
  */

  function selectPage(
    page: CmsPage
  ) {
    setSelectedId(
      page._id
    );

    setIsCreating(
      false
    );

    setMessage(
      ""
    );

    setForm({
      _id:
        page._id,

      title:
        page.title ||
        "",

      slug:
        page.slug ||
        "",

      section:
        page.section,

      pageType:
        page.pageType,

      shortDescription:
        page.shortDescription ||
        "",

      content:
        page.content ||
        "",

      status:
        page.status ||
        "Draft",

      sortOrder:
        Number(
          page.sortOrder ||
            0
        ),

      seoTitle:
        page.seoTitle ||
        "",

      seoDescription:
        page.seoDescription ||
        "",

      externalUrl:
        page.externalUrl ||
        "",

      whatsappNumber:
        page.whatsappNumber ||
        "",

      whatsappMessage:
        page.whatsappMessage ||
        "",

      icon:
        page.icon ||
        "",

      isSystem:
        Boolean(
          page.isSystem
        ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | NEW PAGE
  |--------------------------------------------------------------------------
  */

  function startNewPage() {
    setSelectedId(
      ""
    );

    setIsCreating(
      true
    );

    setMessage(
      ""
    );

    /*
    |--------------------------------------------------------------------------
    | NEXT SORT ORDER
    |--------------------------------------------------------------------------
    */

    const maxSortOrder =
      pages.reduce(
        (
          maximum,
          page
        ) =>
          Math.max(
            maximum,
            Number(
              page.sortOrder ||
                0
            )
          ),
        0
      );

    setForm({
      ...EMPTY_FORM,

      sortOrder:
        maxSortOrder +
        1,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  function updateField<
    K extends keyof EditorForm
  >(
    field: K,
    value: EditorForm[K]
  ) {
    setForm(
      (
        previous
      ) => ({
        ...previous,

        [field]:
          value,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TITLE CHANGE
  |--------------------------------------------------------------------------
  */

  function handleTitleChange(
    value: string
  ) {
    setForm(
      (
        previous
      ) => ({
        ...previous,

        title:
          value,

        /*
        |--------------------------------------------------------------------------
        | AUTO SLUG ONLY FOR CUSTOM PAGE
        |--------------------------------------------------------------------------
        */

        slug:
          !previous.isSystem &&
          (
            isCreating ||
            !previous.slug
          )
            ? createSlug(
                value
              )
            : previous.slug,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE PAGE
  |--------------------------------------------------------------------------
  */

  async function savePage() {
    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    if (
      !form.title.trim()
    ) {
      setSuccess(
        false
      );

      setMessage(
        "Page title is required."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG
    |--------------------------------------------------------------------------
    */

    if (
      !form.slug.trim()
    ) {
      setSuccess(
        false
      );

      setMessage(
        "Page slug is required."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      /*
      |--------------------------------------------------------------------------
      | ENDPOINT
      |--------------------------------------------------------------------------
      */

      const endpoint =
        isCreating
          ? "/api/admin/content"
          : `/api/admin/content/${form._id}`;

      const method =
        isCreating
          ? "POST"
          : "PUT";

      /*
      |--------------------------------------------------------------------------
      | REQUEST
      |--------------------------------------------------------------------------
      */

      const response =
        await fetch(
          endpoint,
          {
            method,

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                form
              ),
          }
        );

      const data =
        (await response.json()) as
          CmsSingleResponse;

      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !data.success ||
        !data.page
      ) {
        setSuccess(
          false
        );

        setMessage(
          data.message ||
            "Unable to save page."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      setSuccess(
        true
      );

      setMessage(
        data.message ||
          "Page saved successfully."
      );

      setIsCreating(
        false
      );

      /*
      |--------------------------------------------------------------------------
      | KEEP SAVED PAGE SELECTED
      |--------------------------------------------------------------------------
      */

      setSelectedId(
        data.page._id
      );

      setForm({
        _id:
          data.page._id,

        title:
          data.page.title ||
          "",

        slug:
          data.page.slug ||
          "",

        section:
          data.page.section,

        pageType:
          data.page.pageType,

        shortDescription:
          data.page
            .shortDescription ||
          "",

        content:
          data.page.content ||
          "",

        status:
          data.page.status ||
          "Draft",

        sortOrder:
          Number(
            data.page.sortOrder ||
              0
          ),

        seoTitle:
          data.page.seoTitle ||
          "",

        seoDescription:
          data.page
            .seoDescription ||
          "",

        externalUrl:
          data.page.externalUrl ||
          "",

        whatsappNumber:
          data.page
            .whatsappNumber ||
          "",

        whatsappMessage:
          data.page
            .whatsappMessage ||
          "",

        icon:
          data.page.icon ||
          "",

        isSystem:
          Boolean(
            data.page.isSystem
          ),
      });

      /*
      |--------------------------------------------------------------------------
      | REFRESH LIST WITHOUT CHANGING EDITOR
      |--------------------------------------------------------------------------
      */

      try {
        const listResponse =
          await fetch(
            "/api/admin/content",
            {
              method:
                "GET",

              cache:
                "no-store",

              credentials:
                "include",
            }
          );

        const listData =
          (await listResponse.json()) as
            CmsListResponse;

        if (
          listResponse.ok &&
          listData.success &&
          Array.isArray(
            listData.pages
          )
        ) {
          setPages(
            listData.pages
          );
        }
      } catch (
        refreshError
      ) {
        console.error(
          "CONTENT LIST REFRESH ERROR:",
          refreshError
        );
      }
    } catch (
      error
    ) {
      console.error(
        "CONTENT SAVE ERROR:",
        error
      );

      setSuccess(
        false
      );

      setMessage(
        "Unable to save page."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE PAGE
  |--------------------------------------------------------------------------
  */

  async function deletePage() {
    if (
      !form._id ||
      form.isSystem
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${form.title}"?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setDeleting(
        true
      );

      setMessage(
        ""
      );

      const response =
        await fetch(
          `/api/admin/content/${form._id}`,
          {
            method:
              "DELETE",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setSuccess(
          false
        );

        setMessage(
          data.message ||
            "Unable to delete page."
        );

        return;
      }

      setSuccess(
        true
      );

      setMessage(
        data.message ||
          "Page deleted."
      );

      setForm({
        ...EMPTY_FORM,
      });

      setSelectedId(
        ""
      );

      setIsCreating(
        false
      );

      /*
      |--------------------------------------------------------------------------
      | RELOAD
      |--------------------------------------------------------------------------
      */

      const listResponse =
        await fetch(
          "/api/admin/content",
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const listData =
        (await listResponse.json()) as
          CmsListResponse;

      const nextPages =
        listResponse.ok &&
        listData.success &&
        Array.isArray(
          listData.pages
        )
          ? listData.pages
          : [];

      setPages(
        nextPages
      );

      if (
        nextPages.length >
        0
      ) {
        selectPage(
          nextPages[0]
        );
      }
    } catch (
      error
    ) {
      console.error(
        "CONTENT DELETE ERROR:",
        error
      );

      setSuccess(
        false
      );

      setMessage(
        "Unable to delete page."
      );
    } finally {
      setDeleting(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PREVIEW URL
  |--------------------------------------------------------------------------
  */

  const previewUrl =
    form.section ===
    "policy"
      ? `/policies/${form.slug}`
      : `/help/${form.slug}`;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            size={22}
            className="animate-spin"
          />

          Loading Content...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-black p-3 text-white">
              <FileText
                size={
                  23
                }
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-950">
                Content
                Management
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage Help,
                Support and
                Policy pages.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={
              loading
            }
            onClick={() =>
              void loadPages()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:opacity-50"
          >
            <RefreshCcw
              size={
                17
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={
              startNewPage
            }
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <CirclePlus
              size={
                17
              }
            />

            New Page
          </button>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | MESSAGE
      |--------------------------------------------------------------------------
      */}

      {message && (
        <div
          className={`mb-6 flex items-center justify-between gap-4 rounded-xl border p-4 ${
            success
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {success && (
              <CheckCircle2
                size={
                  18
                }
              />
            )}

            <span className="text-sm font-medium">
              {
                message
              }
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setMessage(
                ""
              )
            }
          >
            <X
              size={
                18
              }
            />
          </button>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | MAIN GRID
      |--------------------------------------------------------------------------
      */}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/*
        |--------------------------------------------------------------------------
        | LEFT SIDEBAR
        |--------------------------------------------------------------------------
        */}

        <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            {/*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */}

            <div className="relative">
              <Search
                size={
                  17
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Search pages..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-black"
              />
            </div>

            {/*
            |--------------------------------------------------------------------------
            | FILTERS
            |--------------------------------------------------------------------------
            */}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                value={
                  sectionFilter
                }
                onChange={(
                  event
                ) =>
                  setSectionFilter(
                    event
                      .target
                      .value as
                      | "all"
                      | CmsSection
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
              >
                <option value="all">
                  All Sections
                </option>

                <option value="help">
                  Help
                </option>

                <option value="policy">
                  Policies
                </option>
              </select>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value as
                      | "all"
                      | CmsPageStatus
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
              >
                <option value="all">
                  All Status
                </option>

                <option value="Published">
                  Published
                </option>

                <option value="Draft">
                  Draft
                </option>
              </select>
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | PAGE LIST
          |--------------------------------------------------------------------------
          */}

          <div className="max-h-[75vh] overflow-y-auto p-2">
            {filteredPages.length ===
            0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No pages found.
              </div>
            ) : (
              filteredPages.map(
                (
                  page
                ) => {
                  const active =
                    !isCreating &&
                    selectedId ===
                      page._id;

                  return (
                    <button
                      key={
                        page._id
                      }
                      type="button"
                      onClick={() =>
                        selectPage(
                          page
                        )
                      }
                      className={`mb-1 w-full rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-lg p-2 ${
                            active
                              ? "bg-white/10"
                              : "bg-gray-100"
                          }`}
                        >
                          {page.section ===
                          "policy" ? (
                            <ShieldCheck
                              size={
                                16
                              }
                            />
                          ) : (
                            <HelpCircle
                              size={
                                16
                              }
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">
                              {
                                page.title
                              }
                            </p>

                            {page.isSystem && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  active
                                    ? "bg-white/15"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                System
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 truncate text-xs ${
                              active
                                ? "text-gray-300"
                                : "text-gray-400"
                            }`}
                          >
                            /
                            {
                              page.slug
                            }
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                page.status ===
                                "Published"
                                  ? active
                                    ? "bg-green-400/20 text-green-200"
                                    : "bg-green-100 text-green-700"
                                  : active
                                    ? "bg-yellow-400/20 text-yellow-200"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {
                                page.status
                              }
                            </span>

                            <span
                              className={`text-[10px] uppercase ${
                                active
                                  ? "text-gray-300"
                                  : "text-gray-400"
                              }`}
                            >
                              {
                                page.section
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </aside>

        {/*
        |--------------------------------------------------------------------------
        | EDITOR AREA
        |--------------------------------------------------------------------------
        */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/*
          |--------------------------------------------------------------------------
          | EDITOR HEADER
          |--------------------------------------------------------------------------
          */}

          <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                {isCreating
                  ? "Create Page"
                  : form.title ||
                    "Select a page"}
              </h2>

              {form.isSystem && (
                <p className="mt-1 text-xs text-gray-500">
                  System page:
                  slug, section
                  and page type
                  are protected.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/*
              |--------------------------------------------------------------------------
              | PREVIEW
              |--------------------------------------------------------------------------
              */}

              {!isCreating &&
                form.slug &&
                form.status ===
                  "Published" && (
                  <Link
                    href={
                      previewUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-black"
                  >
                    <ExternalLink
                      size={
                        14
                      }
                    />

                    Preview
                  </Link>
                )}

              {/*
              |--------------------------------------------------------------------------
              | DELETE CUSTOM PAGE
              |--------------------------------------------------------------------------
              */}

              {!isCreating &&
                !form.isSystem &&
                form._id && (
                  <button
                    type="button"
                    disabled={
                      deleting
                    }
                    onClick={() =>
                      void deletePage()
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2
                        size={
                          14
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2
                        size={
                          14
                        }
                      />
                    )}

                    Delete
                  </button>
                )}

              {/*
              |--------------------------------------------------------------------------
              | SAVE
              |--------------------------------------------------------------------------
              */}

              <button
                type="button"
                disabled={
                  saving ||
                  !form.title
                    .trim() ||
                  !form.slug
                    .trim()
                }
                onClick={() =>
                  void savePage()
                }
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Save
                    size={
                      14
                    }
                  />
                )}

                {isCreating
                  ? "Create Page"
                  : "Save Changes"}
              </button>
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | EDITOR BODY
          |--------------------------------------------------------------------------
          */}

          <div className="space-y-8 p-5 md:p-7">
            {/*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */}

            <EditorSection
              title="Page Information"
              description="Basic page settings shown to customers."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Page Title"
                  value={
                    form.title
                  }
                  placeholder="Return Policy"
                  onChange={
                    handleTitleChange
                  }
                />

                <Field
                  label="Slug"
                  value={
                    form.slug
                  }
                  placeholder="return-policy"
                  disabled={
                    form.isSystem
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "slug",
                      createSlug(
                        value
                      )
                    )
                  }
                />

                <SelectField
                  label="Section"
                  value={
                    form.section
                  }
                  disabled={
                    form.isSystem
                  }
                  options={[
                    {
                      label:
                        "Help & Support",

                      value:
                        "help",
                    },

                    {
                      label:
                        "Policies",

                      value:
                        "policy",
                    },
                  ]}
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "section",
                      value as CmsSection
                    )
                  }
                />

                <SelectField
                  label="Page Type"
                  value={
                    form.pageType
                  }
                  disabled={
                    form.isSystem
                  }
                  options={[
                    {
                      label:
                        "Content Page",

                      value:
                        "content",
                    },

                    {
                      label:
                        "External Link",

                      value:
                        "external",
                    },

                    {
                      label:
                        "WhatsApp",

                      value:
                        "whatsapp",
                    },
                  ]}
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "pageType",
                      value as CmsPageType
                    )
                  }
                />

                <SelectField
                  label="Status"
                  value={
                    form.status
                  }
                  options={[
                    {
                      label:
                        "Published",

                      value:
                        "Published",
                    },

                    {
                      label:
                        "Draft",

                      value:
                        "Draft",
                    },
                  ]}
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "status",
                      value as CmsPageStatus
                    )
                  }
                />

                <NumberField
                  label="Sort Order"
                  value={
                    form.sortOrder
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "sortOrder",
                      value
                    )
                  }
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Short Description"
                    value={
                      form.shortDescription
                    }
                    rows={
                      3
                    }
                    placeholder="Short introduction shown below page title."
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "shortDescription",
                        value
                      )
                    }
                  />
                </div>
              </div>
            </EditorSection>

            {/*
            |--------------------------------------------------------------------------
            | RICH TEXT PAGE CONTENT
            |--------------------------------------------------------------------------
            */}

            {form.pageType ===
              "content" && (
              <EditorSection
                title="Page Content"
                description="સીધું લખાણ લખો, paste કરો અથવા Word / PDF file import કરો."
              >
                <RichTextEditor
                  value={
                    form.content
                  }
                  variables={
                    CMS_VARIABLES
                  }
                  onChange={(
                    html
                  ) =>
                    updateField(
                      "content",
                      html
                    )
                  }
                />
              </EditorSection>
            )}

            {/*
            |--------------------------------------------------------------------------
            | EXTERNAL LINK
            |--------------------------------------------------------------------------
            */}

            {form.pageType ===
              "external" && (
              <EditorSection
                title="External Link"
                description="Customer will be redirected to this URL."
              >
                <Field
                  label="External URL"
                  value={
                    form.externalUrl
                  }
                  placeholder="https://..."
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "externalUrl",
                      value
                    )
                  }
                />
              </EditorSection>
            )}

            {/*
            |--------------------------------------------------------------------------
            | WHATSAPP
            |--------------------------------------------------------------------------
            */}

            {form.pageType ===
              "whatsapp" && (
              <EditorSection
                title="WhatsApp"
                description="Leave number empty to use the global WhatsApp number from Settings."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="WhatsApp Number"
                    value={
                      form.whatsappNumber
                    }
                    placeholder="919876543210"
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "whatsappNumber",
                        value
                      )
                    }
                  />

                  <Field
                    label="WhatsApp Message"
                    value={
                      form.whatsappMessage
                    }
                    placeholder="Hello SilentGEN..."
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "whatsappMessage",
                        value
                      )
                    }
                  />
                </div>
              </EditorSection>
            )}

            {/*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */}

            <EditorSection
              title="SEO"
              description="Search engine title and description."
            >
              <div className="space-y-5">
                <Field
                  label="SEO Title"
                  value={
                    form.seoTitle
                  }
                  placeholder="Return Policy | SilentGEN"
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "seoTitle",
                      value
                    )
                  }
                />

                <TextAreaField
                  label="SEO Description"
                  value={
                    form.seoDescription
                  }
                  rows={
                    4
                  }
                  placeholder="SEO description..."
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "seoDescription",
                      value
                    )
                  }
                />
              </div>
            </EditorSection>

            {/*
            |--------------------------------------------------------------------------
            | FINAL SAVE
            |--------------------------------------------------------------------------
            */}

            <div className="flex justify-end border-t border-gray-200 pt-6">
              <button
                type="button"
                disabled={
                  saving ||
                  !form.title
                    .trim() ||
                  !form.slug
                    .trim()
                }
                onClick={() =>
                  void savePage()
                }
                className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={
                        17
                      }
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={
                        17
                      }
                    />

                    {isCreating
                      ? "Create Page"
                      : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| EDITOR SECTION
|--------------------------------------------------------------------------
*/

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;

  description: string;

  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-950">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| FIELD
|--------------------------------------------------------------------------
*/

function Field({
  label,
  value,
  placeholder,
  disabled = false,
  onChange,
}: {
  label: string;

  value: string;

  placeholder?: string;

  disabled?: boolean;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type="text"
        value={
          value
        }
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event
              .target
              .value
          )
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      />
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| SELECT
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;

  value: string;

  options: Array<{
    label: string;

    value: string;
  }>;

  disabled?: boolean;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <select
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event
              .target
              .value
          )
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| NUMBER
|--------------------------------------------------------------------------
*/

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;

  value: number;

  onChange: (
    value: number
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type="number"
        min={
          0
        }
        value={
          value
        }
        onChange={(
          event
        ) => {
          const number =
            Number(
              event
                .target
                .value
            );

          onChange(
            Number.isFinite(
              number
            )
              ? number
              : 0
          );
        }}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
      />
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| TEXTAREA
|--------------------------------------------------------------------------
*/

function TextAreaField({
  label,
  value,
  placeholder,
  rows = 5,
  onChange,
}: {
  label: string;

  value: string;

  placeholder?: string;

  rows?: number;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <textarea
        rows={
          rows
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event
              .target
              .value
          )
        }
        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
      />
    </label>
  );
}