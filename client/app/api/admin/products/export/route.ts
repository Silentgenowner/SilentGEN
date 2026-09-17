import {
  NextRequest,
  NextResponse,
} from "next/server";

import * as XLSX from "xlsx";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type SizeStock = {
  size?: unknown;
  stock?: unknown;
};

type Product360Frame = {
  angle?: unknown;
  name?: unknown;
  url?: unknown;
};

type Product360Data = {
  enabled?: unknown;
  frames?: unknown;
};

type ColorVariant = {
  color?: unknown;

  images?: unknown;

  stock?: unknown;

  sizeStocks?: unknown;

  view360Images?: unknown;

  product360?: unknown;
};

/*
|--------------------------------------------------------------------------
| ALLOWED ROLES
|--------------------------------------------------------------------------
*/

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

/*
|--------------------------------------------------------------------------
| ADMIN PERMISSION
|--------------------------------------------------------------------------
*/

async function hasPermission(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return false;
  }

  try {
    const payload =
      await verifyAdminToken(
        token
      );

    return Boolean(
      payload.adminId &&
        payload.role &&
        allowedRoles.includes(
          payload.role as
            (typeof allowedRoles)[number]
        )
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

/*
|--------------------------------------------------------------------------
| NUMBER
|--------------------------------------------------------------------------
*/

function cleanNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| STOCK NUMBER
|--------------------------------------------------------------------------
*/

function cleanStock(
  value: unknown,
  fallback = 0
) {
  const number =
    cleanNumber(
      value,
      fallback
    );

  return Math.max(
    0,
    Math.floor(number)
  );
}

/*
|--------------------------------------------------------------------------
| OPTIONAL STOCK
|--------------------------------------------------------------------------
*/

function optionalStock(
  value: unknown
):
  | number
  | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0
  ) {
    return undefined;
  }

  return Math.floor(
    number
  );
}

/*
|--------------------------------------------------------------------------
| STRING ARRAY
|--------------------------------------------------------------------------
*/

function stringArray(
  value: unknown
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const map =
    new Map<
      string,
      string
    >();

  for (
    const rawItem of value
  ) {
    const item =
      cleanString(
        rawItem
      );

    if (!item) {
      continue;
    }

    const key =
      item.toLowerCase();

    if (!map.has(key)) {
      map.set(
        key,
        item
      );
    }
  }

  return Array.from(
    map.values()
  );
}

/*
|--------------------------------------------------------------------------
| SIZE STOCKS
|--------------------------------------------------------------------------
*/

function normalizeSizeStocks(
  value: unknown
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const map =
    new Map<
      string,
      {
        size: string;
        stock: number;
      }
    >();

  for (
    const rawItem of value
  ) {
    if (
      !rawItem ||
      typeof rawItem !==
        "object"
    ) {
      continue;
    }

    const item =
      rawItem as SizeStock;

    const size =
      cleanString(
        item.size
      );

    if (!size) {
      continue;
    }

    const stock =
      cleanStock(
        item.stock
      );

    map.set(
      size.toLowerCase(),
      {
        size,
        stock,
      }
    );
  }

  return Array.from(
    map.values()
  );
}

/*
|--------------------------------------------------------------------------
| SIZE STOCK STRING
|--------------------------------------------------------------------------
|
| Example:
|
| S=10|M=15|L=20|XL=5
|
|--------------------------------------------------------------------------
*/

function createSizeStockString(
  value: unknown
) {
  const sizeStocks =
    normalizeSizeStocks(
      value
    );

  return sizeStocks
    .map(
      (item) =>
        `${item.size}=${item.stock}`
    )
    .join("|");
}

/*
|--------------------------------------------------------------------------
| SIZE STOCK TOTAL
|--------------------------------------------------------------------------
*/

function calculateSizeStockTotal(
  value: unknown
) {
  return normalizeSizeStocks(
    value
  ).reduce(
    (
      total,
      item
    ) =>
      total +
      item.stock,
    0
  );
}

/*
|--------------------------------------------------------------------------
| 360 FRAMES
|--------------------------------------------------------------------------
*/

function normalize360Frames(
  value: unknown
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const map =
    new Map<
      number,
      {
        angle: number;
        name: string;
        url: string;
      }
    >();

  for (
    const rawFrame of value
  ) {
    if (
      !rawFrame ||
      typeof rawFrame !==
        "object"
    ) {
      continue;
    }

    const frame =
      rawFrame as Product360Frame;

    const angle =
      Number(
        frame.angle
      );

    const url =
      cleanString(
        frame.url
      );

    if (
      !Number.isFinite(
        angle
      ) ||
      angle < 0 ||
      angle >= 360 ||
      !url
    ) {
      continue;
    }

    const safeAngle =
      Math.round(
        angle
      );

    map.set(
      safeAngle,
      {
        angle:
          safeAngle,

        name:
          cleanString(
            frame.name
          ) ||
          `frame-${safeAngle}`,

        url,
      }
    );
  }

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      a.angle -
      b.angle
  );
}

