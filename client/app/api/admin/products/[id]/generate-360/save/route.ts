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

type FrameInput = {
  angle: number;
  name: string;
  base64: string;
  mimeType: string;
};

type SavedFrame = {
  angle: number;
  name: string;
  url: string;
};

type Product360Data = {
  enabled: boolean;
  frames: SavedFrame[];
};

type SaveRequestBody = {
  frame?: FrameInput;

  finalize?: boolean;

  color?: string;
};

type ColorVariantData = {
  color?: string;

  images?: string[];

  view360Images?: string[];

  product360?: Product360Data;
};

/* ============================================================
   ALLOWED ROLES
============================================================ */

const ALLOWED_ROLES = [
  "super_admin",
  "product_manager",
] as const;

type AllowedRole =
  (typeof ALLOWED_ROLES)[number];

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
      !ALLOWED_ROLES.includes(
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
   RESPONSE HELPERS
============================================================ */

function permissionDeniedResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
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
    },
    {
      status: 404,
    }
  );
}

/* ============================================================
   ACTIVE PRODUCT FILTER
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
   STRING HELPER
============================================================ */

function cleanString(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

/* ============================================================
   CLOUDINARY CONFIG CHECK
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
      "Cloudinary configuration is missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }
}

/* ============================================================
   VALIDATE FRAME
============================================================ */

function validateFrame(
  frame: FrameInput
) {
  if (!frame) {
    throw new Error(
      "Frame data is required."
    );
  }

  if (
    typeof frame.angle !==
      "number" ||
    !Number.isFinite(
      frame.angle
    ) ||
    frame.angle < 0 ||
    frame.angle >= 360
  ) {
    throw new Error(
      "Frame angle must be between 0 and 359."
    );
  }

  if (
    !Number.isInteger(
      frame.angle
    )
  ) {
    throw new Error(
      "Frame angle must be a whole number."
    );
  }

  if (
    typeof frame.name !==
      "string" ||
    !frame.name.trim()
  ) {
    throw new Error(
      "Frame name is required."
    );
  }

  if (
    typeof frame.base64 !==
      "string" ||
    !frame.base64.trim()
  ) {
    throw new Error(
      "Frame image data is required."
    );
  }

  if (
    typeof frame.mimeType !==
      "string" ||
    !frame.mimeType.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Invalid image MIME type."
    );
  }
}

/* ============================================================
   CLEAN SAVED FRAMES
============================================================ */

function normalizeFrames(
  value: unknown
): SavedFrame[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const frameMap =
    new Map<
      number,
      SavedFrame
    >();

  for (
    const currentFrame of value
  ) {
    if (
      typeof currentFrame !==
        "object" ||
      currentFrame === null
    ) {
      continue;
    }

    const rawFrame =
      currentFrame as {
        angle?: unknown;
        name?: unknown;
        url?: unknown;
      };

    const angle =
      Number(
        rawFrame.angle
      );

    const name =
      cleanString(
        rawFrame.name
      );

    const url =
      cleanString(
        rawFrame.url
      );

    if (
      !Number.isFinite(
        angle
      ) ||
      angle < 0 ||
      angle >= 360 ||
      !name ||
      !url
    ) {
      continue;
    }

    frameMap.set(
      Math.round(angle),
      {
        angle:
          Math.round(angle),

        name,

        url,
      }
    );
  }

  return Array.from(
    frameMap.values()
  ).sort(
    (a, b) =>
      a.angle - b.angle
  );
}

/* ============================================================
   SAFE COLOR NAME
============================================================ */

function safeColorName(
  color: string
) {
  const value =
    color
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return value || "color";
}

/* ============================================================
   FIND COLOR VARIANT INDEX
============================================================ */

function findColorVariantIndex(
  variants: ColorVariantData[],
  selectedColor: string
) {
  const normalizedSelected =
    selectedColor
      .trim()
      .toLowerCase();

  return variants.findIndex(
    (variant) =>
      cleanString(
        variant.color
      ).toLowerCase() ===
      normalizedSelected
  );
}

