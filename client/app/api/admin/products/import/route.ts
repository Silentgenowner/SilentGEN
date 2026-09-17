import {
  NextRequest,
  NextResponse,
} from "next/server";

import * as XLSX from "xlsx";
import { Readable } from "stream";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";
import cloudinary from "@/lib/cloudinary";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type ProductStatus =
  | "Active"
  | "Draft"
  | "Out of Stock"
  | "Archived";

type Gender =
  | "Men"
  | "Women"
  | "Kids"
  | "Unisex";

type SizeStock = {
  size: string;
  stock: number;
};

type Product360Frame = {
  angle: number;
  name: string;
  url: string;
};

type Product360Data = {
  enabled: boolean;
  frames: Product360Frame[];
};

type ColorVariant = {
  color: string;

  images: string[];

  stock?: number;

  sizeStocks: SizeStock[];

  view360Images: string[];

  product360: Product360Data;
};

type ExcelRow = Record<string, unknown>;

/*
|--------------------------------------------------------------------------
| PERMISSIONS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function createSlug(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function toNumber(
  value: unknown,
  defaultValue = 0
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return defaultValue;
  }

  return number;
}

function toStockNumber(
  value: unknown,
  defaultValue = 0
) {
  const number =
    toNumber(
      value,
      defaultValue
    );

  return Math.max(
    0,
    Math.floor(number)
  );
}

function optionalStockNumber(
  value: unknown
):
  | number
  | undefined {
  if (
    value === undefined ||
    value === null ||
    cleanString(value) === ""
  ) {
    return undefined;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return undefined;
  }

  return Math.floor(
    number
  );
}

function uniqueStrings(
  values: string[]
) {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const rawValue of values
  ) {
    const value =
      rawValue.trim();

    if (!value) {
      continue;
    }

    const key =
      value.toLowerCase();

    if (!map.has(key)) {
      map.set(
        key,
        value
      );
    }
  }

  return Array.from(
    map.values()
  );
}

function toArray(
  value: unknown
) {
  if (
    value === undefined ||
    value === null ||
    cleanString(value) === ""
  ) {
    return [];
  }

  return uniqueStrings(
    String(value)
      .split(/[,\n|]+/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
  );
}

function toBoolean(
  value: unknown
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const normalized =
    cleanString(value)
      .toLowerCase();

  return (
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "1" ||
    normalized === "y"
  );
}

function normalizeStatus(
  value: unknown
): ProductStatus {
  const status =
    cleanString(value);

  if (
    status === "Active" ||
    status === "Draft" ||
    status ===
      "Out of Stock" ||
    status === "Archived"
  ) {
    return status;
  }

  return "Active";
}

function normalizeGender(
  value: unknown
): Gender {
  const gender =
    cleanString(value);

  if (
    gender === "Men" ||
    gender === "Women" ||
    gender === "Kids" ||
    gender === "Unisex"
  ) {
    return gender;
  }

  return "Unisex";
}

function calculateDiscount(
  mrp: number,
  price: number
) {
  if (mrp <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((mrp - price) /
          mrp) *
          100
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| CASE-INSENSITIVE EXCEL CELL
|--------------------------------------------------------------------------
|
| This allows:
|
| sku
| SKU
| Sku
|
| to all work.
|
|--------------------------------------------------------------------------
*/

function getCell(
  row: ExcelRow,
  ...possibleNames: string[]
) {
  const entries =
    Object.entries(row);

  for (
    const possibleName of
    possibleNames
  ) {
    const wanted =
      possibleName
        .trim()
        .toLowerCase();

    const found =
      entries.find(
        ([key]) =>
          key
            .trim()
            .toLowerCase() ===
          wanted
      );

    if (found) {
      return found[1];
    }
  }

  return undefined;
}

