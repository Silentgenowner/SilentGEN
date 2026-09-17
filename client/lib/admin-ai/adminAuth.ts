import jwt, {
  type JwtPayload,
} from "jsonwebtoken";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import Admin from "@/models/Admin";

import {
  isAdminRole,
  type AdminRole,
} from "@/lib/admin-ai/adminPermissions";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN AI AUTH
|--------------------------------------------------------------------------
|
| Central authentication layer for Admin AI.
|
| Security flow:
|
| adminToken cookie
|      ↓
| JWT signature verification
|      ↓
| extract admin id
|      ↓
| load current Admin from MongoDB
|      ↓
| verify active account
|      ↓
| use CURRENT database role
|
| IMPORTANT:
|
| - Never trust role from the AI model.
| - Never trust role from request body.
| - Never trust a stale role from JWT when DB has changed.
| - Current database Admin record is authoritative.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| COOKIE NAME
|--------------------------------------------------------------------------
*/

export const ADMIN_AUTH_COOKIE_NAME =
  "adminToken";

/*
|--------------------------------------------------------------------------
| JWT PAYLOAD
|--------------------------------------------------------------------------
|
| Supports common payload keys so this layer remains compatible with the
| existing SilentGEN admin authentication token.
|
|--------------------------------------------------------------------------
*/

type AdminTokenPayload =
  JwtPayload & {
    id?:
      string;

    adminId?:
      string;

    _id?:
      string;

    userId?:
      string;

    email?:
      string;

    role?:
      string;
  };

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ADMIN
|--------------------------------------------------------------------------
*/

export type AuthenticatedAdminAIUser = {
  id:
    string;

  name:
    string;

  email:
    string;

  role:
    AdminRole;

  isActive:
    boolean;
};

/*
|--------------------------------------------------------------------------
| AUTH RESULT
|--------------------------------------------------------------------------
*/

export type AdminAIAuthResult =
  | {
      success:
        true;

      status:
        200;

      message:
        string;

      admin:
        AuthenticatedAdminAIUser;
    }
  | {
      success:
        false;

      status:
        401 | 403 | 500;

      message:
        string;

      admin:
        null;
    };

/*
|--------------------------------------------------------------------------
| COOKIE SOURCE
|--------------------------------------------------------------------------
*/

type CookieReader = {
  get:
    (
      name:
        string
    ) =>
      | {
          value:
            string;
        }
      | undefined;
};

/*
|--------------------------------------------------------------------------
| REQUEST-LIKE SOURCE
|--------------------------------------------------------------------------
*/

type AdminAuthRequestLike = {
  cookies?:
    CookieReader;

  headers?:
    Headers | {
      get:
        (
          name:
            string
        ) =>
          string | null;
    };
};

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength =
    500
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maxLength
    );
}

/*
|--------------------------------------------------------------------------
| GET JWT SECRET
|--------------------------------------------------------------------------
|
| Supports the likely existing SilentGEN environment names.
|
| Recommended:
|
| ADMIN_JWT_SECRET=...
|
| Existing projects using JWT_SECRET remain compatible.
|
|--------------------------------------------------------------------------
*/

function getAdminJWTSecret() {
  const secret =
    cleanString(
      process.env
        .ADMIN_JWT_SECRET,
      5000
    ) ||
    cleanString(
      process.env
        .JWT_SECRET,
      5000
    );

  if (
    !secret
  ) {
    throw new Error(
      "ADMIN_JWT_SECRET or JWT_SECRET is not configured."
    );
  }

  return secret;
}

/*
|--------------------------------------------------------------------------
| EXTRACT TOKEN FROM COOKIE HEADER
|--------------------------------------------------------------------------
*/

