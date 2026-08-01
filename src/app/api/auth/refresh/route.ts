import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse("Missing refresh token", 400);
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || !payload.sub) {
      return errorResponse("Invalid refresh token", 401);
    }

    await connectDB();
    const user = await User.findById(payload.sub).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return errorResponse("Invalid or revoked refresh token", 401);
    }

    const newAccessToken = signAccessToken({ sub: user._id.toString(), username: user.username });
    const newRefreshToken = signRefreshToken({ sub: user._id.toString() });

    user.refreshToken = newRefreshToken;
    await user.save();

    return successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
