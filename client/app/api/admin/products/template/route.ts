import {
  NextRequest,
  NextResponse,
} from "next/server";

import * as XLSX from "xlsx";

import { verifyAdminToken } from "@/lib/adminAuth";

/* ============================================================
   PERMISSION
============================================================ */

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

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

/* ============================================================
   TEMPLATE HEADERS

   IMPORTANT:
   These names match Import + Export routes.
============================================================ */

const PRODUCT_HEADERS = [
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

/* ============================================================
   EXAMPLE PRODUCTS
============================================================ */

const TEMPLATE_ROWS = [
  /*
  |--------------------------------------------------------------------------
  | EXAMPLE 1
  |--------------------------------------------------------------------------
  |
  | Full Color + Size Inventory
  |
  | Black:
  | S  = 10
  | M  = 15
  | L  = 20
  | XL = 5
  | Total = 50
  |
  | White:
  | S  = 8
  | M  = 12
  | L  = 15
  | XL = 10
  | Total = 45
  |
  | Product Total = 95
  |
  */

  {
    sku: "SG-TS-001",

    name:
      "Premium Cotton T-Shirt",

    slug:
      "premium-cotton-t-shirt",

    category:
      "T-Shirts",

    subCategory:
      "Oversized",

    brand:
      "SilentGEN",

    gender:
      "Unisex",

    fabric:
      "Premium Cotton",

    fit:
      "Oversized",

    gsm:
      220,

    weight:
      250,

    shortDescription:
      "Premium Cotton Oversized T-Shirt",

    description:
      "Premium quality oversized cotton t-shirt from SilentGEN.",

    mrp:
      999,

    price:
      699,

    /*
     * Discount is calculated again
     * by Import Route.
     */

    discount:
      30,

    /*
     * Because VariantStock exists,
     * final imported stock will be
     * calculated from VariantStock.
     *
     * 50 + 45 = 95
     */

    stock:
      95,

    lowStockLimit:
      5,

    status:
      "Active",

    /*
     * Main thumbnail
     */

    image:
      "SG-TS-001-main.jpg",

    /*
     * Main normal gallery
     */

    images:
      "SG-TS-001-front.jpg|SG-TS-001-back.jpg|SG-TS-001-detail.jpg",

    /*
     * Available sizes
     */

    sizes:
      "S,M,L,XL",

    /*
     * Leave blank because inventory
     * is controlled color + size wise.
     */

    SizeStock:
      "",

    /*
     * Available colors
     */

    colors:
      "Black,White",

    /*
     * Optional summary.
     *
     * VariantStock takes priority
     * because size-wise color stock exists.
     */

    ColorStock:
      "Black=50;White=45",

    /*
     * Main color + size inventory.
     */

    VariantStock:
      "Black:S=10|M=15|L=20|XL=5;White:S=8|M=12|L=15|XL=10",

    /*
     * Normal images for each color.
     */

    ColorImages:
      "Black=SG-TS-001-black-front.jpg|SG-TS-001-black-back.jpg;White=SG-TS-001-white-front.jpg|SG-TS-001-white-back.jpg",

    /*
     * Main product 360.
     *
     * Explicit angles are recommended.
     */

    Main360Images:
      "0:SG-TS-001-360-0.jpg|30:SG-TS-001-360-30.jpg|60:SG-TS-001-360-60.jpg|90:SG-TS-001-360-90.jpg|120:SG-TS-001-360-120.jpg|150:SG-TS-001-360-150.jpg|180:SG-TS-001-360-180.jpg|210:SG-TS-001-360-210.jpg|240:SG-TS-001-360-240.jpg|270:SG-TS-001-360-270.jpg|300:SG-TS-001-360-300.jpg|330:SG-TS-001-360-330.jpg",

    /*
     * Separate 360 for every color.
     */

    Color360Images:
      "Black=0:SG-TS-001-black-0.jpg|30:SG-TS-001-black-30.jpg|60:SG-TS-001-black-60.jpg|90:SG-TS-001-black-90.jpg;White=0:SG-TS-001-white-0.jpg|30:SG-TS-001-white-30.jpg|60:SG-TS-001-white-60.jpg|90:SG-TS-001-white-90.jpg",

    tags:
      "Cotton,Oversized,Premium",

    featured:
      true,

    bestSeller:
      false,

    newArrival:
      true,

    trending:
      false,

    sortOrder:
      1,

    seoTitle:
      "Premium Cotton T-Shirt | SilentGEN",

    seoDescription:
      "Premium oversized cotton t-shirt from SilentGEN.",
  },

  /*
  |--------------------------------------------------------------------------
  | EXAMPLE 2
  |--------------------------------------------------------------------------
  |
  | Direct Color Stock
  |
  | No size-wise color stock.
  |
  */

  {
    sku:
      "SG-SH-002",

    name:
      "Premium Formal Shirt",

    slug:
      "premium-formal-shirt",

    category:
      "Shirts",

    subCategory:
      "Formal",

    brand:
      "SilentGEN",

    gender:
      "Men",

    fabric:
      "Cotton",

    fit:
      "Regular Fit",

    gsm:
      180,

    weight:
      300,

    shortDescription:
      "Premium Formal Cotton Shirt",

    description:
      "Premium cotton formal shirt for everyday and office wear.",

    mrp:
      1999,

    price:
      1499,

    discount:
      25,

    /*
     * White 15 + Blue 10 = 25
     */

    stock:
      25,

    lowStockLimit:
      5,

    status:
      "Active",

    image:
      "SG-SH-002-main.jpg",

    images:
      "SG-SH-002-front.jpg|SG-SH-002-back.jpg",

    sizes:
      "M,L,XL",

    /*
     * Product size stock not used.
     */

    SizeStock:
      "",

    colors:
      "White,Blue",

    /*
     * Direct color inventory.
     */

    ColorStock:
      "White=15;Blue=10",

    /*
     * No color + size inventory.
     */

    VariantStock:
      "",

    ColorImages:
      "White=SG-SH-002-white-front.jpg|SG-SH-002-white-back.jpg;Blue=SG-SH-002-blue-front.jpg|SG-SH-002-blue-back.jpg",

    Main360Images:
      "",

    Color360Images:
      "",

    tags:
      "Formal,Cotton,Shirt",

    featured:
      false,

    bestSeller:
      true,

    newArrival:
      false,

    trending:
      true,

    sortOrder:
      2,

    seoTitle:
      "Premium Formal Shirt | SilentGEN",

    seoDescription:
      "Premium formal cotton shirt from SilentGEN.",
  },

  /*
  |--------------------------------------------------------------------------
  | EXAMPLE 3
  |--------------------------------------------------------------------------
  |
  | Product-level Size Stock
  |
  | No color inventory.
  |
  */

  {
    sku:
      "SG-HD-003",

    name:
      "Premium Hoodie",

    slug:
      "premium-hoodie",

    category:
      "Hoodies",

    subCategory:
      "Oversized",

    brand:
      "SilentGEN",

    gender:
      "Unisex",

    fabric:
      "Cotton Fleece",

    fit:
      "Oversized",

    gsm:
      320,

    weight:
      650,

    shortDescription:
      "Premium Heavyweight Hoodie",

    description:
      "Premium heavyweight cotton fleece hoodie.",

    mrp:
      2499,

    price:
      1899,

    discount:
      24,

    /*
     * 5 + 10 + 15 + 10 = 40
     */

    stock:
      40,

    lowStockLimit:
      5,

    status:
      "Active",

    image:
      "SG-HD-003-main.jpg",

    images:
      "SG-HD-003-front.jpg|SG-HD-003-back.jpg",

    sizes:
      "S,M,L,XL",

    /*
     * Product-level size inventory.
     */

    SizeStock:
      "S=5|M=10|L=15|XL=10",

    colors:
      "Black",

    /*
     * Image-only color is allowed.
     *
     * Leave ColorStock and
     * VariantStock empty.
     */

    ColorStock:
      "",

    VariantStock:
      "",

    ColorImages:
      "Black=SG-HD-003-black-front.jpg|SG-HD-003-black-back.jpg",

    Main360Images:
      "",

    Color360Images:
      "",

    tags:
      "Hoodie,Fleece,Premium",

    featured:
      true,

    bestSeller:
      false,

    newArrival:
      true,

    trending:
      true,

    sortOrder:
      3,

    seoTitle:
      "Premium Hoodie | SilentGEN",

    seoDescription:
      "Premium heavyweight oversized hoodie from SilentGEN.",
  },
];

/* ============================================================
   FORMAT GUIDE
============================================================ */

const FORMAT_GUIDE_ROWS = [
  {
    Column:
      "sku",

    Required:
      "YES",

    Example:
      "SG-TS-001",

    Description:
      "Unique product SKU. Duplicate SKU will be skipped.",
  },

  {
    Column:
      "name",

    Required:
      "YES",

    Example:
      "Premium Cotton T-Shirt",

    Description:
      "Product name.",
  },

  {
    Column:
      "slug",

    Required:
      "NO",

    Example:
      "premium-cotton-t-shirt",

    Description:
      "If blank, slug will be generated from product name.",
  },

  {
    Column:
      "category",

    Required:
      "YES",

    Example:
      "T-Shirts",

    Description:
      "Main product category.",
  },

  {
    Column:
      "mrp",

    Required:
      "YES",

    Example:
      "999",

    Description:
      "MRP. Selling price cannot be greater than MRP.",
  },

  {
    Column:
      "price",

    Required:
      "YES",

    Example:
      "699",

    Description:
      "Selling price.",
  },

  {
    Column:
      "stock",

    Required:
      "NO",

    Example:
      "95",

    Description:
      "Manual stock. Ignored when SizeStock, ColorStock or VariantStock controls inventory.",
  },

  {
    Column:
      "sizes",

    Required:
      "NO",

    Example:
      "S,M,L,XL",

    Description:
      "Comma-separated available sizes.",
  },

  {
    Column:
      "SizeStock",

    Required:
      "NO",

    Example:
      "S=10|M=15|L=20|XL=5",

    Description:
      "Product-level size inventory.",
  },

  {
    Column:
      "colors",

    Required:
      "NO",

    Example:
      "Black,White",

    Description:
      "Comma-separated colors.",
  },

  {
    Column:
      "ColorStock",

    Required:
      "NO",

    Example:
      "Black=50;White=45",

    Description:
      "Direct total stock per color. Use when you do not need size-wise stock for that color.",
  },

  {
    Column:
      "VariantStock",

    Required:
      "NO",

    Example:
      "Black:S=10|M=15|L=20|XL=5;White:S=8|M=12|L=15|XL=10",

    Description:
      "Color + size inventory. This is the preferred format when stock differs by both color and size.",
  },

  {
    Column:
      "image",

    Required:
      "NO",

    Example:
      "SG-TS-001-main.jpg",

    Description:
      "Main thumbnail. Can be uploaded filename or full HTTPS URL.",
  },

  {
    Column:
      "images",

    Required:
      "NO",

    Example:
      "front.jpg|back.jpg|detail.jpg",

    Description:
      "Normal main gallery. Separate multiple images using |.",
  },

  {
    Column:
      "ColorImages",

    Required:
      "NO",

    Example:
      "Black=black1.jpg|black2.jpg;White=white1.jpg|white2.jpg",

    Description:
      "Separate normal gallery for each color.",
  },

  {
    Column:
      "Main360Images",

    Required:
      "NO",

    Example:
      "0:front.jpg|30:frame30.jpg|60:frame60.jpg",

    Description:
      "Main product 360 frames. Explicit angle:url format is recommended.",
  },

  {
    Column:
      "Color360Images",

    Required:
      "NO",

    Example:
      "Black=0:black0.jpg|30:black30.jpg;White=0:white0.jpg|30:white30.jpg",

    Description:
      "Separate 360 frames for each color.",
  },

  {
    Column:
      "gender",

    Required:
      "NO",

    Example:
      "Unisex",

    Description:
      "Allowed: Men, Women, Kids, Unisex.",
  },

  {
    Column:
      "status",

    Required:
      "NO",

    Example:
      "Active",

    Description:
      "Allowed: Active, Draft, Out of Stock, Archived.",
  },

  {
    Column:
      "featured",

    Required:
      "NO",

    Example:
      "TRUE",

    Description:
      "TRUE / FALSE, YES / NO or 1 / 0.",
  },

  {
    Column:
      "bestSeller",

    Required:
      "NO",

    Example:
      "FALSE",

    Description:
      "TRUE / FALSE.",
  },

  {
    Column:
      "newArrival",

    Required:
      "NO",

    Example:
      "TRUE",

    Description:
      "TRUE / FALSE.",
  },

  {
    Column:
      "trending",

    Required:
      "NO",

    Example:
      "FALSE",

    Description:
      "TRUE / FALSE.",
  },
];

/* ============================================================
   INVENTORY RULES
============================================================ */

const INVENTORY_RULE_ROWS = [
  {
    Priority:
      1,

    InventoryMode:
      "Color + Size Stock",

    ExcelColumn:
      "VariantStock",

    Example:
      "Black:S=10|M=15;White:S=8|M=12",

    Result:
      "Product total = sum of all color + size stock.",
  },

  {
    Priority:
      2,

    InventoryMode:
      "Direct Color Stock",

    ExcelColumn:
      "ColorStock",

    Example:
      "Black=50;White=45",

    Result:
      "Used when VariantStock is not supplied for the color.",
  },

  {
    Priority:
      3,

    InventoryMode:
      "Product Size Stock",

    ExcelColumn:
      "SizeStock",

    Example:
      "S=10|M=15|L=20",

    Result:
      "Used when no color variant inventory exists.",
  },

  {
    Priority:
      4,

    InventoryMode:
      "Manual Product Stock",

    ExcelColumn:
      "stock",

    Example:
      "50",

    Result:
      "Used only when no detailed inventory exists.",
  },

  {
    Priority:
      "-",

    InventoryMode:
      "Image-only Color",

    ExcelColumn:
      "ColorImages",

    Example:
      "Black=black1.jpg|black2.jpg",

    Result:
      "A color with images but no ColorStock/VariantStock does not affect product inventory.",
  },
];

/* ============================================================
   IMAGE RULES
============================================================ */

const IMAGE_RULE_ROWS = [
  {
    Type:
      "Main Thumbnail",

    ExcelColumn:
      "image",

    Example:
      "SG-TS-001-main.jpg",

    Notes:
      "Upload a file with exactly the same filename or use a full HTTPS URL.",
  },

  {
    Type:
      "Main Gallery",

    ExcelColumn:
      "images",

    Example:
      "front.jpg|back.jpg|detail.jpg",

    Notes:
      "Separate multiple images with |.",
  },

  {
    Type:
      "Color Gallery",

    ExcelColumn:
      "ColorImages",

    Example:
      "Black=black1.jpg|black2.jpg;White=white1.jpg",

    Notes:
      "Use ; between colors and | between images.",
  },

  {
    Type:
      "Main 360",

    ExcelColumn:
      "Main360Images",

    Example:
      "0:frame0.jpg|30:frame30.jpg|60:frame60.jpg",

    Notes:
      "Recommended 12 angles: 0,30,60,90,120,150,180,210,240,270,300,330.",
  },

  {
    Type:
      "Color 360",

    ExcelColumn:
      "Color360Images",

    Example:
      "Black=0:black0.jpg|30:black30.jpg;White=0:white0.jpg|30:white30.jpg",

    Notes:
      "Each color can have independent 360 frames.",
  },

  {
    Type:
      "Remote URL",

    ExcelColumn:
      "Any image column",

    Example:
      "https://example.com/product.jpg",

    Notes:
      "Full HTTP/HTTPS URLs can be used without uploading the local image file.",
  },
];

/* ============================================================
   COLUMN WIDTHS
============================================================ */

const PRODUCT_COLUMN_WIDTHS = [
  { wch: 18 }, // sku
  { wch: 35 }, // name
  { wch: 35 }, // slug
  { wch: 20 }, // category
  { wch: 20 }, // subCategory
  { wch: 20 }, // brand

  { wch: 14 }, // gender
  { wch: 22 }, // fabric
  { wch: 18 }, // fit
  { wch: 10 }, // gsm
  { wch: 12 }, // weight

  { wch: 45 }, // shortDescription
  { wch: 70 }, // description

  { wch: 12 }, // mrp
  { wch: 12 }, // price
  { wch: 12 }, // discount

  { wch: 12 }, // stock
  { wch: 16 }, // lowStockLimit
  { wch: 18 }, // status

  { wch: 45 }, // image
  { wch: 90 }, // images

  { wch: 25 }, // sizes
  { wch: 45 }, // SizeStock

  { wch: 30 }, // colors
  { wch: 50 }, // ColorStock
  { wch: 110 }, // VariantStock

  { wch: 130 }, // ColorImages

  { wch: 150 }, // Main360Images
  { wch: 180 }, // Color360Images

  { wch: 40 }, // tags

  { wch: 12 }, // featured
  { wch: 12 }, // bestSeller
  { wch: 12 }, // newArrival
  { wch: 12 }, // trending

  { wch: 12 }, // sortOrder

  { wch: 50 }, // seoTitle
  { wch: 70 }, // seoDescription
];

/* ============================================================
   DOWNLOAD EXCEL TEMPLATE
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ==========================================================
       PERMISSION
    ========================================================== */

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

    /* ==========================================================
       WORKBOOK
    ========================================================== */

    const workbook =
      XLSX.utils.book_new();

    /* ==========================================================
       PRODUCT TEMPLATE SHEET
    ========================================================== */

    const productWorksheet =
      XLSX.utils.json_to_sheet(
        TEMPLATE_ROWS,
        {
          header:
            PRODUCT_HEADERS,
        }
      );

    productWorksheet["!cols"] =
      PRODUCT_COLUMN_WIDTHS;

    XLSX.utils.book_append_sheet(
      workbook,
      productWorksheet,
      "Products Template"
    );

    /* ==========================================================
       FORMAT GUIDE
    ========================================================== */

    const guideWorksheet =
      XLSX.utils.json_to_sheet(
        FORMAT_GUIDE_ROWS
      );

    guideWorksheet["!cols"] = [
      {
        wch: 24,
      },

      {
        wch: 14,
      },

      {
        wch: 100,
      },

      {
        wch: 100,
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      guideWorksheet,
      "Format Guide"
    );

    /* ==========================================================
       INVENTORY RULES
    ========================================================== */

    const inventoryWorksheet =
      XLSX.utils.json_to_sheet(
        INVENTORY_RULE_ROWS
      );

    inventoryWorksheet["!cols"] = [
      {
        wch: 12,
      },

      {
        wch: 28,
      },

      {
        wch: 24,
      },

      {
        wch: 100,
      },

      {
        wch: 90,
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      inventoryWorksheet,
      "Inventory Rules"
    );

    /* ==========================================================
       IMAGE RULES
    ========================================================== */

    const imageWorksheet =
      XLSX.utils.json_to_sheet(
        IMAGE_RULE_ROWS
      );

    imageWorksheet["!cols"] = [
      {
        wch: 24,
      },

      {
        wch: 28,
      },

      {
        wch: 120,
      },

      {
        wch: 100,
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      imageWorksheet,
      "Image Rules"
    );

    /* ==========================================================
       GENERATE XLSX
    ========================================================== */

    const buffer =
      XLSX.write(
        workbook,
        {
          type:
            "buffer",

          bookType:
            "xlsx",

          compression:
            true,
        }
      );

    /* ==========================================================
       RESPONSE
    ========================================================== */

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
            'attachment; filename="SilentGEN_Product_Template.xlsx"',

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_TEMPLATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to generate template.",
      },
      {
        status: 500,
      }
    );
  }
}