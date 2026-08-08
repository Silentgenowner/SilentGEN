import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { verifyAdminToken } from "@/lib/adminAuth";

const allowedRoles = ["super_admin", "product_manager"] as const;

export async function POST(request: NextRequest) {
  try {
    // --------------------------
    // Admin Authentication
    // --------------------------

    const token = request.cookies.get("adminToken")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const payload = await verifyAdminToken(token);

    if (
      !payload.adminId ||
      !payload.role ||
      !allowedRoles.includes(
        payload.role as (typeof allowedRoles)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------
    // Read FormData
    // --------------------------

    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file selected",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------
    // Validate Type
    // --------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
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

    // --------------------------
    // Validate Size (5 MB)
    // --------------------------

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum file size is 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------
    // Convert Buffer
    // --------------------------

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    // --------------------------
    // Upload Cloudinary
    // --------------------------

    const uploadResult = await new Promise<any>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "SilentGEN/products",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(buffer);
      }
    );

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });

  } catch (error) {
    console.error("UPLOAD_IMAGE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Image upload failed.",
      },
      {
        status: 500,
      }
    );
  }
}
