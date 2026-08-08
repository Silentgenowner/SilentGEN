import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@/models/Admin";

function getAdminJwtSecret() {
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "Missing ADMIN_JWT_SECRET. Add it to your environment or .env.local. See .env.example for the expected format."
    );
  }

  return jwtSecret;
}

export type AdminTokenPayload = {
  adminId: string;
  email: string;
  role: AdminRole;
};

export async function createAdminToken(payload: AdminTokenPayload) {
  const secretKey = new TextEncoder().encode(getAdminJwtSecret());

  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAdminToken(token: string) {
  const secretKey = new TextEncoder().encode(getAdminJwtSecret());
  const { payload } = await jwtVerify(token, secretKey);

  return {
    adminId: payload.sub,
    email: payload.email as string | undefined,
    role: payload.role as AdminRole | undefined,
  };
}