/*
|--------------------------------------------------------------------------
| 360 DATA
|--------------------------------------------------------------------------
*/

function normalizeProduct360(
  value: unknown
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return {
      enabled: false,
      frames: [],
    };
  }

  const data =
    value as Product360Data;

  const frames =
    normalize360Frames(
      data.frames
    );

  return {
    enabled:
      Boolean(
        data.enabled
      ) &&
      frames.length > 0,

    frames,
  };
}

/*
|--------------------------------------------------------------------------
| PRODUCT 360 STRING
|--------------------------------------------------------------------------
|
| Output:
|
| 0:https://...
| 30:https://...
| 60:https://...
|
|--------------------------------------------------------------------------
*/

function create360String(
  product360Value: unknown,
  legacyImagesValue?: unknown
) {
  const product360 =
    normalizeProduct360(
      product360Value
    );

  /*
  |--------------------------------------------------------------------------
  | NEW AI / CLOUDINARY FRAMES
  |--------------------------------------------------------------------------
  */

  if (
    product360.frames.length >
    0
  ) {
    return product360.frames
      .map(
        (frame) =>
          `${frame.angle}:${frame.url}`
      )
      .join("|");
  }

  /*
  |--------------------------------------------------------------------------
  | LEGACY 360 FALLBACK
  |--------------------------------------------------------------------------
  */

  const legacyImages =
    stringArray(
      legacyImagesValue
    );

  if (
    legacyImages.length ===
    0
  ) {
    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | Evenly distribute legacy images around 360 degrees.
  |--------------------------------------------------------------------------
  */

  return legacyImages
    .map(
      (
        url,
        index
      ) => {
        const angle =
          Math.floor(
            (index * 360) /
              legacyImages.length
          );

        return `${angle}:${url}`;
      }
    )
    .join("|");
}

/*
|--------------------------------------------------------------------------
| NORMALIZE COLOR VARIANTS
|--------------------------------------------------------------------------
*/

function normalizeColorVariants(
  value: unknown
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const variants: {
    color: string;

    images: string[];

    stock?: number;

    sizeStocks: {
      size: string;
      stock: number;
    }[];

    view360Images: string[];

    product360: {
      enabled: boolean;
      frames: {
        angle: number;
        name: string;
        url: string;
      }[];
    };
  }[] = [];

  for (
    const rawVariant of value
  ) {
    if (
      !rawVariant ||
      typeof rawVariant !==
        "object"
    ) {
      continue;
    }

    const variant =
      rawVariant as ColorVariant;

    const color =
      cleanString(
        variant.color
      );

    if (!color) {
      continue;
    }

    const sizeStocks =
      normalizeSizeStocks(
        variant.sizeStocks
      );

    const directStock =
      optionalStock(
        variant.stock
      );

    const stock =
      sizeStocks.length >
      0
        ? sizeStocks.reduce(
            (
              total,
              item
            ) =>
              total +
              item.stock,
            0
          )
        : directStock;

    variants.push({
      color,

      images:
        stringArray(
          variant.images
        ),

      stock,

      sizeStocks,

      view360Images:
        stringArray(
          variant.view360Images
        ),

      product360:
        normalizeProduct360(
          variant.product360
        ),
    });
  }

  return variants;
}

/*
|--------------------------------------------------------------------------
| COLOR STOCK
|--------------------------------------------------------------------------
|
| Example:
|
| Black=50;White=45
|
| Image-only variants without inventory are omitted.
|
|--------------------------------------------------------------------------
*/

function createColorStockString(
  value: unknown
) {
  const variants =
    normalizeColorVariants(
      value
    );

  return variants
    .filter(
      (variant) =>
        variant.stock !==
          undefined ||
        variant.sizeStocks
          .length > 0
    )
    .map(
      (variant) => {
        const stock =
          variant.sizeStocks
            .length >
          0
            ? variant.sizeStocks.reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  item.stock,
                0
              )
            : variant.stock ??
              0;

        return `${variant.color}=${stock}`;
      }
    )
    .join(";");
}

