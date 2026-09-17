import {
  checkProductStock,
  getProduct,
  searchProducts,
} from "@/lib/ai/tools/productTools";

import {
  buildOutfit,
} from "@/lib/ai/tools/outfitTools";

import {
  addAICartItem,
  getAICart,
  removeAICartItem,
  updateAICartQuantity,
} from "@/lib/ai/tools/cartTools";

import {
  cancelAIOrder,
  getAIOrder,
  getAIOrders,
  requestAIExchange,
  requestAIReturn,
  trackAIOrder,
} from "@/lib/ai/tools/orderTools";

import {
  clearAIStyleProfile,
  getAIStyleProfile,
  updateAIStyleProfile,
} from "@/lib/ai/tools/styleProfileTools";

/*
|--------------------------------------------------------------------------
| INPUT TYPE
|--------------------------------------------------------------------------
*/

type ToolExecutionInput = {
  name: string;

  argumentsJson: string;

  userId?:
    | string
    | null;
};

/*
|--------------------------------------------------------------------------
| GENERIC ARGUMENT OBJECT
|--------------------------------------------------------------------------
*/

type ToolArguments =
  Record<
    string,
    unknown
  >;

/*
|--------------------------------------------------------------------------
| PARSE ARGUMENTS
|--------------------------------------------------------------------------
*/

function parseArguments(
  value: string
): ToolArguments {
  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(
        parsed
      )
    ) {
      return {};
    }

    return parsed as ToolArguments;
  } catch {
    return {};
  }
}

/*
|--------------------------------------------------------------------------
| NUMBER OR NULL
|--------------------------------------------------------------------------
*/

function numberOrNull(
  value: unknown
): number | null {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    return null;
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| BOUNDED INTEGER
|--------------------------------------------------------------------------
|
| Do not rely only on the AI tool JSON schema.
|
| Backend also enforces valid limits.
|
|--------------------------------------------------------------------------
*/

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) {
  const parsed =
    typeof value ===
    "number"
      ? value
      : Number(
          value
        );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  const integer =
    Math.floor(
      parsed
    );

  return Math.min(
    maximum,
    Math.max(
      minimum,
      integer
    )
  );
}

/*
|--------------------------------------------------------------------------
| STRING OR NULL
|--------------------------------------------------------------------------
*/

function stringOrNull(
  value: unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value.trim();

  return clean ||
    null;
}

/*
|--------------------------------------------------------------------------
| STRING VALUE
|--------------------------------------------------------------------------
*/

function stringValue(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

/*
|--------------------------------------------------------------------------
| STRING ARRAY OR NULL
|--------------------------------------------------------------------------
|
| null / undefined:
| No update to this style field.
|
| []:
| Explicit empty array.
|
|--------------------------------------------------------------------------
*/

function stringArrayOrNull(
  value: unknown
): string[] | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    !Array.isArray(
      value
    )
  ) {
    return null;
  }

  const cleaned =
    value
      .filter(
        (
          item
        ) =>
          typeof item ===
          "string"
      )
      .map(
        (
          item
        ) =>
          String(
            item
          ).trim()
      )
      .filter(
        Boolean
      );

  return Array.from(
    new Set(
      cleaned
    )
  );
}

/*
|--------------------------------------------------------------------------
| BOOLEAN OR NULL
|--------------------------------------------------------------------------
*/

function booleanOrNull(
  value: unknown
): boolean | null {
  return typeof value ===
    "boolean"
    ? value
    : null;
}

/*
|--------------------------------------------------------------------------
| EXECUTE AI TOOL
|--------------------------------------------------------------------------
*/

