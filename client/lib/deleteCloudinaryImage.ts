import cloudinary from "@/lib/cloudinary";

/*
|--------------------------------------------------------------------------
| Extract Cloudinary Public ID From URL
|--------------------------------------------------------------------------
|
| Example:
|
| https://res.cloudinary.com/demo/image/upload/v123456789/
| homepage/hero/abc123.jpg
|
| Returns:
|
| homepage/hero/abc123
|
|--------------------------------------------------------------------------
*/

export function getCloudinaryPublicId(
  imageUrl: string
): string | null {
  try {
    if (!imageUrl) {
      return null;
    }

    const url = new URL(imageUrl);

    /*
    |--------------------------------------------------------------------------
    | Only process Cloudinary URLs
    |--------------------------------------------------------------------------
    */

    if (
      !url.hostname.includes(
        "res.cloudinary.com"
      )
    ) {
      return null;
    }

    const pathname =
      url.pathname.replace(/^\/+/, "");

    /*
    |--------------------------------------------------------------------------
    | Expected format:
    |
    | image/upload/[version/]public_id.ext
    |
    |--------------------------------------------------------------------------
    */

    const uploadIndex =
      pathname.indexOf(
        "/upload/"
      );

    if (uploadIndex === -1) {
      return null;
    }

    let publicPath =
      pathname.substring(
        uploadIndex + "/upload/".length
      );

    /*
    |--------------------------------------------------------------------------
    | Remove transformations
    |--------------------------------------------------------------------------
    */

    const pathParts =
      publicPath.split("/");

    while (
      pathParts.length > 0 &&
      (
        pathParts[0].includes("_") ||
        pathParts[0].includes(",") ||
        pathParts[0].startsWith("w_") ||
        pathParts[0].startsWith("h_") ||
        pathParts[0].startsWith("c_") ||
        pathParts[0].startsWith("q_") ||
        pathParts[0].startsWith("f_") ||
        pathParts[0].startsWith("dpr_") ||
        pathParts[0].startsWith("ar_") ||
        pathParts[0].startsWith("g_")
      )
    ) {
      pathParts.shift();
    }

    publicPath =
      pathParts.join("/");

    /*
    |--------------------------------------------------------------------------
    | Remove file extension
    |--------------------------------------------------------------------------
    */

    publicPath =
      publicPath.replace(
        /\.[^/.]+$/,
        ""
      );

    return publicPath || null;
  } catch (error) {
    console.error(
      "GET CLOUDINARY PUBLIC ID ERROR:",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Delete Cloudinary Image
|--------------------------------------------------------------------------
*/

export async function deleteCloudinaryImage(
  imageUrl: string
): Promise<boolean> {
  try {
    if (!imageUrl) {
      return true;
    }

    const publicId =
      getCloudinaryPublicId(
        imageUrl
      );

    /*
    |--------------------------------------------------------------------------
    | External image URL
    |--------------------------------------------------------------------------
    |
    | If image is not from Cloudinary,
    | there is nothing to delete.
    |
    |--------------------------------------------------------------------------
    */

    if (!publicId) {
      return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Asset
    |--------------------------------------------------------------------------
    */

    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image",
          type: "upload",
          invalidate: true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Cloudinary Responses
    |--------------------------------------------------------------------------
    |
    | "ok"      -> deleted
    | "not found" -> already deleted
    |
    |--------------------------------------------------------------------------
    */

    if (
      result.result === "ok" ||
      result.result === "not found"
    ) {
      return true;
    }

    console.warn(
      "CLOUDINARY DELETE RESULT:",
      result
    );

    return false;
  } catch (error) {
    console.error(
      "DELETE CLOUDINARY IMAGE ERROR:",
      error
    );

    return false;
  }
}