import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Readable } from "stream";

import { verifyAdminToken } from "@/lib/adminAuth";
import cloudinary from "@/lib/cloudinary";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const MAX_VIDEO_DURATION_SECONDS =
  30;

const MAX_VIDEO_SIZE_MB =
  50;

const MAX_VIDEO_SIZE_BYTES =
  MAX_VIDEO_SIZE_MB *
  1024 *
  1024;

const ALLOWED_ROLES = [
  "super_admin",
  "product_manager",
] as const;

const ALLOWED_VIDEO_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]);

const ALLOWED_EXTENSIONS =
  new Set([
    ".mp4",
    ".webm",
    ".mov",
  ]);

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type CloudinaryVideoResult = {
  secure_url?: string;

  public_id?: string;

  duration?: number;

  width?: number;

  height?: number;

  format?: string;

  bytes?: number;

  version?: number;
};

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
        ALLOWED_ROLES.includes(
          payload.role as
            (typeof ALLOWED_ROLES)[number]
        )
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| FILE EXTENSION
|--------------------------------------------------------------------------
*/

function getFileExtension(
  fileName: string
) {
  const index =
    fileName.lastIndexOf(
      "."
    );

  if (index < 0) {
    return "";
  }

  return fileName
    .slice(index)
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| VALID VIDEO FILE
|--------------------------------------------------------------------------
*/

function isAllowedVideo(
  file: File
) {
  const extension =
    getFileExtension(
      file.name
    );

  const mimeAllowed =
    ALLOWED_VIDEO_TYPES.has(
      file.type
    );

  const extensionAllowed =
    ALLOWED_EXTENSIONS.has(
      extension
    );

  /*
  |--------------------------------------------------------------------------
  | Some browsers may not provide MIME correctly for MOV,
  | so extension fallback is allowed.
  |--------------------------------------------------------------------------
  */

  return (
    mimeAllowed ||
    extensionAllowed
  );
}

/*
|--------------------------------------------------------------------------
| CLEAN FILE NAME
|--------------------------------------------------------------------------
*/

function cleanFileName(
  fileName: string
) {
  return fileName
    .replace(
      /\.[^/.]+$/,
      ""
    )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(
      0,
      80
    );
}

/*
|--------------------------------------------------------------------------
| UPLOAD VIDEO TO CLOUDINARY
|--------------------------------------------------------------------------
*/

async function uploadVideoToCloudinary(
  file: File
): Promise<CloudinaryVideoResult> {
  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(
      bytes
    );

  const safeName =
    cleanFileName(
      file.name
    ) ||
    `product-reel-${Date.now()}`;

  return new Promise(
    (
      resolve,
      reject
    ) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            resource_type:
              "video",

            folder:
              "SilentGEN/product-reels",

            public_id:
              `${safeName}-${Date.now()}`,

            overwrite:
              false,

            use_filename:
              false,

            unique_filename:
              true,
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
                    "Cloudinary video upload failed."
                  )
              );

              return;
            }

            resolve(
              result as CloudinaryVideoResult
            );
          }
        );

      Readable.from(
        buffer
      ).pipe(
        uploadStream
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| DELETE CLOUDINARY VIDEO
|--------------------------------------------------------------------------
*/

async function deleteVideo(
  publicId: string
) {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "video",

        invalidate:
          true,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_VIDEO_DELETE_ERROR:",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE POSTER URL
|--------------------------------------------------------------------------
*/

function createPosterUrl(
  publicId: string
) {
  if (!publicId) {
    return "";
  }

  try {
    return cloudinary.url(
      publicId,
      {
        secure:
          true,

        resource_type:
          "video",

        format:
          "jpg",

        transformation: [
          {
            start_offset:
              "0",

            quality:
              "auto",

            fetch_format:
              "auto",
          },
        ],
      }
    );
  } catch {
    return "";
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  let uploadedPublicId =
    "";

  try {
    /*
    |--------------------------------------------------------------------------
    | ADMIN PERMISSION
    |--------------------------------------------------------------------------
    */

    const permitted =
      await hasPermission(
        request
      );

    if (!permitted) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Permission denied.",
        },
        {
          status:
            403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FORM DATA
    |--------------------------------------------------------------------------
    */

    const formData =
      await request.formData();

    const videoValue =
      formData.get(
        "video"
      );

    if (
      !videoValue ||
      !(
        videoValue instanceof
        File
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Video file is required.",
        },
        {
          status:
            400,
        }
      );
    }

    const video =
      videoValue;

    /*
    |--------------------------------------------------------------------------
    | EMPTY FILE
    |--------------------------------------------------------------------------
    */

    if (
      video.size <= 0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Selected video file is empty.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FILE TYPE
    |--------------------------------------------------------------------------
    */

    if (
      !isAllowedVideo(
        video
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Only MP4, WEBM and MOV videos are allowed.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FILE SIZE
    |--------------------------------------------------------------------------
    */

    if (
      video.size >
      MAX_VIDEO_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            `Video size must be ${MAX_VIDEO_SIZE_MB} MB or less.`,
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CLOUDINARY UPLOAD
    |--------------------------------------------------------------------------
    */

    const result =
      await uploadVideoToCloudinary(
        video
      );

    const url =
      typeof result.secure_url ===
        "string"
        ? result.secure_url.trim()
        : "";

    const publicId =
      typeof result.public_id ===
        "string"
        ? result.public_id.trim()
        : "";

    uploadedPublicId =
      publicId;

    /*
    |--------------------------------------------------------------------------
    | VALID CLOUDINARY RESPONSE
    |--------------------------------------------------------------------------
    */

    if (
      !url ||
      !publicId
    ) {
      if (publicId) {
        await deleteVideo(
          publicId
        );
      }

      return NextResponse.json(
        {
          success:
            false,

          message:
            "Cloudinary did not return a valid video URL.",
        },
        {
          status:
            500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VIDEO DURATION
    |--------------------------------------------------------------------------
    */

    const duration =
      Number(
        result.duration
      );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Duration validation happens AFTER Cloudinary upload,
    | because Cloudinary reads the real video metadata.
    |
    | If duration cannot be detected,
    | delete uploaded video for safety.
    |
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isFinite(
        duration
      ) ||
      duration <= 0
    ) {
      await deleteVideo(
        publicId
      );

      uploadedPublicId =
        "";

      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unable to detect video duration. Please upload another video.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 30 SECOND LIMIT
    |--------------------------------------------------------------------------
    */

    if (
      duration >
      MAX_VIDEO_DURATION_SECONDS
    ) {
      await deleteVideo(
        publicId
      );

      uploadedPublicId =
        "";

      return NextResponse.json(
        {
          success:
            false,

          message:
            `Product reel must be ${MAX_VIDEO_DURATION_SECONDS} seconds or shorter. Your video is ${duration.toFixed(
              1
            )} seconds.`,
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | POSTER
    |--------------------------------------------------------------------------
    */

    const poster =
      createPosterUrl(
        publicId
      );

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Product reel uploaded successfully.",

        video: {
          enabled:
            true,

          url,

          publicId,

          duration:
            Number(
              duration.toFixed(
                2
              )
            ),

          poster,

          width:
            Number(
              result.width ??
                0
            ),

          height:
            Number(
              result.height ??
                0
            ),

          format:
            String(
              result.format ??
                ""
            ),

          bytes:
            Number(
              result.bytes ??
                video.size
            ),
        },
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_VIDEO_UPLOAD_ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    |
    | If something fails after upload,
    | remove orphan video from Cloudinary.
    |
    |--------------------------------------------------------------------------
    */

    if (
      uploadedPublicId
    ) {
      await deleteVideo(
        uploadedPublicId
      );
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to upload product reel.",
      },
      {
        status:
          500,
      }
    );
  }
}