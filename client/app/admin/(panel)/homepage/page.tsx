"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminImageUploader from "@/components/admin/AdminImageUploader";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type ImageData = {
  url: string;
  alt: string;
  title: string;
};

type ButtonData = {
  enabled: boolean;
  text: string;
  href: string;
  openInNewTab: boolean;
};

type HeroSlide = {
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  image: ImageData;
  mobileImage: ImageData;
  button: ButtonData;
  secondaryButton: ButtonData;
  enabled: boolean;
  sortOrder: number;
};

type HeroData = {
  enabled: boolean;
  autoSlide: boolean;
  slideInterval: number;
  slides: HeroSlide[];
};

type CategoryItem = {
  _id?: string;
  category: string;
  name: string;
  title: string;
  description: string;
  image: ImageData;
  href: string;
  enabled: boolean;
  sortOrder: number;
};

type CategoriesData = {
  enabled: boolean;
  title: string;
  subtitle: string;
  items: CategoryItem[];
  viewAllText: string;
  viewAllHref: string;
};

type GenderData = {
  enabled: boolean;
  title: string;
  menImage: ImageData;
  womenImage: ImageData;
  kidsImage: ImageData;
};

type OfferItem = {
  _id?: string;
  title: string;
  subtitle: string;
  discountText: string;
  image: ImageData;
  href: string;
  buttonText: string;
  enabled: boolean;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
};

type OffersData = {
  enabled: boolean;
  title: string;
  items: OfferItem[];
};

type ProductSection = {
  _id?: string;
  title: string;
  subtitle: string;
  type:
    | "featured"
    | "trending"
    | "new-arrivals"
    | "best-sellers"
    | "manual";
  productIds: string[];
  enabled: boolean;
  slider: boolean;
  sortOrder: number;
  viewAllText: string;
  viewAllHref: string;
};

type CollectionItem = {
  _id?: string;
  title: string;
  description: string;
  image: ImageData;
  href: string;
  buttonText: string;
  enabled: boolean;
  sortOrder: number;
};

type CollectionsData = {
  enabled: boolean;
  men: CollectionItem;
  women: CollectionItem;
  kids: CollectionItem;
};

type SeasonalData = {
  enabled: boolean;
  title: string;
  summer: CollectionItem;
  winter: CollectionItem;
  festive: CollectionItem;
  newSeason: CollectionItem;
};

type WhyShopItem = {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  image: ImageData;
  enabled: boolean;
  sortOrder: number;
};

type WhyShopData = {
  enabled: boolean;
  title: string;
  items: WhyShopItem[];
};

type NewsletterData = {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  backgroundImage: ImageData;
};

