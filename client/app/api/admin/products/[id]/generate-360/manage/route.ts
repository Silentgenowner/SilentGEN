import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import {
  v2 as cloudinary,
} from "cloudinary";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import {
  verifyAdminToken,
} from "@/lib/adminAuth";

/* ============================================================
   CLOUDINARY
============================================================ */

cloudinary.config({
  cloud_name:
    process.env
      .CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env
      .CLOUDINARY_API_KEY,

  api_secret:
    process.env
      .CLOUDINARY_API_SECRET,
});

/* ============================================================
   ALLOWED ROLES
============================================================ */

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

/* ============================================================
   TYPES
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AdminPayload = {
  adminId?: string;
  role?: string;
};

type SavedFrame = {
  angle: number;
  name: string;
  url: string;
};

type PatchBody = {
  enabled?: boolean;
};

type DeleteBody = {
  angle?: number;
  deleteAll?: boolean;
};

/* ============================================================
   ADMIN AUTH
============================================================ */

async function getAdminPayload(
  request: NextRequest
): Promise<AdminPayload | null> {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return null;
  }

  try {
    const payload =
      await verifyAdminToken(
        token
      );

    if (
      !payload?.adminId ||
      !payload?.role
    ) {
      return null;
    }

    const role =
      String(
        payload.role
      );

    if (
      !allowedRoles.includes(
        role as AllowedRole
      )
    ) {
      return null;
    }

    return {
      adminId:
        String(
          payload.adminId
        ),

      role,
    };
  } catch {
    return null;
  }
}

/* ============================================================
   RESPONSES
============================================================ */

function permissionDeniedResponse() {
  return NextResponse.json(
    {
      success: false,

      error:
        "Permission denied.",

      message:
        "Permission denied.",
    },
    {
      status: 403,
    }
  );
}

function invalidResponse(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
    },
    {
      status: 400,
    }
  );
}

function notFoundResponse(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
    },
    {
      status: 404,
    }
  );
}

/* ============================================================
   CLOUDINARY CONFIG VALIDATION
============================================================ */

function validateCloudinaryConfig() {
  if (
    !process.env
      .CLOUDINARY_CLOUD_NAME ||
    !process.env
      .CLOUDINARY_API_KEY ||
    !process.env
      .CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary configuration is missing."
    );
  }
}

/* ============================================================
   PRODUCT FILTER
============================================================ */

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

/* ============================================================
   NORMALIZE FRAMES
============================================================ */

function normalizeFrames(
  value: unknown
): SavedFrame[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is Record<
        string,
        unknown
      > =>
        Boolean(item) &&
        typeof item ===
          "object" &&
        !Array.isArray(item)
    )
    .map((item) => ({
      angle:
        Number(
          item.angle
        ),

      name:
        String(
          item.name ?? ""
        ).trim(),

      url:
        String(
          item.url ?? ""
        ).trim(),
    }))
    .filter(
      (frame) =>
        Number.isFinite(
          frame.angle
        ) &&
        frame.angle >= 0 &&
        frame.angle < 360 &&
        Boolean(frame.url)
    )
    .sort(
      (a, b) =>
        a.angle - b.angle
    );
}

/* ============================================================
   GET CLOUDINARY PUBLIC ID FROM FRAME
============================================================ */

function getPublicId(
  productId: string,
  angle: number
) {
  return `silentgen/products/${productId}/360/angle-${angle}`;
}

/* ============================================================
   DELETE CLOUDINARY FRAME
============================================================ */

async function deleteCloudinaryFrame(
  productId: string,
  angle: number
) {
  validateCloudinaryConfig();

  const publicId =
    getPublicId(
      productId,
      angle
    );

  try {
    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "image",

          invalidate:
            true,
        }
      );

    console.log(
      "CLOUDINARY 360 DELETE:",
      {
        angle,
        publicId,
        result:
          result?.result,
      }
    );

    return result;
  } catch (error) {
    console.error(
      "CLOUDINARY FRAME DELETE ERROR:",
      {
        angle,
        publicId,
        error,
      }
    );

    throw error;
  }
}