/*
|--------------------------------------------------------------------------
| CLOUDINARY IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

async function uploadImageToCloudinary(
  file: File
): Promise<string> {
  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(bytes);

  return new Promise(
    (
      resolve,
      reject
    ) => {
      const upload =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "SilentGEN/products",

            resource_type:
              "image",
          },
          (
            error,
            result
          ) => {
            if (
              error ||
              !result
            ) {
              reject(
                error ||
                  new Error(
                    "Cloudinary upload failed."
                  )
              );

              return;
            }

            resolve(
              result.secure_url
            );
          }
        );

      Readable.from(
        buffer
      ).pipe(upload);
    }
  );
}

/*
|--------------------------------------------------------------------------
| IMAGE CACHE
|--------------------------------------------------------------------------
|
| If same uploaded file is used:
|
| - thumbnail
| - gallery
| - black images
| - black 360
|
| it uploads only once.
|
|--------------------------------------------------------------------------
*/

function createImageResolver(
  uploadedImages: File[]
) {
  const fileMap =
    new Map<
      string,
      File
    >();

  const urlCache =
    new Map<
      string,
      string
    >();

  for (
    const file of uploadedImages
  ) {
    if (
      !file ||
      typeof file.name !==
        "string"
    ) {
      continue;
    }

    const fileName =
      file.name
        .trim()
        .toLowerCase();

    if (fileName) {
      fileMap.set(
        fileName,
        file
      );
    }
  }

  return async function resolveImage(
    value: unknown
  ): Promise<string> {
    const image =
      cleanString(value);

    if (!image) {
      return "";
    }

    if (
      /^https?:\/\//i.test(
        image
      )
    ) {
      return image;
    }

    const key =
      image.toLowerCase();

    const cached =
      urlCache.get(key);

    if (cached) {
      return cached;
    }

    const matchedFile =
      fileMap.get(key);

    if (!matchedFile) {
      return "";
    }

    try {
      const url =
        await uploadImageToCloudinary(
          matchedFile
        );

      urlCache.set(
        key,
        url
      );

      return url;
    } catch (error) {
      console.error(
        `IMAGE_UPLOAD_ERROR (${image}):`,
        error
      );

      return "";
    }
  };
}

/*
|--------------------------------------------------------------------------
| SPLIT IMAGE VALUES
|--------------------------------------------------------------------------
|
| Supports:
|
| image1.jpg,image2.jpg
|
| image1.jpg|image2.jpg
|
| image1.jpg
| image2.jpg
|
|--------------------------------------------------------------------------
*/

function splitImageValues(
  value: unknown
) {
  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  return uniqueStrings(
    cleanString(value)
      .split(/[,\n|]+/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
  );
}

async function resolveImages(
  value: unknown,
  resolveImage: (
    value: unknown
  ) => Promise<string>
) {
  const items =
    splitImageValues(
      value
    );

  const result:
    string[] = [];

  for (
    const item of items
  ) {
    const url =
      await resolveImage(
        item
      );

    if (url) {
      result.push(url);
    }
  }

  return uniqueStrings(
    result
  );
}

/*
|--------------------------------------------------------------------------
| SIZE STOCK PARSER
|--------------------------------------------------------------------------
|
| Excel:
|
| SizeStock
|
| S=10|M=15|L=20|XL=5
|
| Also supports:
|
| S:10|M:15
|
|--------------------------------------------------------------------------
*/

function parseSizeStock(
  value: unknown
): SizeStock[] {
  const text =
    cleanString(value);

  if (!text) {
    return [];
  }

  const map =
    new Map<
      string,
      SizeStock
    >();

  const parts =
    text.split(
      /[|,\n]+/
    );

  for (
    const part of parts
  ) {
    const cleaned =
      part.trim();

    if (!cleaned) {
      continue;
    }

    const separatorIndex =
      cleaned.search(
        /[:=]/
      );

    if (
      separatorIndex < 0
    ) {
      continue;
    }

    const size =
      cleaned
        .slice(
          0,
          separatorIndex
        )
        .trim();

    const stockText =
      cleaned
        .slice(
          separatorIndex + 1
        )
        .trim();

    if (!size) {
      continue;
    }

    const stock =
      Number(stockText);

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      continue;
    }

    map.set(
      size.toLowerCase(),
      {
        size,

        stock:
          Math.floor(stock),
      }
    );
  }

  return Array.from(
    map.values()
  );
}

