"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type SectionKey =
  | "header"
  | "logo"
  | "hero"
  | "featured"
  | "categories"
  | "gender"
  | "offers"
  | "new-arrivals"
  | "best-sellers"
  | "men-collection"
  | "women-collection"
  | "kids-collection"
  | "seasonal"
  | "why-shop"
  | "newsletter"
  | "footer";

type SectionItem = {
  id: SectionKey;
  name: string;
  description: string;
  enabled: boolean;
};

type ProductSectionData = {
  type?: string;
  title?: string;
  subtitle?: string;
  productIds?: string[];
  enabled?: boolean;
  slider?: boolean;
  sortOrder?: number;
  viewAllText?: string;
  viewAllHref?: string;
  [key: string]: unknown;
};

type CollectionSectionData = {
  enabled?: boolean;
  men?: unknown;
  women?: unknown;
  kids?: unknown;
  [key: string]: unknown;
};

type HomepageData = {
  logo?: {
    enabled?: boolean;
    url?: string;
    alt?: string;
    title?: string;
  };

  header?: {
    enabled?: boolean;
    [key: string]: unknown;
  };

  hero?: {
    enabled?: boolean;
    autoSlide?: boolean;
    slideInterval?: number;
    slides?: unknown[];
    [key: string]: unknown;
  };

  categories?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    items?: unknown[];
    viewAllText?: string;
    viewAllHref?: string;
    [key: string]: unknown;
  };

  gender?: {
    enabled?: boolean;
    title?: string;
    menImage?: unknown;
    womenImage?: unknown;
    kidsImage?: unknown;
    [key: string]: unknown;
  };

  offers?: {
    enabled?: boolean;
    title?: string;
    items?: unknown[];
    [key: string]: unknown;
  };

  productSections?: ProductSectionData[];

  collections?: CollectionSectionData;

  seasonal?: {
    enabled?: boolean;
    title?: string;
    summer?: unknown;
    winter?: unknown;
    festive?: unknown;
    newSeason?: unknown;
    [key: string]: unknown;
  };

  whyShop?: {
    enabled?: boolean;
    title?: string;
    items?: unknown[];
    [key: string]: unknown;
  };

  newsletter?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    buttonText?: string;
    backgroundImage?: unknown;
    [key: string]: unknown;
  };

  footer?: {
    enabled?: boolean;
    [key: string]: unknown;
  };

  settings?: {
    primaryFont?: string;
    headingFont?: string;
    bodyFont?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };

  sectionOrder?: string[];

  isPublished?: boolean;

  [key: string]: unknown;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  homepage?: HomepageData;
};

/*
|--------------------------------------------------------------------------
| DEFAULT SECTION LIST
|--------------------------------------------------------------------------
*/

