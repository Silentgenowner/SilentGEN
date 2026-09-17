import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import {
  GoogleGenAI,
} from "@google/genai";

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

type ProductImageVariant = {
  color?: string;

  images?: string[];

  view360Images?: string[];
};

type ProductDocumentData = {
  _id?: unknown;

  name?: string;

  title?: string;

  thumbnail?: string;

  image?: string;

  images?: string[];

  productImages?: string[];

  colorVariants?: ProductImageVariant[];
};

type GenerateRequestBody = {
  color?: string;
};

type GeneratedFrame = {
  angle: number;

  name: string;

  base64: string;

  mimeType: string;
};

type SourceImage = {
  base64: string;

  mimeType: string;
};

type GeminiApiError = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };

  message?: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const ALLOWED_ROLES = [
  "super_admin",
  "product_manager",
] as const;

type AllowedRole =
  (typeof ALLOWED_ROLES)[number];

const TOTAL_FRAMES = 12;

const ANGLES =
  Array.from(
    {
      length: TOTAL_FRAMES,
    },
    (_, index) =>
      index * 30
  );

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
   STRING HELPERS
============================================================ */

function cleanString(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

function cleanStringArray(
  value: unknown
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    )
  );
}

/* ============================================================
   GET GEMINI API KEY
============================================================ */

function getGeminiApiKey() {
  const key =
    process.env
      .GEMINI_API_KEY;

  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env.local"
    );
  }

  return key;
}

/* ============================================================
   NORMALIZE IMAGE URL

   Fixes:

   /images/shirt.jpg

   Previously server fetch tried:

   fetch("/images/shirt.jpg")

   which causes:

   Failed to parse URL

   Now it becomes:

   http://localhost:3000/images/shirt.jpg
============================================================ */

function normalizeImageUrl(
  imageUrl: string,
  request: NextRequest
): string {
  const value =
    imageUrl.trim();

  if (!value) {
    return "";
  }

  /* ----------------------------------------------------------
     DATA URL
  ---------------------------------------------------------- */

  if (
    value.startsWith(
      "data:image/"
    )
  ) {
    return value;
  }

  /* ----------------------------------------------------------
     FULL URL
  ---------------------------------------------------------- */

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    return value;
  }

  /* ----------------------------------------------------------
     PROTOCOL RELATIVE
  ---------------------------------------------------------- */

  if (
    value.startsWith("//")
  ) {
    return `https:${value}`;
  }

  /* ----------------------------------------------------------
     LOCAL PUBLIC IMAGE
  ---------------------------------------------------------- */

  const origin =
    request.nextUrl.origin;

  if (
    value.startsWith("/")
  ) {
    return `${origin}${value}`;
  }

  return `${origin}/${value}`;
}

/* ============================================================
   GET MAIN PRODUCT IMAGES
============================================================ */

function getMainProductImages(
  product: ProductDocumentData
): string[] {
  const possibleImages = [
    ...cleanStringArray(
      product.images
    ),

    ...cleanStringArray(
      product.productImages
    ),

    ...(cleanString(
      product.thumbnail
    )
      ? [
          cleanString(
            product.thumbnail
          ),
        ]
      : []),

    ...(cleanString(
      product.image
    )
      ? [
          cleanString(
            product.image
          ),
        ]
      : []),
  ];

  return Array.from(
    new Set(
      possibleImages.filter(
        Boolean
      )
    )
  );
}

/* ============================================================
   FIND COLOR VARIANT
============================================================ */

function findColorVariant(
  product: ProductDocumentData,
  selectedColor: string
): ProductImageVariant | null {
  if (
    !selectedColor ||
    !Array.isArray(
      product.colorVariants
    )
  ) {
    return null;
  }

  const normalizedColor =
    selectedColor
      .trim()
      .toLowerCase();

  return (
    product.colorVariants.find(
      (variant) =>
        cleanString(
          variant?.color
        )
          .toLowerCase() ===
        normalizedColor
    ) ?? null
  );
}

/* ============================================================
   GET COLOR IMAGES
============================================================ */