function getCookieFromHeader(
  cookieHeader:
    string,
  cookieName:
    string
) {
  const cookies =
    cookieHeader.split(
      ";"
    );

  for (
    const cookie of
    cookies
  ) {
    const separatorIndex =
      cookie.indexOf(
        "="
      );

    if (
      separatorIndex <
      0
    ) {
      continue;
    }

    const name =
      cookie
        .slice(
          0,
          separatorIndex
        )
        .trim();

    if (
      name !==
      cookieName
    ) {
      continue;
    }

    const value =
      cookie
        .slice(
          separatorIndex +
            1
        )
        .trim();

    if (
      !value
    ) {
      return "";
    }

    try {
      return decodeURIComponent(
        value
      );
    } catch {
      return value;
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET ADMIN TOKEN FROM REQUEST
|--------------------------------------------------------------------------
*/

export function getAdminTokenFromRequest(
  request:
    AdminAuthRequestLike
) {
  /*
  |--------------------------------------------------------------------------
  | NEXTREQUEST COOKIE API
  |--------------------------------------------------------------------------
  */

  const cookieToken =
    request.cookies?.get(
      ADMIN_AUTH_COOKIE_NAME
    )?.value;

  if (
    typeof cookieToken ===
      "string" &&
    cookieToken.trim()
  ) {
    return cookieToken.trim();
  }

  /*
  |--------------------------------------------------------------------------
  | RAW COOKIE HEADER FALLBACK
  |--------------------------------------------------------------------------
  */

  const cookieHeader =
    request.headers?.get(
      "cookie"
    );

  if (
    cookieHeader
  ) {
    return getCookieFromHeader(
      cookieHeader,
      ADMIN_AUTH_COOKIE_NAME
    );
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| VERIFY JWT
|--------------------------------------------------------------------------
*/

export function verifyAdminToken(
  token:
    string
):
  AdminTokenPayload | null {
  const cleanToken =
    cleanString(
      token,
      10_000
    );

  if (
    !cleanToken
  ) {
    return null;
  }

  try {
    const decoded =
      jwt.verify(
        cleanToken,
        getAdminJWTSecret()
      );

    if (
      !decoded ||
      typeof decoded !==
        "object"
    ) {
      return null;
    }

    return decoded as
      AdminTokenPayload;
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET ADMIN ID FROM TOKEN
|--------------------------------------------------------------------------
*/

function getAdminIdFromPayload(
  payload:
    AdminTokenPayload
) {
  const candidates = [
    payload.adminId,
    payload.id,
    payload._id,
    payload.userId,
    payload.sub,
  ];

  for (
    const candidate of
    candidates
  ) {
    const value =
      cleanString(
        candidate,
        100
      );

    if (
      value &&
      mongoose.Types.ObjectId.isValid(
        value
      )
    ) {
      return value;
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET ADMIN EMAIL FROM TOKEN
|--------------------------------------------------------------------------
|
| Used only as a compatibility fallback if an older token does not contain
| MongoDB admin id.
|
|--------------------------------------------------------------------------
*/

function getAdminEmailFromPayload(
  payload:
    AdminTokenPayload
) {
  const email =
    cleanString(
      payload.email,
      320
    )
      .toLowerCase();

  return email;
}

/*
|--------------------------------------------------------------------------
| SERIALIZE AUTHENTICATED ADMIN
|--------------------------------------------------------------------------
*/

function serializeAdmin(
  admin:
    any
):
  AuthenticatedAdminAIUser | null {
  const id =
    cleanString(
      admin?._id
        ? String(
            admin._id
          )
        : "",
      100
    );

  if (
    !id ||
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {
    return null;
  }

  const role =
    admin?.role;

  if (
    !isAdminRole(
      role
    )
  ) {
    return null;
  }

  return {
    id,

    name:
      cleanString(
        admin?.name,
        200
      ),

    email:
      cleanString(
        admin?.email,
        320
      ).toLowerCase(),

    role,

    isActive:
      admin?.isActive !==
      false,
  };
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATE TOKEN
|--------------------------------------------------------------------------
|
| This function verifies:
|
| - JWT signature
| - token identity
| - current DB admin
| - current role
| - active status
|
|--------------------------------------------------------------------------
*/

export async function authenticateAdminAIToken(
  token:
    string
):
  Promise<
    AdminAIAuthResult
  > {
  try {
    const payload =
      verifyAdminToken(
        token
      );

    if (
      !payload
    ) {
      return {
        success:
          false,

        status:
          401,

        message:
          "Invalid or expired admin authentication token.",

        admin:
          null,
      };
    }

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | PREFER OBJECT ID
    |--------------------------------------------------------------------------
    */

    const adminId =
      getAdminIdFromPayload(
        payload
      );

    let admin:
      any =
      null;

    if (
      adminId
    ) {
      admin =
        await Admin.findById(
          adminId
        )
          .select(
            [
              "_id",
              "name",
              "email",
              "role",
              "isActive",
            ].join(
              " "
            )
          )
          .lean();
    }

    /*
    |--------------------------------------------------------------------------
    | LEGACY EMAIL FALLBACK
    |--------------------------------------------------------------------------
    |
    | Useful if an existing SilentGEN token contains email but not admin id.
    |
    |--------------------------------------------------------------------------
    */

    if (
      !admin
    ) {
      const email =
        getAdminEmailFromPayload(
          payload
        );

      if (
        email
      ) {
        admin =
          await Admin.findOne(
            {
              email,
            }
          )
            .select(
              [
                "_id",
                "name",
                "email",
                "role",
                "isActive",
              ].join(
                " "
              )
            )
            .lean();
      }
    }

    if (
      !admin
    ) {
      return {
        success:
          false,

        status:
          401,

        message:
          "Admin account was not found.",

        admin:
          null,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT DB ROLE
    |--------------------------------------------------------------------------
    |
    | Do NOT use payload.role as authority.
    |
    |--------------------------------------------------------------------------
    */

    const authenticated =
      serializeAdmin(
        admin
      );

    if (
      !authenticated
    ) {
      return {
        success:
          false,

        status:
          403,

        message:
          "Admin account has an unsupported role.",

        admin:
          null,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE STATUS
    |--------------------------------------------------------------------------
    */

    if (
      !authenticated.isActive
    ) {
      return {
        success:
          false,

        status:
          403,

        message:
          "Admin account is inactive.",

        admin:
          null,
      };
    }

    return {
      success:
        true,

      status:
        200,

      message:
        "Admin authenticated successfully.",

      admin:
        authenticated,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI authentication error:",
      error
    );

    return {
      success:
        false,

      status:
        500,

      message:
        "Unable to authenticate Admin AI request.",

      admin:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATE REQUEST
|--------------------------------------------------------------------------
|
| Main helper for:
|
| app/api/admin/ai/chat/route.ts
|
|--------------------------------------------------------------------------
*/

export async function authenticateAdminAIRequest(
  request:
    AdminAuthRequestLike
):
  Promise<
    AdminAIAuthResult
  > {
  const token =
    getAdminTokenFromRequest(
      request
    );

  if (
    !token
  ) {
    return {
      success:
        false,

      status:
        401,

      message:
        "Admin authentication is required.",

      admin:
        null,
    };
  }

  return authenticateAdminAIToken(
    token
  );
}

/*
|--------------------------------------------------------------------------
| REQUIRE AUTHENTICATED ADMIN
|--------------------------------------------------------------------------
|
| Useful in internal server functions where throwing is preferable.
|
|--------------------------------------------------------------------------
*/

export async function requireAuthenticatedAdminAI(
  request:
    AdminAuthRequestLike
) {
  const result =
    await authenticateAdminAIRequest(
      request
    );

  if (
    !result.success
  ) {
    throw new AdminAIAuthenticationError(
      result.message,
      result.status
    );
  }

  return result.admin;
}

/*
|--------------------------------------------------------------------------
| AUTH ERROR
|--------------------------------------------------------------------------
*/

export class AdminAIAuthenticationError
  extends Error {
  status:
    401 | 403 | 500;

  constructor(
    message:
      string,
    status:
      401 | 403 | 500
  ) {
    super(
      message
    );

    this.name =
      "AdminAIAuthenticationError";

    this.status =
      status;
  }
}

/*
|--------------------------------------------------------------------------
| CHECK OWN ADMIN ID
|--------------------------------------------------------------------------
|
| Defence-in-depth helper.
|
|--------------------------------------------------------------------------
*/

export function authenticatedAdminMatches(
  admin:
    AuthenticatedAdminAIUser,
  adminId:
    unknown
) {
  const requestedId =
    cleanString(
      adminId,
      100
    );

  if (
    !requestedId ||
    !mongoose.Types.ObjectId.isValid(
      requestedId
    )
  ) {
    return false;
  }

  return (
    admin.id ===
    requestedId
  );
}

/*
|--------------------------------------------------------------------------
| ROLE HELPER
|--------------------------------------------------------------------------
*/

export function getAuthenticatedAdminRole(
  admin:
    AuthenticatedAdminAIUser
):
  AdminRole {
  return admin.role;
}

/*
|--------------------------------------------------------------------------
| ADMIN AI EXECUTION CONTEXT
|--------------------------------------------------------------------------
|
| Creates trusted server-side context for adminToolExecutor.
|
| Never build this context from client supplied adminId/role.
|
|--------------------------------------------------------------------------
*/

export function buildAdminAIExecutionContext({
  admin,
  conversationId,
  messageId,
  requestId,
}: {
  admin:
    AuthenticatedAdminAIUser;

  conversationId?:
    string | null;

  messageId?:
    string | null;

  requestId?:
    string | null;
}) {
  return {
    adminId:
      admin.id,

    adminRole:
      admin.role,

    conversationId:
      conversationId &&
      mongoose.Types.ObjectId.isValid(
        conversationId
      )
        ? conversationId
        : null,

    messageId:
      messageId &&
      mongoose.Types.ObjectId.isValid(
        messageId
      )
        ? messageId
        : null,

    requestId:
      cleanString(
        requestId,
        200
      ) ||
      null,
  };
}