function calculateSizeStockTotal(
  sizeStocks: SizeStock[]
) {
  return sizeStocks.reduce(
    (
      total,
      item
    ) =>
      total +
      toStockNumber(
        item.stock
      ),
    0
  );
}

/*
|--------------------------------------------------------------------------
| VARIANT STOCK PARSER
|--------------------------------------------------------------------------
|
| Excel:
|
| VariantStock
|
| Black:S=10|M=15|L=20|XL=5;White:S=8|M=12|L=15|XL=10
|
|--------------------------------------------------------------------------
*/

function parseVariantStock(
  value: unknown
) {
  const result =
    new Map<
      string,
      {
        color: string;
        sizeStocks: SizeStock[];
      }
    >();

  const text =
    cleanString(value);

  if (!text) {
    return result;
  }

  const colorGroups =
    text
      .split(";")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  for (
    const group of
    colorGroups
  ) {
    const separatorIndex =
      group.indexOf(":");

    if (
      separatorIndex <= 0
    ) {
      continue;
    }

    const color =
      group
        .slice(
          0,
          separatorIndex
        )
        .trim();

    const stockPart =
      group
        .slice(
          separatorIndex + 1
        )
        .trim();

    if (!color) {
      continue;
    }

    const sizeStocks =
      parseSizeStock(
        stockPart
      );

    if (
      sizeStocks.length ===
      0
    ) {
      continue;
    }

    result.set(
      color.toLowerCase(),
      {
        color,
        sizeStocks,
      }
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| COLOR TOTAL STOCK PARSER
|--------------------------------------------------------------------------
|
| Excel:
|
| ColorStock
|
| Black=50;White=45
|
|--------------------------------------------------------------------------
*/

function parseColorStock(
  value: unknown
) {
  const result =
    new Map<
      string,
      {
        color: string;
        stock: number;
      }
    >();

  const text =
    cleanString(value);

  if (!text) {
    return result;
  }

  const groups =
    text
      .split(";")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  for (
    const group of groups
  ) {
    const separatorIndex =
      group.search(
        /[:=]/
      );

    if (
      separatorIndex <= 0
    ) {
      continue;
    }

    const color =
      group
        .slice(
          0,
          separatorIndex
        )
        .trim();

    const stockValue =
      group
        .slice(
          separatorIndex + 1
        )
        .trim();

    const stock =
      optionalStockNumber(
        stockValue
      );

    if (
      !color ||
      stock === undefined
    ) {
      continue;
    }

    result.set(
      color.toLowerCase(),
      {
        color,
        stock,
      }
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| COLOR IMAGES PARSER
|--------------------------------------------------------------------------
|
| Excel:
|
| ColorImages
|
| Black=black1.jpg|black2.jpg;White=white1.jpg|white2.jpg
|
| URLs also work.
|
|--------------------------------------------------------------------------
*/

function parseColorImagesRaw(
  value: unknown
) {
  const result =
    new Map<
      string,
      {
        color: string;
        images: string[];
      }
    >();

  const text =
    cleanString(value);

  if (!text) {
    return result;
  }

  const groups =
    text
      .split(";")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  for (
    const group of groups
  ) {
    const separatorIndex =
      group.indexOf("=");

    if (
      separatorIndex <= 0
    ) {
      continue;
    }

    const color =
      group
        .slice(
          0,
          separatorIndex
        )
        .trim();

    const images =
      splitImageValues(
        group.slice(
          separatorIndex + 1
        )
      );

    if (!color) {
      continue;
    }

    result.set(
      color.toLowerCase(),
      {
        color,
        images,
      }
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| COLOR 360 PARSER
|--------------------------------------------------------------------------
|
| Supported:
|
| Color360Images
|
| Black=black0.jpg|black30.jpg|black60.jpg;White=white0.jpg|...
|
| In this mode:
| first image  = 0°
| second       = 30°
| third        = 60°
| ...
|
| OR explicit angles:
|
| Black=0:black0.jpg|30:black30.jpg|60:black60.jpg
|
|--------------------------------------------------------------------------
*/

type Raw360Frame = {
  angle: number;
  name: string;
  image: string;
};

function parse360ImageList(
  value: string
): Raw360Frame[] {
  const result:
    Raw360Frame[] = [];

  const items =
    value
      .split(/[|\n]+/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  for (
    let index = 0;
    index < items.length;
    index++
  ) {
    const item =
      items[index];

    let angle =
      index * 30;

    let image =
      item;

    const explicitMatch =
      item.match(
        /^(\d{1,3})\s*:\s*(.+)$/
      );

    if (explicitMatch) {
      angle =
        Number(
          explicitMatch[1]
        );

      image =
        explicitMatch[2].trim();
    }

    if (
      !Number.isFinite(
        angle
      ) ||
      angle < 0 ||
      angle >= 360 ||
      !image
    ) {
      continue;
    }

    const safeAngle =
      Math.round(angle);

    result.push({
      angle:
        safeAngle,

      name:
        `frame-${safeAngle}`,

      image,
    });
  }

  const map =
    new Map<
      number,
      Raw360Frame
    >();

  for (
    const frame of result
  ) {
    map.set(
      frame.angle,
      frame
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

function parseColor360Raw(
  value: unknown
) {
  const result =
    new Map<
      string,
      {
        color: string;
        frames: Raw360Frame[];
      }
    >();

  const text =
    cleanString(value);

  if (!text) {
    return result;
  }

  const groups =
    text
      .split(";")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  for (
    const group of groups
  ) {
    const separatorIndex =
      group.indexOf("=");

    if (
      separatorIndex <= 0
    ) {
      continue;
    }

    const color =
      group
        .slice(
          0,
          separatorIndex
        )
        .trim();

    const frameText =
      group
        .slice(
          separatorIndex + 1
        )
        .trim();

    if (!color) {
      continue;
    }

    const frames =
      parse360ImageList(
        frameText
      );

    result.set(
      color.toLowerCase(),
      {
        color,
        frames,
      }
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| RESOLVE 360 FRAMES
|--------------------------------------------------------------------------
*/

async function resolve360Frames(
  frames: Raw360Frame[],
  resolveImage: (
    value: unknown
  ) => Promise<string>
): Promise<Product360Frame[]> {
  const result:
    Product360Frame[] = [];

  for (
    const frame of frames
  ) {
    const url =
      await resolveImage(
        frame.image
      );

    if (!url) {
      continue;
    }

    result.push({
      angle:
        frame.angle,

      name:
        frame.name,

      url,
    });
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| BUILD MAIN 360
|--------------------------------------------------------------------------
|
| Excel column:
|
| Main360Images
|
| OR
|
| View360Images
|
|--------------------------------------------------------------------------
*/

async function buildMain360(
  value: unknown,
  resolveImage: (
    value: unknown
  ) => Promise<string>
) {
  const rawFrames =
    parse360ImageList(
      cleanString(value)
    );

  const frames =
    await resolve360Frames(
      rawFrames,
      resolveImage
    );

  return {
    enabled:
      frames.length > 0,

    frames,
  } satisfies Product360Data;
}

/*
|--------------------------------------------------------------------------
| BUILD COLOR VARIANTS
|--------------------------------------------------------------------------
*/

async function buildColorVariants(
  row: ExcelRow,
  resolveImage: (
    value: unknown
  ) => Promise<string>
): Promise<ColorVariant[]> {
  const variantStock =
    parseVariantStock(
      getCell(
        row,
        "VariantStock",
        "ColorSizeStock",
        "colorSizeStock"
      )
    );

  const colorStock =
    parseColorStock(
      getCell(
        row,
        "ColorStock",
        "colorStock"
      )
    );

  const colorImages =
    parseColorImagesRaw(
      getCell(
        row,
        "ColorImages",
        "colorImages"
      )
    );

  const color360 =
    parseColor360Raw(
      getCell(
        row,
        "Color360Images",
        "color360Images",
        "Color360",
        "color360"
      )
    );

  const manualColors =
    toArray(
      getCell(
        row,
        "colors",
        "Colors"
      )
    );

  const colorMap =
    new Map<
      string,
      string
    >();

  for (
    const color of manualColors
  ) {
    colorMap.set(
      color.toLowerCase(),
      color
    );
  }

  for (
    const item of
    variantStock.values()
  ) {
    colorMap.set(
      item.color.toLowerCase(),
      item.color
    );
  }

  for (
    const item of
    colorStock.values()
  ) {
    colorMap.set(
      item.color.toLowerCase(),
      item.color
    );
  }

  for (
    const item of
    colorImages.values()
  ) {
    colorMap.set(
      item.color.toLowerCase(),
      item.color
    );
  }

  for (
    const item of
    color360.values()
  ) {
    colorMap.set(
      item.color.toLowerCase(),
      item.color
    );
  }

  const variants:
    ColorVariant[] = [];

  for (
    const [
      key,
      color,
    ] of colorMap
  ) {
    const sizeInventory =
      variantStock.get(
        key
      );

    const directStock =
      colorStock.get(
        key
      );

    const imageData =
      colorImages.get(
        key
      );

    const color360Data =
      color360.get(
        key
      );

    const images:
      string[] = [];

    if (imageData) {
      for (
        const image of
        imageData.images
      ) {
        const url =
          await resolveImage(
            image
          );

        if (url) {
          images.push(
            url
          );
        }
      }
    }

    const frames =
      color360Data
        ? await resolve360Frames(
            color360Data.frames,
            resolveImage
          )
        : [];

    const sizeStocks =
      sizeInventory
        ?.sizeStocks ?? [];

    let stock:
      | number
      | undefined;

    if (
      sizeStocks.length >
      0
    ) {
      stock =
        calculateSizeStockTotal(
          sizeStocks
        );
    } else if (
      directStock
    ) {
      stock =
        directStock.stock;
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | If a color only has images / 360 images:
    |
    | stock remains undefined.
    |
    | Therefore an image-only color does NOT accidentally turn product stock
    | into zero.
    |
    |--------------------------------------------------------------------------
    */

    variants.push({
      color,

      images:
        uniqueStrings(
          images
        ),

      stock,

      sizeStocks,

      view360Images:
        frames.map(
          (frame) =>
            frame.url
        ),

      product360: {
        enabled:
          frames.length >
          0,

        frames,
      },
    });
  }

  return variants;
}

/*
|--------------------------------------------------------------------------
| TOTAL STOCK
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. Color + size / color stock
| 2. Product size stock
| 3. Manual product stock
|
|--------------------------------------------------------------------------
*/

function calculateFinalStock(
  manualStock: number,
  sizeStocks: SizeStock[],
  colorVariants: ColorVariant[]
) {
  const variantsWithInventory =
    colorVariants.filter(
      (variant) =>
        variant.sizeStocks
          .length >
          0 ||
        variant.stock !==
          undefined
    );

  if (
    variantsWithInventory.length >
    0
  ) {
    return colorVariants.reduce(
      (
        total,
        variant
      ) => {
        if (
          variant.sizeStocks
            .length >
          0
        ) {
          return (
            total +
            calculateSizeStockTotal(
              variant.sizeStocks
            )
          );
        }

        return (
          total +
          (variant.stock ??
            0)
        );
      },
      0
    );
  }

  if (
    sizeStocks.length >
    0
  ) {
    return calculateSizeStockTotal(
      sizeStocks
    );
  }

  return manualStock;
}

/*
|--------------------------------------------------------------------------
| POST IMPORT
|--------------------------------------------------------------------------
*/

export async function POST(
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
    | FORM DATA
    |--------------------------------------------------------------------------
    */

    const formData =
      await request.formData();

    const excelValue =
      formData.get(
        "excel"
      );

    if (
      !excelValue ||
      !(excelValue instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Excel file is required.",
        },
        {
          status: 400,
        }
      );
    }

    const excel =
      excelValue;

    /*
    |--------------------------------------------------------------------------
    | UPLOADED IMAGES
    |--------------------------------------------------------------------------
    */

    const uploadedImages =
      formData
        .getAll(
          "images"
        )
        .filter(
          (
            value
          ): value is File =>
            value instanceof
            File
        );

    const resolveImage =
      createImageResolver(
        uploadedImages
      );

    /*
    |--------------------------------------------------------------------------
    | READ EXCEL
    |--------------------------------------------------------------------------
    */

    const excelBuffer =
      Buffer.from(
        await excel.arrayBuffer()
      );

    const workbook =
      XLSX.read(
        excelBuffer,
        {
          type: "buffer",
        }
      );

    const firstSheetName =
      workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Excel workbook does not contain any sheets.",
        },
        {
          status: 400,
        }
      );
    }

    const sheet =
      workbook.Sheets[
        firstSheetName
      ];

    if (!sheet) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unable to read Excel sheet.",
        },
        {
          status: 400,
        }
      );
    }

    const rows =
      XLSX.utils.sheet_to_json<
        ExcelRow
      >(
        sheet,
        {
          defval: "",
        }
      );

    if (
      rows.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Excel file does not contain any product rows.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    let imported =
      0;

    let skipped =
      0;

    const errors:
      string[] = [];

    /*
    |--------------------------------------------------------------------------
    | IMPORT LOOP
    |--------------------------------------------------------------------------
    */

    for (
      let rowIndex = 0;
      rowIndex <
      rows.length;
      rowIndex++
    ) {
      const row =
        rows[rowIndex];

      const excelRowNumber =
        rowIndex + 2;

      let sku =
        "UNKNOWN";

      try {
        /*
        |--------------------------------------------------------------------------
        | BASIC
        |--------------------------------------------------------------------------
        */

        sku =
          cleanString(
            getCell(
              row,
              "sku",
              "SKU"
            )
          ).toUpperCase();

        const name =
          cleanString(
            getCell(
              row,
              "name",
              "Name",
              "ProductName",
              "Product Name"
            )
          );

        const rawSlug =
          cleanString(
            getCell(
              row,
              "slug",
              "Slug"
            )
          );

        const slug =
          createSlug(
            rawSlug ||
              name
          );

        const category =
          cleanString(
            getCell(
              row,
              "category",
              "Category"
            )
          );

        if (
          !sku ||
          !name ||
          !slug ||
          !category
        ) {
          skipped++;

          errors.push(
            `Row ${excelRowNumber} (${sku || "UNKNOWN"}) : SKU, Name and Category are required.`
          );

          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | DUPLICATE
        |--------------------------------------------------------------------------
        */

        const existing =
          await Product.findOne(
            {
              $or: [
                {
                  sku,
                },
                {
                  slug,
                },
              ],
            }
          )
            .select(
              "_id sku slug"
            )
            .lean();

        if (existing) {
          skipped++;

          errors.push(
            `Row ${excelRowNumber} (${sku}) : SKU or Slug already exists.`
          );

          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | PRICE
        |--------------------------------------------------------------------------
        */

        const mrp =
          toNumber(
            getCell(
              row,
              "mrp",
              "MRP"
            )
          );

        const price =
          toNumber(
            getCell(
              row,
              "price",
              "Price",
              "SellingPrice",
              "Selling Price"
            )
          );

        if (
          mrp < 0 ||
          price < 0
        ) {
          skipped++;

          errors.push(
            `Row ${excelRowNumber} (${sku}) : MRP and Price cannot be negative.`
          );

          continue;
        }

        if (
          price > mrp
        ) {
          skipped++;

          errors.push(
            `Row ${excelRowNumber} (${sku}) : Selling price cannot be greater than MRP.`
          );

          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | MANUAL STOCK
        |--------------------------------------------------------------------------
        */

        const manualStock =
          toStockNumber(
            getCell(
              row,
              "stock",
              "Stock",
              "TotalStock",
              "Total Stock"
            )
          );

        /*
        |--------------------------------------------------------------------------
        | PRODUCT SIZE STOCK
        |--------------------------------------------------------------------------
        |
        | Excel:
        |
        | SizeStock
        | S=10|M=15|L=20|XL=5
        |
        |--------------------------------------------------------------------------
        */

        const sizeStocks =
          parseSizeStock(
            getCell(
              row,
              "SizeStock",
              "sizeStock",
              "SizeStocks",
              "sizeStocks"
            )
          );

        /*
        |--------------------------------------------------------------------------
        | COLOR VARIANTS
        |--------------------------------------------------------------------------
        */

        const colorVariants =
          await buildColorVariants(
            row,
            resolveImage
          );

        /*
        |--------------------------------------------------------------------------
        | TOTAL STOCK
        |--------------------------------------------------------------------------
        */

        const stock =
          calculateFinalStock(
            manualStock,
            sizeStocks,
            colorVariants
          );

        /*
        |--------------------------------------------------------------------------
        | NORMAL PRODUCT IMAGES
        |--------------------------------------------------------------------------
        */

        const thumbnailValue =
          getCell(
            row,
            "image",
            "Image",
            "thumbnail",
            "Thumbnail"
          );

        const thumbnail =
          await resolveImage(
            thumbnailValue
          );

        const galleryImages =
          await resolveImages(
            getCell(
              row,
              "images",
              "Images",
              "GalleryImages",
              "Gallery Images"
            ),
            resolveImage
          );

        const images =
          uniqueStrings([
            ...(thumbnail
              ? [thumbnail]
              : []),

            ...galleryImages,
          ]);

        /*
        |--------------------------------------------------------------------------
        | MAIN 360
        |--------------------------------------------------------------------------
        */

        const main360Value =
          getCell(
            row,
            "Main360Images",
            "main360Images",
            "View360Images",
            "view360Images",
            "360Images"
          );

        const product360 =
          await buildMain360(
            main360Value,
            resolveImage
          );

        const view360Images =
          product360.frames.map(
            (frame) =>
              frame.url
          );

        /*
        |--------------------------------------------------------------------------
        | SIZES
        |--------------------------------------------------------------------------
        */

        const manualSizes =
          toArray(
            getCell(
              row,
              "sizes",
              "Sizes"
            )
          );

        const sizeStockSizes =
          sizeStocks.map(
            (item) =>
              item.size
          );

        const colorVariantSizes =
          colorVariants.flatMap(
            (variant) =>
              variant.sizeStocks.map(
                (item) =>
                  item.size
              )
          );

        const sizes =
          uniqueStrings([
            ...manualSizes,

            ...sizeStockSizes,

            ...colorVariantSizes,
          ]);

        /*
        |--------------------------------------------------------------------------
        | COLORS
        |--------------------------------------------------------------------------
        */

        const manualColors =
          toArray(
            getCell(
              row,
              "colors",
              "Colors"
            )
          );

        const variantColors =
          colorVariants.map(
            (variant) =>
              variant.color
          );

        const colors =
          uniqueStrings([
            ...manualColors,
            ...variantColors,
          ]);

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        let status =
          normalizeStatus(
            getCell(
              row,
              "status",
              "Status"
            )
          );

        if (
          status ===
            "Active" &&
          stock <= 0
        ) {
          status =
            "Out of Stock";
        }

        if (
          status ===
            "Out of Stock" &&
          stock > 0
        ) {
          status =
            "Active";
        }

        /*
        |--------------------------------------------------------------------------
        | DISCOUNT
        |--------------------------------------------------------------------------
        */

        const discount =
          calculateDiscount(
            mrp,
            price
          );

        /*
        |--------------------------------------------------------------------------
        | NUMERIC DETAILS
        |--------------------------------------------------------------------------
        */

        const gsm =
          Math.max(
            0,
            toNumber(
              getCell(
                row,
                "gsm",
                "GSM"
              )
            )
          );

        const weight =
          Math.max(
            0,
            toNumber(
              getCell(
                row,
                "weight",
                "Weight"
              )
            )
          );

        const lowStockLimit =
          toStockNumber(
            getCell(
              row,
              "lowStockLimit",
              "LowStockLimit",
              "Low Stock Limit"
            ),
            5
          );

        const sortOrder =
          Math.max(
            0,
            Math.floor(
              toNumber(
                getCell(
                  row,
                  "sortOrder",
                  "SortOrder",
                  "Sort Order"
                )
              )
            )
          );

        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        await Product.create(
          {
            /*
            |--------------------------------------------------------------------------
            | BASIC
            |--------------------------------------------------------------------------
            */

            sku,

            name,

            slug,

            shortDescription:
              cleanString(
                getCell(
                  row,
                  "shortDescription",
                  "ShortDescription",
                  "Short Description"
                )
              ),

            description:
              cleanString(
                getCell(
                  row,
                  "description",
                  "Description"
                )
              ),

            /*
            |--------------------------------------------------------------------------
            | CATEGORY
            |--------------------------------------------------------------------------
            */

            category,

            subCategory:
              cleanString(
                getCell(
                  row,
                  "subCategory",
                  "SubCategory",
                  "Sub Category"
                )
              ),

            brand:
              cleanString(
                getCell(
                  row,
                  "brand",
                  "Brand"
                )
              ) ||
              "SilentGEN",

            /*
            |--------------------------------------------------------------------------
            | DETAILS
            |--------------------------------------------------------------------------
            */

            gender:
              normalizeGender(
                getCell(
                  row,
                  "gender",
                  "Gender"
                )
              ),

            fabric:
              cleanString(
                getCell(
                  row,
                  "fabric",
                  "Fabric"
                )
              ),

            fit:
              cleanString(
                getCell(
                  row,
                  "fit",
                  "Fit"
                )
              ),

            gsm,

            weight,

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */

            mrp,

            price,

            discount,

            /*
            |--------------------------------------------------------------------------
            | INVENTORY
            |--------------------------------------------------------------------------
            */

            stock,

            sizeStocks,

            lowStockLimit,

            sold: 0,

            /*
            |--------------------------------------------------------------------------
            | IMAGES
            |--------------------------------------------------------------------------
            */

            thumbnail,

            images,

            /*
            |--------------------------------------------------------------------------
            | 360
            |--------------------------------------------------------------------------
            */

            view360Images,

            product360,

            /*
            |--------------------------------------------------------------------------
            | VARIANTS
            |--------------------------------------------------------------------------
            */

            sizes,

            colors,

            colorVariants,

            /*
            |--------------------------------------------------------------------------
            | TAGS
            |--------------------------------------------------------------------------
            */

            tags:
              toArray(
                getCell(
                  row,
                  "tags",
                  "Tags"
                )
              ),

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */

            featured:
              toBoolean(
                getCell(
                  row,
                  "featured",
                  "Featured"
                )
              ),

            bestSeller:
              toBoolean(
                getCell(
                  row,
                  "bestSeller",
                  "BestSeller",
                  "Best Seller"
                )
              ),

            newArrival:
              toBoolean(
                getCell(
                  row,
                  "newArrival",
                  "NewArrival",
                  "New Arrival"
                )
              ),

            trending:
              toBoolean(
                getCell(
                  row,
                  "trending",
                  "Trending"
                )
              ),

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            status,

            sortOrder,

            isDeleted:
              false,

            deletedAt:
              null,

            deletedBy:
              null,

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            seoTitle:
              cleanString(
                getCell(
                  row,
                  "seoTitle",
                  "SEOTitle",
                  "SEO Title"
                )
              ),

            seoDescription:
              cleanString(
                getCell(
                  row,
                  "seoDescription",
                  "SEODescription",
                  "SEO Description"
                )
              ),
          }
        );

        imported++;
      } catch (error) {
        skipped++;

        console.error(
          `PRODUCT_IMPORT_ROW_${excelRowNumber}_ERROR:`,
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to import.";

        errors.push(
          `Row ${excelRowNumber} (${sku}) : ${message}`
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          imported > 0
            ? `${imported} product(s) imported successfully.`
            : "No products were imported.",

        summary: {
          totalRows:
            rows.length,

          imported,

          skipped,

          failed:
            errors.length,
        },

        imported,

        skipped,

        errors,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_IMPORT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to import products.",
      },
      {
        status: 500,
      }
    );
  }
}