function getColorProductImages(
  product: ProductDocumentData,
  color: string
): string[] {
  const variant =
    findColorVariant(
      product,
      color
    );

  if (!variant) {
    return [];
  }

  return Array.from(
    new Set(
      cleanStringArray(
        variant.images
      )
    )
  );
}

/* ============================================================
   GET SOURCE PRODUCT IMAGES
============================================================ */

function getSourceProductImages(
  product: ProductDocumentData,
  color: string
): string[] {
  if (color) {
    return getColorProductImages(
      product,
      color
    );
  }

  return getMainProductImages(
    product
  );
}

/* ============================================================
   DATA URI TO BASE64
============================================================ */

function parseDataUri(
  dataUri: string
): SourceImage {
  const match =
    dataUri.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
    );

  if (!match) {
    throw new Error(
      "Invalid image data URI."
    );
  }

  const mimeType =
    match[1];

  const base64 =
    match[2];

  if (
    !mimeType ||
    !base64
  ) {
    throw new Error(
      "Invalid image data URI."
    );
  }

  return {
    mimeType,
    base64,
  };
}

/* ============================================================
   IMAGE URL TO BASE64
============================================================ */

async function imageUrlToBase64(
  rawUrl: string,
  request: NextRequest
): Promise<SourceImage> {
  const url =
    normalizeImageUrl(
      rawUrl,
      request
    );

  if (!url) {
    throw new Error(
      "Product image URL is empty."
    );
  }

  /* ----------------------------------------------------------
     DATA URL
  ---------------------------------------------------------- */

  if (
    url.startsWith(
      "data:image/"
    )
  ) {
    return parseDataUri(
      url
    );
  }

  let response: Response;

  try {
    response =
      await fetch(
        url,
        {
          method: "GET",

          cache:
            "no-store",

          headers: {
            Accept:
              "image/*",
          },
        }
      );
  } catch (error) {
    console.error(
      "SOURCE IMAGE FETCH ERROR:",
      {
        url,
        error,
      }
    );

    throw new Error(
      `Unable to download product image: ${url}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Unable to download product image (${response.status}): ${url}`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) ||
    "image/jpeg";

  if (
    !contentType.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      `Source URL did not return an image: ${url}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  if (
    arrayBuffer.byteLength ===
    0
  ) {
    throw new Error(
      "Downloaded product image is empty."
    );
  }

  const base64 =
    Buffer.from(
      arrayBuffer
    ).toString(
      "base64"
    );

  return {
    base64,
    mimeType:
      contentType.split(
        ";"
      )[0] ||
      "image/jpeg",
  };
}

/* ============================================================
   BUILD AI PROMPT
============================================================ */

function buildPrompt(
  product: ProductDocumentData,
  angle: number,
  selectedColor: string
) {
  const productName =
    cleanString(
      product.name
    ) ||
    cleanString(
      product.title
    ) ||
    "fashion product";

  const colorInstruction =
    selectedColor
      ? `
The selected product color is:
${selectedColor}

The generated product MUST remain exactly this ${selectedColor} color.
Do not change it to any other color.
`
      : "";

  return `
Create one photorealistic ecommerce catalog frame of the EXACT SAME ${productName} shown in the supplied reference image.

${colorInstruction}

TARGET CAMERA ANGLE:
${angle} degrees around the product.

This image is one frame in a continuous 360-degree ecommerce product rotation.

STRICT PRODUCT IDENTITY RULES:

- Preserve the exact same product.
- Preserve the exact garment shape.
- Preserve the exact dimensions and proportions.
- Preserve the exact selected color.
- Preserve the exact fabric appearance.
- Preserve the exact texture.
- Preserve the exact collar.
- Preserve the exact neckline.
- Preserve the exact sleeves.
- Preserve the exact cuffs.
- Preserve the exact buttons.
- Preserve the exact pockets.
- Preserve the exact stitching.
- Preserve the exact seams.
- Preserve the exact logo.
- Preserve the exact embroidery.
- Preserve the exact printed graphics.
- Preserve the exact typography present on the product.
- Preserve every visible design element.
- Preserve product construction.
- Preserve product fit and silhouette.

DO NOT:

- Do not redesign the product.
- Do not change the product color.
- Do not invent a new logo.
- Do not change the existing logo.
- Do not invent text.
- Do not change existing text.
- Do not add accessories.
- Do not add a person.
- Do not add a mannequin.
- Do not add hands.
- Do not add props.
- Do not remove product details.
- Do not change fabric.
- Do not alter embroidery.
- Do not alter print artwork.
- Do not alter buttons.
- Do not alter pockets.
- Do not make the garment longer or shorter.
- Do not make sleeves longer or shorter.

CAMERA:

Imagine the product remains perfectly centered while the camera rotates horizontally around it.

The requested camera rotation is exactly ${angle} degrees.

0 degrees = front view.
90 degrees = right-side view.
180 degrees = back view.
270 degrees = left-side view.

For intermediate angles, create a natural corresponding three-quarter product view.

OUTPUT:

- Product only.
- Clean ecommerce catalog image.
- Centered composition.
- Consistent product scale.
- Consistent framing.
- Professional studio lighting.
- Neutral clean background.
- Realistic natural shadows.
- Sharp garment details.
- Photorealistic.
- High quality.

This frame must visually match the other frames in the same 360-degree sequence.
`;
}

/* ============================================================
   GENERATE ONE FRAME
============================================================ */

async function generateFrame(
  ai: GoogleGenAI,
  product: ProductDocumentData,
  sourceImage: SourceImage,
  angle: number,
  selectedColor: string
): Promise<GeneratedFrame> {
  const prompt =
    buildPrompt(
      product,
      angle,
      selectedColor
    );

  const response =
    await ai.models.generateContent(
      {
        model:
          "gemini-2.5-flash-image",

        contents: [
          {
            role:
              "user",

            parts: [
              {
                inlineData: {
                  data:
                    sourceImage.base64,

                  mimeType:
                    sourceImage.mimeType,
                },
              },

              {
                text:
                  prompt,
              },
            ],
          },
        ],
      }
    );

  const parts =
    response.candidates?.[0]
      ?.content?.parts ||
    [];

  for (
    const part of parts
  ) {
    if (
      part.inlineData?.data &&
      part.inlineData
        ?.mimeType
    ) {
      const safeColor =
        selectedColor
          ? selectedColor
              .trim()
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                "-"
              )
              .replace(
                /^-|-$/g,
                ""
              )
          : "main";

      return {
        angle,

        name:
          `${safeColor}-360-${angle}.png`,

        base64:
          part.inlineData.data,

        mimeType:
          part.inlineData
            .mimeType,
      };
    }
  }

  throw new Error(
    `Gemini did not return an image for ${angle}° angle.`
  );
}

/* ============================================================
   EXTRACT GEMINI ERROR
============================================================ */

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
    error !== null
  ) {
    const apiError =
      error as GeminiApiError;

    if (
      apiError.error
        ?.message
    ) {
      return apiError.error
        .message;
    }

    if (
      apiError.message
    ) {
      return apiError.message;
    }
  }

  return "360 generation failed.";
}

/* ============================================================
   DETECT 429 / QUOTA ERROR
============================================================ */

function isQuotaError(
  error: unknown
): boolean {
  const message =
    getErrorMessage(
      error
    ).toLowerCase();

  return (
    message.includes(
      "429"
    ) ||
    message.includes(
      "quota"
    ) ||
    message.includes(
      "resource_exhausted"
    ) ||
    message.includes(
      "rate limit"
    ) ||
    message.includes(
      "rate-limit"
    )
  );
}

/* ============================================================
   POST
   POST /api/admin/products/[id]/generate-360
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
       CONNECT DB
    ======================================================== */

    await connectDB();

    const { id } =
      await context.params;

    /* ========================================================
       VALIDATE PRODUCT ID
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
       REQUEST BODY
    ======================================================== */

    let selectedColor = "";

    try {
      const body =
        (await request.json()) as
          | GenerateRequestBody
          | null;

      selectedColor =
        cleanString(
          body?.color
        );
    } catch {
      /*
       * Empty request body is valid
       * for Main Product generation.
       */

      selectedColor = "";
    }

    /* ========================================================
       FIND PRODUCT
    ======================================================== */

    const productRaw =
      await Product.findOne({
        _id: id,
        ...activeProductFilter(),
      }).lean();

    if (!productRaw) {
      return notFoundResponse(
        "Product not found."
      );
    }

    const product =
      productRaw as unknown as
        ProductDocumentData;

    /* ========================================================
       VALIDATE COLOR
    ======================================================== */

    if (selectedColor) {
      const variant =
        findColorVariant(
          product,
          selectedColor
        );

      if (!variant) {
        return notFoundResponse(
          `Color variant "${selectedColor}" was not found for this product.`
        );
      }

      const colorImages =
        getColorProductImages(
          product,
          selectedColor
        );

      if (
        colorImages.length ===
        0
      ) {
        return invalidResponse(
          `${selectedColor} does not have any product images. Add at least one ${selectedColor} image before generating its 360° view.`
        );
      }
    }

    /* ========================================================
       SELECT SOURCE IMAGES
    ======================================================== */

    const productImages =
      getSourceProductImages(
        product,
        selectedColor
      );

    if (
      productImages.length ===
      0
    ) {
      return invalidResponse(
        selectedColor
          ? `${selectedColor} does not have any source image.`
          : "This product does not have any image. Upload a product image first."
      );
    }

    /* ========================================================
       SOURCE IMAGE
    ======================================================== */

    const sourceImageUrl =
      productImages[0];

    if (!sourceImageUrl) {
      return invalidResponse(
        "Unable to find a valid source image."
      );
    }

    console.log(
      "360 GENERATION TARGET:",
      {
        productId:
          id,

        target:
          selectedColor
            ? "color"
            : "main",

        color:
          selectedColor ||
          null,

        sourceImage:
          sourceImageUrl,
      }
    );

    const sourceImage =
      await imageUrlToBase64(
        sourceImageUrl,
        request
      );

    /* ========================================================
       GEMINI
    ======================================================== */

    const apiKey =
      getGeminiApiKey();

    const ai =
      new GoogleGenAI({
        apiKey,
      });

    /* ========================================================
       GENERATE ALL 12 FRAMES
    ======================================================== */

    const frames: GeneratedFrame[] =
      [];

    for (
      const angle of ANGLES
    ) {
      try {
        console.log(
          `Generating 360° frame ${angle}°`,
          selectedColor
            ? `for ${selectedColor}`
            : "for Main Product"
        );

        const frame =
          await generateFrame(
            ai,
            product,
            sourceImage,
            angle,
            selectedColor
          );

        frames.push(
          frame
        );
      } catch (frameError) {
        console.error(
          `GENERATE FRAME ${angle} ERROR:`,
          frameError
        );

        /*
         * Important:
         * If quota fails, stop immediately.
         * Otherwise Gemini would keep trying
         * the remaining angles.
         */

        if (
          isQuotaError(
            frameError
          )
        ) {
          return NextResponse.json(
            {
              success:
                false,

              error:
                "Gemini quota is currently exhausted. Use Manual 360 Upload or try AI generation again when your Gemini quota becomes available.",

              originalError:
                getErrorMessage(
                  frameError
                ),
            },
            {
              status: 429,
            }
          );
        }

        throw frameError;
      }
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        productId: id,

        target:
          selectedColor
            ? "color"
            : "main",

        color:
          selectedColor ||
          null,

        sourceImage:
          sourceImageUrl,

        totalFrames:
          frames.length,

        images:
          frames,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GENERATE_360_ERROR:",
      error
    );

    if (
      isQuotaError(error)
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Gemini quota is currently exhausted. Use Manual 360 Upload or try AI generation again later.",

          originalError:
            getErrorMessage(
              error
            ),
        },
        {
          status: 429,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        error:
          getErrorMessage(
            error
          ),
      },
      {
        status: 500,
      }
    );
  }
}