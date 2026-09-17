"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type CategoryImage = {
  url: string;
  publicId: string;
  alt: string;
  title: string;
};

type Category = {
  _id: string;
  name: string;
  slug: string;
  image: CategoryImage;
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryResponse = {
  success?: boolean;
  message?: string;
  category?: Category;
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();

  const categoryId =
    typeof params.id === "string"
      ? params.id
      : "";

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [category, setCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [imagePublicId, setImagePublicId] =
    useState("");

  const [imageAlt, setImageAlt] =
    useState("");

  const [imageTitle, setImageTitle] =
    useState("");

  const [enabled, setEnabled] =
    useState(true);

  const [sortOrder, setSortOrder] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | CREATE SLUG
  |--------------------------------------------------------------------------
  */

  function createSlug(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/['"]/g, "")
      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(
        /^-|-$/g,
        ""
      );
  }

  /*
  |--------------------------------------------------------------------------
  | FETCH CATEGORY
  |--------------------------------------------------------------------------
  */

  const fetchCategory =
    useCallback(async () => {
      if (!categoryId) {
        setError(
          "Invalid category ID."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `/api/admin/categories/${categoryId}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data: CategoryResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.category
        ) {
          throw new Error(
            data.message ||
              "Unable to load category."
          );
        }

        const loadedCategory =
          data.category;

        setCategory(
          loadedCategory
        );

        /*
        |--------------------------------------------------------------------------
        | FILL FORM
        |--------------------------------------------------------------------------
        */

        setName(
          loadedCategory.name || ""
        );

        setSlug(
          loadedCategory.slug || ""
        );

        setImageUrl(
          loadedCategory.image?.url ||
            ""
        );

        setImagePublicId(
          loadedCategory.image
            ?.publicId || ""
        );

        setImageAlt(
          loadedCategory.image?.alt ||
            ""
        );

        setImageTitle(
          loadedCategory.image
            ?.title || ""
        );

        setEnabled(
          loadedCategory.enabled !==
            false
        );

        setSortOrder(
          String(
            loadedCategory.sortOrder ??
              0
          )
        );
      } catch (err) {
        console.error(
          "CATEGORY LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load category."
        );
      } finally {
        setLoading(false);
      }
    }, [categoryId]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  /*
  |--------------------------------------------------------------------------
  | NAME CHANGE
  |--------------------------------------------------------------------------
  */

  function handleNameChange(
    value: string
  ) {
    setName(value);

    /*
    |--------------------------------------------------------------------------
    | Automatically update slug.
    |
    | User can still manually edit slug afterwards.
    |--------------------------------------------------------------------------
    */

    setSlug(
      createSlug(value)
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE CATEGORY
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName =
      name.trim();

    if (!cleanName) {
      setError(
        "Category name is required."
      );
      return;
    }

    const cleanSlug =
      createSlug(
        slug.trim() ||
          cleanName
      );

    if (!cleanSlug) {
      setError(
        "Unable to create a valid category slug."
      );
      return;
    }

    let numericSortOrder =
      Number(sortOrder);

    if (
      !Number.isFinite(
        numericSortOrder
      )
    ) {
      numericSortOrder = 0;
    }

    numericSortOrder =
      Math.max(
        0,
        Math.floor(
          numericSortOrder
        )
      );

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: cleanName,

        slug: cleanSlug,

        image: {
          url:
            imageUrl.trim(),

          publicId:
            imagePublicId.trim(),

          alt:
            imageAlt.trim() ||
            cleanName,

          title:
            imageTitle.trim() ||
            cleanName,
        },

        enabled,

        sortOrder:
          numericSortOrder,
      };

      const response =
        await fetch(
          `/api/admin/categories/${categoryId}`,
          {
            method: "PATCH",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data: CategoryResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update category."
        );
      }

      if (data.category) {
        setCategory(
          data.category
        );

        setName(
          data.category.name
        );

        setSlug(
          data.category.slug
        );

        setImageUrl(
          data.category.image?.url ||
            ""
        );

        setImagePublicId(
          data.category.image
            ?.publicId || ""
        );

        setImageAlt(
          data.category.image?.alt ||
            ""
        );

        setImageTitle(
          data.category.image
            ?.title || ""
        );

        setEnabled(
          data.category.enabled
        );

        setSortOrder(
          String(
            data.category.sortOrder
          )
        );
      }

      setSuccess(
        data.message ||
          "Category updated successfully."
      );

      /*
      |--------------------------------------------------------------------------
      | Scroll to top
      |--------------------------------------------------------------------------
      */

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "CATEGORY UPDATE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE CATEGORY
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    if (!category) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete "${category.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/categories/${categoryId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

      const data: {
        success?: boolean;
        message?: string;
      } =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete category."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Redirect back to categories list
      |--------------------------------------------------------------------------
      */

      router.push(
        "/admin/categories"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "CATEGORY DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

            <p className="text-sm text-gray-500">
              Loading category...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR WITHOUT CATEGORY
  |--------------------------------------------------------------------------
  */

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="text-xl font-bold text-red-700">
              Unable to Load Category
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error ||
                "Category not found."}
            </p>

            <Link
              href="/admin/categories"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              ← Back to Categories
            </Link>
          </div>
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-6">
          <div className="mb-3">
            <Link
              href="/admin/categories"
              className="text-sm font-semibold text-gray-500 transition hover:text-black"
            >
              ← Back to Categories
            </Link>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 text-sm font-medium text-gray-500">
                Admin / Catalog / Categories
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Edit Category
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update category details,
                image, visibility and
                ordering.
              </p>
            </div>

            <div
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {enabled
                ? "Active Category"
                : "Disabled Category"}
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="font-bold text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        {/* MAIN FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* BASIC INFORMATION */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage the category name
                and URL slug.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  maxLength={100}
                  placeholder="e.g. T-Shirts"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              {/* SLUG */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Slug
                </label>

                <input
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      createSlug(
                        event.target
                          .value
                      )
                    )
                  }
                  maxLength={120}
                  placeholder="t-shirts"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  URL:
                  {" /category/"}
                  {slug ||
                    "category-slug"}
                </p>
              </div>
            </div>
          </div>

          {/* IMAGE INFORMATION */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Category Image
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage category image and
                Cloudinary information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* IMAGE URL */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Image URL
                </label>

                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) =>
                    setImageUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* PUBLIC ID */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Cloudinary Public ID
                </label>

                <input
                  type="text"
                  value={imagePublicId}
                  onChange={(event) =>
                    setImagePublicId(
                      event.target.value
                    )
                  }
                  placeholder="silentgen/categories/..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* ALT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Image Alt
                </label>

                <input
                  type="text"
                  value={imageAlt}
                  onChange={(event) =>
                    setImageAlt(
                      event.target.value
                    )
                  }
                  placeholder="Category image"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Image Title
                </label>

                <input
                  type="text"
                  value={imageTitle}
                  onChange={(event) =>
                    setImageTitle(
                      event.target.value
                    )
                  }
                  placeholder="Category title"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* IMAGE PREVIEW */}

            {imageUrl.trim() && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Image Preview
                </p>

                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <img
                    src={imageUrl}
                    alt={
                      imageAlt ||
                      name ||
                      "Category preview"
                    }
                    title={
                      imageTitle ||
                      name ||
                      "Category preview"
                    }
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SETTINGS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Category Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Control visibility and
                display ordering.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* SORT ORDER */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Sort Order
                </label>

                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Lower numbers appear
                  first.
                </p>
              </div>

              {/* ENABLED */}

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Category Enabled
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Show this category
                      in the store.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) =>
                      setEnabled(
                        event.target
                          .checked
                      )
                    }
                    className="h-5 w-5 accent-black"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* CATEGORY INFORMATION */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Category Information
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Category ID
                </p>

                <p className="mt-1 break-all text-sm font-medium text-gray-700">
                  {category._id}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Current Status
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700">
                  {enabled
                    ? "Active"
                    : "Disabled"}
                </p>
              </div>

              {category.createdAt && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {new Date(
                      category.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              {category.updatedAt && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {new Date(
                      category.updatedAt
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}

          <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

              {/* DELETE */}

              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  deleting ||
                  saving
                }
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Category"}
              </button>

              {/* RIGHT ACTIONS */}

              <div className="flex flex-col gap-3 sm:flex-row">

                <Link
                  href="/admin/categories"
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    deleting
                  }
                  className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}