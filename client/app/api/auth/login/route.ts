import { NextRequest } from "next/server";

import { POST as verifyOtpPost } from "../verify-otp/route";

export async function POST(req: NextRequest) {
  return verifyOtpPost(req);
}