/* ============================================================
   GET
   GET /api/admin/products/[id]/generate-360/manage
============================================================ */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    /* --------------------------------------------------------
       DB
    -------------------------------------------------------- */

    await connectDB();

    /* --------------------------------------------------------
       ID
    -------------------------------------------------------- */

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product ID."
      );
    }

    /* --------------------------------------------------------
       PRODUCT
    -------------------------------------------------------- */

    const product =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      }).lean();

    if (!product) {
      return notFoundResponse(
        "Product not found."
      );
    }

    /* --------------------------------------------------------
       FRAMES
    -------------------------------------------------------- */

    const frames =
      normalizeFrames(
        product.product360
          ?.frames
      );

    const enabled =
      Boolean(
        product.product360
          ?.enabled
      );

    /* --------------------------------------------------------
       SUCCESS
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        enabled,

        totalFrames:
          frames.length,

        frames,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET 360 MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load 360° product view.",

        message:
          "Unable to load 360° product view.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   PATCH
   ENABLE / DISABLE 360

   PATCH /api/admin/products/[id]/generate-360/manage

   BODY:
   {
     "enabled": true
   }
============================================================ */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    /* --------------------------------------------------------
       DATABASE
    -------------------------------------------------------- */

    await connectDB();

    /* --------------------------------------------------------
       PRODUCT ID
    -------------------------------------------------------- */

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product ID."
      );
    }

    /* --------------------------------------------------------
       BODY
    -------------------------------------------------------- */

    let body: PatchBody;

    try {
      body =
        (await request.json()) as PatchBody;
    } catch {
      return invalidResponse(
        "Invalid JSON request body."
      );
    }

    /* --------------------------------------------------------
       VALIDATE ENABLED
    -------------------------------------------------------- */

    if (
      typeof body.enabled !==
      "boolean"
    ) {
      return invalidResponse(
        "enabled must be true or false."
      );
    }

    /* --------------------------------------------------------
       FIND PRODUCT
    -------------------------------------------------------- */

    const product =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      });

    if (!product) {
      return notFoundResponse(
        "Product not found."
      );
    }

    /* --------------------------------------------------------
       CURRENT FRAMES
    -------------------------------------------------------- */

    const frames =
      normalizeFrames(
        product.product360
          ?.frames
      );

    /* --------------------------------------------------------
       CANNOT ENABLE WITHOUT FRAMES
    -------------------------------------------------------- */

    if (
      body.enabled &&
      frames.length === 0
    ) {
      return invalidResponse(
        "Cannot enable 360° view because no frames are saved."
      );
    }

    /* --------------------------------------------------------
       UPDATE
    -------------------------------------------------------- */

    product.product360 = {
      enabled:
        body.enabled,

      frames,
    };

    await product.save();

    /* --------------------------------------------------------
       SUCCESS
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          body.enabled
            ? "360° product view enabled successfully."
            : "360° product view disabled successfully.",

        enabled:
          body.enabled,

        totalFrames:
          frames.length,

        frames,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH 360 MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to update 360° product view.",

        message:
          "Unable to update 360° product view.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE

   Supports:

   1. DELETE ONE FRAME

   {
     "angle": 90
   }

   2. DELETE ALL FRAMES

   {
     "deleteAll": true
   }
============================================================ */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    /* --------------------------------------------------------
       DATABASE
    -------------------------------------------------------- */

    await connectDB();

    /* --------------------------------------------------------
       PRODUCT ID
    -------------------------------------------------------- */

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product ID."
      );
    }

    /* --------------------------------------------------------
       BODY
    -------------------------------------------------------- */

    let body: DeleteBody;

    try {
      body =
        (await request.json()) as DeleteBody;
    } catch {
      return invalidResponse(
        "Invalid JSON request body."
      );
    }

    /* --------------------------------------------------------
       FIND PRODUCT
    -------------------------------------------------------- */

    const product =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      });

    if (!product) {
      return notFoundResponse(
        "Product not found."
      );
    }

    /* --------------------------------------------------------
       CURRENT FRAMES
    -------------------------------------------------------- */

    const currentFrames =
      normalizeFrames(
        product.product360
          ?.frames
      );

    /* ========================================================
       DELETE ALL
    ======================================================== */

    if (
      body.deleteAll ===
      true
    ) {
      /* ------------------------------------------------------
         DELETE CLOUDINARY FRAMES
      ------------------------------------------------------ */

      if (
        currentFrames.length >
        0
      ) {
        validateCloudinaryConfig();

        for (
          const currentFrame of
          currentFrames
        ) {
          try {
            await deleteCloudinaryFrame(
              id,
              currentFrame.angle
            );
          } catch (
            cloudinaryError
          ) {
            /*
             We log the Cloudinary error,
             but continue deleting the
             database 360 state.

             This prevents one missing
             Cloudinary asset from blocking
             complete cleanup.
            */

            console.error(
              "DELETE ALL 360 CLOUDINARY ITEM ERROR:",
              {
                angle:
                  currentFrame.angle,

                error:
                  cloudinaryError,
              }
            );
          }
        }
      }

      /* ------------------------------------------------------
         CLEAR PRODUCT 360
      ------------------------------------------------------ */

      product.product360 = {
        enabled: false,
        frames: [],
      };

      await product.save();

      /* ------------------------------------------------------
         SUCCESS
      ------------------------------------------------------ */

      return NextResponse.json(
        {
          success: true,

          message:
            "360° product view deleted successfully.",

          enabled: false,

          totalFrames: 0,

          frames: [],
        },
        {
          status: 200,
        }
      );
    }

    /* ========================================================
       DELETE ONE FRAME
    ======================================================== */

    if (
      body.angle ===
      undefined
    ) {
      return invalidResponse(
        "Frame angle is required."
      );
    }

    const angle =
      Number(
        body.angle
      );

    /* --------------------------------------------------------
       VALIDATE ANGLE
    -------------------------------------------------------- */

    if (
      !Number.isFinite(
        angle
      ) ||
      angle < 0 ||
      angle >= 360
    ) {
      return invalidResponse(
        "Invalid 360° frame angle."
      );
    }

    /* --------------------------------------------------------
       FIND FRAME
    -------------------------------------------------------- */

    const frameExists =
      currentFrames.some(
        (currentFrame) =>
          currentFrame.angle ===
          angle
      );

    if (!frameExists) {
      return notFoundResponse(
        `${angle}° frame was not found.`
      );
    }

    /* --------------------------------------------------------
       DELETE FROM CLOUDINARY
    -------------------------------------------------------- */

    try {
      await deleteCloudinaryFrame(
        id,
        angle
      );
    } catch (
      cloudinaryError
    ) {
      console.error(
        "360 FRAME CLOUDINARY DELETE ERROR:",
        cloudinaryError
      );

      /*
       We continue to remove the frame
       from MongoDB even if the Cloudinary
       object was already missing.
      */
    }

    /* --------------------------------------------------------
       FILTER FRAME
    -------------------------------------------------------- */

    const remainingFrames =
      currentFrames.filter(
        (currentFrame) =>
          currentFrame.angle !==
          angle
      );

    /* --------------------------------------------------------
       ENABLE STATUS

       If no frame remains => disable 360.
       Otherwise preserve previous state.
    -------------------------------------------------------- */

    const nextEnabled =
      remainingFrames.length >
      0
        ? Boolean(
            product
              .product360
              ?.enabled
          )
        : false;

    /* --------------------------------------------------------
       SAVE
    -------------------------------------------------------- */

    product.product360 = {
      enabled:
        nextEnabled,

      frames:
        remainingFrames,
    };

    await product.save();

    /* --------------------------------------------------------
       SUCCESS
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          `${angle}° frame deleted successfully.`,

        enabled:
          nextEnabled,

        totalFrames:
          remainingFrames.length,

        frames:
          remainingFrames,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE 360 MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to delete 360° product data.",

        message:
          "Unable to delete 360° product data.",
      },
      {
        status: 500,
      }
    );
  }
}