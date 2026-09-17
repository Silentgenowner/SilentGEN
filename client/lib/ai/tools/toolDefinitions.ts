/*
|--------------------------------------------------------------------------
| SILENTGEN AI TOOL DEFINITIONS
|--------------------------------------------------------------------------
|
| These are the real ecommerce capabilities available to SilentGEN AI.
|
| IMPORTANT:
|
| - Tool names must exactly match executeAITool.ts
| - All tools use real SilentGEN backend data
| - Never invent product/order/cart identifiers
| - Consequential tools use server-side confirmation protection
| - Language handling belongs to the system prompt, not tool arguments
|
|--------------------------------------------------------------------------
*/

export const silentGenToolDefinitions =
  [
    /*
    |--------------------------------------------------------------------------
    | SEARCH PRODUCTS
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "search_products",

      description:
        "Search real SilentGEN products using customer requirements such as search text, category, gender, color, size, fabric, fit, minimum price, maximum price and stock availability. Use this for real product discovery and recommendations.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          query: {
            type: [
              "string",
              "null",
            ],

            description:
              "Optional free-text product search query. Use null when no search text is needed.",
          },

          category: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested product category or fashion type such as Shirt, T-shirt, Jeans, Trouser, Chinos or another relevant SilentGEN category. Use null when unspecified.",
          },

          gender: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested gender filter such as Men, Women, Kids or Unisex. Use null when unspecified.",
          },

          color: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested product color. Use null when unspecified.",
          },

          size: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested product size. Use null when unspecified.",
          },

          fabric: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested fabric such as Cotton. Use null when unspecified.",
          },

          fit: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested fit such as Slim Fit or Regular Fit. Use null when unspecified.",
          },

          minPrice: {
            type: [
              "number",
              "null",
            ],

            description:
              "Minimum customer budget in INR. Use null when no minimum is specified.",
          },

          maxPrice: {
            type: [
              "number",
              "null",
            ],

            description:
              "Maximum customer budget in INR. Use null when no maximum is specified.",
          },

          inStockOnly: {
            type:
              "boolean",

            description:
              "Use true when only currently available products should be returned.",
          },

          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              12,

            description:
              "Maximum number of products to return.",
          },
        },

        required: [
          "query",
          "category",
          "gender",
          "color",
          "size",
          "fabric",
          "fit",
          "minPrice",
          "maxPrice",
          "inStockOnly",
          "limit",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | GET PRODUCT
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "get_product",

      description:
        "Get one exact real SilentGEN product using either its product ID or slug. Use this when exact product details such as price, fabric, fit, colors, sizes or description are required.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          productId: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact SilentGEN product ID when known. Use null when using slug instead.",
          },

          slug: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact SilentGEN product slug when known. Use null when using productId instead.",
          },
        },

        required: [
          "productId",
          "slug",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | CHECK PRODUCT STOCK
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "check_product_stock",

      description:
        "Check current real SilentGEN inventory for one exact product, including selected size and color variant availability. Use this before claiming exact variant availability when size or color matters.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          productId: {
            type:
              "string",

            description:
              "Exact real SilentGEN product ID.",
          },

          size: {
            type: [
              "string",
              "null",
            ],

            description:
              "Selected size. Use null if size is not specified or the product does not require a size.",
          },

          color: {
            type: [
              "string",
              "null",
            ],

            description:
              "Selected color. Use null if color is not specified or the product does not require a color.",
          },
        },

        required: [
          "productId",
          "size",
          "color",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | BUILD OUTFIT
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "build_outfit",

      description:
        "Build a coordinated outfit using real SilentGEN products based on a base product or category, color, gender, occasion, style, size and budget. Use this for complete-look and matching-fashion requests.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          baseProductId: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact current/base SilentGEN product ID when the outfit should be built around a specific product. Use null when no exact base product exists.",
          },

          baseCategory: {
            type: [
              "string",
              "null",
            ],

            description:
              "Base fashion category when known, such as Shirt, T-shirt, Jeans or Trouser.",
          },

          baseColor: {
            type: [
              "string",
              "null",
            ],

            description:
              "Base product or requested outfit color. Use null when unspecified.",
          },

          gender: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested gender context such as Men, Women, Kids or Unisex. Use null when unspecified.",
          },

          occasion: {
            type: [
              "string",
              "null",
            ],

            description:
              "Occasion such as Casual, Office, Party, College, Date or Wedding. Use null when unspecified.",
          },

          style: {
            type: [
              "string",
              "null",
            ],

            description:
              "Requested style such as Premium, Minimal, Casual, Formal or Streetwear. Use null when unspecified.",
          },

          size: {
            type: [
              "string",
              "null",
            ],

            description:
              "Customer clothing size preference when relevant. Use null when unspecified.",
          },

          budget: {
            type: [
              "number",
              "null",
            ],

            description:
              "Maximum total outfit budget in INR when specified. Use null when no budget applies.",
          },

          limitPerCategory: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              5,

            description:
              "Maximum number of candidate products to consider per complementary category.",
          },
        },

        required: [
          "baseProductId",
          "baseCategory",
          "baseColor",
          "gender",
          "occasion",
          "style",
          "size",
          "budget",
          "limitPerCategory",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | GET CART
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "get_cart",

      description:
        "Get the authenticated customer's current real SilentGEN cart including exact variants, quantities and totals. Requires customer login.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties:
          {},

        required:
          [],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | ADD CART ITEM
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "add_cart_item",

      description:
        "Add one exact real SilentGEN product variant to the authenticated customer's cart. Never invent a product ID and never guess a required size or color. Only call this when the exact product and all required variant selections are known.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          productId: {
            type:
              "string",

            description:
              "Exact real SilentGEN product ID to add.",
          },

          size: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact customer-selected size. Use null only when size is not required by the product.",
          },

          color: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact customer-selected color. Use null only when color is not required by the product.",
          },

          quantity: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              20,

            description:
              "Quantity to add. Must respect real stock availability.",
          },
        },

        required: [
          "productId",
          "size",
          "color",
          "quantity",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | UPDATE CART QUANTITY
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "update_cart_quantity",

      description:
        "Set the quantity of one exact existing SilentGEN cart product variant for the authenticated customer. The exact product ID, size and color variant must be identified before changing quantity.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          productId: {
            type:
              "string",

            description:
              "Exact SilentGEN cart product ID.",
          },

          size: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact cart variant size. Use null only when the item does not use size.",
          },

          color: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact cart variant color. Use null only when the item does not use color.",
          },

          quantity: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              20,

            description:
              "New absolute quantity for this exact cart variant.",
          },
        },

        required: [
          "productId",
          "size",
          "color",
          "quantity",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | REMOVE CART ITEM
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "remove_cart_item",

      description:
        "Remove one exact SilentGEN cart product variant belonging to the authenticated customer. Identify the correct product, size and color before removing it.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          productId: {
            type:
              "string",

            description:
              "Exact product ID of the cart item to remove.",
          },

          size: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact cart item size, or null when the product has no size variant.",
          },

          color: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact cart item color, or null when the product has no color variant.",
          },
        },

        required: [
          "productId",
          "size",
          "color",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | GET ORDERS
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "get_orders",

      description:
        "Get recent real orders belonging to the authenticated SilentGEN customer. Use this when the customer asks for recent, latest or previous orders.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              20,

            description:
              "Maximum number of recent customer orders to return.",
          },
        },

        required: [
          "limit",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | GET ONE ORDER
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "get_order",

      description:
        "Get complete real details for one exact SilentGEN order belonging to the authenticated customer.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          orderId: {
            type:
              "string",

            description:
              "Exact real SilentGEN order ID belonging to the authenticated customer.",
          },
        },

        required: [
          "orderId",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | TRACK ORDER
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "track_order",

      description:
        "Track one exact real SilentGEN customer order. When a real AWB exists and Shiprocket is configured, live Shiprocket tracking may be used. Never invent courier, AWB, scans or delivery estimates.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          orderId: {
            type:
              "string",

            description:
              "Exact SilentGEN order ID belonging to the authenticated customer.",
          },
        },

        required: [
          "orderId",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | CANCEL ORDER
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | First call:
    | confirmed = false
    |
    | After frontend/server confirmation:
    | confirmed = true
    |
    | chat/route.ts performs the final server-side authorization.
    |
    */

    {
      type:
        "function",

      name:
        "cancel_order",

      description:
        "Request cancellation of one eligible real SilentGEN customer order. This is consequential. On the initial cancellation request use confirmed=false so the backend can request customer confirmation. Use confirmed=true only on a later explicit confirmation turn. The server independently validates confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          orderId: {
            type:
              "string",

            description:
              "Exact eligible SilentGEN order ID belonging to the authenticated customer.",
          },

          reason: {
            type: [
              "string",
              "null",
            ],

            description:
              "Customer-provided cancellation reason when available. Use null when no reason was given.",
          },

          confirmed: {
            type:
              "boolean",

            description:
              "Use false on the initial action request. Use true only after the customer has explicitly confirmed the same pending cancellation action.",
          },
        },

        required: [
          "orderId",
          "reason",
          "confirmed",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | RETURN REQUEST
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "request_return",

      description:
        "Request a return for one eligible delivered SilentGEN customer order. A genuine customer-provided return reason is required. This is consequential. Initially use confirmed=false. Use confirmed=true only after the customer explicitly confirms the same pending return request. The server independently validates confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          orderId: {
            type:
              "string",

            description:
              "Exact eligible delivered SilentGEN order ID belonging to the authenticated customer.",
          },

          reason: {
            type:
              "string",

            description:
              "Actual return reason provided by the customer. Never invent a reason.",
          },

          confirmed: {
            type:
              "boolean",

            description:
              "Use false before explicit confirmation and true only on the later explicit confirmation turn for the same pending return.",
          },
        },

        required: [
          "orderId",
          "reason",
          "confirmed",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | EXCHANGE REQUEST
    |--------------------------------------------------------------------------
    |
    | requestedSize / requestedColor are intentionally NOT included yet.
    |
    | Current Order schema/tool backend does not safely persist replacement
    | variant selections yet. We will add them together later.
    |
    */

    {
      type:
        "function",

      name:
        "request_exchange",

      description:
        "Request an exchange for one eligible delivered SilentGEN customer order. A genuine customer-provided exchange reason is required. This is consequential. Initially use confirmed=false. Use confirmed=true only after explicit customer confirmation of the same pending exchange request. Do not invent a replacement size or color. The server independently validates confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          orderId: {
            type:
              "string",

            description:
              "Exact eligible delivered SilentGEN order ID belonging to the authenticated customer.",
          },

          reason: {
            type:
              "string",

            description:
              "Actual exchange reason provided by the customer. Never invent the reason.",
          },

          confirmed: {
            type:
              "boolean",

            description:
              "Use false before confirmation and true only on the explicit confirmation turn for the exact same pending exchange request.",
          },
        },

        required: [
          "orderId",
          "reason",
          "confirmed",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | GET STYLE PROFILE
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "get_style_profile",

      description:
        "Get persistent SilentGEN AI fashion and shopping preferences belonging to the authenticated customer, including preferred colors, sizes, fits, styles, budgets and personalization settings.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties:
          {},

        required:
          [],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | UPDATE STYLE PROFILE
    |--------------------------------------------------------------------------
    */

    {
      type:
        "function",

      name:
        "update_style_profile",

      description:
        "Save explicit durable fashion and shopping preferences for the authenticated SilentGEN customer. Save only continuing preferences or information the customer explicitly asks SilentGEN AI to remember. Do not convert temporary shopping requests into permanent preferences.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          preferredColors: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Durable colors the customer prefers. Use null when this field should not be changed.",
          },

          dislikedColors: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Durable colors the customer wants to avoid. Use null when unchanged.",
          },

          preferredSizes: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Customer's usual/preferred sizes such as L or XL. Use null when unchanged.",
          },

          preferredFits: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Preferred garment fits such as Slim Fit or Regular Fit. Use null when unchanged.",
          },

          preferredCategories: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Long-term preferred fashion categories. Use null when unchanged.",
          },

          preferredBrands: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Long-term preferred brands. Use null when unchanged.",
          },

          preferredStyles: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Long-term style preferences such as Minimal, Casual, Premium or Streetwear. Use null when unchanged.",
          },

          preferredFabrics: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Long-term preferred fabrics such as Cotton. Use null when unchanged.",
          },

          preferredOccasions: {
            type: [
              "array",
              "null",
            ],

            items: {
              type:
                "string",
            },

            description:
              "Long-term shopping occasions the customer commonly prefers. Use null when unchanged.",
          },

          minBudget: {
            type: [
              "number",
              "null",
            ],

            description:
              "Persistent normal minimum shopping budget in INR, only when explicitly indicated as a continuing preference. Use null when unchanged.",
          },

          maxBudget: {
            type: [
              "number",
              "null",
            ],

            description:
              "Persistent normal maximum shopping budget in INR, only when explicitly indicated as a continuing preference. Use null when unchanged.",
          },

          likedProductId: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact real product ID the customer explicitly said they like. Use null when no liked product is being recorded.",
          },

          dislikedProductId: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact real product ID the customer explicitly said they dislike. Use null when no disliked product is being recorded.",
          },

          viewedProductId: {
            type: [
              "string",
              "null",
            ],

            description:
              "Exact real product ID to record as viewed when appropriate. Use null when not being updated.",
          },

          personalizationEnabled: {
            type: [
              "boolean",
              "null",
            ],

            description:
              "Set false only when the customer clearly disables personalization. Set true when they clearly enable it. Use null when unchanged.",
          },
        },

        required: [
          "preferredColors",
          "dislikedColors",
          "preferredSizes",
          "preferredFits",
          "preferredCategories",
          "preferredBrands",
          "preferredStyles",
          "preferredFabrics",
          "preferredOccasions",
          "minBudget",
          "maxBudget",
          "likedProductId",
          "dislikedProductId",
          "viewedProductId",
          "personalizationEnabled",
        ],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR STYLE PROFILE
    |--------------------------------------------------------------------------
    |
    | This is also consequential because it permanently deletes saved
    | SilentGEN AI preference memory.
    |
    | First call:
    | confirmed = false
    |
    | Confirmation turn:
    | confirmed = true
    |
    */

    {
      type:
        "function",

      name:
        "clear_style_profile",

      description:
        "Clear all persistent SilentGEN AI fashion and shopping preferences for the authenticated customer. This is consequential. Initially use confirmed=false to request confirmation. Use confirmed=true only after explicit customer confirmation of the same pending clear-profile action. The server independently validates confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        additionalProperties:
          false,

        properties: {
          confirmed: {
            type:
              "boolean",

            description:
              "Use false before customer confirmation. Use true only after the customer explicitly confirms clearing all saved SilentGEN AI style preferences.",
          },
        },

        required: [
          "confirmed",
        ],
      },
    },
  ] as const;