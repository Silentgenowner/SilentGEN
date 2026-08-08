import { NextRequest } from "next/server";

import { GET as getProfile, PUT as updateProfile } from "../user/profile/route";

export async function GET(req: NextRequest) {
  return getProfile(req);
}

export async function PUT(req: NextRequest) {
  return updateProfile(req);
}
