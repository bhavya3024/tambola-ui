import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    return successResponse({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        stats: user.stats,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