/*
|--------------------------------------------------------------------------
| COLOR + SIZE STOCK
|--------------------------------------------------------------------------
|
| Example:
|
| Black:S=10|M=15|L=20;White:S=8|M=12|L=15
|
|--------------------------------------------------------------------------
*/

function createVariantStockString(
  value: unknown
) {
  const variants =
    normalizeColorVariants(
      value
    );

  return variants
    .filter(
      (variant) =>
        variant.sizeStocks
          .length > 0
    )
    .map(
      (variant) => {
        const sizeData =
          variant.sizeStocks
            .map(
              (item) =>
                `${item.size}=${item.stock}`
            )
            .join("|");

        return `${variant.color}:${sizeData}`;
      }
    )
    .join(";");
}

/*
|--------------------------------------------------------------------------
| COLOR IMAGES
|--------------------------------------------------------------------------
|
| Example:
|
| Black=https://...|https://...;White=https://...
|
|--------------------------------------------------------------------------
*/

function createColorImagesString(
  value: unknown
) {
  const variants =
    normalizeColorVariants(
      value
    );

  return variants
    .filter(
      (variant) =>
        variant.images.length >
        0
    )
    .map(
      (variant) =>
        `${variant.color}=${variant.images.join("|")}`
    )
    .join(";");
}

/*
|--------------------------------------------------------------------------
| COLOR 360
|--------------------------------------------------------------------------
|
| Example:
|
| Black=0:https://...|30:https://...;White=0:https://...
|
|--------------------------------------------------------------------------
*/

function createColor360String(
  value: unknown
) {
  const variants =
    normalizeColorVariants(
      value
    );

  return variants
    .map(
      (variant) => {
        const frames =
          create360String(
            variant.product360,
            variant.view360Images
          );

        if (!frames) {
          return "";
        }

        return `${variant.color}=${frames}`;
      }
    )
    .filter(Boolean)
    .join(";");
}

/*
|--------------------------------------------------------------------------
| ACTIVE PRODUCT FILTER
|--------------------------------------------------------------------------
|
| Trash products are not exported.
|
|--------------------------------------------------------------------------
*/

function activeProductFilter() {
  return {
    $or: [
      {
        isDeleted: false,
      },

      {
        isDeleted: {
          $exists: false,
        },
      },
    ],
  };
}

