import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";
import cloudinary from "@/lib/cloudinary";
import {
  verifyAdminToken,
} from "@/lib/adminAuth";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const MAX_FILE_SIZE =
  10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| POST - HOMEPAGE IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | ADMIN AUTH
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
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const admin =
      await verifyAdminToken(token);

    if (
      !admin?.adminId ||
      !admin?.role
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid admin token.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE CONNECTION
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

    const file =
      formData.get("file");

    /*
    |--------------------------------------------------------------------------
    | FILE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select an image.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MIME TYPE
    |--------------------------------------------------------------------------
    */

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
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
    | FILE SIZE
    |--------------------------------------------------------------------------
    */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Image size must be 10MB or less.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY CONFIG CHECK
    |--------------------------------------------------------------------------
    */

    if (
      !process.env
        .CLOUDINARY_CLOUD_NAME ||
      !process.env
        .CLOUDINARY_API_KEY ||
      !process.env
        .CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cloudinary is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FILE BUFFER
    |--------------------------------------------------------------------------
    */

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY UPLOAD
    |--------------------------------------------------------------------------
    */

    const uploadResult =
      await new Promise<{
        secure_url: string;
        public_id: string;
        width?: number;
        height?: number;
        format?: string;
        bytes?: number;
      }>(
        (
          resolve,
          reject
        ) => {
          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  "silentgen/homepage",

                resource_type:
                  "image",

                use_filename:
                  false,

                unique_filename:
                  true,

                overwrite:
                  false,
              },

              (
                error,
                result
              ) => {
                if (error) {
                  reject(error);
                  return;
                }

                if (!result) {
                  reject(
                    new Error(
                      "Cloudinary upload failed."
                    )
                  );

                  return;
                }

                resolve({
                  secure_url:
                    result.secure_url,

                  public_id:
                    result.public_id,

                  width:
                    result.width,

                  height:
                    result.height,

                  format:
                    result.format,

                  bytes:
                    result.bytes,
                });
              }
            );

          uploadStream.end(
            buffer
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Image uploaded successfully.",

        image: {
          url:
            uploadResult.secure_url,

          publicId:
            uploadResult.public_id,

          width:
            uploadResult.width ??
            null,

          height:
            uploadResult.height ??
            null,

          format:
            uploadResult.format ??
            null,

          bytes:
            uploadResult.bytes ??
            null,
        },

        uploadedBy:
          admin.adminId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_HOMEPAGE_UPLOAD_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to upload image.",
      },
      {
        status: 500,
      }
    );
  }
}