const DEFAULT_SECTIONS: SectionItem[] = [
  {
    id: "header",
    name: "Header",
    description: "Website navigation and top header",
    enabled: true,
  },
  {
    id: "logo",
    name: "Website Logo",
    description: "Main SilentGEN website logo",
    enabled: true,
  },
  {
    id: "hero",
    name: "Hero Slider",
    description: "Large homepage banner / slider",
    enabled: true,
  },
  {
    id: "featured",
    name: "Featured Products",
    description: "Featured product section",
    enabled: true,
  },
  {
    id: "categories",
    name: "Shop by Category",
    description: "Clothing categories",
    enabled: true,
  },
  {
    id: "gender",
    name: "Shop by Gender",
    description: "Men, women and kids",
    enabled: true,
  },
  {
    id: "offers",
    name: "Offers & Deals",
    description: "Promotional offers and banners",
    enabled: true,
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Latest products",
    enabled: true,
  },
  {
    id: "best-sellers",
    name: "Best Sellers",
    description: "Best selling products",
    enabled: true,
  },
  {
    id: "men-collection",
    name: "Men's Collection",
    description: "Men collection section",
    enabled: true,
  },
  {
    id: "women-collection",
    name: "Women's Collection",
    description: "Women collection section",
    enabled: true,
  },
  {
    id: "kids-collection",
    name: "Kids' Collection",
    description: "Kids collection section",
    enabled: true,
  },
  {
    id: "seasonal",
    name: "Seasonal Collection",
    description: "Summer, winter and festive collections",
    enabled: true,
  },
  {
    id: "why-shop",
    name: "Why Shop SilentGEN",
    description: "Brand benefits and highlights",
    enabled: true,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Newsletter subscription section",
    enabled: true,
  },
  {
    id: "footer",
    name: "Footer",
    description: "Website footer",
    enabled: true,
  },
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function HomePageEditor() {
  const [homepage, setHomepage] =
    useState<HomepageData | null>(null);

  const [sections, setSections] =
    useState<SectionItem[]>(
      DEFAULT_SECTIONS
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState<SectionKey>("header");

  /*
  |--------------------------------------------------------------------------
  | LOAD HOMEPAGE
  |--------------------------------------------------------------------------
  */

  const loadHomepage = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            "/api/admin/homepage",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data: ApiResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load homepage."
          );
        }

        const homepageData =
          data.homepage || {};

        setHomepage(
          homepageData
        );

        const savedOrder =
          Array.isArray(
            homepageData.sectionOrder
          )
            ? homepageData.sectionOrder
            : [];

        const reordered =
          buildSectionsFromOrder(
            savedOrder
          );

        const finalSections =
          reordered.map(
            (section) => ({
              ...section,
              enabled:
                getSectionEnabled(
                  section.id,
                  homepageData
                ),
            })
          );

        setSections(
          finalSections
        );
      } catch (error) {
        console.error(
          "ADMIN HOMEPAGE EDITOR LOAD ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load homepage."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadHomepage();
  }, [loadHomepage]);

  /*
  |--------------------------------------------------------------------------
  | SECTION ORDER
  |--------------------------------------------------------------------------
  */

  const sectionOrder =
    useMemo(
      () =>
        sections.map(
          (section) =>
            section.id
        ),
      [sections]
    );

  /*
  |--------------------------------------------------------------------------
  | MOVE SECTION
  |--------------------------------------------------------------------------
  */

  function moveSection(
    index: number,
    direction: "up" | "down"
  ) {
    setSections(
      (current) => {
        const next = [
          ...current,
        ];

        const targetIndex =
          direction === "up"
            ? index - 1
            : index + 1;

        if (
          targetIndex < 0 ||
          targetIndex >=
            next.length
        ) {
          return current;
        }

        const temp =
          next[index];

        next[index] =
          next[targetIndex];

        next[targetIndex] =
          temp;

        return next;
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TOGGLE SECTION
  |--------------------------------------------------------------------------
  */

  function toggleSection(
    id: SectionKey
  ) {
    setSections(
      (current) =>
        current.map(
          (section) =>
            section.id === id
              ? {
                  ...section,
                  enabled:
                    !section.enabled,
                }
              : section
        )
    );

    setSuccess("");
    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | SELECT SECTION
  |--------------------------------------------------------------------------
  */

  function selectSection(
    id: SectionKey
  ) {
    setSelectedSection(id);
    setError("");
    setSuccess("");
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  async function saveHomepage() {
    if (!homepage) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedHomepage =
        applySectionEnabledStates(
          {
            ...homepage,
          },
          sections
        );

      updatedHomepage.sectionOrder =
        sectionOrder;

      const response =
        await fetch(
          "/api/admin/homepage",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              updatedHomepage
            ),
          }
        );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save homepage."
        );
      }

      const savedHomepage =
        data.homepage ||
        updatedHomepage;

      setHomepage(
        savedHomepage
      );

      /*
      |--------------------------------------------------------------------------
      | SYNC SECTION STATES AFTER SAVE
      |--------------------------------------------------------------------------
      */

      const savedOrder =
        Array.isArray(
          savedHomepage.sectionOrder
        )
          ? savedHomepage.sectionOrder
          : sectionOrder;

      const reordered =
        buildSectionsFromOrder(
          savedOrder
        );

      setSections(
        reordered.map(
          (section) => ({
            ...section,
            enabled:
              getSectionEnabled(
                section.id,
                savedHomepage
              ),
          })
        )
      );

      setSuccess(
        "Homepage saved successfully."
      );
    } catch (error) {
      console.error(
        "ADMIN HOMEPAGE SAVE ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save homepage."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RESET ORDER
  |--------------------------------------------------------------------------
  */

  function resetSectionOrder() {
    setSections(
      DEFAULT_SECTIONS.map(
        (section) => ({
          ...section,
          enabled:
            getSectionEnabled(
              section.id,
              homepage || {}
            ),
        })
      )
    );

    setSuccess("");
    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[500px] rounded-2xl border border-gray-200 bg-white p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-gray-200" />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-24 rounded-xl bg-gray-200" />
            <div className="h-24 rounded-xl bg-gray-200" />
            <div className="h-24 rounded-xl bg-gray-200" />
          </div>

          <div className="h-96 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Homepage Editor
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage every homepage section
              from one simple place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={
                resetSectionOrder
              }
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset Order
            </button>

            <button
              type="button"
              onClick={
                saveHomepage
              }
              disabled={saving}
              className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Homepage"}
            </button>

          </div>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                loadHomepage
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>
        )}

        {/* MAIN GRID */}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

          {/* LEFT SECTION MANAGER */}

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">

            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Homepage Sections
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Use Up / Down buttons
                to change section order.
              </p>
            </div>

            <div className="space-y-2">

              {sections.map(
                (
                  section,
                  index
                ) => {
                  const active =
                    selectedSection ===
                    section.id;

                  return (
                    <div
                      key={
                        section.id
                      }
                      className={`rounded-xl border p-3 transition ${
                        active
                          ? "border-black bg-gray-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          selectSection(
                            section.id
                          )
                        }
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-bold text-white">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-semibold text-gray-900">
                              {
                                section.name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {
                                section.description
                              }
                            </p>

                          </div>
                        </div>
                      </button>

                      <div className="mt-3 flex items-center justify-between gap-2">

                        <div className="flex gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              moveSection(
                                index,
                                "up"
                              )
                            }
                            disabled={
                              index === 0 ||
                              saving
                            }
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveSection(
                                index,
                                "down"
                              )
                            }
                            disabled={
                              index ===
                                sections.length -
                                  1 ||
                              saving
                            }
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↓
                          </button>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleSection(
                              section.id
                            )
                          }
                          disabled={saving}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            section.enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {section.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </button>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          </aside>

          {/* RIGHT EDITOR */}

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="text-lg font-bold text-gray-900">
                {getSectionName(
                  selectedSection
                )}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {getSectionDescription(
                  selectedSection
                )}
              </p>

            </div>

            <div className="p-5">

              <SectionEditorPlaceholder
                section={
                  selectedSection
                }
                homepage={
                  homepage
                }
                sections={
                  sections
                }
                onToggle={() =>
                  toggleSection(
                    selectedSection
                  )
                }
              />

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SECTION PLACEHOLDER
|--------------------------------------------------------------------------
*/

function SectionEditorPlaceholder({
  section,
  homepage,
  sections,
  onToggle,
}: {
  section: SectionKey;
  homepage: HomepageData | null;
  sections: SectionItem[];
  onToggle: () => void;
}) {
  const current =
    sections.find(
      (item) =>
        item.id === section
    );

  const enabled =
    current?.enabled ?? true;

  return (
    <div className="space-y-6">

      {/* STATUS */}

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-gray-900">
            Section Status
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Turn this homepage section
            on or off.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`rounded-lg px-5 py-2 text-sm font-semibold ${
            enabled
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          }`}
        >
          {enabled
            ? "Section Enabled"
            : "Section Disabled"}
        </button>

      </div>

      {/* INFO */}

      <div className="rounded-xl border border-dashed border-gray-300 p-6">

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
          {getSectionNumber(
            section
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900">
          {getSectionName(
            section
          )}
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          {getSectionDescription(
            section
          )}
        </p>

        {section === "header" && (
          <InfoBox>
            Header controls will be
            added here: navigation,
            search, account, wishlist
            and cart.
          </InfoBox>
        )}

        {section === "logo" && (
          <InfoBox>
            Logo controls will be
            added here: logo image,
            alt text and title.
          </InfoBox>
        )}

        {section === "hero" && (
          <InfoBox>
            Hero controls will be
            added here: slides, desktop
            image, mobile image, title,
            subtitle, buttons and slider
            settings.
          </InfoBox>
        )}

        {section === "featured" && (
          <InfoBox>
            Featured product controls
            will be added here.
          </InfoBox>
        )}

        {section === "categories" && (
          <InfoBox>
            Category controls will be
            added here: title, subtitle,
            category cards, images and
            links.
          </InfoBox>
        )}

        {section === "gender" && (
          <InfoBox>
            Gender controls will be added
            here: Men, Women and Kids.
          </InfoBox>
        )}

        {section === "offers" && (
          <InfoBox>
            Offer controls will be added
            here: promotional banners,
            discounts, dates and buttons.
          </InfoBox>
        )}

        {section === "new-arrivals" && (
          <InfoBox>
            New Arrival product controls
            will be added here.
          </InfoBox>
        )}

        {section === "best-sellers" && (
          <InfoBox>
            Best Seller product controls
            will be added here.
          </InfoBox>
        )}

        {section === "men-collection" && (
          <InfoBox>
            Men's Collection controls
            will be added here.
          </InfoBox>
        )}

        {section === "women-collection" && (
          <InfoBox>
            Women's Collection controls
            will be added here.
          </InfoBox>
        )}

        {section === "kids-collection" && (
          <InfoBox>
            Kids' Collection controls
            will be added here.
          </InfoBox>
        )}

        {section === "seasonal" && (
          <InfoBox>
            Seasonal controls will be
            added here.
          </InfoBox>
        )}

        {section === "why-shop" && (
          <InfoBox>
            Why Shop SilentGEN controls
            will be added here.
          </InfoBox>
        )}

        {section === "newsletter" && (
          <InfoBox>
            Newsletter controls will be
            added here.
          </InfoBox>
        )}

        {section === "footer" && (
          <InfoBox>
            Footer controls will be added
            here: links, social media,
            copyright and contact details.
          </InfoBox>
        )}

      </div>

      {/* CURRENT DATA */}

      {homepage && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Current Homepage Data
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Section:{" "}
            <span className="font-semibold text-gray-700">
              {section}
            </span>
          </p>

        </div>
      )}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INFO BOX
|--------------------------------------------------------------------------
*/

function InfoBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-700">
      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| BUILD SECTIONS FROM SAVED ORDER
|--------------------------------------------------------------------------
*/

function buildSectionsFromOrder(
  savedOrder: string[]
): SectionItem[] {
  const map =
    new Map<
      SectionKey,
      SectionItem
    >(
      DEFAULT_SECTIONS.map(
        (section) => [
          section.id,
          section,
        ]
      )
    );

  const result: SectionItem[] =
    [];

  for (const id of savedOrder) {
    const section =
      map.get(
        id as SectionKey
      );

    if (section) {
      result.push({
        ...section,
      });

      map.delete(
        id as SectionKey
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ADD NEW SECTIONS
  |--------------------------------------------------------------------------
  */

  for (const section of DEFAULT_SECTIONS) {
    if (map.has(section.id)) {
      result.push({
        ...section,
      });
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| GET SECTION ENABLED
|--------------------------------------------------------------------------
*/

function getSectionEnabled(
  id: SectionKey,
  homepage: HomepageData
): boolean {
  switch (id) {
    case "header":
      return (
        homepage.header?.enabled ??
        true
      );

    case "logo":
      return (
        homepage.logo?.enabled ??
        true
      );

    case "hero":
      return (
        homepage.hero?.enabled ??
        true
      );

    case "featured":
      return (
        findProductSection(
          homepage,
          "featured"
        )?.enabled ?? true
      );

    case "categories":
      return (
        homepage.categories
          ?.enabled ?? true
      );

    case "gender":
      return (
        homepage.gender?.enabled ??
        true
      );

    case "offers":
      return (
        homepage.offers?.enabled ??
        true
      );

    case "new-arrivals":
      return (
        findProductSection(
          homepage,
          "new-arrivals"
        )?.enabled ?? true
      );

    case "best-sellers":
      return (
        findProductSection(
          homepage,
          "best-sellers"
        )?.enabled ?? true
      );

    case "men-collection":
      return (
        homepage.collections
          ?.men &&
        typeof homepage.collections.men ===
          "object" &&
        "enabled" in
          (homepage.collections.men as Record<
            string,
            unknown
          >)
          ? Boolean(
              (
                homepage.collections.men as Record<
                  string,
                  unknown
                >
              ).enabled
            )
          : homepage.collections
              ?.enabled ?? true
      );

    case "women-collection":
      return (
        homepage.collections
          ?.women &&
        typeof homepage.collections.women ===
          "object" &&
        "enabled" in
          (homepage.collections.women as Record<
            string,
            unknown
          >)
          ? Boolean(
              (
                homepage.collections.women as Record<
                  string,
                  unknown
                >
              ).enabled
            )
          : homepage.collections
              ?.enabled ?? true
      );

    case "kids-collection":
      return (
        homepage.collections
          ?.kids &&
        typeof homepage.collections.kids ===
          "object" &&
        "enabled" in
          (homepage.collections.kids as Record<
            string,
            unknown
          >)
          ? Boolean(
              (
                homepage.collections.kids as Record<
                  string,
                  unknown
                >
              ).enabled
            )
          : homepage.collections
              ?.enabled ?? true
      );

    case "seasonal":
      return (
        homepage.seasonal
          ?.enabled ?? true
      );

    case "why-shop":
      return (
        homepage.whyShop?.enabled ??
        true
      );

    case "newsletter":
      return (
        homepage.newsletter
          ?.enabled ?? true
      );

    case "footer":
      return (
        homepage.footer?.enabled ??
        true
      );

    default:
      return true;
  }
}

/*
|--------------------------------------------------------------------------
| APPLY ENABLED STATES
|--------------------------------------------------------------------------
*/

function applySectionEnabledStates(
  homepage: HomepageData,
  sections: SectionItem[]
): HomepageData {
  const result: HomepageData = {
    ...homepage,
  };

  for (const section of sections) {
    switch (section.id) {
      case "header":
        result.header = {
          ...(result.header || {}),
          enabled:
            section.enabled,
        };
        break;

      case "logo":
        result.logo = {
          ...(result.logo || {}),
          enabled:
            section.enabled,
        };
        break;

      case "hero":
        result.hero = {
          ...(result.hero || {}),
          enabled:
            section.enabled,
        };
        break;

      case "categories":
        result.categories = {
          ...(result.categories || {}),
          enabled:
            section.enabled,
        };
        break;

      case "gender":
        result.gender = {
          ...(result.gender || {}),
          enabled:
            section.enabled,
        };
        break;

      case "offers":
        result.offers = {
          ...(result.offers || {}),
          enabled:
            section.enabled,
        };
        break;

      case "seasonal":
        result.seasonal = {
          ...(result.seasonal || {}),
          enabled:
            section.enabled,
        };
        break;

      case "why-shop":
        result.whyShop = {
          ...(result.whyShop || {}),
          enabled:
            section.enabled,
        };
        break;

      case "newsletter":
        result.newsletter = {
          ...(result.newsletter || {}),
          enabled:
            section.enabled,
        };
        break;

      case "footer":
        result.footer = {
          ...(result.footer || {}),
          enabled:
            section.enabled,
        };
        break;

      case "featured":
        result.productSections =
          updateProductSection(
            result.productSections,
            "featured",
            section.enabled
          );
        break;

      case "new-arrivals":
        result.productSections =
          updateProductSection(
            result.productSections,
            "new-arrivals",
            section.enabled
          );
        break;

      case "best-sellers":
        result.productSections =
          updateProductSection(
            result.productSections,
            "best-sellers",
            section.enabled
          );
        break;

      case "men-collection":
        result.collections =
          updateCollectionEnabled(
            result.collections,
            "men",
            section.enabled
          );
        break;

      case "women-collection":
        result.collections =
          updateCollectionEnabled(
            result.collections,
            "women",
            section.enabled
          );
        break;

      case "kids-collection":
        result.collections =
          updateCollectionEnabled(
            result.collections,
            "kids",
            section.enabled
          );
        break;

      default:
        break;
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| UPDATE COLLECTION ENABLED
|--------------------------------------------------------------------------
*/

function updateCollectionEnabled(
  collections:
    | CollectionSectionData
    | undefined,
  key:
    | "men"
    | "women"
    | "kids",
  enabled: boolean
): CollectionSectionData {
  const current: CollectionSectionData =
    collections
      ? {
          ...collections,
        }
      : {};

  const existing =
    current[key];

  if (
    existing &&
    typeof existing ===
      "object" &&
    !Array.isArray(existing)
  ) {
    current[key] = {
      ...(existing as Record<
        string,
        unknown
      >),
      enabled,
    };
  } else {
    current[key] = {
      enabled,
    };
  }

  return current;
}

/*
|--------------------------------------------------------------------------
| PRODUCT SECTION UPDATE
|--------------------------------------------------------------------------
*/

function updateProductSection(
  sections:
    | ProductSectionData[]
    | undefined,
  type: string,
  enabled: boolean
): ProductSectionData[] {
  const current =
    Array.isArray(sections)
      ? sections.map(
          (section) => ({
            ...section,
          })
        )
      : [];

  const index =
    current.findIndex(
      (section) =>
        section?.type === type
    );

  if (index >= 0) {
    current[index] = {
      ...current[index],
      enabled,
    };

    return current;
  }

  current.push({
    title:
      type === "featured"
        ? "Featured Products"
        : type ===
            "new-arrivals"
          ? "New Arrivals"
          : "Best Sellers",

    subtitle: "",

    type,

    productIds: [],

    enabled,

    slider: true,

    sortOrder:
      current.length,

    viewAllText:
      "View All",

    viewAllHref:
      "/shop",
  });

  return current;
}

/*
|--------------------------------------------------------------------------
| FIND PRODUCT SECTION
|--------------------------------------------------------------------------
*/

function findProductSection(
  homepage: HomepageData,
  type: string
): ProductSectionData | undefined {
  if (
    !Array.isArray(
      homepage.productSections
    )
  ) {
    return undefined;
  }

  return homepage.productSections.find(
    (section) =>
      section?.type === type
  );
}

/*
|--------------------------------------------------------------------------
| SECTION NAME
|--------------------------------------------------------------------------
*/

function getSectionName(
  id: SectionKey
): string {
  return (
    DEFAULT_SECTIONS.find(
      (section) =>
        section.id === id
    )?.name || id
  );
}

/*
|--------------------------------------------------------------------------
| SECTION DESCRIPTION
|--------------------------------------------------------------------------
*/

function getSectionDescription(
  id: SectionKey
): string {
  return (
    DEFAULT_SECTIONS.find(
      (section) =>
        section.id === id
    )?.description || ""
  );
}

/*
|--------------------------------------------------------------------------
| SECTION NUMBER
|--------------------------------------------------------------------------
*/

function getSectionNumber(
  id: SectionKey
): number {
  const index =
    DEFAULT_SECTIONS.findIndex(
      (section) =>
        section.id === id
    );

  return index >= 0
    ? index + 1
    : 0;
}