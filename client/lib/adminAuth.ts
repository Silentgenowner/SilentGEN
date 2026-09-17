import {
  SignJWT,
  jwtVerify,
} from "jose";

import type {
  AdminRole,
} from "@/models/Admin";

/*
|--------------------------------------------------------------------------
| ADMIN JWT SECRET
|--------------------------------------------------------------------------
*/

function getAdminJwtSecret(): string {
  const jwtSecret =
    process.env.ADMIN_JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "Missing ADMIN_JWT_SECRET. Add it to your environment or .env.local."
    );
  }

  return jwtSecret;
}

/*
|--------------------------------------------------------------------------
| ADMIN TOKEN PAYLOAD
|--------------------------------------------------------------------------
*/

export type AdminTokenPayload = {
  adminId: string;
  email: string;
  role: AdminRole;
};

/*
|--------------------------------------------------------------------------
| CREATE ADMIN TOKEN
|--------------------------------------------------------------------------
*/

export async function createAdminToken(
  payload: AdminTokenPayload
): Promise<string> {
  const secretKey =
    new TextEncoder().encode(
      getAdminJwtSecret()
    );

  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(
      payload.adminId
    )
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/*
|--------------------------------------------------------------------------
| VERIFY ADMIN TOKEN
|--------------------------------------------------------------------------
*/

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload> {
  if (
    !token ||
    typeof token !== "string"
  ) {
    throw new Error(
      "Invalid admin token."
    );
  }

  const secretKey =
    new TextEncoder().encode(
      getAdminJwtSecret()
    );

  let payload;

  try {
    const result =
      await jwtVerify(
        token,
        secretKey,
        {
          algorithms: ["HS256"],
        }
      );

    payload =
      result.payload;
  } catch (error) {
    console.error(
      "ADMIN_TOKEN_VERIFY_ERROR:",
      error
    );

    throw new Error(
      "Invalid or expired admin token."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN ID
  |--------------------------------------------------------------------------
  */

  if (
    !payload.sub ||
    typeof payload.sub !==
      "string"
  ) {
    throw new Error(
      "Admin token does not contain adminId."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EMAIL
  |--------------------------------------------------------------------------
  */

  if (
    typeof payload.email !==
    "string" ||
    !payload.email.trim()
  ) {
    throw new Error(
      "Admin token does not contain email."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ROLE
  |--------------------------------------------------------------------------
  */

  if (
    typeof payload.role !==
    "string" ||
    !payload.role.trim()
  ) {
    throw new Error(
      "Admin token does not contain role."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RETURN ADMIN
  |--------------------------------------------------------------------------
  */

  return {
    adminId:
      payload.sub,

    email:
      payload.email,

    role:
      payload.role as AdminRole,
  };
}