"use client";

type SearchBarProps = {
  search: string;
  setSearch: React.Dispatch<
    React.SetStateAction<string>
  >;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE SEARCH TERM
|--------------------------------------------------------------------------
|
| Examples:
|
| T-shirt  -> tshirt
| tshirt   -> tshirt
| Tshirt   -> tshirt
| t-shirt  -> tshirt
| t shirt  -> tshirt
| T SHIRT  -> tshirt
|
|--------------------------------------------------------------------------
*/

function normalizeSearch(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "");
}

/*
|--------------------------------------------------------------------------
| DISPLAY SEARCH VALUE
|--------------------------------------------------------------------------
|
| Internally all T-shirt variations become:
|
| tshirt
|
| This makes the search state consistent.
|
|--------------------------------------------------------------------------
*/

function normalizeSearchInput(
  value: string
): string {
  const normalized =
    normalizeSearch(value);

  /*
  |--------------------------------------------------------------------------
  | T-SHIRT CANONICAL SEARCH
  |--------------------------------------------------------------------------
  */

  if (
    normalized === "tshirt"
  ) {
    return "tshirt";
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function SearchBar({
  search,
  setSearch,
}: SearchBarProps) {
  return (
    <div className="mb-8">
      <label
        htmlFor="product-search"
        className="sr-only"
      >
        Search products
      </label>

      <input
        id="product-search"
        type="search"
        placeholder="Search products..."
        value={search}
        onChange={(event) => {
          const value =
            event.target.value;

          /*
          |--------------------------------------------------------------------------
          | T-SHIRT NORMALIZATION
          |--------------------------------------------------------------------------
          */

          const normalized =
            normalizeSearch(
              value
            );

          /*
          |--------------------------------------------------------------------------
          | T-SHIRT VARIATIONS
          |--------------------------------------------------------------------------
          |
          | If user types:
          |
          | T-shirt
          | tshirt
          | Tshirt
          | t-shirt
          | t shirt
          | T SHIRT
          |
          | state becomes:
          |
          | tshirt
          |
          |--------------------------------------------------------------------------
          */

          if (
            normalized ===
            "tshirt"
          ) {
            setSearch(
              normalizeSearchInput(
                value
              )
                .toLowerCase()
                .replace(
                  /[\s-]+/g,
                  ""
                )
            );

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | NORMAL SEARCH
          |--------------------------------------------------------------------------
          */

          setSearch(
            value
          );
        }}
        autoComplete="off"
        spellCheck={false}
        className="
          w-full
          rounded-lg
          border
          border-gray-300
          bg-white
          p-3
          text-sm
          text-gray-900
          outline-none
          transition
          placeholder:text-gray-400
          focus:border-black
          focus:ring-2
          focus:ring-black/10
        "
      />
    </div>
  );
}