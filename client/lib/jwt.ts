import jwt from "jsonwebtoken";

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "Missing JWT_SECRET. Add it to your environment or .env.local. See .env.example for the expected format."
    );
  }

  return jwtSecret;
}



export function createToken(payload: any) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