type SettingsData = {
  primaryFont: string;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type HomepageData = {
  _id?: string;

  logo: ImageData;

  favicon: ImageData;

  hero: HeroData;

  categories: CategoriesData;

  gender: GenderData;

  offers: OffersData;

  productSections: ProductSection[];

  collections: CollectionsData;

  seasonal: SeasonalData;

  whyShop: WhyShopData;

  newsletter: NewsletterData;

  settings: SettingsData;

  sectionOrder: string[];

  isPublished: boolean;

  lastUpdatedBy?: string;

  createdAt?: string;

  updatedAt?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  homepage?: HomepageData;
};

/*
|--------------------------------------------------------------------------
| DEFAULT HELPERS
|--------------------------------------------------------------------------
*/

function createImage(): ImageData {
  return {
    url: "",
    alt: "",
    title: "",
  };
}

function createButton(): ButtonData {
  return {
    enabled: true,
    text: "",
    href: "",
    openInNewTab: false,
  };
}

function createHeroSlide(): HeroSlide {
  return {
    title: "",
    subtitle: "",
    description: "",

    image: createImage(),

    mobileImage: createImage(),

    button: createButton(),

    secondaryButton: {
      enabled: false,
      text: "",
      href: "",
      openInNewTab: false,
    },

    enabled: true,

    sortOrder: 0,
  };
}

function createCategory(): CategoryItem {
  return {
    category: "",
    name: "",
    title: "",
    description: "",

    image: createImage(),

    href: "/shop",

    enabled: true,

    sortOrder: 0,
  };
}

function createOffer(): OfferItem {
  return {
    title: "",
    subtitle: "",
    discountText: "",

    image: createImage(),

    href: "/shop",

    buttonText: "Shop Now",

    enabled: true,

    sortOrder: 0,

    startDate: null,

    endDate: null,
  };
}

function createCollection(
  title = "",
  href = "/shop",
  buttonText = "View Collection",
  sortOrder = 0
): CollectionItem {
  return {
    title,

    description: "",

    image: createImage(),

    href,

    buttonText,

    enabled: true,

    sortOrder,
  };
}

/*
|--------------------------------------------------------------------------
| DEFAULT HOMEPAGE
|--------------------------------------------------------------------------
*/

function createDefaultHomepage(): HomepageData {
  return {
    logo: createImage(),

    favicon: createImage(),

    hero: {
      enabled: true,

      autoSlide: true,

      slideInterval: 5000,

      slides: [],
    },

    categories: {
      enabled: true,

      title: "Shop by Category",

      subtitle:
        "Find your style from our complete fashion collection.",

      items: [],

      viewAllText:
        "View All Categories",

      viewAllHref: "/shop",
    },

    gender: {
      enabled: true,

      title:
        "Shop by Gender",

      menImage:
        createImage(),

      womenImage:
        createImage(),

      kidsImage:
        createImage(),
    },

    offers: {
      enabled: true,

      title:
        "Offers & Deals",

      items: [],
    },

    productSections: [],

    collections: {
      enabled: true,

      men: createCollection(
        "Men's Collection",
        "/shop?gender=men",
        "View Collection",
        0
      ),

      women: createCollection(
        "Women's Collection",
        "/shop?gender=women",
        "View Collection",
        1
      ),

      kids: createCollection(
        "Kids' Collection",
        "/shop?gender=kids",
        "View Collection",
        2
      ),
    },

    seasonal: {
      enabled: true,

      title:
        "Seasonal Collection",

      summer:
        createCollection(
          "Summer Collection",
          "/shop?season=summer",
          "Shop Summer",
          0
        ),

      winter:
        createCollection(
          "Winter Collection",
          "/shop?season=winter",
          "Shop Winter",
          1
        ),

      festive:
        createCollection(
          "Festive Collection",
          "/shop?season=festive",
          "Shop Festive",
          2
        ),

      newSeason:
        createCollection(
          "New Season",
          "/shop",
          "Explore",
          3
        ),
    },

    whyShop: {
      enabled: true,

      title:
        "Why Shop SilentGEN",

      items: [],
    },

    newsletter: {
      enabled: true,

      title:
        "Stay Updated",

      description:
        "Subscribe for exclusive offers and updates.",

      buttonText:
        "Subscribe",

      backgroundImage:
        createImage(),
    },

    settings: {
      primaryFont:
        "Inter",

      headingFont:
        "Inter",

      bodyFont:
        "Inter",

      primaryColor:
        "#000000",

      secondaryColor:
        "#ffffff",

      accentColor:
        "#111111",
    },

    sectionOrder: [
      "hero",
      "featured",
      "categories",
      "gender",
      "offers",
      "new-arrivals",
      "best-sellers",
      "men-collection",
      "women-collection",
      "kids-collection",
      "seasonal",
      "why-shop",
      "newsletter",
    ],

    isPublished: true,
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE HOMEPAGE
|--------------------------------------------------------------------------
*/

function normalizeHomepage(
  input?:
    | Partial<HomepageData>
    | null
): HomepageData {
  const defaults =
    createDefaultHomepage();

  const source =
    input &&
    typeof input ===
      "object"
      ? input
      : {};

  return {
    ...defaults,

    ...source,

    logo: {
      ...defaults.logo,
      ...(source.logo ||
        {}),
    },

    favicon: {
      ...defaults.favicon,
      ...(source.favicon ||
        {}),
    },

    hero: {
      ...defaults.hero,

      ...(source.hero ||
        {}),

      slides: Array.isArray(
        source.hero?.slides
      )
        ? source.hero.slides.map(
            (slide) => ({
              ...createHeroSlide(),

              ...slide,

              image: {
                ...createImage(),

                ...(slide.image ||
                  {}),
              },

              mobileImage: {
                ...createImage(),

                ...(slide.mobileImage ||
                  {}),
              },

              button: {
                ...createButton(),

                ...(slide.button ||
                  {}),
              },

              secondaryButton: {
                ...createButton(),

                ...(slide.secondaryButton ||
                  {}),
              },
            })
          )
        : [],
    },

    categories: {
      ...defaults.categories,

      ...(source.categories ||
        {}),

      items: Array.isArray(
        source.categories
          ?.items
      )
        ? source.categories.items.map(
            (item) => ({
              ...createCategory(),

              ...item,

              image: {
                ...createImage(),

                ...(item.image ||
                  {}),
              },
            })
          )
        : [],
    },

    gender: {
      ...defaults.gender,

      ...(source.gender ||
        {}),

      menImage: {
        ...createImage(),

        ...(source.gender
          ?.menImage || {}),
      },

      womenImage: {
        ...createImage(),

        ...(source.gender
          ?.womenImage ||
          {}),
      },

      kidsImage: {
        ...createImage(),

        ...(source.gender
          ?.kidsImage || {}),
      },
    },

    offers: {
      ...defaults.offers,

      ...(source.offers ||
        {}),

      items: Array.isArray(
        source.offers?.items
      )
        ? source.offers.items.map(
            (item) => ({
              ...createOffer(),

              ...item,

              image: {
                ...createImage(),

                ...(item.image ||
                  {}),
              },
            })
          )
        : [],
    },

    productSections:
      Array.isArray(
        source.productSections
      )
        ? source.productSections.map(
            (section) => ({
              ...section,

              title:
                section.title ||
                "Featured Products",

              subtitle:
                section.subtitle ||
                "",

              type:
                section.type ||
                "featured",

              productIds:
                Array.isArray(
                  section.productIds
                )
                  ? section.productIds
                  : [],

              enabled:
                section.enabled ??
                true,

              slider:
                section.slider ??
                true,

              sortOrder:
                section.sortOrder ??
                0,

              viewAllText:
                section.viewAllText ||
                "View All",

              viewAllHref:
                section.viewAllHref ||
                "/shop",
            })
          )
        : [],

    collections: {
      ...defaults.collections,

      ...(source.collections ||
        {}),

      men: {
        ...defaults
          .collections.men,

        ...(source.collections
          ?.men || {}),

        image: {
          ...createImage(),

          ...(source.collections
            ?.men?.image ||
            {}),
        },
      },

      women: {
        ...defaults
          .collections.women,

        ...(source.collections
          ?.women || {}),

        image: {
          ...createImage(),

          ...(source.collections
            ?.women?.image ||
            {}),
        },
      },

      kids: {
        ...defaults
          .collections.kids,

        ...(source.collections
          ?.kids || {}),

        image: {
          ...createImage(),

          ...(source.collections
            ?.kids?.image ||
            {}),
        },
      },
    },

    seasonal: {
      ...defaults.seasonal,

      ...(source.seasonal ||
        {}),

      summer: {
        ...defaults.seasonal
          .summer,

        ...(source.seasonal
          ?.summer || {}),

        image: {
          ...createImage(),

          ...(source.seasonal
            ?.summer?.image ||
            {}),
        },
      },

      winter: {
        ...defaults.seasonal
          .winter,

        ...(source.seasonal
          ?.winter || {}),

        image: {
          ...createImage(),

          ...(source.seasonal
            ?.winter?.image ||
            {}),
        },
      },

      festive: {
        ...defaults.seasonal
          .festive,

        ...(source.seasonal
          ?.festive || {}),

        image: {
          ...createImage(),

          ...(source.seasonal
            ?.festive?.image ||
            {}),
        },
      },

      newSeason: {
        ...defaults.seasonal
          .newSeason,

        ...(source.seasonal
          ?.newSeason ||
          {}),

        image: {
          ...createImage(),

          ...(source.seasonal
            ?.newSeason?.image ||
            {}),
        },
      },
    },

    whyShop: {
      ...defaults.whyShop,

      ...(source.whyShop ||
        {}),

      items: Array.isArray(
        source.whyShop?.items
      )
        ? source.whyShop.items.map(
            (item) => ({
              ...item,

              title:
                item.title ||
                "",

              description:
                item.description ||
                "",

              icon:
                item.icon ||
                "",

              image: {
                ...createImage(),

                ...(item.image ||
                  {}),
              },

              enabled:
                item.enabled ??
                true,

              sortOrder:
                item.sortOrder ??
                0,
            })
          )
        : [],
    },

    newsletter: {
      ...defaults.newsletter,

      ...(source.newsletter ||
        {}),

      backgroundImage: {
        ...createImage(),

        ...(source.newsletter
          ?.backgroundImage ||
          {}),
      },
    },

    settings: {
      ...defaults.settings,

      ...(source.settings ||
        {}),
    },

    sectionOrder:
      Array.isArray(
        source.sectionOrder
      ) &&
      source.sectionOrder
        .length > 0
        ? source.sectionOrder
        : defaults.sectionOrder,
  };
}

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function AdminHomepagePage() {
  const [
    homepage,
    setHomepage,
  ] =
    useState<HomepageData>(
      createDefaultHomepage()
    );

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
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    openSections,
    setOpenSections,
  ] = useState<
    Record<string, boolean>
  >({
    logo: true,

    hero: true,

    featured: false,

    categories: false,

    gender: false,

    offers: false,

    collections: false,

    seasonal: false,

    whyShop: false,

    newsletter: false,

    settings: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD HOMEPAGE
  |--------------------------------------------------------------------------
  */

  const loadHomepage =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          setSuccess("");

          const response =
            await fetch(
              "/api/admin/homepage",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
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

          setHomepage(
            normalizeHomepage(
              data.homepage
            )
          );
        } catch (error) {
          console.error(
            "ADMIN HOMEPAGE LOAD ERROR:",
            error
          );

          setError(
            error instanceof
              Error
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
    void loadHomepage();
  }, [loadHomepage]);

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  async function saveHomepage() {
    try {
      setSaving(true);

      setError("");

      setSuccess("");

      const response =
        await fetch(
          "/api/admin/homepage",
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                homepage
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

      if (
        data.homepage
      ) {
        setHomepage(
          normalizeHomepage(
            data.homepage
          )
        );
      }

      setSuccess(
        data.message ||
          "Homepage saved successfully."
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    } catch (error) {
      console.error(
        "ADMIN HOMEPAGE SAVE ERROR:",
        error
      );

      setError(
        error instanceof
          Error
          ? error.message
          : "Unable to save homepage."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TOGGLE SECTION
  |--------------------------------------------------------------------------
  */

  function toggleSection(
    key: string
  ) {
    setOpenSections(
      (previous) => ({
        ...previous,

        [key]:
          !previous[key],
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SECTION ORDER LABELS
  |--------------------------------------------------------------------------
  */

  const sectionLabels =
    useMemo(
      () => ({
        hero:
          "Hero Slider",

        featured:
          "Featured Products",

        categories:
          "Shop by Category",

        gender:
          "Shop by Gender",

        offers:
          "Offers & Deals",

        "new-arrivals":
          "New Arrivals",

        "best-sellers":
          "Best Sellers",

        "men-collection":
          "Men's Collection",

        "women-collection":
          "Women's Collection",

        "kids-collection":
          "Kids' Collection",

        seasonal:
          "Seasonal Collection",

        "why-shop":
          "Why Shop SilentGEN",

        newsletter:
          "Newsletter",
      }),
      []
    );

  /*
  |--------------------------------------------------------------------------
  | MOVE ORDER
  |--------------------------------------------------------------------------
  */

  function moveSection(
    index: number,

    direction:
      | "up"
      | "down"
  ) {
    setHomepage(
      (previous) => {
        const order = [
          ...previous.sectionOrder,
        ];

        const target =
          direction ===
          "up"
            ? index - 1
            : index + 1;

        if (
          target < 0 ||
          target >=
            order.length
        ) {
          return previous;
        }

        const nextOrder = [
          ...order,
        ];

        const temporary =
          nextOrder[index];

        nextOrder[index] =
          nextOrder[target];

        nextOrder[target] =
          temporary;

        return {
          ...previous,

          sectionOrder:
            nextOrder,
        };
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMAGE FIELD
  |--------------------------------------------------------------------------
  */

  function updateImage(
    path:
      | "logo"
      | "favicon",

    field:
      keyof ImageData,

    value: string
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        [path]: {
          ...previous[path],

          [field]:
            value,
        },
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | HERO FIELD
  |--------------------------------------------------------------------------
  */

  function updateHeroField<
    K extends keyof HeroData,
  >(
    field: K,

    value:
      HeroData[K]
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        hero: {
          ...previous.hero,

          [field]:
            value,
        },
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | HERO SLIDE
  |--------------------------------------------------------------------------
  */

  function addHeroSlide() {
    setHomepage(
      (previous) => ({
        ...previous,

        hero: {
          ...previous.hero,

          slides: [
            ...previous.hero
              .slides,

            {
              ...createHeroSlide(),

              sortOrder:
                previous.hero
                  .slides
                  .length,
            },
          ],
        },
      })
    );
  }

  function removeHeroSlide(
    index: number
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        hero: {
          ...previous.hero,

          slides:
            previous.hero.slides.filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !==
                index
            ),
        },
      })
    );
  }

  function updateHeroSlide(
    index: number,

    field:
      keyof HeroSlide,

    value: unknown
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        hero: {
          ...previous.hero,

          slides:
            previous.hero.slides.map(
              (
                slide,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...slide,

                      [field]:
                        value,
                    }
                  : slide
            ),
        },
      })
    );
  }

  function updateHeroSlideImage(
    index: number,

    imageType:
      | "image"
      | "mobileImage",

    field:
      keyof ImageData,

    value: string
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        hero: {
          ...previous.hero,

          slides:
            previous.hero.slides.map(
              (
                slide,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...slide,

                      [imageType]:
                        {
                          ...slide[
                            imageType
                          ],

                          [field]:
                            value,
                        },
                    }
                  : slide
            ),
        },
      })
    );
  }

  function updateHeroButton(
    index: number,

    buttonType:
      | "button"
      | "secondaryButton",

    field:
      keyof ButtonData,

    value: unknown
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        hero: {
          ...previous.hero,

          slides:
            previous.hero.slides.map(
              (
                slide,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...slide,

                      [buttonType]:
                        {
                          ...slide[
                            buttonType
                          ],

                          [field]:
                            value,
                        },
                    }
                  : slide
            ),
        },
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY
  |--------------------------------------------------------------------------
  */

  function addCategory() {
    setHomepage(
      (previous) => ({
        ...previous,

        categories: {
          ...previous.categories,

          items: [
            ...previous
              .categories
              .items,

            {
              ...createCategory(),

              sortOrder:
                previous
                  .categories
                  .items.length,
            },
          ],
        },
      })
    );
  }

  function removeCategory(
    index: number
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        categories: {
          ...previous.categories,

          items:
            previous.categories.items.filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !==
                index
            ),
        },
      })
    );
  }

  function updateCategory(
    index: number,

    field:
      keyof CategoryItem,

    value: unknown
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        categories: {
          ...previous.categories,

          items:
            previous.categories.items.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      [field]:
                        value,
                    }
                  : item
            ),
        },
      })
    );
  }

  function updateCategoryImage(
    index: number,

    field:
      keyof ImageData,

    value: string
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        categories: {
          ...previous.categories,

          items:
            previous.categories.items.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      image: {
                        ...item.image,

                        [field]:
                          value,
                      },
                    }
                  : item
            ),
        },
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | OFFER
  |--------------------------------------------------------------------------
  */

  function addOffer() {
    setHomepage(
      (previous) => ({
        ...previous,

        offers: {
          ...previous.offers,

          items: [
            ...previous.offers
              .items,

            {
              ...createOffer(),

              sortOrder:
                previous.offers
                  .items.length,
            },
          ],
        },
      })
    );
  }

  function removeOffer(
    index: number
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        offers: {
          ...previous.offers,

          items:
            previous.offers.items.filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !==
                index
            ),
        },
      })
    );
  }

  function updateOffer(
    index: number,

    field:
      keyof OfferItem,

    value: unknown
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        offers: {
          ...previous.offers,

          items:
            previous.offers.items.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      [field]:
                        value,
                    }
                  : item
            ),
        },
      })
    );
  }

  function updateOfferImage(
    index: number,

    field:
      keyof ImageData,

    value: string
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        offers: {
          ...previous.offers,

          items:
            previous.offers.items.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      image: {
                        ...item.image,

                        [field]:
                          value,
                      },
                    }
                  : item
            ),
        },
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

            <p className="mt-4 text-sm text-gray-500">
              Loading Homepage
              Editor...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HEADER */}

      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Homepage Editor
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your
              SilentGEN homepage
              sections.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadHomepage()
              }
              disabled={
                saving
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={
                saveHomepage
              }
              disabled={
                saving
              }
              className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Homepage"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ALERTS */}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT */}

          <div className="space-y-5">
            {/* STATUS */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Homepage Status
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Control whether
                    the homepage is
                    publicly visible.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      homepage.isPublished
                    }
                    onChange={(
                      event
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          isPublished:
                            event
                              .target
                              .checked,
                        })
                      )
                    }
                    className="h-5 w-5 rounded border-gray-300"
                  />

                  <span className="text-sm font-semibold text-gray-800">
                    {homepage.isPublished
                      ? "Published"
                      : "Unpublished"}
                  </span>
                </label>
              </div>
            </div>

            {/* LOGO */}

            <EditorSection
              number="1"
              title="Website Logo"
              open={
                openSections.logo
              }
              onToggle={() =>
                toggleSection(
                  "logo"
                )
              }
            >
              <div className="grid gap-5 md:grid-cols-2">
                <ImageField
                  label="Website Logo"
                  value={
                    homepage.logo.url
                  }
                  onChange={(
                    value
                  ) =>
                    updateImage(
                      "logo",
                      "url",
                      value
                    )
                  }
                />

                <ImagePreview
                  url={
                    homepage.logo.url
                  }
                  alt="Website Logo"
                />

                <TextField
                  label="Alt Text"
                  value={
                    homepage.logo.alt
                  }
                  onChange={(
                    value
                  ) =>
                    updateImage(
                      "logo",
                      "alt",
                      value
                    )
                  }
                />

                <TextField
                  label="Title"
                  value={
                    homepage.logo.title
                  }
                  onChange={(
                    value
                  ) =>
                    updateImage(
                      "logo",
                      "title",
                      value
                    )
                  }
                />

                <div className="md:col-span-2 border-t border-gray-100 pt-5">
                  <ImageField
                    label="Favicon"
                    value={
                      homepage.favicon
                        .url
                    }
                    onChange={(
                      value
                    ) =>
                      updateImage(
                        "favicon",
                        "url",
                        value
                      )
                    }
                  />

                  <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <TextField
                      label="Favicon Alt Text"
                      value={
                        homepage
                          .favicon.alt
                      }
                      onChange={(
                        value
                      ) =>
                        updateImage(
                          "favicon",
                          "alt",
                          value
                        )
                      }
                    />

                    <TextField
                      label="Favicon Title"
                      value={
                        homepage
                          .favicon.title
                      }
                      onChange={(
                        value
                      ) =>
                        updateImage(
                          "favicon",
                          "title",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </EditorSection>

            {/* HERO */}

            <EditorSection
              number="2"
              title="Hero Slider"
              open={
                openSections.hero
              }
              onToggle={() =>
                toggleSection(
                  "hero"
                )
              }
            >
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <ToggleField
                    label="Enable Hero"
                    checked={
                      homepage.hero
                        .enabled
                    }
                    onChange={(
                      checked
                    ) =>
                      updateHeroField(
                        "enabled",
                        checked
                      )
                    }
                  />

                  <ToggleField
                    label="Auto Slide"
                    checked={
                      homepage.hero
                        .autoSlide
                    }
                    onChange={(
                      checked
                    ) =>
                      updateHeroField(
                        "autoSlide",
                        checked
                      )
                    }
                  />

                  <NumberField
                    label="Slide Interval (ms)"
                    value={
                      homepage.hero
                        .slideInterval
                    }
                    min={1000}
                    onChange={(
                      value
                    ) =>
                      updateHeroField(
                        "slideInterval",
                        value
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Hero Slides
                    </p>

                    <p className="text-xs text-gray-500">
                      Current Slides:{" "}
                      {
                        homepage.hero
                          .slides
                          .length
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addHeroSlide
                    }
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    + Add Slide
                  </button>
                </div>

                {homepage.hero
                  .slides.length ===
                  0 && (
                  <EmptyState text="No hero slides added yet." />
                )}

                {homepage.hero.slides.map(
                  (
                    slide,
                    index
                  ) => (
                    <div
                      key={
                        slide._id ||
                        `hero-${index}`
                      }
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Slide{" "}
                          {index +
                            1}
                        </h3>

                        <div className="flex items-center gap-3">
                          <ToggleField
                            label="Enabled"
                            checked={
                              slide.enabled
                            }
                            onChange={(
                              checked
                            ) =>
                              updateHeroSlide(
                                index,
                                "enabled",
                                checked
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeHeroSlide(
                                index
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <TextField
                          label="Title"
                          value={
                            slide.title
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlide(
                              index,
                              "title",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Subtitle"
                          value={
                            slide.subtitle
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlide(
                              index,
                              "subtitle",
                              value
                            )
                          }
                        />

                        <div className="md:col-span-2">
                          <TextAreaField
                            label="Description"
                            value={
                              slide.description
                            }
                            onChange={(
                              value
                            ) =>
                              updateHeroSlide(
                                index,
                                "description",
                                value
                              )
                            }
                          />
                        </div>

                        <ImageField
                          label="Desktop Hero Image"
                          value={
                            slide.image
                              .url
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlideImage(
                              index,
                              "image",
                              "url",
                              value
                            )
                          }
                        />

                        <ImageField
                          label="Mobile Hero Image"
                          value={
                            slide
                              .mobileImage
                              .url
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlideImage(
                              index,
                              "mobileImage",
                              "url",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Desktop Image Alt"
                          value={
                            slide.image
                              .alt
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlideImage(
                              index,
                              "image",
                              "alt",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Mobile Image Alt"
                          value={
                            slide
                              .mobileImage
                              .alt
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlideImage(
                              index,
                              "mobileImage",
                              "alt",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Desktop Image Title"
                          value={
                            slide.image
                              .title
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlideImage(
                              index,
                              "image",
                              "title",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Mobile Image Title"
                          value={
                            slide
                              .mobileImage
                              .title
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroSlideImage(
                              index,
                              "mobileImage",
                              "title",
                              value
                            )
                          }
                        />

                        <div className="md:col-span-2">
                          <div className="mb-3 border-t border-gray-200 pt-5">
                            <p className="font-semibold text-gray-900">
                              Primary
                              Button
                            </p>
                          </div>
                        </div>

                        <TextField
                          label="Button Text"
                          value={
                            slide.button
                              .text
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroButton(
                              index,
                              "button",
                              "text",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Button Link"
                          value={
                            slide.button
                              .href
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroButton(
                              index,
                              "button",
                              "href",
                              value
                            )
                          }
                        />

                        <ToggleField
                          label="Enable Button"
                          checked={
                            slide.button
                              .enabled
                          }
                          onChange={(
                            checked
                          ) =>
                            updateHeroButton(
                              index,
                              "button",
                              "enabled",
                              checked
                            )
                          }
                        />

                        <ToggleField
                          label="Open in New Tab"
                          checked={
                            slide.button
                              .openInNewTab
                          }
                          onChange={(
                            checked
                          ) =>
                            updateHeroButton(
                              index,
                              "button",
                              "openInNewTab",
                              checked
                            )
                          }
                        />

                        <div className="md:col-span-2">
                          <div className="mb-3 border-t border-gray-200 pt-5">
                            <p className="font-semibold text-gray-900">
                              Secondary
                              Button
                            </p>
                          </div>
                        </div>

                        <TextField
                          label="Secondary Button Text"
                          value={
                            slide
                              .secondaryButton
                              .text
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroButton(
                              index,
                              "secondaryButton",
                              "text",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Secondary Button Link"
                          value={
                            slide
                              .secondaryButton
                              .href
                          }
                          onChange={(
                            value
                          ) =>
                            updateHeroButton(
                              index,
                              "secondaryButton",
                              "href",
                              value
                            )
                          }
                        />

                        <ToggleField
                          label="Enable Secondary Button"
                          checked={
                            slide
                              .secondaryButton
                              .enabled
                          }
                          onChange={(
                            checked
                          ) =>
                            updateHeroButton(
                              index,
                              "secondaryButton",
                              "enabled",
                              checked
                            )
                          }
                        />

                        <ToggleField
                          label="Secondary Opens New Tab"
                          checked={
                            slide
                              .secondaryButton
                              .openInNewTab
                          }
                          onChange={(
                            checked
                          ) =>
                            updateHeroButton(
                              index,
                              "secondaryButton",
                              "openInNewTab",
                              checked
                            )
                          }
                        />

                        <NumberField
                          label="Sort Order"
                          value={
                            slide.sortOrder
                          }
                          min={0}
                          onChange={(
                            value
                          ) =>
                            updateHeroSlide(
                              index,
                              "sortOrder",
                              value
                            )
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </EditorSection>

            {/* FEATURED PRODUCTS */}

            <EditorSection
              number="3"
              title="Featured Products"
              open={
                openSections.featured
              }
              onToggle={() =>
                toggleSection(
                  "featured"
                )
              }
            >
              <ProductSectionEditor
                homepage={
                  homepage
                }
                setHomepage={
                  setHomepage
                }
              />
            </EditorSection>

            {/* CATEGORIES */}

            <EditorSection
              number="4"
              title="Shop by Category"
              open={
                openSections.categories
              }
              onToggle={() =>
                toggleSection(
                  "categories"
                )
              }
            >
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <ToggleField
                    label="Enable Category Section"
                    checked={
                      homepage
                        .categories
                        .enabled
                    }
                    onChange={(
                      checked
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          categories:
                            {
                              ...previous.categories,

                              enabled:
                                checked,
                            },
                        })
                      )
                    }
                  />

                  <TextField
                    label="Section Title"
                    value={
                      homepage
                        .categories
                        .title
                    }
                    onChange={(
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          categories:
                            {
                              ...previous.categories,

                              title:
                                value,
                            },
                        })
                      )
                    }
                  />

                  <TextField
                    label="View All Text"
                    value={
                      homepage
                        .categories
                        .viewAllText
                    }
                    onChange={(
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          categories:
                            {
                              ...previous.categories,

                              viewAllText:
                                value,
                            },
                        })
                      )
                    }
                  />
                </div>

                <TextAreaField
                  label="Subtitle"
                  value={
                    homepage
                      .categories
                      .subtitle
                  }
                  onChange={(
                    value
                  ) =>
                    setHomepage(
                      (
                        previous
                      ) => ({
                        ...previous,

                        categories:
                          {
                            ...previous.categories,

                            subtitle:
                              value,
                          },
                      })
                    )
                  }
                />

                <TextField
                  label="View All Link"
                  value={
                    homepage
                      .categories
                      .viewAllHref
                  }
                  onChange={(
                    value
                  ) =>
                    setHomepage(
                      (
                        previous
                      ) => ({
                        ...previous,

                        categories:
                          {
                            ...previous.categories,

                            viewAllHref:
                              value,
                          },
                      })
                    )
                  }
                />

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Categories
                    </p>

                    <p className="text-xs text-gray-500">
                      {
                        homepage
                          .categories
                          .items
                          .length
                      }{" "}
                      categories
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addCategory
                    }
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    + Add Category
                  </button>
                </div>

                {homepage.categories
                  .items.length ===
                  0 && (
                  <EmptyState text="No categories added yet." />
                )}

                {homepage.categories.items.map(
                  (
                    category,
                    index
                  ) => (
                    <div
                      key={
                        category._id ||
                        `category-${index}`
                      }
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Category{" "}
                          {index +
                            1}
                        </h3>

                        <div className="flex items-center gap-3">
                          <ToggleField
                            label="Enabled"
                            checked={
                              category.enabled
                            }
                            onChange={(
                              checked
                            ) =>
                              updateCategory(
                                index,
                                "enabled",
                                checked
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeCategory(
                                index
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <TextField
                          label="Product Category"
                          placeholder="e.g. T-Shirt"
                          value={
                            category.category
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategory(
                              index,
                              "category",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Display Name"
                          value={
                            category.name
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategory(
                              index,
                              "name",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Homepage Title"
                          value={
                            category.title
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategory(
                              index,
                              "title",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Category Link"
                          value={
                            category.href
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategory(
                              index,
                              "href",
                              value
                            )
                          }
                        />

                        <ImageField
                          label="Category Image"
                          value={
                            category.image
                              .url
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategoryImage(
                              index,
                              "url",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Image Alt"
                          value={
                            category.image
                              .alt
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategoryImage(
                              index,
                              "alt",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Image Title"
                          value={
                            category.image
                              .title
                          }
                          onChange={(
                            value
                          ) =>
                            updateCategoryImage(
                              index,
                              "title",
                              value
                            )
                          }
                        />

                        <NumberField
                          label="Sort Order"
                          value={
                            category.sortOrder
                          }
                          min={0}
                          onChange={(
                            value
                          ) =>
                            updateCategory(
                              index,
                              "sortOrder",
                              value
                            )
                          }
                        />

                        <div className="md:col-span-2">
                          <TextAreaField
                            label="Description"
                            value={
                              category.description
                            }
                            onChange={(
                              value
                            ) =>
                              updateCategory(
                                index,
                                "description",
                                value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </EditorSection>

            {/* GENDER */}

            <EditorSection
              number="5"
              title="Shop by Gender"
              open={
                openSections.gender
              }
              onToggle={() =>
                toggleSection(
                  "gender"
                )
              }
            >
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <ToggleField
                    label="Enable Gender Section"
                    checked={
                      homepage.gender
                        .enabled
                    }
                    onChange={(
                      checked
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          gender:
                            {
                              ...previous.gender,

                              enabled:
                                checked,
                            },
                        })
                      )
                    }
                  />

                  <TextField
                    label="Section Title"
                    value={
                      homepage.gender
                        .title
                    }
                    onChange={(
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          gender:
                            {
                              ...previous.gender,

                              title:
                                value,
                            },
                        })
                      )
                    }
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <GenderImageEditor
                    label="Men"
                    image={
                      homepage.gender
                        .menImage
                    }
                    onChange={(
                      field,
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          gender:
                            {
                              ...previous.gender,

                              menImage:
                                {
                                  ...previous
                                    .gender
                                    .menImage,

                                  [field]:
                                    value,
                                },
                            },
                        })
                      )
                    }
                  />

                  <GenderImageEditor
                    label="Women"
                    image={
                      homepage.gender
                        .womenImage
                    }
                    onChange={(
                      field,
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          gender:
                            {
                              ...previous.gender,

                              womenImage:
                                {
                                  ...previous
                                    .gender
                                    .womenImage,

                                  [field]:
                                    value,
                                },
                            },
                        })
                      )
                    }
                  />

                  <GenderImageEditor
                    label="Kids"
                    image={
                      homepage.gender
                        .kidsImage
                    }
                    onChange={(
                      field,
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          gender:
                            {
                              ...previous.gender,

                              kidsImage:
                                {
                                  ...previous
                                    .gender
                                    .kidsImage,

                                  [field]:
                                    value,
                                },
                            },
                        })
                      )
                    }
                  />
                </div>
              </div>
            </EditorSection>

            {/* OFFERS */}

            <EditorSection
              number="6"
              title="Offers & Deals"
              open={
                openSections.offers
              }
              onToggle={() =>
                toggleSection(
                  "offers"
                )
              }
            >
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-3">
                  <ToggleField
                    label="Enable Offers"
                    checked={
                      homepage.offers
                        .enabled
                    }
                    onChange={(
                      checked
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          offers:
                            {
                              ...previous.offers,

                              enabled:
                                checked,
                            },
                        })
                      )
                    }
                  />

                  <TextField
                    label="Section Title"
                    value={
                      homepage.offers
                        .title
                    }
                    onChange={(
                      value
                    ) =>
                      setHomepage(
                        (
                          previous
                        ) => ({
                          ...previous,

                          offers:
                            {
                              ...previous.offers,

                              title:
                                value,
                            },
                        })
                      )
                    }
                  />

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={
                        addOffer
                      }
                      className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      + Add Offer
                    </button>
                  </div>
                </div>

                {homepage.offers
                  .items.length ===
                  0 && (
                  <EmptyState text="No offers added yet." />
                )}

                {homepage.offers.items.map(
                  (
                    offer,
                    index
                  ) => (
                    <div
                      key={
                        offer._id ||
                        `offer-${index}`
                      }
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Offer{" "}
                          {index +
                            1}
                        </h3>

                        <div className="flex items-center gap-3">
                          <ToggleField
                            label="Enabled"
                            checked={
                              offer.enabled
                            }
                            onChange={(
                              checked
                            ) =>
                              updateOffer(
                                index,
                                "enabled",
                                checked
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeOffer(
                                index
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <TextField
                          label="Title"
                          value={
                            offer.title
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "title",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Subtitle"
                          value={
                            offer.subtitle
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "subtitle",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Discount Text"
                          placeholder="e.g. 50% OFF"
                          value={
                            offer.discountText
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "discountText",
                              value
                            )
                          }
                        />

                        <ImageField
                          label="Offer Image"
                          value={
                            offer.image
                              .url
                          }
                          onChange={(
                            value
                          ) =>
                            updateOfferImage(
                              index,
                              "url",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Button Text"
                          value={
                            offer.buttonText
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "buttonText",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Button Link"
                          value={
                            offer.href
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "href",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Image Alt"
                          value={
                            offer.image
                              .alt
                          }
                          onChange={(
                            value
                          ) =>
                            updateOfferImage(
                              index,
                              "alt",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Image Title"
                          value={
                            offer.image
                              .title
                          }
                          onChange={(
                            value
                          ) =>
                            updateOfferImage(
                              index,
                              "title",
                              value
                            )
                          }
                        />

                        <TextField
                          label="Start Date"
                          type="date"
                          value={
                            offer.startDate ||
                            ""
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "startDate",
                              value ||
                                null
                            )
                          }
                        />

                        <TextField
                          label="End Date"
                          type="date"
                          value={
                            offer.endDate ||
                            ""
                          }
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "endDate",
                              value ||
                                null
                            )
                          }
                        />

                        <NumberField
                          label="Sort Order"
                          value={
                            offer.sortOrder
                          }
                          min={0}
                          onChange={(
                            value
                          ) =>
                            updateOffer(
                              index,
                              "sortOrder",
                              value
                            )
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </EditorSection>
          </div>

          {/* RIGHT SIDEBAR */}

          <aside className="space-y-5">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900">
                  Quick Actions
                </h2>

                <button
                  type="button"
                  onClick={
                    saveHomepage
                  }
                  disabled={
                    saving
                  }
                  className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void loadHomepage()
                  }
                  disabled={
                    saving
                  }
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reload Homepage
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900">
                  Section Order
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Change homepage
                  section ordering.
                </p>

                <div className="mt-4 space-y-2">
                  {homepage.sectionOrder.map(
                    (
                      key,
                      index
                    ) => (
                      <div
                        key={`${key}-${index}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
                          {sectionLabels[
                            key as keyof typeof sectionLabels
                          ] ||
                            key}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            moveSection(
                              index,
                              "up"
                            )
                          }
                          disabled={
                            index ===
                            0
                          }
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-xs disabled:opacity-30"
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
                            homepage
                              .sectionOrder
                              .length -
                              1
                          }
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-xs disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* COMMON FIELD WRAPPER                                                       */
/* -------------------------------------------------------------------------- */

function FieldWrapper({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* TEXT FIELD                                                                 */
/* -------------------------------------------------------------------------- */

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <FieldWrapper
      label={label}
    >
      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
      />
    </FieldWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/* TEXTAREA                                                                   */
/* -------------------------------------------------------------------------- */

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
}) {
  return (
    <FieldWrapper
      label={label}
    >
      <textarea
        value={value}
        placeholder={
          placeholder
        }
        rows={4}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
      />
    </FieldWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/* NUMBER FIELD                                                               */
/* -------------------------------------------------------------------------- */

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <FieldWrapper
      label={label}
    >
      <input
        type="number"
        min={min}
        value={value}
        onChange={(
          event
        ) => {
          const nextValue =
            Number(
              event.target
                .value
            );

          onChange(
            Number.isFinite(
              nextValue
            )
              ? nextValue
              : 0
          );
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
      />
    </FieldWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/* IMAGE FIELD - DRAG & DROP                                                  */
/* -------------------------------------------------------------------------- */

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <AdminImageUploader
      label={label}
      value={
        value.trim()
          ? [
              value.trim(),
            ]
          : []
      }
      onChange={(
        images
      ) =>
        onChange(
          images[0] ||
            ""
        )
      }
      multiple={false}
      maxImages={1}
      allowUrl
      helperText="Drag & drop an image, click to browse, or paste an image URL."
    />
  );
}

/* -------------------------------------------------------------------------- */
/* IMAGE PREVIEW                                                              */
/* -------------------------------------------------------------------------- */

function ImagePreview({
  url,
  alt,
}: {
  url: string;
  alt: string;
}) {
  const [
    failed,
    setFailed,
  ] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">
        Preview
      </p>

      <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
        {url &&
        !failed ? (
          <img
            src={url}
            alt={
              alt ||
              "Preview"
            }
            className="max-h-full max-w-full object-contain"
            onError={() =>
              setFailed(
                true
              )
            }
          />
        ) : (
          <span className="px-4 text-center text-xs text-gray-400">
            {url
              ? "Image could not be loaded."
              : "No image added."}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TOGGLE                                                                     */
/* -------------------------------------------------------------------------- */

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .checked
          )
        }
        className="h-5 w-5 rounded border-gray-300 accent-black"
      />

      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* COLOR FIELD                                                                */
/* -------------------------------------------------------------------------- */

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  const safeColor =
    /^#[0-9A-Fa-f]{6}$/.test(
      value
    )
      ? value
      : "#000000";

  return (
    <FieldWrapper
      label={label}
    >
      <div className="flex gap-3">
        <input
          type="color"
          value={
            safeColor
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className="h-12 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
        />

        <input
          type="text"
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
          placeholder="#000000"
        />
      </div>
    </FieldWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/* COLOR SUMMARY                                                              */
/* -------------------------------------------------------------------------- */

function ColorSummary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-600">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span
          className="h-6 w-6 shrink-0 rounded border border-gray-200"
          style={{
            backgroundColor:
              value ||
              "#000000",
          }}
        />

        <span className="text-xs font-medium text-gray-700">
          {value ||
            "#000000"}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
      <p className="text-sm text-gray-500">
        {text}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PRODUCT SECTION EDITOR                                                     */
/* -------------------------------------------------------------------------- */

function ProductSectionEditor({
  homepage,
  setHomepage,
}: {
  homepage:
    HomepageData;

  setHomepage:
    React.Dispatch<
      React.SetStateAction<HomepageData>
    >;
}) {
  const sections =
    homepage.productSections;

  function addSection() {
    setHomepage(
      (previous) => ({
        ...previous,

        productSections: [
          ...previous.productSections,

          {
            title:
              "Featured Products",

            subtitle:
              "Our latest collection",

            type:
              "featured",

            productIds: [],

            enabled: true,

            slider: true,

            sortOrder:
              previous
                .productSections
                .length,

            viewAllText:
              "View All",

            viewAllHref:
              "/shop",
          },
        ],
      })
    );
  }

  function removeSection(
    index: number
  ) {
    setHomepage(
      (previous) => ({
        ...previous,

        productSections:
          previous.productSections.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          ),
      })
    );
  }

  function updateSection(
    index: number,
    field:
      keyof ProductSection,
    value: unknown
  ) {
    setHomepage(
      (previous) => {
        const productSections =
          [
            ...previous.productSections,
          ];

        productSections[
          index
        ] = {
          ...productSections[
            index
          ],

          [field]:
            value,
        };

        return {
          ...previous,

          productSections,
        };
      }
    );
  }

  function moveProductSection(
    index: number,
    direction:
      | "up"
      | "down"
  ) {
    setHomepage(
      (previous) => {
        const sections = [
          ...previous.productSections,
        ];

        const targetIndex =
          direction ===
          "up"
            ? index - 1
            : index + 1;

        if (
          targetIndex <
            0 ||
          targetIndex >=
            sections.length
        ) {
          return previous;
        }

        const current =
          sections[index];

        const target =
          sections[
            targetIndex
          ];

        sections[index] = {
          ...target,

          sortOrder:
            index,
        };

        sections[
          targetIndex
        ] = {
          ...current,

          sortOrder:
            targetIndex,
        };

        return {
          ...previous,

          productSections:
            sections,
        };
      }
    );
  }

  function updateProducts(
    index: number,
    productIds: string[]
  ) {
    setHomepage(
      (previous) => {
        const productSections =
          [
            ...previous.productSections,
          ];

        productSections[
          index
        ] = {
          ...productSections[
            index
          ],

          productIds,
        };

        return {
          ...previous,

          productSections,
        };
      }
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900">
            Product Sections
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Configure
            featured,
            trending, new
            arrivals and best
            sellers.
          </p>
        </div>

        <button
          type="button"
          onClick={
            addSection
          }
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          + Add Section
        </button>
      </div>

      {sections.length ===
        0 && (
        <EmptyState text="No product sections configured." />
      )}

      {sections.map(
        (
          section,
          index
        ) => (
          <div
            key={
              section._id ||
              `product-section-${index}`
            }
            className="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Product
                  Section{" "}
                  {index + 1}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Sort Order:{" "}
                  {
                    section.sortOrder
                  }
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ToggleField
                  label="Enabled"
                  checked={
                    section.enabled
                  }
                  onChange={(
                    checked
                  ) =>
                    updateSection(
                      index,
                      "enabled",
                      checked
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    moveProductSection(
                      index,
                      "up"
                    )
                  }
                  disabled={
                    index ===
                    0
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() =>
                    moveProductSection(
                      index,
                      "down"
                    )
                  }
                  disabled={
                    index ===
                    sections.length -
                      1
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeSection(
                      index
                    )
                  }
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Title"
                value={
                  section.title
                }
                onChange={(
                  value
                ) =>
                  updateSection(
                    index,
                    "title",
                    value
                  )
                }
              />

              <TextField
                label="Subtitle"
                value={
                  section.subtitle
                }
                onChange={(
                  value
                ) =>
                  updateSection(
                    index,
                    "subtitle",
                    value
                  )
                }
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Section Type
                </span>

                <select
                  value={
                    section.type
                  }
                  onChange={(
                    event
                  ) =>
                    updateSection(
                      index,
                      "type",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                >
                  <option value="featured">
                    Featured
                  </option>

                  <option value="trending">
                    Trending
                  </option>

                  <option value="new-arrivals">
                    New Arrivals
                  </option>

                  <option value="best-sellers">
                    Best Sellers
                  </option>

                  <option value="manual">
                    Manual
                  </option>
                </select>
              </label>

              <ToggleField
                label="Enable Slider"
                checked={
                  section.slider
                }
                onChange={(
                  checked
                ) =>
                  updateSection(
                    index,
                    "slider",
                    checked
                  )
                }
              />

              <TextField
                label="View All Text"
                value={
                  section.viewAllText
                }
                onChange={(
                  value
                ) =>
                  updateSection(
                    index,
                    "viewAllText",
                    value
                  )
                }
              />

              <TextField
                label="View All Link"
                value={
                  section.viewAllHref
                }
                onChange={(
                  value
                ) =>
                  updateSection(
                    index,
                    "viewAllHref",
                    value
                  )
                }
              />
            </div>

            <div className="mt-6">
              <ProductSelector
                sectionType={
                  section.type
                }
                selectedIds={
                  section.productIds
                }
                onChange={(
                  ids
                ) =>
                  updateProducts(
                    index,
                    ids
                  )
                }
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PRODUCT SELECTOR                                                           */
/* -------------------------------------------------------------------------- */

type AdminProduct = {
  _id: string;

  name: string;

  price: number;

  mrp: number;

  stock: number;

  thumbnail?: string;

  images?: string[];

  image?: string;

  category?: string;

  brand?: string;

  status?: string;

  isActive?: boolean;
};

function ProductSelector({
  sectionType,
  selectedIds,
  onChange,
}: {
  sectionType: string;

  selectedIds:
    string[];

  onChange: (
    productIds:
      string[]
  ) => void;
}) {
  const [
    products,
    setProducts,
  ] =
    useState<
      AdminProduct[]
    >([]);

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

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("all");

  const [
    showSelectedOnly,
    setShowSelectedOnly,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/products?limit=100",
            {
              method:
                "GET",

              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Failed to load products."
          );
        }

        const list =
          Array.isArray(
            data
          )
            ? data
            : Array.isArray(
                  data?.products
                )
              ? data.products
              : Array.isArray(
                    data?.items
                  )
                ? data.items
                : [];

        if (!cancelled) {
          setProducts(
            list
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof
              Error
              ? err.message
              : "Failed to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(
            false
          );
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories =
    useMemo(() => {
      const values =
        products
          .map(
            (
              product
            ) =>
              product.category
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value &&
                  value.trim()
              )
          );

      return [
        ...new Set(
          values
        ),
      ].sort();
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (
          product
        ) => {
          const matchesSearch =
            !query ||
            product.name
              .toLowerCase()
              .includes(
                query
              ) ||
            product._id
              .toLowerCase()
              .includes(
                query
              ) ||
            product.category
              ?.toLowerCase()
              .includes(
                query
              );

          const matchesCategory =
            category ===
              "all" ||
            product.category ===
              category;

          const matchesSelected =
            !showSelectedOnly ||
            selectedIds.includes(
              product._id
            );

          return (
            matchesSearch &&
            matchesCategory &&
            matchesSelected
          );
        }
      );
    }, [
      products,
      search,
      category,
      showSelectedOnly,
      selectedIds,
    ]);

  function toggleProduct(
    productId: string
  ) {
    if (
      selectedIds.includes(
        productId
      )
    ) {
      onChange(
        selectedIds.filter(
          (id) =>
            id !==
            productId
        )
      );

      return;
    }

    onChange([
      ...selectedIds,
      productId,
    ]);
  }

  function removeProduct(
    productId: string
  ) {
    onChange(
      selectedIds.filter(
        (id) =>
          id !==
          productId
      )
    );
  }

  function selectVisibleProducts() {
    const visibleIds =
      filteredProducts.map(
        (
          product
        ) =>
          product._id
      );

    const merged = [
      ...selectedIds,
      ...visibleIds,
    ];

    onChange([
      ...new Set(
        merged
      ),
    ]);
  }

  function clearVisibleProducts() {
    const visibleIds =
      new Set(
        filteredProducts.map(
          (
            product
          ) =>
            product._id
        )
      );

    onChange(
      selectedIds.filter(
        (id) =>
          !visibleIds.has(
            id
          )
      )
    );
  }

  function getProductImage(
    product:
      AdminProduct
  ) {
    if (
      product.thumbnail
    ) {
      return product.thumbnail;
    }

    if (
      product.images &&
      product.images.length >
        0
    ) {
      return product
        .images[0];
    }

    if (
      product.image
    ) {
      return product.image;
    }

    return "";
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">
              Select Products
            </h4>

            <p className="mt-1 text-xs text-gray-500">
              Section type:{" "}
              <span className="font-medium text-gray-700">
                {sectionType}
              </span>
            </p>
          </div>

          <div className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
            {
              selectedIds.length
            }{" "}
            Selected
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input
            type="search"
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search product..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />

          <select
            value={
              category
            }
            onChange={(
              event
            ) =>
              setCategory(
                event.target
                  .value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(
              (item) => (
                <option
                  key={
                    item
                  }
                  value={
                    item
                  }
                >
                  {item}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            onClick={() =>
              setShowSelectedOnly(
                (
                  value
                ) =>
                  !value
              )
            }
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              showSelectedOnly
                ? "border-black bg-black text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {showSelectedOnly
              ? "All Products"
              : "Selected Only"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              selectVisibleProducts
            }
            disabled={
              filteredProducts.length ===
              0
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          >
            Select Visible
          </button>

          <button
            type="button"
            onClick={
              clearVisibleProducts
            }
            disabled={
              filteredProducts.length ===
              0
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          >
            Clear Visible
          </button>

          <span className="flex items-center px-2 text-xs text-gray-400">
            Showing{" "}
            {
              filteredProducts.length
            }{" "}
            of{" "}
            {
              products.length
            }
          </span>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="mt-3 text-sm text-gray-500">
            Loading
            products...
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        filteredProducts.length ===
          0 && (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              No products
              found.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Try another
              search or
              category.
            </p>
          </div>
        )}

      {!loading &&
        filteredProducts.length >
          0 && (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map(
              (
                product
              ) => {
                const selected =
                  selectedIds.includes(
                    product._id
                  );

                const image =
                  getProductImage(
                    product
                  );

                return (
                  <div
                    key={
                      product._id
                    }
                    className={`flex items-center gap-4 p-4 transition ${
                      selected
                        ? "bg-gray-50"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      onChange={() =>
                        toggleProduct(
                          product._id
                        )
                      }
                      className="h-5 w-5 shrink-0 rounded border-gray-300 accent-black"
                    />

                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      {image ? (
                        <img
                          src={
                            image
                          }
                          alt={
                            product.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {
                          product.name
                        }
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          ₹
                          {Number(
                            product.price ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        {product.mrp >
                          product.price && (
                          <span className="line-through">
                            ₹
                            {Number(
                              product.mrp
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}

                        {product.category && (
                          <span>
                            {
                              product.category
                            }
                          </span>
                        )}

                        <span>
                          Stock:{" "}
                          {
                            product.stock
                          }
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      {selected ? (
                        <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white">
                          Selected
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
                          Available
                        </span>
                      )}
                    </div>

                    {selected && (
                      <button
                        type="button"
                        onClick={() =>
                          removeProduct(
                            product._id
                          )
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EDITOR SECTION                                                             */
/* -------------------------------------------------------------------------- */

function EditorSection({
  number,
  title,
  open,
  onToggle,
  children,
}: {
  number: string;
  title: string;
  open: boolean;
  onToggle:
    () => void;
  children:
    React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={
          onToggle
        }
        className="flex w-full items-center gap-4 px-5 py-5 text-left hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
          {number}
        </span>

        <span className="flex-1">
          <span className="block text-base font-bold text-gray-900">
            {title}
          </span>
        </span>

        <span className="text-xl text-gray-400">
          {open
            ? "−"
            : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5">
          {children}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* GENDER IMAGE EDITOR                                                        */
/* -------------------------------------------------------------------------- */

function GenderImageEditor({
  label,
  image,
  onChange,
}: {
  label: string;

  image:
    ImageData;

  onChange: (
    field:
      keyof ImageData,
    value: string
  ) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">
        {label}
      </h3>

      <div className="space-y-4">
        <ImageField
          label={`${label} Image`}
          value={
            image.url
          }
          onChange={(
            value
          ) =>
            onChange(
              "url",
              value
            )
          }
        />

        <TextField
          label="Alt Text"
          value={
            image.alt
          }
          onChange={(
            value
          ) =>
            onChange(
              "alt",
              value
            )
          }
        />

        <TextField
          label="Image Title"
          value={
            image.title
          }
          onChange={(
            value
          ) =>
            onChange(
              "title",
              value
            )
          }
        />

        <ImagePreview
          url={
            image.url
          }
          alt={
            label
          }
        />
      </div>
    </div>
  );
}