"use client";

import { useEffect, useState } from "react";

type HeroSlide = {
  _id?: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  sortOrder: number;
};

type CategoryItem = {
  _id?: string;
  name: string;
  image: string;
  link: string;
  active: boolean;
  sortOrder: number;
};

type SectionItem = {
  _id?: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
  sortOrder: number;
};

type WhyShopItem = {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  active: boolean;
  sortOrder: number;
};

type HomepageData = {
  heroSlides: HeroSlide[];
  categories: CategoryItem[];
  genderSections: SectionItem[];
  offers: SectionItem[];
  seasonalCollections: SectionItem[];
  whyShop: WhyShopItem[];
  newsletter: {
    title: string;
    description: string;
    active: boolean;
  };
  footer: {
    aboutUs: string;
    email: string;
    mobile: string;
    instagram: string;
    facebook: string;
    youtube: string;
    logo: string;
  };
  isActive: boolean;
};

const emptyHero: HeroSlide = {
  image: "",
  title: "",
  subtitle: "",
  buttonText: "Shop Now",
  buttonLink: "/shop",
  active: true,
  sortOrder: 0,
};

const emptyCategory: CategoryItem = {
  name: "",
  image: "",
  link: "",
  active: true,
  sortOrder: 0,
};

const emptySection: SectionItem = {
  title: "",
  subtitle: "",
  image: "",
  link: "",
  active: true,
  sortOrder: 0,
};

const emptyWhyShop: WhyShopItem = {
  title: "",
  description: "",
  icon: "",
  image: "",
  active: true,
  sortOrder: 0,
};

const defaultData: HomepageData = {
  heroSlides: [],
  categories: [],
  genderSections: [],
  offers: [],
  seasonalCollections: [],
  whyShop: [],
  newsletter: {
    title: "Stay Updated With SilentGEN",
    description:
      "Get exclusive offers and latest collection updates.",
    active: true,
  },
  footer: {
    aboutUs: "",
    email: "",
    mobile: "",
    instagram: "",
    facebook: "",
    youtube: "",
    logo: "",
  },
  isActive: true,
};

