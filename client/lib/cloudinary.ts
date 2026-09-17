import { v2 as cloudinary } from "cloudinary";

/*
|--------------------------------------------------------------------------
| CLOUDINARY CONFIGURATION
|--------------------------------------------------------------------------
|
| Required environment variables:
|
| CLOUDINARY_CLOUD_NAME
| CLOUDINARY_API_KEY
| CLOUDINARY_API_SECRET
|
|--------------------------------------------------------------------------
*/

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME;

const apiKey =
  process.env.CLOUDINARY_API_KEY;

const apiSecret =
  process.env.CLOUDINARY_API_SECRET;

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

if (
  !cloudName ||
  !apiKey ||
  !apiSecret
) {
  console.warn(
    "Cloudinary environment variables are not fully configured."
  );
}

/*
|--------------------------------------------------------------------------
| CONFIGURE CLOUDINARY
|--------------------------------------------------------------------------
*/

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default cloudinary;