export async function executeAITool({
  name,
  argumentsJson,
  userId = null,
}: ToolExecutionInput) {
  const args =
    parseArguments(
      argumentsJson
    );

  switch (
    name
  ) {
    /*
    |--------------------------------------------------------------------------
    | SEARCH PRODUCTS
    |--------------------------------------------------------------------------
    */

    case "search_products":
      return searchProducts(
        {
          query:
            stringOrNull(
              args.query
            ),

          category:
            stringOrNull(
              args.category
            ),

          gender:
            stringOrNull(
              args.gender
            ),

          color:
            stringOrNull(
              args.color
            ),

          size:
            stringOrNull(
              args.size
            ),

          fabric:
            stringOrNull(
              args.fabric
            ),

          fit:
            stringOrNull(
              args.fit
            ),

          minPrice:
            numberOrNull(
              args.minPrice
            ),

          maxPrice:
            numberOrNull(
              args.maxPrice
            ),

          inStockOnly:
            args.inStockOnly !==
            false,

          limit:
            boundedInteger(
              args.limit,
              6,
              1,
              12
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | GET PRODUCT
    |--------------------------------------------------------------------------
    */

    case "get_product":
      return getProduct(
        {
          productId:
            stringOrNull(
              args.productId
            ),

          slug:
            stringOrNull(
              args.slug
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | CHECK PRODUCT STOCK
    |--------------------------------------------------------------------------
    */

    case "check_product_stock":
      return checkProductStock(
        {
          productId:
            stringValue(
              args.productId
            ),

          size:
            stringOrNull(
              args.size
            ),

          color:
            stringOrNull(
              args.color
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | BUILD OUTFIT
    |--------------------------------------------------------------------------
    */

    case "build_outfit":
      return buildOutfit(
        {
          baseProductId:
            stringOrNull(
              args.baseProductId
            ),

          baseCategory:
            stringOrNull(
              args.baseCategory
            ),

          baseColor:
            stringOrNull(
              args.baseColor
            ),

          gender:
            stringOrNull(
              args.gender
            ),

          occasion:
            stringOrNull(
              args.occasion
            ),

          style:
            stringOrNull(
              args.style
            ),

          size:
            stringOrNull(
              args.size
            ),

          budget:
            numberOrNull(
              args.budget
            ),

          limitPerCategory:
            boundedInteger(
              args.limitPerCategory,
              3,
              1,
              5
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | GET CART
    |--------------------------------------------------------------------------
    */

    case "get_cart":
      return getAICart(
        userId
      );

    /*
    |--------------------------------------------------------------------------
    | ADD CART ITEM
    |--------------------------------------------------------------------------
    |
    | Exact size/color validation remains inside cartTools.ts.
    |
    | Quantity is also constrained here to 1–20.
    |
    */

    case "add_cart_item":
      return addAICartItem(
        userId,
        {
          productId:
            stringValue(
              args.productId
            ),

          size:
            stringOrNull(
              args.size
            ),

          color:
            stringOrNull(
              args.color
            ),

          quantity:
            boundedInteger(
              args.quantity,
              1,
              1,
              20
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | UPDATE CART QUANTITY
    |--------------------------------------------------------------------------
    */

    case "update_cart_quantity":
      return updateAICartQuantity(
        userId,
        {
          productId:
            stringValue(
              args.productId
            ),

          size:
            stringOrNull(
              args.size
            ),

          color:
            stringOrNull(
              args.color
            ),

          quantity:
            boundedInteger(
              args.quantity,
              1,
              1,
              20
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | REMOVE CART ITEM
    |--------------------------------------------------------------------------
    */

    case "remove_cart_item":
      return removeAICartItem(
        userId,
        {
          productId:
            stringValue(
              args.productId
            ),

          size:
            stringOrNull(
              args.size
            ),

          color:
            stringOrNull(
              args.color
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | GET ORDERS
    |--------------------------------------------------------------------------
    */

    case "get_orders":
      return getAIOrders(
        userId,
        boundedInteger(
          args.limit,
          10,
          1,
          20
        )
      );

    /*
    |--------------------------------------------------------------------------
    | GET ONE ORDER
    |--------------------------------------------------------------------------
    */

    case "get_order":
      return getAIOrder(
        userId,
        {
          orderId:
            stringValue(
              args.orderId
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | TRACK ORDER
    |--------------------------------------------------------------------------
    */

    case "track_order":
      return trackAIOrder(
        userId,
        {
          orderId:
            stringValue(
              args.orderId
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | CANCEL ORDER
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | executeAITool itself does NOT decide whether confirmation is authentic.
    |
    | app/api/ai/chat/route.ts performs the server-side pending-action
    | authorization first.
    |
    | Here we only pass the final authorized boolean to orderTools.ts.
    |
    */

    case "cancel_order":
      return cancelAIOrder(
        userId,
        {
          orderId:
            stringValue(
              args.orderId
            ),

          reason:
            stringOrNull(
              args.reason
            ),

          confirmed:
            args.confirmed ===
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RETURN ORDER
    |--------------------------------------------------------------------------
    */

    case "request_return":
      return requestAIReturn(
        userId,
        {
          orderId:
            stringValue(
              args.orderId
            ),

          reason:
            stringValue(
              args.reason
            ),

          confirmed:
            args.confirmed ===
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | EXCHANGE ORDER
    |--------------------------------------------------------------------------
    |
    | requestedSize / requestedColor intentionally remain excluded until
    | Order schema and orderTools.ts persist replacement variants correctly.
    |
    */

    case "request_exchange":
      return requestAIExchange(
        userId,
        {
          orderId:
            stringValue(
              args.orderId
            ),

          reason:
            stringValue(
              args.reason
            ),

          confirmed:
            args.confirmed ===
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | GET STYLE PROFILE
    |--------------------------------------------------------------------------
    */

    case "get_style_profile":
      return getAIStyleProfile(
        userId
      );

    /*
    |--------------------------------------------------------------------------
    | UPDATE STYLE PROFILE
    |--------------------------------------------------------------------------
    */

    case "update_style_profile":
      return updateAIStyleProfile(
        userId,
        {
          preferredColors:
            stringArrayOrNull(
              args.preferredColors
            ),

          dislikedColors:
            stringArrayOrNull(
              args.dislikedColors
            ),

          preferredSizes:
            stringArrayOrNull(
              args.preferredSizes
            ),

          preferredFits:
            stringArrayOrNull(
              args.preferredFits
            ),

          preferredCategories:
            stringArrayOrNull(
              args.preferredCategories
            ),

          preferredBrands:
            stringArrayOrNull(
              args.preferredBrands
            ),

          preferredStyles:
            stringArrayOrNull(
              args.preferredStyles
            ),

          preferredFabrics:
            stringArrayOrNull(
              args.preferredFabrics
            ),

          preferredOccasions:
            stringArrayOrNull(
              args.preferredOccasions
            ),

          minBudget:
            args.minBudget ===
            null
              ? null
              : numberOrNull(
                  args.minBudget
                ),

          maxBudget:
            args.maxBudget ===
            null
              ? null
              : numberOrNull(
                  args.maxBudget
                ),

          likedProductId:
            stringOrNull(
              args.likedProductId
            ),

          dislikedProductId:
            stringOrNull(
              args.dislikedProductId
            ),

          viewedProductId:
            stringOrNull(
              args.viewedProductId
            ),

          personalizationEnabled:
            booleanOrNull(
              args.personalizationEnabled
            ),
        }
      );

    /*
    |--------------------------------------------------------------------------
    | CLEAR STYLE PROFILE
    |--------------------------------------------------------------------------
    |
    | SECURITY:
    |
    | This function still refuses to delete saved preferences unless
    | confirmed=true reaches this layer.
    |
    | chat/route.ts must independently authorize that boolean using the
    | previously stored server-side pending confirmation.
    |
    */

    case "clear_style_profile":
      if (
        args.confirmed !==
        true
      ) {
        return {
          success:
            false,

          confirmationRequired:
            true,

          action:
            "clear_style_profile",

          message:
            "Clearing all saved SilentGEN AI style preferences requires explicit customer confirmation.",
        };
      }

      return clearAIStyleProfile(
        userId
      );

    /*
    |--------------------------------------------------------------------------
    | UNKNOWN TOOL
    |--------------------------------------------------------------------------
    */

    default:
      return {
        success:
          false,

        message:
          `Unknown AI tool: ${name}`,
      };
  }
}