export default function AdminHomepagePage() {
  const [data, setData] =
    useState<HomepageData>(defaultData);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadHomepage();
  }, []);

  async function loadHomepage() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/homepage",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load homepage."
        );
      }

      setData({
        ...defaultData,
        ...result.homepage,
        newsletter: {
          ...defaultData.newsletter,
          ...(result.homepage?.newsletter || {}),
        },
        footer: {
          ...defaultData.footer,
          ...(result.homepage?.footer || {}),
        },
      });
    } catch (err) {
      console.error(
        "LOAD HOMEPAGE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load homepage."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveHomepage() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/admin/homepage",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to save homepage."
        );
      }

      setData(result.homepage);

      setMessage(
        "Homepage saved successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "SAVE HOMEPAGE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save homepage."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateField(
    field: keyof HomepageData,
    value: unknown
  ) {
    setData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateNewsletter(
    field: string,
    value: string | boolean
  ) {
    setData((current) => ({
      ...current,
      newsletter: {
        ...current.newsletter,
        [field]: value,
      },
    }));
  }

  function updateFooter(
    field: string,
    value: string
  ) {
    setData((current) => ({
      ...current,
      footer: {
        ...current.footer,
        [field]: value,
      },
    }));
  }

  function updateHero(
    index: number,
    field: keyof HeroSlide,
    value: string | boolean | number
  ) {
    setData((current) => ({
      ...current,
      heroSlides:
        current.heroSlides.map(
          (slide, slideIndex) =>
            slideIndex === index
              ? {
                  ...slide,
                  [field]: value,
                }
              : slide
        ),
    }));
  }

  function addHero() {
    setData((current) => ({
      ...current,
      heroSlides: [
        ...current.heroSlides,
        {
          ...emptyHero,
          sortOrder:
            current.heroSlides.length,
        },
      ],
    }));
  }

  function removeHero(index: number) {
    setData((current) => ({
      ...current,
      heroSlides:
        current.heroSlides.filter(
          (_, i) => i !== index
        ),
    }));
  }

  function updateCategory(
    index: number,
    field: keyof CategoryItem,
    value: string | boolean | number
  ) {
    setData((current) => ({
      ...current,
      categories:
        current.categories.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  }

  function addCategory() {
    setData((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          ...emptyCategory,
          sortOrder:
            current.categories.length,
        },
      ],
    }));
  }

  function removeCategory(index: number) {
    setData((current) => ({
      ...current,
      categories:
        current.categories.filter(
          (_, i) => i !== index
        ),
    }));
  }

  function updateSection(
    fieldName:
      | "genderSections"
      | "offers"
      | "seasonalCollections",
    index: number,
    field: keyof SectionItem,
    value: string | boolean | number
  ) {
    setData((current) => ({
      ...current,
      [fieldName]:
        current[fieldName].map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  }

  function addSection(
    fieldName:
      | "genderSections"
      | "offers"
      | "seasonalCollections"
  ) {
    setData((current) => ({
      ...current,
      [fieldName]: [
        ...current[fieldName],
        {
          ...emptySection,
          sortOrder:
            current[fieldName].length,
        },
      ],
    }));
  }

  function removeSection(
    fieldName:
      | "genderSections"
      | "offers"
      | "seasonalCollections",
    index: number
  ) {
    setData((current) => ({
      ...current,
      [fieldName]:
        current[fieldName].filter(
          (_, i) => i !== index
        ),
    }));
  }

  function updateWhyShop(
    index: number,
    field: keyof WhyShopItem,
    value: string | boolean | number
  ) {
    setData((current) => ({
      ...current,
      whyShop:
        current.whyShop.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  }

  function addWhyShop() {
    setData((current) => ({
      ...current,
      whyShop: [
        ...current.whyShop,
        {
          ...emptyWhyShop,
          sortOrder:
            current.whyShop.length,
        },
      ],
    }));
  }

  function removeWhyShop(index: number) {
    setData((current) => ({
      ...current,
      whyShop:
        current.whyShop.filter(
          (_, i) => i !== index
        ),
    }));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-black" />

          <p className="mt-4 text-gray-600">
            Loading Homepage Management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 rounded-2xl bg-black p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">
            SilentGEN Admin
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Homepage Management
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Manage your customer homepage without coding.
          </p>
        </div>

        <button
          type="button"
          onClick={saveHomepage}
          disabled={saving}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Homepage"}
        </button>
      </div>

      {/* ================================================= */}
      {/* MESSAGE */}
      {/* ================================================= */}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 font-medium text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ================================================= */}
      {/* HOMEPAGE STATUS */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Homepage Status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Turn homepage content on or off.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={data.isActive}
              onChange={(e) =>
                updateField(
                  "isActive",
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

            <span className="font-medium">
              Active
            </span>
          </label>
        </div>
      </section>

      {/* ================================================= */}
      {/* HERO SLIDER */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <SectionHeader
          title="Hero Banner Slider"
          description="Add multiple homepage banners. They can slide automatically."
          buttonText="+ Add Hero Slide"
          onClick={addHero}
        />

        <div className="mt-6 space-y-6">
          {data.heroSlides.length === 0 && (
            <EmptyBox text="No hero slides added yet." />
          )}

          {data.heroSlides.map(
            (slide, index) => (
              <div
                key={slide._id || index}
                className="rounded-xl border bg-gray-50 p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-bold">
                    Hero Slide {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      removeHero(index)
                    }
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Input
                    label="Image URL"
                    value={slide.image}
                    onChange={(value) =>
                      updateHero(
                        index,
                        "image",
                        value
                      )
                    }
                    placeholder="/images/hero.jpg"
                  />

                  <Input
                    label="Title"
                    value={slide.title}
                    onChange={(value) =>
                      updateHero(
                        index,
                        "title",
                        value
                      )
                    }
                    placeholder="Premium Fashion Collection"
                  />

                  <Input
                    label="Subtitle"
                    value={slide.subtitle}
                    onChange={(value) =>
                      updateHero(
                        index,
                        "subtitle",
                        value
                      )
                    }
                    placeholder="Discover the latest collection"
                  />

                  <Input
                    label="Button Text"
                    value={slide.buttonText}
                    onChange={(value) =>
                      updateHero(
                        index,
                        "buttonText",
                        value
                      )
                    }
                    placeholder="Shop Now"
                  />

                  <Input
                    label="Button Link"
                    value={slide.buttonLink}
                    onChange={(value) =>
                      updateHero(
                        index,
                        "buttonLink",
                        value
                      )
                    }
                    placeholder="/shop"
                  />

                  <Input
                    label="Sort Order"
                    value={String(
                      slide.sortOrder
                    )}
                    onChange={(value) =>
                      updateHero(
                        index,
                        "sortOrder",
                        Number(value) || 0
                      )
                    }
                    type="number"
                  />
                </div>

                <Checkbox
                  label="Show this slide"
                  checked={slide.active}
                  onChange={(value) =>
                    updateHero(
                      index,
                      "active",
                      value
                    )
                  }
                />

                {slide.image && (
                  <ImagePreview
                    image={slide.image}
                  />
                )}
              </div>
            )
          )}
        </div>
      </section>

      {/* ================================================= */}
      {/* CATEGORY */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <SectionHeader
          title="Shop By Category"
          description="T-Shirts, Shirts, Jeans, Pants, Shorts, Jackets, Tops, Hoodies, Accessories..."
          buttonText="+ Add Category"
          onClick={addCategory}
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {data.categories.map(
            (item, index) => (
              <div
                key={item._id || index}
                className="rounded-xl border bg-gray-50 p-5"
              >
                <div className="mb-4 flex justify-between">
                  <h3 className="font-bold">
                    Category {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      removeCategory(index)
                    }
                    className="text-sm font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Category Name"
                    value={item.name}
                    onChange={(value) =>
                      updateCategory(
                        index,
                        "name",
                        value
                      )
                    }
                    placeholder="T-Shirts"
                  />

                  <Input
                    label="Image URL"
                    value={item.image}
                    onChange={(value) =>
                      updateCategory(
                        index,
                        "image",
                        value
                      )
                    }
                    placeholder="/images/tshirts.jpg"
                  />

                  <Input
                    label="Filter Link"
                    value={item.link}
                    onChange={(value) =>
                      updateCategory(
                        index,
                        "link",
                        value
                      )
                    }
                    placeholder="/shop?category=T-Shirts"
                  />

                  <Checkbox
                    label="Show category"
                    checked={item.active}
                    onChange={(value) =>
                      updateCategory(
                        index,
                        "active",
                        value
                      )
                    }
                  />

                  {item.image && (
                    <ImagePreview
                      image={item.image}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {data.categories.length === 0 && (
          <EmptyBox text="No categories added yet." />
        )}
      </section>

      {/* ================================================= */}
      {/* GENDER */}
      {/* ================================================= */}

      <SectionList
        title="Shop By Gender"
        description="Men, Women and Kids collections."
        items={data.genderSections}
        onAdd={() =>
          addSection("genderSections")
        }
        onDelete={(index) =>
          removeSection(
            "genderSections",
            index
          )
        }
        onUpdate={(index, field, value) =>
          updateSection(
            "genderSections",
            index,
            field,
            value
          )
        }
        addText="+ Add Gender"
      />

      {/* ================================================= */}
      {/* OFFERS */}
      {/* ================================================= */}

      <SectionList
        title="Offers & Deals"
        description="Sale, discount products and limited-time offers."
        items={data.offers}
        onAdd={() =>
          addSection("offers")
        }
        onDelete={(index) =>
          removeSection(
            "offers",
            index
          )
        }
        onUpdate={(index, field, value) =>
          updateSection(
            "offers",
            index,
            field,
            value
          )
        }
        addText="+ Add Offer"
      />

      {/* ================================================= */}
      {/* SEASONAL */}
      {/* ================================================= */}

      <SectionList
        title="Seasonal Collections"
        description="Summer, Winter, Festive and New Season."
        items={data.seasonalCollections}
        onAdd={() =>
          addSection(
            "seasonalCollections"
          )
        }
        onDelete={(index) =>
          removeSection(
            "seasonalCollections",
            index
          )
        }
        onUpdate={(index, field, value) =>
          updateSection(
            "seasonalCollections",
            index,
            field,
            value
          )
        }
        addText="+ Add Collection"
      />

      {/* ================================================= */}
      {/* WHY SHOP */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <SectionHeader
          title="Why Shop SilentGEN"
          description="Premium Quality, Secure Checkout, Fast Delivery, Easy Returns, Customer Support."
          buttonText="+ Add Benefit"
          onClick={addWhyShop}
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {data.whyShop.map(
            (item, index) => (
              <div
                key={item._id || index}
                className="rounded-xl border bg-gray-50 p-5"
              >
                <div className="mb-4 flex justify-between">
                  <h3 className="font-bold">
                    Benefit {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      removeWhyShop(
                        index
                      )
                    }
                    className="text-sm font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={item.title}
                    onChange={(value) =>
                      updateWhyShop(
                        index,
                        "title",
                        value
                      )
                    }
                    placeholder="Premium Quality"
                  />

                  <Input
                    label="Description"
                    value={
                      item.description
                    }
                    onChange={(value) =>
                      updateWhyShop(
                        index,
                        "description",
                        value
                      )
                    }
                    placeholder="High quality products"
                  />

                  <Input
                    label="Icon"
                    value={item.icon}
                    onChange={(value) =>
                      updateWhyShop(
                        index,
                        "icon",
                        value
                      )
                    }
                    placeholder="quality"
                  />

                  <Input
                    label="Image URL"
                    value={item.image}
                    onChange={(value) =>
                      updateWhyShop(
                        index,
                        "image",
                        value
                      )
                    }
                    placeholder="/images/quality.jpg"
                  />

                  <Checkbox
                    label="Show benefit"
                    checked={item.active}
                    onChange={(value) =>
                      updateWhyShop(
                        index,
                        "active",
                        value
                      )
                    }
                  />

                  {item.image && (
                    <ImagePreview
                      image={item.image}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* ================================================= */}
      {/* NEWSLETTER */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">
          Newsletter / Offers
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage the email subscription section.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Input
            label="Title"
            value={data.newsletter.title}
            onChange={(value) =>
              updateNewsletter(
                "title",
                value
              )
            }
          />

          <Input
            label="Description"
            value={
              data.newsletter.description
            }
            onChange={(value) =>
              updateNewsletter(
                "description",
                value
              )
            }
          />
        </div>

        <Checkbox
          label="Show newsletter section"
          checked={data.newsletter.active}
          onChange={(value) =>
            updateNewsletter(
              "active",
              value
            )
          }
        />
      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">
          Footer Management
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage footer information, logo and social links.
        </p>

        <div className="mt-6 space-y-5">
          <Input
            label="Logo Image URL"
            value={data.footer.logo}
            onChange={(value) =>
              updateFooter(
                "logo",
                value
              )
            }
            placeholder="/images/logo.png"
          />

          <div>
            <label className="mb-2 block text-sm font-semibold">
              About Us
            </label>

            <textarea
              value={data.footer.aboutUs}
              onChange={(e) =>
                updateFooter(
                  "aboutUs",
                  e.target.value
                )
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="About SilentGEN..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Email"
              value={data.footer.email}
              onChange={(value) =>
                updateFooter(
                  "email",
                  value
                )
              }
              placeholder="support@silentgen.com"
            />

            <Input
              label="Mobile"
              value={data.footer.mobile}
              onChange={(value) =>
                updateFooter(
                  "mobile",
                  value
                )
              }
              placeholder="+91 XXXXX XXXXX"
            />

            <Input
              label="Instagram"
              value={
                data.footer.instagram
              }
              onChange={(value) =>
                updateFooter(
                  "instagram",
                  value
                )
              }
              placeholder="https://instagram.com/..."
            />

            <Input
              label="Facebook"
              value={
                data.footer.facebook
              }
              onChange={(value) =>
                updateFooter(
                  "facebook",
                  value
                )
              }
              placeholder="https://facebook.com/..."
            />

            <Input
              label="YouTube"
              value={
                data.footer.youtube
              }
              onChange={(value) =>
                updateFooter(
                  "youtube",
                  value
                )
              }
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* FINAL SAVE */}
      {/* ================================================= */}

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          onClick={saveHomepage}
          disabled={saving}
          className="rounded-xl bg-black px-8 py-4 font-bold text-white shadow-xl transition hover:bg-gray-800 disabled:opacity-50"
        >
          {saving
            ? "Saving Homepage..."
            : "Save All Homepage Changes"}
        </button>
      </div>
    </div>
  );
}


/* ======================================================
   INPUT
====================================================== */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
      />
    </div>
  );
}


/* ======================================================
   CHECKBOX
====================================================== */

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-5 w-5"
      />

      {label}
    </label>
  );
}


/* ======================================================
   IMAGE PREVIEW
====================================================== */

function ImagePreview({
  image,
}: {
  image: string;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border bg-white">
      <img
        src={image}
        alt="Preview"
        className="h-48 w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display =
            "none";
        }}
      />
    </div>
  );
}


/* ======================================================
   SECTION HEADER
====================================================== */

function SectionHeader({
  title,
  description,
  buttonText,
  onClick,
}: {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
      >
        {buttonText}
      </button>
    </div>
  );
}


/* ======================================================
   EMPTY BOX
====================================================== */

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}


/* ======================================================
   SECTION LIST
====================================================== */

function SectionList({
  title,
  description,
  items,
  onAdd,
  onDelete,
  onUpdate,
  addText,
}: {
  title: string;
  description: string;
  items: SectionItem[];
  onAdd: () => void;
  onDelete: (index: number) => void;
  onUpdate: (
    index: number,
    field: keyof SectionItem,
    value: string | boolean | number
  ) => void;
  addText: string;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <SectionHeader
        title={title}
        description={description}
        buttonText={addText}
        onClick={onAdd}
      />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item._id || index}
            className="rounded-xl border bg-gray-50 p-5"
          >
            <div className="mb-4 flex justify-between">
              <h3 className="font-bold">
                Item {index + 1}
              </h3>

              <button
                type="button"
                onClick={() =>
                  onDelete(index)
                }
                className="text-sm font-semibold text-red-600"
              >
                Delete
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Title"
                value={item.title}
                onChange={(value) =>
                  onUpdate(
                    index,
                    "title",
                    value
                  )
                }
                placeholder="Men"
              />

              <Input
                label="Subtitle"
                value={item.subtitle}
                onChange={(value) =>
                  onUpdate(
                    index,
                    "subtitle",
                    value
                  )
                }
                placeholder="Explore Men's Collection"
              />

              <Input
                label="Image URL"
                value={item.image}
                onChange={(value) =>
                  onUpdate(
                    index,
                    "image",
                    value
                  )
                }
                placeholder="/images/men.jpg"
              />

              <Input
                label="Link"
                value={item.link}
                onChange={(value) =>
                  onUpdate(
                    index,
                    "link",
                    value
                  )
                }
                placeholder="/shop?gender=Men"
              />

              <Checkbox
                label="Show this section"
                checked={item.active}
                onChange={(value) =>
                  onUpdate(
                    index,
                    "active",
                    value
                  )
                }
              />

              {item.image && (
                <ImagePreview
                  image={item.image}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-6">
          <EmptyBox text="No items added yet." />
        </div>
      )}
    </section>
  );
}
