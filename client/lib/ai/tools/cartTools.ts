import mongoose from "mongoose";

import Cart from "@/models/Cart";
import Product from "@/models/Product";

import {
  calculateCartTotals,
} from "@/lib/cartTotals";

import {
  getProductVariantImage,
  resolveProductInventory,
} from "@/lib/ai/tools/productTools";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type AddCartItemInput = {
  productId: string;

  size: string | null;

  color: string | null;

  quantity: number;
};

export type UpdateCartQuantityInput = {
  productId: string;

  size: string | null;

  color: string | null;

  quantity: number;
};

export type RemoveCartItemInput = {
  productId: string;

  size: string | null;

  color: string | null;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_AI_CART_QUANTITY =
  20;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function normalizeValue(
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

function safeNumber(
  value: unknown
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return number;
}

function safeStock(
  value: unknown
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number <= 0
  ) {
    return 0;
  }

  return Math.floor(
    number
  );
}

function emptySummary() {
  return {
    totalItems:
      0,

    subtotal:
      0,

    shipping:
      0,

    grandTotal:
      0,
  };
}

/*
|--------------------------------------------------------------------------
| LOGIN RESPONSE
|--------------------------------------------------------------------------
*/

function loginRequired(
  message: string
) {
  return {
    success:
      false,

    requiresLogin:
      true,

    message,

    items:
      [],

    summary:
      emptySummary(),
  };
}

/*
|--------------------------------------------------------------------------
| VALIDATE USER ID
|--------------------------------------------------------------------------
*/

function validUserId(
  userId:
    string | null
) {
  return Boolean(
    userId &&
      mongoose.Types.ObjectId.isValid(
        userId
      )
  );
}

/*
|--------------------------------------------------------------------------
| EXACT CART ITEM MATCH
|--------------------------------------------------------------------------
*/

function findCartItem(
  cart:
    any,
  productId:
    string,
  size:
    string | null,
  color:
    string | null
) {
  if (
    !cart ||
    !Array.isArray(
      cart.items
    )
  ) {
    return null;
  }

  const requestedSize =
    normalizeValue(
      size
    );

  const requestedColor =
    normalizeValue(
      color
    );

  return (
    cart.items.find(
      (
        item: any
      ) => {
        const sameProduct =
          String(
            item.productId
          ) ===
          productId;

        const sameSize =
          normalizeValue(
            item.size
          ) ===
          requestedSize;

        const sameColor =
          normalizeValue(
            item.color
          ) ===
          requestedColor;

        return (
          sameProduct &&
          sameSize &&
          sameColor
        );
      }
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| EXACT CART ITEM INDEX
|--------------------------------------------------------------------------
*/

function findCartItemIndex(
  cart:
    any,
  productId:
    string,
  size:
    string | null,
  color:
    string | null
) {
  if (
    !cart ||
    !Array.isArray(
      cart.items
    )
  ) {
    return -1;
  }

  const requestedSize =
    normalizeValue(
      size
    );

  const requestedColor =
    normalizeValue(
      color
    );

  return cart.items.findIndex(
    (
      item: any
    ) => {
      const sameProduct =
        String(
          item.productId
        ) ===
        productId;

      const sameSize =
        normalizeValue(
          item.size
        ) ===
        requestedSize;

      const sameColor =
        normalizeValue(
          item.color
        ) ===
        requestedColor;

      return (
        sameProduct &&
        sameSize &&
        sameColor
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT MAP
|--------------------------------------------------------------------------
*/

async function getProductMap(
  cart:
    any
) {
  if (
    !cart ||
    !Array.isArray(
      cart.items
    ) ||
    cart.items.length ===
      0
  ) {
    return new Map<
      string,
      any
    >();
  }

  const productIds =
    Array.from(
      new Set(
        cart.items
          .map(
            (
              item: any
            ) =>
              String(
                item.productId ||
                  ""
              )
          )
          .filter(
            (
              id: string
            ) =>
              mongoose.Types.ObjectId.isValid(
                id
              )
          )
      )
    );

  if (
    productIds.length ===
    0
  ) {
    return new Map<
      string,
      any
    >();
  }

  const products =
    await Product.find({
      _id: {
        $in:
          productIds,
      },

      isDeleted: {
        $ne:
          true,
      },
    }).lean();

  return new Map(
    products.map(
      (
        product: any
      ) => [
        String(
          product._id
        ),

        product,
      ]
    )
  );
}

/*
|--------------------------------------------------------------------------
| SYNC ONE CART ITEM
|--------------------------------------------------------------------------
*/

function syncCartItem(
  item:
    any,
  product:
    any
) {
  const selectedSize =
    cleanString(
      item.size
    ) ||
    null;

  const selectedColor =
    cleanString(
      item.color
    ) ||
    null;

  const inventory =
    resolveProductInventory(
      product,
      {
        size:
          selectedSize,

        color:
          selectedColor,
      }
    );

  const quantity =
    Math.max(
      Math.floor(
        safeNumber(
          item.quantity
        )
      ),
      1
    );

  const variantValid =
    (
      !selectedSize ||
      inventory.sizeAvailable
    ) &&
    (
      !selectedColor ||
      inventory.colorAvailable
    );

  const active =
    product.status ===
      "Active" &&
    product.isDeleted !==
      true;

  const purchasable =
    active &&
    variantValid &&
    inventory.available &&
    inventory.stock >
      0;

  const syncedQuantity =
    purchasable
      ? Math.min(
          quantity,
          inventory.stock
        )
      : quantity;

  item.sku =
    String(
      product.sku ||
        item.sku ||
        ""
    );

  item.name =
    String(
      product.name ||
        item.name ||
        ""
    );

  item.brand =
    String(
      product.brand ||
        item.brand ||
        "SilentGEN"
    );

  item.category =
    String(
      product.category ||
        item.category ||
        ""
    );

  item.price =
    Math.max(
      safeNumber(
        product.price
      ),
      0
    );

  item.stock =
    purchasable
      ? inventory.stock
      : 0;

  item.status =
    purchasable
      ? "Active"
      : "Inactive";

  item.image =
    inventory.image ||
    getProductVariantImage(
      product,
      selectedColor
    ) ||
    String(
      product.thumbnail ||
        product.images?.[0] ||
        item.image ||
        ""
    );

  item.quantity =
    syncedQuantity;

  /*
  |--------------------------------------------------------------------------
  | CANONICAL SIZE / COLOR
  |--------------------------------------------------------------------------
  */

  if (
    inventory.size
  ) {
    item.size =
      inventory.size;
  }

  if (
    inventory.color
  ) {
    item.color =
      inventory.color;
  }

  return {
    inventory,

    purchasable,

    variantValid,
  };
}

/*
|--------------------------------------------------------------------------
| CART TOTAL SOURCE
|--------------------------------------------------------------------------
*/

function getPurchasableItems(
  cart:
    any
) {
  if (
    !cart ||
    !Array.isArray(
      cart.items
    )
  ) {
    return [];
  }

  return cart.items.filter(
    (
      item: any
    ) =>
      item.status ===
        "Active" &&
      safeStock(
        item.stock
      ) >
        0 &&
      safeNumber(
        item.quantity
      ) >
        0
  );
}

/*
|--------------------------------------------------------------------------
| SERIALIZE CART
|--------------------------------------------------------------------------
*/

async function serializeCart(
  cart:
    any,
  options?: {
    saveSyncedCart?:
      boolean;
  }
) {
  if (
    !cart ||
    !Array.isArray(
      cart.items
    ) ||
    cart.items.length ===
      0
  ) {
    return {
      items:
        [],

      summary:
        emptySummary(),
    };
  }

  const productMap =
    await getProductMap(
      cart
    );

  let changed =
    false;

  const serializedItems:
    any[] =
    [];

  for (
    const item of
    cart.items
  ) {
    const productId =
      String(
        item.productId ||
          ""
      );

    const product =
      productMap.get(
        productId
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT REMOVED / DELETED
    |--------------------------------------------------------------------------
    */

    if (
      !product
    ) {
      const beforeStatus =
        item.status;

      const beforeStock =
        item.stock;

      item.status =
        "Inactive";

      item.stock =
        0;

      if (
        beforeStatus !==
          item.status ||
        beforeStock !==
          item.stock
      ) {
        changed =
          true;
      }

      serializedItems.push({
        productId,

        name:
          String(
            item.name ||
              ""
          ),

        sku:
          String(
            item.sku ||
              ""
          ),

        category:
          String(
            item.category ||
              ""
          ),

        brand:
          String(
            item.brand ||
              "SilentGEN"
          ),

        image:
          String(
            item.image ||
              ""
          ),

        price:
          safeNumber(
            item.price
          ),

        stock:
          0,

        quantity:
          Math.max(
            Math.floor(
              safeNumber(
                item.quantity
              )
            ),
            1
          ),

        size:
          cleanString(
            item.size
          ),

        color:
          cleanString(
            item.color
          ),

        status:
          "Inactive",

        available:
          false,

        message:
          "Product is no longer available.",

        url:
          productId
            ? `/product/${productId}`
            : "",
      });

      continue;
    }

    const before =
      JSON.stringify({
        sku:
          item.sku,

        name:
          item.name,

        brand:
          item.brand,

        category:
          item.category,

        image:
          item.image,

        price:
          item.price,

        stock:
          item.stock,

        status:
          item.status,

        quantity:
          item.quantity,

        size:
          item.size,

        color:
          item.color,
      });

    const {
      inventory,
      purchasable,
    } =
      syncCartItem(
        item,
        product
      );

    const after =
      JSON.stringify({
        sku:
          item.sku,

        name:
          item.name,

        brand:
          item.brand,

        category:
          item.category,

        image:
          item.image,

        price:
          item.price,

        stock:
          item.stock,

        status:
          item.status,

        quantity:
          item.quantity,

        size:
          item.size,

        color:
          item.color,
      });

    if (
      before !==
      after
    ) {
      changed =
        true;
    }

    serializedItems.push({
      productId,

      name:
        String(
          item.name ||
            ""
        ),

      sku:
        String(
          item.sku ||
            ""
        ),

      category:
        String(
          item.category ||
            ""
        ),

      brand:
        String(
          item.brand ||
            "SilentGEN"
        ),

      image:
        String(
          item.image ||
            ""
        ),

      price:
        safeNumber(
          item.price
        ),

      stock:
        safeStock(
          item.stock
        ),

      quantity:
        Math.max(
          Math.floor(
            safeNumber(
              item.quantity
            )
          ),
          1
        ),

      size:
        cleanString(
          item.size
        ),

      color:
        cleanString(
          item.color
        ),

      status:
        String(
          item.status ||
            ""
        ),

      available:
        purchasable,

      sizeAvailable:
        inventory.sizeAvailable,

      colorAvailable:
        inventory.colorAvailable,

      sizeRequired:
        inventory.sizeRequired,

      colorRequired:
        inventory.colorRequired,

      availableSizes:
        inventory.availableSizes,

      availableColors:
        inventory.availableColors,

      message:
        purchasable
          ? inventory.message
          : inventory.message ||
            "Product is currently unavailable.",

      url:
        `/product/${productId}`,
    });
  }

  if (
    changed &&
    options?.saveSyncedCart !==
      false
  ) {
    await cart.save();
  }

  const purchasableItems =
    getPurchasableItems(
      cart
    );

  const totals =
    calculateCartTotals(
      purchasableItems
    );

  return {
    items:
      serializedItems,

    summary: {
      totalItems:
        Number(
          totals.totalItems ||
            0
        ),

      subtotal:
        Number(
          totals.subtotal ||
            0
        ),

      shipping:
        Number(
          totals.shipping ||
            0
        ),

      grandTotal:
        Number(
          totals.grandTotal ||
            0
        ),
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET CART
|--------------------------------------------------------------------------
*/

export async function getAICart(
  userId:
    string | null
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to view your cart."
    );
  }

  if (
    !validUserId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",

      items:
        [],

      summary:
        emptySummary(),
    };
  }

  const cart =
    await Cart.findOne({
      userId,
    });

  if (
    !cart ||
    !Array.isArray(
      cart.items
    ) ||
    cart.items.length ===
      0
  ) {
    return {
      success:
        true,

      message:
        "Your cart is empty.",

      items:
        [],

      summary:
        emptySummary(),
    };
  }

  const serialized =
    await serializeCart(
      cart
    );

  const availableItems =
    serialized.items.filter(
      (
        item: any
      ) =>
        item.available ===
        true
    );

  return {
    success:
      true,

    message:
      serialized.items.length >
      0
        ? availableItems.length ===
          serialized.items.length
          ? "Cart loaded successfully."
          : "Cart loaded. Some items are currently unavailable or have changed stock."
        : "Your cart is empty.",

    ...serialized,
  };
}

/*
|--------------------------------------------------------------------------
| ADD CART ITEM
|--------------------------------------------------------------------------
*/

export async function addAICartItem(
  userId:
    string | null,
  input:
    AddCartItemInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to add products to your cart."
    );
  }

  if (
    !validUserId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",
    };
  }

  const productId =
    cleanString(
      input.productId
    );

  if (
    !productId ||
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",
    };
  }

  const quantity =
    Number(
      input.quantity
    );

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <
      1 ||
    quantity >
      MAX_AI_CART_QUANTITY
  ) {
    return {
      success:
        false,

      message:
        `Quantity must be between 1 and ${MAX_AI_CART_QUANTITY}.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD REAL PRODUCT
  |--------------------------------------------------------------------------
  */

  const product =
    await Product.findOne({
      _id:
        productId,

      isDeleted: {
        $ne:
          true,
      },
    }).lean();

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",
    };
  }

  if (
    product.status !==
    "Active"
  ) {
    return {
      success:
        false,

      message:
        "Product is currently unavailable.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | REQUESTED VARIANT
  |--------------------------------------------------------------------------
  */

  const requestedSize =
    cleanString(
      input.size
    ) ||
    null;

  const requestedColor =
    cleanString(
      input.color
    ) ||
    null;

  const inventory =
    resolveProductInventory(
      product,
      {
        size:
          requestedSize,

        color:
          requestedColor,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | REQUIRED SIZE
  |--------------------------------------------------------------------------
  */

  if (
    inventory.sizeRequired &&
    !requestedSize
  ) {
    return {
      success:
        false,

      selectionRequired:
        true,

      requiredSelection:
        "size",

      availableSizes:
        inventory.availableSizes,

      availableColors:
        inventory.availableColors,

      message:
        "Please select a size before adding this product to cart.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | REQUIRED COLOR
  |--------------------------------------------------------------------------
  */

  if (
    inventory.colorRequired &&
    !requestedColor
  ) {
    return {
      success:
        false,

      selectionRequired:
        true,

      requiredSelection:
        "color",

      availableSizes:
        inventory.availableSizes,

      availableColors:
        inventory.availableColors,

      message:
        "Please select a color before adding this product to cart.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | INVALID SIZE
  |--------------------------------------------------------------------------
  */

  if (
    requestedSize &&
    !inventory.sizeAvailable
  ) {
    return {
      success:
        false,

      selectionRequired:
        true,

      requiredSelection:
        "size",

      availableSizes:
        inventory.availableSizes,

      message:
        inventory.message ||
        `Size ${requestedSize} is not available.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | INVALID COLOR
  |--------------------------------------------------------------------------
  */

  if (
    requestedColor &&
    !inventory.colorAvailable
  ) {
    return {
      success:
        false,

      selectionRequired:
        true,

      requiredSelection:
        "color",

      availableColors:
        inventory.availableColors,

      message:
        inventory.message ||
        `Color ${requestedColor} is not available.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | EXACT STOCK
  |--------------------------------------------------------------------------
  */

  if (
    !inventory.available ||
    inventory.stock <=
      0
  ) {
    return {
      success:
        false,

      stock:
        0,

      message:
        inventory.message ||
        "Selected product variant is currently out of stock.",
    };
  }

  if (
    quantity >
    inventory.stock
  ) {
    return {
      success:
        false,

      stock:
        inventory.stock,

      message:
        `Only ${inventory.stock} item(s) are currently available for this exact variant.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CANONICAL VARIANT
  |--------------------------------------------------------------------------
  */

  const finalSize =
    inventory.size ||
    requestedSize ||
    "";

  const finalColor =
    inventory.color ||
    requestedColor ||
    "";

  /*
  |--------------------------------------------------------------------------
  | GET OR CREATE CART
  |--------------------------------------------------------------------------
  */

  let cart =
    await Cart.findOne({
      userId,
    });

  if (
    !cart
  ) {
    cart =
      new Cart({
        userId,

        items:
          [],
      });
  }

  /*
  |--------------------------------------------------------------------------
  | SAME EXACT VARIANT
  |--------------------------------------------------------------------------
  */

  const existingItem =
    findCartItem(
      cart,
      productId,
      finalSize,
      finalColor
    );

  let finalQuantity =
    quantity;

  if (
    existingItem
  ) {
    const currentQuantity =
      Math.max(
        Math.floor(
          safeNumber(
            existingItem.quantity
          )
        ),
        0
      );

    finalQuantity =
      currentQuantity +
      quantity;

    if (
      finalQuantity >
      MAX_AI_CART_QUANTITY
    ) {
      return {
        success:
          false,

        currentQuantity,

        message:
          `Maximum AI cart quantity allowed is ${MAX_AI_CART_QUANTITY}.`,
      };
    }

    if (
      finalQuantity >
      inventory.stock
    ) {
      return {
        success:
          false,

        currentQuantity,

        stock:
          inventory.stock,

        message:
          `You already have ${currentQuantity} item(s) in cart. Only ${inventory.stock} item(s) are available for this exact variant.`,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | SYNC EXISTING ITEM
    |--------------------------------------------------------------------------
    */

    existingItem.quantity =
      finalQuantity;

    existingItem.sku =
      String(
        product.sku ||
          existingItem.sku ||
          ""
      );

    existingItem.name =
      String(
        product.name ||
          existingItem.name ||
          ""
      );

    existingItem.brand =
      String(
        product.brand ||
          existingItem.brand ||
          "SilentGEN"
      );

    existingItem.category =
      String(
        product.category ||
          existingItem.category ||
          ""
      );

    existingItem.price =
      Math.max(
        safeNumber(
          product.price
        ),
        0
      );

    existingItem.stock =
      inventory.stock;

    existingItem.status =
      "Active";

    existingItem.size =
      finalSize;

    existingItem.color =
      finalColor;

    existingItem.image =
      inventory.image ||
      getProductVariantImage(
        product,
        finalColor
      ) ||
      String(
        product.thumbnail ||
          product.images?.[0] ||
          existingItem.image ||
          ""
      );
  } else {
    /*
    |--------------------------------------------------------------------------
    | NEW CART ITEM
    |--------------------------------------------------------------------------
    */

    cart.items.push({
      productId:
        product._id,

      sku:
        String(
          product.sku ||
            ""
        ),

      name:
        String(
          product.name ||
            ""
        ),

      brand:
        String(
          product.brand ||
            "SilentGEN"
        ),

      category:
        String(
          product.category ||
            ""
        ),

      image:
        inventory.image ||
        getProductVariantImage(
          product,
          finalColor
        ) ||
        String(
          product.thumbnail ||
            product.images?.[0] ||
            ""
        ),

      price:
        Math.max(
          safeNumber(
            product.price
          ),
          0
        ),

      stock:
        inventory.stock,

      status:
        "Active",

      quantity:
        finalQuantity,

      size:
        finalSize,

      color:
        finalColor,
    } as any);
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE CART
  |--------------------------------------------------------------------------
  */

  await cart.save();

  const serialized =
    await serializeCart(
      cart,
      {
        saveSyncedCart:
          false,
      }
    );

  return {
    success:
      true,

    message:
      `${product.name || "Product"} added to cart successfully.`,

    addedItem: {
      productId,

      name:
        String(
          product.name ||
            ""
        ),

      quantity:
        finalQuantity,

      addedQuantity:
        quantity,

      size:
        finalSize,

      color:
        finalColor,

      stock:
        inventory.stock,

      image:
        inventory.image ||
        getProductVariantImage(
          product,
          finalColor
        ) ||
        "",
    },

    ...serialized,
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE QUANTITY
|--------------------------------------------------------------------------
*/

export async function updateAICartQuantity(
  userId:
    string | null,
  input:
    UpdateCartQuantityInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to update your cart."
    );
  }

  if (
    !validUserId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",
    };
  }

  const productId =
    cleanString(
      input.productId
    );

  if (
    !productId ||
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",
    };
  }

  const quantity =
    Number(
      input.quantity
    );

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <
      1 ||
    quantity >
      MAX_AI_CART_QUANTITY
  ) {
    return {
      success:
        false,

      message:
        `Quantity must be between 1 and ${MAX_AI_CART_QUANTITY}.`,
    };
  }

  const cart =
    await Cart.findOne({
      userId,
    });

  if (
    !cart ||
    !Array.isArray(
      cart.items
    ) ||
    cart.items.length ===
      0
  ) {
    return {
      success:
        false,

      message:
        "Cart is empty.",
    };
  }

  const item =
    findCartItem(
      cart,
      productId,
      input.size,
      input.color
    );

  if (
    !item
  ) {
    return {
      success:
        false,

      message:
        "That exact product, size and color combination was not found in the cart.",
    };
  }

  const product =
    await Product.findOne({
      _id:
        productId,

      isDeleted: {
        $ne:
          true,
      },
    }).lean();

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product is no longer available.",
    };
  }

  if (
    product.status !==
    "Active"
  ) {
    item.status =
      "Inactive";

    item.stock =
      0;

    await cart.save();

    return {
      success:
        false,

      message:
        "Product is currently unavailable.",
    };
  }

  const selectedSize =
    cleanString(
      item.size
    ) ||
    cleanString(
      input.size
    ) ||
    null;

  const selectedColor =
    cleanString(
      item.color
    ) ||
    cleanString(
      input.color
    ) ||
    null;

  const inventory =
    resolveProductInventory(
      product,
      {
        size:
          selectedSize,

        color:
          selectedColor,
      }
    );

  if (
    selectedSize &&
    !inventory.sizeAvailable
  ) {
    return {
      success:
        false,

      message:
        `Selected size ${selectedSize} is no longer available.`,
    };
  }

  if (
    selectedColor &&
    !inventory.colorAvailable
  ) {
    return {
      success:
        false,

      message:
        `Selected color ${selectedColor} is no longer available.`,
    };
  }

  if (
    !inventory.available ||
    inventory.stock <=
      0
  ) {
    item.status =
      "Inactive";

    item.stock =
      0;

    await cart.save();

    return {
      success:
        false,

      message:
        inventory.message ||
        "Selected product variant is currently out of stock.",
    };
  }

  if (
    quantity >
    inventory.stock
  ) {
    return {
      success:
        false,

      stock:
        inventory.stock,

      message:
        `Only ${inventory.stock} item(s) are currently available for this exact variant.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE SNAPSHOT
  |--------------------------------------------------------------------------
  */

  item.quantity =
    quantity;

  item.price =
    Math.max(
      safeNumber(
        product.price
      ),
      0
    );

  item.name =
    String(
      product.name ||
        item.name ||
        ""
    );

  item.sku =
    String(
      product.sku ||
        item.sku ||
        ""
    );

  item.brand =
    String(
      product.brand ||
        item.brand ||
        "SilentGEN"
    );

  item.category =
    String(
      product.category ||
        item.category ||
        ""
    );

  item.stock =
    inventory.stock;

  item.status =
    "Active";

  item.image =
    inventory.image ||
    getProductVariantImage(
      product,
      selectedColor
    ) ||
    String(
      product.thumbnail ||
        product.images?.[0] ||
        item.image ||
        ""
    );

  if (
    inventory.size
  ) {
    item.size =
      inventory.size;
  }

  if (
    inventory.color
  ) {
    item.color =
      inventory.color;
  }

  await cart.save();

  const serialized =
    await serializeCart(
      cart,
      {
        saveSyncedCart:
          false,
      }
    );

  return {
    success:
      true,

    message:
      `${product.name || "Product"} quantity updated to ${quantity}.`,

    updatedItem: {
      productId,

      quantity,

      size:
        cleanString(
          item.size
        ),

      color:
        cleanString(
          item.color
        ),

      stock:
        inventory.stock,

      image:
        String(
          item.image ||
            ""
        ),
    },

    ...serialized,
  };
}

/*
|--------------------------------------------------------------------------
| REMOVE CART ITEM
|--------------------------------------------------------------------------
*/

export async function removeAICartItem(
  userId:
    string | null,
  input:
    RemoveCartItemInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to remove items from your cart."
    );
  }

  if (
    !validUserId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",
    };
  }

  const productId =
    cleanString(
      input.productId
    );

  if (
    !productId ||
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",
    };
  }

  const cart =
    await Cart.findOne({
      userId,
    });

  if (
    !cart ||
    !Array.isArray(
      cart.items
    ) ||
    cart.items.length ===
      0
  ) {
    return {
      success:
        false,

      message:
        "Cart is empty.",
    };
  }

  const itemIndex =
    findCartItemIndex(
      cart,
      productId,
      input.size,
      input.color
    );

  if (
    itemIndex ===
    -1
  ) {
    return {
      success:
        false,

      message:
        "That exact product, size and color combination was not found in the cart.",
    };
  }

  const removedItem =
    cart.items[
      itemIndex
    ] as any;

  const removedName =
    cleanString(
      removedItem.name
    ) ||
    "Product";

  const removedSize =
    cleanString(
      removedItem.size
    );

  const removedColor =
    cleanString(
      removedItem.color
    );

  const removedQuantity =
    Math.max(
      Math.floor(
        safeNumber(
          removedItem.quantity
        )
      ),
      1
    );

  cart.items.splice(
    itemIndex,
    1
  );

  await cart.save();

  const serialized =
    await serializeCart(
      cart,
      {
        saveSyncedCart:
          false,
      }
    );

  return {
    success:
      true,

    message:
      `${removedName} removed from cart.`,

    removedItem: {
      productId,

      name:
        removedName,

      quantity:
        removedQuantity,

      size:
        removedSize,

      color:
        removedColor,
    },

    ...serialized,
  };
}