/*
|--------------------------------------------------------------------------
| GET EXPORT
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const permitted =
      await hasPermission(
        request
      );

    if (!permitted) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Permission denied.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | PRODUCTS
    |--------------------------------------------------------------------------
    */

    const products =
      await Product.find(
        activeProductFilter()
      )
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | EXCEL ROWS
    |--------------------------------------------------------------------------
    */

    const rows =
      products.map(
        (
          product: any
        ) => {
          const colorVariants =
            normalizeColorVariants(
              product.colorVariants
            );

          const productImages =
            stringArray(
              product.images
            );

          const thumbnail =
            cleanString(
              product.thumbnail
            ) ||
            productImages[0] ||
            "";

          const main360 =
            create360String(
              product.product360,
              product.view360Images
            );

          return {
            /*
            |--------------------------------------------------------------------------
            | BASIC
            |--------------------------------------------------------------------------
            */

            sku:
              cleanString(
                product.sku
              ),

            name:
              cleanString(
                product.name
              ),

            slug:
              cleanString(
                product.slug
              ),

            category:
              cleanString(
                product.category
              ),

            subCategory:
              cleanString(
                product.subCategory
              ),

            brand:
              cleanString(
                product.brand
              ),

            /*
            |--------------------------------------------------------------------------
            | SPECIFICATION
            |--------------------------------------------------------------------------
            */

            gender:
              cleanString(
                product.gender
              ) ||
              "Unisex",

            fabric:
              cleanString(
                product.fabric
              ),

            fit:
              cleanString(
                product.fit
              ),

            gsm:
              cleanNumber(
                product.gsm
              ),

            weight:
              cleanNumber(
                product.weight
              ),

            /*
            |--------------------------------------------------------------------------
            | DESCRIPTION
            |--------------------------------------------------------------------------
            */

            shortDescription:
              cleanString(
                product.shortDescription
              ),

            description:
              cleanString(
                product.description
              ),

            /*
            |--------------------------------------------------------------------------
            | PRICE
            |--------------------------------------------------------------------------
            */

            mrp:
              cleanNumber(
                product.mrp
              ),

            price:
              cleanNumber(
                product.price
              ),

            discount:
              cleanNumber(
                product.discount
              ),

            /*
            |--------------------------------------------------------------------------
            | TOTAL INVENTORY
            |--------------------------------------------------------------------------
            */

            stock:
              cleanStock(
                product.stock
              ),

            lowStockLimit:
              cleanStock(
                product.lowStockLimit,
                5
              ),

            status:
              cleanString(
                product.status
              ) ||
              "Active",

            /*
            |--------------------------------------------------------------------------
            | PRODUCT IMAGES
            |--------------------------------------------------------------------------
            */

            image:
              thumbnail,

            images:
              productImages.join(
                "|"
              ),

            /*
            |--------------------------------------------------------------------------
            | PRODUCT SIZES
            |--------------------------------------------------------------------------
            */

            sizes:
              stringArray(
                product.sizes
              ).join(","),

            /*
            |--------------------------------------------------------------------------
            | PRODUCT LEVEL SIZE STOCK
            |--------------------------------------------------------------------------
            */

            SizeStock:
              createSizeStockString(
                product.sizeStocks
              ),

            /*
            |--------------------------------------------------------------------------
            | PRODUCT COLORS
            |--------------------------------------------------------------------------
            */

            colors:
              stringArray(
                product.colors
              ).join(","),

            /*
            |--------------------------------------------------------------------------
            | COLOR TOTAL STOCK
            |--------------------------------------------------------------------------
            */

            ColorStock:
              createColorStockString(
                colorVariants
              ),

            /*
            |--------------------------------------------------------------------------
            | COLOR + SIZE STOCK
            |--------------------------------------------------------------------------
            */

            VariantStock:
              createVariantStockString(
                colorVariants
              ),

            /*
            |--------------------------------------------------------------------------
            | COLOR IMAGES
            |--------------------------------------------------------------------------
            */

            ColorImages:
              createColorImagesString(
                colorVariants
              ),

            /*
            |--------------------------------------------------------------------------
            | MAIN 360
            |--------------------------------------------------------------------------
            */

            Main360Images:
              main360,

            /*
            |--------------------------------------------------------------------------
            | COLOR 360
            |--------------------------------------------------------------------------
            */

            Color360Images:
              createColor360String(
                colorVariants
              ),

            /*
            |--------------------------------------------------------------------------
            | TAGS
            |--------------------------------------------------------------------------
            */

            tags:
              stringArray(
                product.tags
              ).join(","),

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */

            featured:
              Boolean(
                product.featured
              ),

            bestSeller:
              Boolean(
                product.bestSeller
              ),

            newArrival:
              Boolean(
                product.newArrival
              ),

            trending:
              Boolean(
                product.trending
              ),

            /*
            |--------------------------------------------------------------------------
            | SORT
            |--------------------------------------------------------------------------
            */

            sortOrder:
              cleanNumber(
                product.sortOrder
              ),

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            seoTitle:
              cleanString(
                product.seoTitle
              ),

            seoDescription:
              cleanString(
                product.seoDescription
              ),
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | EMPTY EXPORT
    |--------------------------------------------------------------------------
    |
    | json_to_sheet([]) does not provide our required headers.
    |
    |--------------------------------------------------------------------------
    */

    const headers = [
      "sku",
      "name",
      "slug",
      "category",
      "subCategory",
      "brand",

      "gender",
      "fabric",
      "fit",
      "gsm",
      "weight",

      "shortDescription",
      "description",

      "mrp",
      "price",
      "discount",

      "stock",
      "lowStockLimit",
      "status",

      "image",
      "images",

      "sizes",
      "SizeStock",

      "colors",
      "ColorStock",
      "VariantStock",

      "ColorImages",

      "Main360Images",
      "Color360Images",

      "tags",

      "featured",
      "bestSeller",
      "newArrival",
      "trending",

      "sortOrder",

      "seoTitle",
      "seoDescription",
    ];

    /*
    |--------------------------------------------------------------------------
    | WORKBOOK
    |--------------------------------------------------------------------------
    */

    const workbook =
      XLSX.utils.book_new();

    const worksheet =
      rows.length > 0
        ? XLSX.utils.json_to_sheet(
            rows,
            {
              header:
                headers,
            }
          )
        : XLSX.utils.aoa_to_sheet(
            [
              headers,
            ]
          );

    /*
    |--------------------------------------------------------------------------
    | COLUMN WIDTHS
    |--------------------------------------------------------------------------
    */

    worksheet["!cols"] = [
      {
        wch: 18,
      }, // sku

      {
        wch: 35,
      }, // name

      {
        wch: 35,
      }, // slug

      {
        wch: 22,
      }, // category

      {
        wch: 22,
      }, // subCategory

      {
        wch: 20,
      }, // brand

      {
        wch: 14,
      }, // gender

      {
        wch: 20,
      }, // fabric

      {
        wch: 18,
      }, // fit

      {
        wch: 10,
      }, // gsm

      {
        wch: 12,
      }, // weight

      {
        wch: 45,
      }, // shortDescription

      {
        wch: 70,
      }, // description

      {
        wch: 12,
      }, // mrp

      {
        wch: 12,
      }, // price

      {
        wch: 12,
      }, // discount

      {
        wch: 12,
      }, // stock

      {
        wch: 16,
      }, // lowStockLimit

      {
        wch: 18,
      }, // status

      {
        wch: 55,
      }, // image

      {
        wch: 90,
      }, // images

      {
        wch: 25,
      }, // sizes

      {
        wch: 45,
      }, // SizeStock

      {
        wch: 30,
      }, // colors

      {
        wch: 45,
      }, // ColorStock

      {
        wch: 100,
      }, // VariantStock

      {
        wch: 120,
      }, // ColorImages

      {
        wch: 140,
      }, // Main360Images

      {
        wch: 160,
      }, // Color360Images

      {
        wch: 40,
      }, // tags

      {
        wch: 12,
      }, // featured

      {
        wch: 12,
      }, // bestSeller

      {
        wch: 12,
      }, // newArrival

      {
        wch: 12,
      }, // trending

      {
        wch: 12,
      }, // sortOrder

      {
        wch: 50,
      }, // seoTitle

      {
        wch: 70,
      }, // seoDescription
    ];

    /*
    |--------------------------------------------------------------------------
    | FREEZE HEADER
    |--------------------------------------------------------------------------
    */

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
    };

    /*
    |--------------------------------------------------------------------------
    | APPEND PRODUCT SHEET
    |--------------------------------------------------------------------------
    */

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Products"
    );

    /*
    |--------------------------------------------------------------------------
    | FORMAT GUIDE SHEET
    |--------------------------------------------------------------------------
    */

    const guideRows = [
      {
        Column:
          "SizeStock",

        Format:
          "S=10|M=15|L=20|XL=5",

        Purpose:
          "Product-level size-wise inventory",
      },

      {
        Column:
          "ColorStock",

        Format:
          "Black=50;White=45",

        Purpose:
          "Total stock for individual colors when size-wise stock is not used",
      },

      {
        Column:
          "VariantStock",

        Format:
          "Black:S=10|M=15|L=20;White:S=8|M=12|L=15",

        Purpose:
          "Color + size-wise inventory",
      },

      {
        Column:
          "ColorImages",

        Format:
          "Black=https://image1.jpg|https://image2.jpg;White=https://image3.jpg",

        Purpose:
          "Separate normal images for each color",
      },

      {
        Column:
          "Main360Images",

        Format:
          "0:https://frame0.jpg|30:https://frame30.jpg|60:https://frame60.jpg",

        Purpose:
          "Main product 360-degree frames",
      },

      {
        Column:
          "Color360Images",

        Format:
          "Black=0:https://black0.jpg|30:https://black30.jpg;White=0:https://white0.jpg|30:https://white30.jpg",

        Purpose:
          "Separate 360-degree frames for each color",
      },

      {
        Column:
          "images",

        Format:
          "https://image1.jpg|https://image2.jpg",

        Purpose:
          "Main product gallery images",
      },

      {
        Column:
          "sizes",

        Format:
          "S,M,L,XL",

        Purpose:
          "Available product sizes",
      },

      {
        Column:
          "colors",

        Format:
          "Black,White,Navy Blue",

        Purpose:
          "Available product colors",
      },

      {
        Column:
          "featured",

        Format:
          "TRUE / FALSE",

        Purpose:
          "Featured product flag",
      },

      {
        Column:
          "status",

        Format:
          "Active / Draft / Out of Stock / Archived",

        Purpose:
          "Product status",
      },
    ];

    const guideSheet =
      XLSX.utils.json_to_sheet(
        guideRows
      );

    guideSheet["!cols"] = [
      {
        wch: 25,
      },

      {
        wch: 100,
      },

      {
        wch: 60,
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      guideSheet,
      "Format Guide"
    );

    /*
    |--------------------------------------------------------------------------
    | GENERATE EXCEL
    |--------------------------------------------------------------------------
    */

    const buffer =
      XLSX.write(
        workbook,
        {
          type: "buffer",
          bookType: "xlsx",
          compression: true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return new NextResponse(
      new Uint8Array(
        buffer
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            'attachment; filename="SilentGEN_Products.xlsx"',

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_EXPORT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to export products.",
      },
      {
        status: 500,
      }
    );
  }
}