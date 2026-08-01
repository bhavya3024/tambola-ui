import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    return successResponse(null, "Logged out successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
