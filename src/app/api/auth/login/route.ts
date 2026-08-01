import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const loginValue = body.email || body.login;
    const password = body.password;

    if (!loginValue || !password) {
      return errorResponse("Missing email/username or password", 400);
    }

    await connectDB();

    const user = await User.findOne({
      $or: [
        { email: loginValue.toLowerCase() },
        { username: loginValue.toLowerCase() },
      ],
    }).select("+password +refreshToken +isEmailVerified");

    if (!user) {
      return errorResponse("Invalid credentials", 401);
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return errorResponse("Invalid credentials", 401);
    }

    if (!user.isEmailVerified) {
      return errorResponse("Please verify your email address before logging in", 403);
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), username: user.username });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    user.refreshToken = refreshToken;
    await user.save();

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          stats: user.stats,
        },
      },
      "Login successful"
    );
  } catch (err: any) {
    console.error("Login error:", err);
    return errorResponse(err.message || "Internal server error", 500);
  }
}