/* ============================================================
   POST
   POST /api/admin/products/[id]/generate-360/save
============================================================ */

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* ========================================================
       ADMIN AUTH
    ======================================================== */

    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    /* ========================================================
       DATABASE
    ======================================================== */

    await connectDB();

    validateCloudinaryConfig();

    const { id } =
      await context.params;

    /* ========================================================
       PRODUCT ID
    ======================================================== */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product ID."
      );
    }

    /* ========================================================
       PRODUCT
    ======================================================== */

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

    /* ========================================================
       REQUEST BODY
    ======================================================== */

    let body: SaveRequestBody;

    try {
      body =
        (await request.json()) as
          SaveRequestBody;
    } catch {
      return invalidResponse(
        "Invalid JSON request body."
      );
    }

    const selectedColor =
      cleanString(
        body.color
      );

    /* ========================================================
       COLOR VARIANTS
    ======================================================== */

    const colorVariants =
      Array.isArray(
        product.colorVariants
      )
        ? (
            product.colorVariants as unknown as
              ColorVariantData[]
          ).map(
            (variant) => ({
              ...(typeof (
                variant as any
              ).toObject ===
              "function"
                ? (
                    variant as any
                  ).toObject()
                : variant),
            })
          )
        : [];

    let colorVariantIndex =
      -1;

    if (selectedColor) {
      colorVariantIndex =
        findColorVariantIndex(
          colorVariants,
          selectedColor
        );

      if (
        colorVariantIndex ===
        -1
      ) {
        return notFoundResponse(
          `Color variant "${selectedColor}" was not found.`
        );
      }
    }

    /* ========================================================
       FINALIZE
    ======================================================== */

    if (
      body.finalize === true
    ) {
      /* ------------------------------------------------------
         COLOR FINALIZE
      ------------------------------------------------------ */

      if (selectedColor) {
        const variant =
          colorVariants[
            colorVariantIndex
          ];

        if (!variant) {
          return notFoundResponse(
            `Color variant "${selectedColor}" was not found.`
          );
        }

        const existingFrames =
          normalizeFrames(
            variant.product360
              ?.frames
          );

        if (
          existingFrames.length ===
          0
        ) {
          return invalidResponse(
            `No 360° frames have been uploaded for ${selectedColor}.`
          );
        }

        variant.product360 = {
          enabled: true,

          frames:
            existingFrames,
        };

        colorVariants[
          colorVariantIndex
        ] = variant;

        product.set(
          "colorVariants",
          colorVariants
        );

        await product.save();

        return NextResponse.json(
          {
            success: true,

            message:
              `${selectedColor} 360° product view saved successfully.`,

            target:
              "color",

            color:
              selectedColor,

            enabled: true,

            totalFrames:
              existingFrames.length,

            frames:
              existingFrames,

            product360: {
              enabled: true,

              frames:
                existingFrames,
            },
          },
          {
            status: 200,
          }
        );
      }

      /* ------------------------------------------------------
         MAIN PRODUCT FINALIZE
      ------------------------------------------------------ */

      const mainProduct360 =
        product.get(
          "product360"
        ) as
          | Product360Data
          | undefined;

      const existingFrames =
        normalizeFrames(
          mainProduct360
            ?.frames
        );

      if (
        existingFrames.length ===
        0
      ) {
        return invalidResponse(
          "No Main Product 360° frames have been uploaded yet."
        );
      }

      product.set(
        "product360",
        {
          enabled: true,

          frames:
            existingFrames,
        }
      );

      await product.save();

      return NextResponse.json(
        {
          success: true,

          message:
            "Main Product 360° view saved successfully.",

          target:
            "main",

          color: null,

          enabled: true,

          totalFrames:
            existingFrames.length,

          frames:
            existingFrames,

          product360: {
            enabled: true,

            frames:
              existingFrames,
          },
        },
        {
          status: 200,
        }
      );
    }

    /* ========================================================
       FRAME REQUIRED
    ======================================================== */

    if (!body.frame) {
      return invalidResponse(
        "Frame data is required."
      );
    }

    /* ========================================================
       VALIDATE FRAME
    ======================================================== */

    validateFrame(
      body.frame
    );

    const frame =
      body.frame;

    /* ========================================================
       BASE64 DATA URI
    ======================================================== */

    const dataUri =
      `data:${frame.mimeType};base64,${frame.base64}`;

    /* ========================================================
       CLOUDINARY FOLDER
    ======================================================== */

    const folder =
      selectedColor
        ? `silentgen/products/${id}/360/colors/${safeColorName(
            selectedColor
          )}`
        : `silentgen/products/${id}/360/main`;

    /* ========================================================
       CLOUDINARY PUBLIC ID
    ======================================================== */

    const publicId =
      `angle-${frame.angle}`;

    /* ========================================================
       CLOUDINARY UPLOAD
    ======================================================== */

    const uploadResult =
      await cloudinary.uploader.upload(
        dataUri,
        {
          folder,

          public_id:
            publicId,

          overwrite: true,

          resource_type:
            "image",

          invalidate: true,
        }
      );

    if (
      !uploadResult
        ?.secure_url
    ) {
      throw new Error(
        "Cloudinary did not return an image URL."
      );
    }

    /* ========================================================
       SAVED FRAME
    ======================================================== */

    const savedFrame: SavedFrame =
      {
        angle:
          frame.angle,

        name:
          frame.name.trim(),

        url:
          uploadResult
            .secure_url,
      };

    /* ========================================================
       SAVE COLOR FRAME
    ======================================================== */

    if (selectedColor) {
      const variant =
        colorVariants[
          colorVariantIndex
        ];

      if (!variant) {
        return notFoundResponse(
          `Color variant "${selectedColor}" was not found.`
        );
      }

      const currentFrames =
        normalizeFrames(
          variant.product360
            ?.frames
        );

      const withoutSameAngle =
        currentFrames.filter(
          (
            currentFrame: SavedFrame
          ) =>
            currentFrame.angle !==
            savedFrame.angle
        );

      const updatedFrames =
        normalizeFrames([
          ...withoutSameAngle,

          savedFrame,
        ]);

      variant.product360 = {
        /*
         * During frame upload keep it disabled.
         *
         * It becomes enabled only after:
         *
         * {
         *   finalize: true,
         *   color: "Blue"
         * }
         */

        enabled: false,

        frames:
          updatedFrames,
      };

      colorVariants[
        colorVariantIndex
      ] = variant;

      product.set(
        "colorVariants",
        colorVariants
      );

      await product.save();

      return NextResponse.json(
        {
          success: true,

          message:
            `${selectedColor} 360° frame ${frame.angle}° uploaded successfully.`,

          target:
            "color",

          color:
            selectedColor,

          frame:
            savedFrame,

          enabled: false,

          totalFrames:
            updatedFrames.length,

          frames:
            updatedFrames,

          product360: {
            enabled: false,

            frames:
              updatedFrames,
          },
        },
        {
          status: 200,
        }
      );
    }

    /* ========================================================
       SAVE MAIN PRODUCT FRAME
    ======================================================== */

    const currentMain360 =
      product.get(
        "product360"
      ) as
        | Product360Data
        | undefined;

    const currentFrames =
      normalizeFrames(
        currentMain360
          ?.frames
      );

    const withoutSameAngle =
      currentFrames.filter(
        (
          currentFrame: SavedFrame
        ) =>
          currentFrame.angle !==
          savedFrame.angle
      );

    const updatedFrames =
      normalizeFrames([
        ...withoutSameAngle,

        savedFrame,
      ]);

    product.set(
      "product360",
      {
        /*
         * Do not enable until finalize.
         */

        enabled: false,

        frames:
          updatedFrames,
      }
    );

    await product.save();

    /* ========================================================
       SUCCESS
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          `Main Product 360° frame ${frame.angle}° uploaded successfully.`,

        target:
          "main",

        color: null,

        frame:
          savedFrame,

        enabled: false,

        totalFrames:
          updatedFrames.length,

        frames:
          updatedFrames,

        product360: {
          enabled: false,

          frames:
            updatedFrames,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "SAVE_360_FRAME_ERROR:",
      error
    );

    /* ========================================================
       MONGOOSE VALIDATION
    ======================================================== */

    if (
      error instanceof
      mongoose.Error
        .ValidationError
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            Object.values(
              error.errors
            )
              .map(
                (
                  currentError
                ) =>
                  currentError
                    .message
              )
              .join(", ") ||
            "Product validation failed.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       GENERIC ERROR
    ======================================================== */

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Unable to save 360° frame.",
      },
      {
        status: 500,
      }
    );
  }
}