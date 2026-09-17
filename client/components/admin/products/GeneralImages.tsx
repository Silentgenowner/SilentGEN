"use client";

type GeneralImagesForm = {
  thumbnail: string;
  images: string;
};

type GeneralImagesProps = {
  form: GeneralImagesForm;
  saving: boolean;

  updateField: <K extends keyof GeneralImagesForm>(
    field: K,
    value: GeneralImagesForm[K]
  ) => void;
};

export default function GeneralImages({
  form,
  saving,
  updateField,
}: GeneralImagesProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">
        General Images
      </h3>

      <div className="mt-5 space-y-5">
        {/* THUMBNAIL */}
        <div>
          <label
            htmlFor="thumbnail"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Thumbnail URL
          </label>

          <input
            id="thumbnail"
            type="url"
            value={form.thumbnail}
            onChange={(event) =>
              updateField(
                "thumbnail",
                event.target.value
              )
            }
            disabled={saving}
            placeholder="https://example.com/product.jpg"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* ADDITIONAL IMAGES */}
        <div>
          <label
            htmlFor="images"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Additional Image URLs
          </label>

          <textarea
            id="images"
            value={form.images}
            onChange={(event) =>
              updateField(
                "images",
                event.target.value
              )
            }
            rows={3}
            placeholder="Paste comma-separated image URLs"
            disabled={saving}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            These are general product images.
            Separate multiple URLs with commas.
          </p>
        </div>
      </div>
    </section>
  );
}