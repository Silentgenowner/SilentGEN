"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

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
  categories?: Category[];
  count?: number;
};

type DeleteResponse = {
  success?: boolean;
  message?: string;
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function AdminCategoriesPage() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [togglingId, setTogglingId] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | ADD FORM
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
  | FETCH CATEGORIES
  |--------------------------------------------------------------------------
  */

  const fetchCategories =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              "/api/admin/categories",
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
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load categories."
            );
          }

          setCategories(
            Array.isArray(
              data.categories
            )
              ? data.categories
              : []
          );
        } catch (err) {
          console.error(
            "CATEGORY FETCH ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load categories."
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
    fetchCategories();
  }, [fetchCategories]);

  /*
  |--------------------------------------------------------------------------
  | AUTO SLUG
  |--------------------------------------------------------------------------
  */

  function handleNameChange(
    value: string
  ) {
    setName(value);

    /*
    | Keep slug automatically synchronized
    | while creating a category.
    */

    setSlug(
      createSlug(value)
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  function resetForm() {
    setName("");
    setSlug("");
    setImageUrl("");
    setImagePublicId("");
    setImageAlt("");
    setImageTitle("");
    setEnabled(true);
    setSortOrder("");
    setShowAddForm(false);
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE CATEGORY
  |--------------------------------------------------------------------------
  */

  async function handleCreateCategory(
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

    try {
      setCreating(true);
      setError("");

      const payload = {
        name: cleanName,

        slug:
          slug.trim() ||
          createSlug(cleanName),

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
          sortOrder.trim() === ""
            ? undefined
            : Number(sortOrder),
      };

      const response =
        await fetch(
          "/api/admin/categories",
          {
            method: "POST",

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
            "Unable to create category."
        );
      }

      resetForm();

      await fetchCategories();
    } catch (err) {
      console.error(
        "CATEGORY CREATE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create category."
      );
    } finally {
      setCreating(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE CATEGORY
  |--------------------------------------------------------------------------
  */

  async function handleDelete(
    category: Category
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${category.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        category._id
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/categories/${category._id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

      const data: DeleteResponse =
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

      setCategories(
        (current) =>
          current.filter(
            (item) =>
              item._id !==
              category._id
          )
      );
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
      setDeletingId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TOGGLE ENABLED
  |--------------------------------------------------------------------------
  */

  async function handleToggleEnabled(
    category: Category
  ) {
    try {
      setTogglingId(
        category._id
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/categories/${category._id}`,
          {
            method: "PATCH",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                enabled:
                  !category.enabled,
              }),
          }
        );

      const data: {
        success?: boolean;
        message?: string;
        category?: Category;
      } =
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
        setCategories(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                category._id
                  ? data.category!
                  : item
            )
        );
      } else {
        await fetchCategories();
      }
    } catch (err) {
      console.error(
        "CATEGORY TOGGLE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category."
      );
    } finally {
      setTogglingId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const filteredCategories =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return categories;
      }

      return categories.filter(
        (category) =>
          category.name
            .toLowerCase()
            .includes(query) ||
          category.slug
            .toLowerCase()
            .includes(query)
      );
    }, [
      categories,
      search,
    ]);

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */

  const totalCategories =
    categories.length;

  const activeCategories =
    categories.filter(
      (category) =>
        category.enabled
    ).length;

  const disabledCategories =
    categories.filter(
      (category) =>
        !category.enabled
    ).length;

  /*
  |--------------------------------------------------------------------------
  | IMAGE PREVIEW
  |--------------------------------------------------------------------------
  */

  function CategoryImagePreview({
    category,
  }: {
    category: Category;
  }) {
    if (!category.image?.url) {
      return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
          No Image
        </div>
      );
    }

    return (
      <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <img
          src={category.image.url}
          alt={
            category.image.alt ||
            category.name
          }
          title={
            category.image.title ||
            category.name
          }
          className="h-full w-full object-cover"
        />
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
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 text-sm font-medium text-gray-500">
              Admin / Catalog
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Categories
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage product categories,
              visibility and ordering.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddForm(
                (value) => !value
              )
            }
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            {showAddForm
              ? "Close Form"
              : "+ Add Category"}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

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

        {/* ADD FORM */}

        {showAddForm && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Add New Category
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a new category for
                your store.
              </p>
            </div>

            <form
              onSubmit={
                handleCreateCategory
              }
              className="space-y-5"
            >
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
                        event.target
                          .value
                      )
                    }
                    placeholder="e.g. T-Shirts"
                    maxLength={100}
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
                    placeholder="t-shirts"
                    maxLength={120}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Automatically generated
                    from category name.
                  </p>
                </div>

                {/* IMAGE URL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Image URL
                  </label>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(event) =>
                      setImageUrl(
                        event.target
                          .value
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* CLOUDINARY PUBLIC ID */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Cloudinary Public ID
                  </label>

                  <input
                    type="text"
                    value={
                      imagePublicId
                    }
                    onChange={(event) =>
                      setImagePublicId(
                        event.target
                          .value
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
                        event.target
                          .value
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
                        event.target
                          .value
                      )
                    }
                    placeholder="Category title"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

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
                        event.target
                          .value
                      )
                    }
                    placeholder="Auto"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* ENABLED */}

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Category Enabled
                      </p>

                      <p className="text-xs text-gray-500">
                        Show this category in
                        the store.
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

              {/* IMAGE PREVIEW */}

              {imageUrl.trim() && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Image Preview
                  </p>

                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={imageUrl}
                      alt={
                        imageAlt ||
                        name ||
                        "Category preview"
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={creating}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STATS */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Categories
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalCategories}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeCategories}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Disabled
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {disabledCategories}
            </p>
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search category..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={
                fetchCategories
              }
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

              <p className="text-sm text-gray-500">
                Loading categories...
              </p>
            </div>
          ) : filteredCategories.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                📁
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {search
                  ? "No categories found"
                  : "No categories yet"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try a different search term."
                  : "Create your first category to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAddForm(
                      true
                    )
                  }
                  className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  + Add Category
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Category
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Slug
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Order
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map(
                      (category) => (
                        <tr
                          key={
                            category._id
                          }
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <CategoryImagePreview
                                category={
                                  category
                                }
                              />

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900">
                                  {
                                    category.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  ID:{" "}
                                  {
                                    category._id
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <code className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              /
                              {
                                category.slug
                              }
                            </code>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-gray-700">
                              {
                                category.sortOrder
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleEnabled(
                                  category
                                )
                              }
                              disabled={
                                togglingId ===
                                category._id
                              }
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                                category.enabled
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  category.enabled
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />

                              {togglingId ===
                              category._id
                                ? "Updating..."
                                : category.enabled
                                  ? "Active"
                                  : "Disabled"}
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/categories/${category._id}`}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                              >
                                Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    category
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  category._id
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {deletingId ===
                                category._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="divide-y divide-gray-100 md:hidden">
                {filteredCategories.map(
                  (category) => (
                    <div
                      key={
                        category._id
                      }
                      className="p-4"
                    >
                      <div className="flex gap-3">
                        <CategoryImagePreview
                          category={
                            category
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-gray-900">
                                {
                                  category.name
                                }
                              </h3>

                              <p className="mt-1 truncate text-xs text-gray-500">
                                /
                                {
                                  category.slug
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleEnabled(
                                  category
                                )
                              }
                              disabled={
                                togglingId ===
                                category._id
                              }
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                                category.enabled
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {category.enabled
                                ? "Active"
                                : "Disabled"}
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Sort Order:{" "}
                              <strong className="text-gray-700">
                                {
                                  category.sortOrder
                                }
                              </strong>
                            </span>

                            <div className="flex gap-2">
                              <Link
                                href={`/admin/categories/${category._id}`}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
                              >
                                Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    category
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  category._id
                                }
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                              >
                                {deletingId ===
                                category._id
                                  ? "..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* FOOTER COUNT */}

        {!loading &&
          filteredCategories.length >
            0 && (
            <div className="mt-4 text-right text-xs text-gray-400">
              Showing{" "}
              {
                filteredCategories.length
              }{" "}
              of{" "}
              {categories.length}{" "}
              categories
            </div>
          )}
      </div>
    </div>
  );
}