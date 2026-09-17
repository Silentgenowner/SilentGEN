import { NextRequest, NextResponse } from "next/server";
import { SortOrder } from "mongoose";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyToken } from "@/lib/jwt";
/*
|--------------------------------------------------------------------------
| ADMIN PRODUCT LIST API
|--------------------------------------------------------------------------
|
| Features:
| - Admin authentication
| - Product permission validation
| - Search
| - Category filter
| - Status filter
| - Gender filter
| - Sorting
| - Pagination
| - Invalid/corrupt product protection
| - Safe numeric conversion
| - Lean response
|
|--------------------------------------------------------------------------
*/

const PRODUCT_ROLES = [
  "super_admin",
  "product_manager",
];

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ADMIN TOKEN
    |--------------------------------------------------------------------------
    */

    const token =
      request.cookies.get(
        "adminToken"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication required",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY TOKEN
    |--------------------------------------------------------------------------
    */

    let decoded: any;

    try {
      decoded =
    await verifyToken(token);    
     } catch (error) {
      console.error(
        "ADMIN TOKEN VERIFY ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired admin session",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN ROLE
    |--------------------------------------------------------------------------
    */

    const adminRole =
      decoded?.role ||
      decoded?.adminRole ||
      decoded?.userRole ||
      "";

    if (
      !PRODUCT_ROLES.includes(
        String(adminRole)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage products",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY PARAMETERS
    |--------------------------------------------------------------------------
    */

    const { searchParams } =
      new URL(request.url);

    const search =
      (
        searchParams.get(
          "search"
        ) || ""
      ).trim();

    const category =
      (
        searchParams.get(
          "category"
        ) || ""
      ).trim();

    const status =
      (
        searchParams.get(
          "status"
        ) || ""
      ).trim();

    const gender =
      (
        searchParams.get(
          "gender"
        ) || ""
      ).trim();

    const sortBy =
      (
        searchParams.get(
          "sortBy"
        ) || "createdAt"
      ).trim();

    const sortOrderParam =
      (
        searchParams.get(
          "sortOrder"
        ) || "desc"
      ).trim();

    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const pageParam = Number(
      searchParams.get(
        "page"
      ) || 1
    );

    const limitParam = Number(
      searchParams.get(
        "limit"
      ) || 20
    );

    const page =
      Number.isInteger(
        pageParam
      ) && pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isInteger(
        limitParam
      ) &&
      limitParam > 0 &&
      limitParam <= 100
        ? limitParam
        : 20;

    const skip =
      (page - 1) * limit;

    /*
    |--------------------------------------------------------------------------
    | FILTER
    |--------------------------------------------------------------------------
    */

    const filter: Record<
      string,
      any
    > = {};

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    if (search) {
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const searchRegex =
        new RegExp(
          escapedSearch,
          "i"
        );

      filter.$or = [
        {
          name: searchRegex,
        },
        {
          sku: searchRegex,
        },
        {
          slug: searchRegex,
        },
        {
          brand: searchRegex,
        },
        {
          category: searchRegex,
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    if (
      category &&
      category.toLowerCase() !==
        "all"
    ) {
      filter.category =
        category;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (
      status &&
      status.toLowerCase() !==
        "all"
    ) {
      filter.status =
        status;
    }

    /*
    |--------------------------------------------------------------------------
    | GENDER
    |--------------------------------------------------------------------------
    */

    if (
      gender &&
      gender.toLowerCase() !==
        "all"
    ) {
      filter.gender =
        gender;
    }

    /*
    |--------------------------------------------------------------------------
    | SAFE SORT FIELD
    |--------------------------------------------------------------------------
    */

    const allowedSortFields =
      new Set([
        "createdAt",
        "updatedAt",
        "name",
        "price",
        "mrp",
        "stock",
        "rating",
        "discount",
      ]);

    const safeSortBy =
      allowedSortFields.has(
        sortBy
      )
        ? sortBy
        : "createdAt";

    /*
    |--------------------------------------------------------------------------
    | SAFE SORT ORDER
    |--------------------------------------------------------------------------
    */

    const safeSortOrder: SortOrder =
      sortOrderParam ===
      "asc"
        ? 1
        : -1;

    /*
    |--------------------------------------------------------------------------
    | SORT
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Explicit SortOrder prevents TypeScript
    | union inference error.
    |
    */

    const sort: Record<
      string,
      SortOrder
    > = {
      [safeSortBy]:
        safeSortOrder,

      /*
      |----------------------------------------------------------------------
      | Secondary sort
      |----------------------------------------------------------------------
      |
      | Keeps pagination stable when two products have
      | the same primary sort value.
      |
      */

      _id:
        safeSortOrder,
    };

    /*
    |--------------------------------------------------------------------------
    | DEBUG
    |--------------------------------------------------------------------------
    */

    console.log(
      "ADMIN PRODUCT LIST:",
      {
        search,
        category,
        status,
        gender,
        sortBy: safeSortBy,
        sortOrder:
          safeSortOrder,
        page,
        limit,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | TOTAL COUNT
    |--------------------------------------------------------------------------
    */

    const total =
      await Product.countDocuments(
        filter
      );

    /*
    |--------------------------------------------------------------------------
    | FETCH PRODUCTS
    |--------------------------------------------------------------------------
    */

    const rawProducts =
      await Product.find(
        filter
      )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    /*
    |--------------------------------------------------------------------------
    | VALID PRODUCT FILTER
    |--------------------------------------------------------------------------
    |
    | Protect admin page from old/corrupt database records.
    |
    */

    const validProducts =
      rawProducts.filter(
        (product: any) => {
          const hasValidName =
            typeof product.name ===
              "string" &&
            product.name.trim()
              .length > 0;

          const hasValidPrice =
            typeof product.price ===
              "number" &&
            Number.isFinite(
              product.price
            );

          const hasValidMrp =
            typeof product.mrp ===
              "number" &&
            Number.isFinite(
              product.mrp
            );

          const hasValidStock =
            typeof product.stock ===
              "number" &&
            Number.isFinite(
              product.stock
            );

          return (
            hasValidName &&
            hasValidPrice &&
            hasValidMrp &&
            hasValidStock
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE PRODUCTS
    |--------------------------------------------------------------------------
    */

    const products =
      validProducts.map(
        (product: any) => ({
          ...product,

          _id: String(
            product._id
          ),

          name:
            typeof product.name ===
            "string"
              ? product.name
              : "",

          slug:
            typeof product.slug ===
            "string"
              ? product.slug
              : "",

          sku:
            typeof product.sku ===
            "string"
              ? product.sku
              : "",

          brand:
            typeof product.brand ===
            "string"
              ? product.brand
              : "",

          category:
            typeof product.category ===
            "string"
              ? product.category
              : "",

          gender:
            typeof product.gender ===
            "string"
              ? product.gender
              : "",

          status:
            typeof product.status ===
            "string"
              ? product.status
              : "",

          price:
            Number(
              product.price
            ),

          mrp:
            Number(
              product.mrp
            ),

          stock:
            Number(
              product.stock
            ),

          discount:
            Number(
              product.discount
            ) || 0,

          rating:
            Number(
              product.rating
            ) || 0,

          thumbnail:
            typeof product.thumbnail ===
            "string"
              ? product.thumbnail
              : "",

          images:
            Array.isArray(
              product.images
            )
              ? product.images
              : [],

          sizes:
            Array.isArray(
              product.sizes
            )
              ? product.sizes
              : [],

          colors:
            Array.isArray(
              product.colors
            )
              ? product.colors
              : [],
        })
      );

    /*
    |--------------------------------------------------------------------------
    | TOTAL PAGES
    |--------------------------------------------------------------------------
    */

    const totalPages =
      Math.ceil(
        total / limit
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        products,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page <
            totalPages,

          hasPreviousPage:
            page > 1,
        },

        filters: {
          search,
          category,
          status,
          gender,
          sortBy:
            safeSortBy,
          sortOrder:
            safeSortOrder === 1
              ? "asc"
              : "desc",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    console.error(
      "ADMIN PRODUCT LIST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Unable to load products",
      },
      {
        status: 500,
      }
    );
  }
}