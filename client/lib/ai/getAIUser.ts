import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/*
|--------------------------------------------------------------------------
| JWT PAYLOAD
|--------------------------------------------------------------------------
*/

type UserTokenPayload = {
  id?: string;

  userId?: string;

  _id?: string;

  role?: string;

  mobile?: string;

  email?: string;

  iat?: number;

  exp?: number;
};

/*
|--------------------------------------------------------------------------
| GET OPTIONAL USER
|--------------------------------------------------------------------------
|
| AI works for:
|
| - Logged in customers
| - Guest customers
|
| So invalid/missing token does NOT throw.
|
*/

export function getOptionalAIUserId(
  request: NextRequest
): string | null {
  try {
    const token =
      request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    const secret =
      process.env.JWT_SECRET?.trim();

    if (!secret) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      secret
    ) as UserTokenPayload;

    const userId =
      decoded.userId ||
      decoded.id ||
      decoded._id;

    if (!userId) {
      return null;
    }

    return String(userId);
  } catch {
    return null;
  }
}