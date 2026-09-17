import {
  NextRequest,
  NextResponse,
} from "next/server";

import { v2 as cloudinary } from "cloudinary";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";

export const runtime =
  "nodejs";

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

/*
|--------------------------------------------------------------------------
| CLOUDINARY CONFIG
|--------------------------------------------------------------------------
*/

function configureCloudinary() {
  const cloudName =
    process.env
      .CLOUDINARY_CLOUD_NAME;

  const apiKey =
    process.env
      .CLOUDINARY_API_KEY;

  const apiSecret =
    process.env
      .CLOUDINARY_API_SECRET;

  if (
    !cloudName ||
    !apiKey ||
    !apiSecret
  ) {
    throw new Error(
      "Cloudinary configuration is missing."
    );
  }

  cloudinary.config({
    cloud_name:
      cloudName,

    api_key:
      apiKey,

    api_secret:
      apiSecret,

    secure: true,
  });
}

/*
|--------------------------------------------------------------------------
| ADMIN AUTH
|--------------------------------------------------------------------------
*/

async function verifyUploadAdmin(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return {
      error:
        NextResponse.json(
          {
            success:
              false,

            message:
              "Admin login required.",
          },
          {
            status:
              401,
          }
        ),
    };
  }

  let payload;

  try {
    payload =
      await verifyAdminToken(
        token
      );
  } catch {
    return {
      error:
        NextResponse.json(
          {
            success:
              false,

            message:
              "Invalid or expired admin session.",
          },
          {
            status:
              401,
          }
        ),
    };
  }

  await connectDB();

  const admin =
    await Admin.findById(
      payload.adminId
    )
      .select(
        "_id role isActive"
      )
      .lean();

  if (!admin) {
    return {
      error:
        NextResponse.json(
          {
            success:
              false,

            message:
              "Admin not found.",
          },
          {
            status:
              404,
          }
        ),
    };
  }

  if (
    admin.isActive ===
    false
  ) {
    return {
      error:
        NextResponse.json(
          {
            success:
              false,

            message:
              "Admin account is disabled.",
          },
          {
            status:
              403,
          }
        ),
    };
  }

  const allowedRoles = [
    "super_admin",
    "product_manager",
  ];

  if (
    !allowedRoles.includes(
      String(
        admin.role
      )
    )
  ) {
    return {
      error:
        NextResponse.json(
          {
            success:
              false,

            message:
              "You do not have permission to upload product images.",
          },
          {
            status:
              403,
          }
        ),
    };
  }

  return {
    admin,
  };
}

/*
|--------------------------------------------------------------------------
| UPLOAD
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    const auth =
      await verifyUploadAdmin(
        request
      );

    if (
      "error" in auth
    ) {
      return auth.error;
    }

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY
    |--------------------------------------------------------------------------
    */

    configureCloudinary();

    /*
    |--------------------------------------------------------------------------
    | FORM DATA
    |--------------------------------------------------------------------------
    */

    const formData =
      await request.formData();

    const file =
      formData.get(
        "file"
      );

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Image file is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FILE TYPE
    |--------------------------------------------------------------------------
    */

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Only JPG, JPEG, PNG and WEBP images are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SIZE
    |--------------------------------------------------------------------------
    */

    if (
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Image file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Each image must be 8 MB or smaller.",
        },
        {
          status: 413,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BUFFER
    |--------------------------------------------------------------------------
    */

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(
        arrayBuffer
      );

    const dataUri =
      `data:${file.type};base64,${buffer.toString(
        "base64"
      )}`;

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY UPLOAD
    |--------------------------------------------------------------------------
    */

    const result =
      await cloudinary.uploader.upload(
        dataUri,
        {
          folder:
            "silentgen/products",

          resource_type:
            "image",

          transformation: [
            {
              quality:
                "auto",

              fetch_format:
                "auto",
            },
          ],
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,

      message:
        "Image uploaded successfully.",

      url:
        result.secure_url,

      publicId:
        result.public_id,

      width:
        result.width,

      height:
        result.height,

      format:
        result.format,
    });
  } catch (error) {
    console.error(
      "PRODUCT IMAGE UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to upload image. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}