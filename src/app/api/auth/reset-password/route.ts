import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { createHash } from "crypto";
import { hashPassword } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return errorResponse("Missing token or password", 400);
    }

    await connectDB();
    const hashedToken = createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpiry");

    if (!user) {
      return errorResponse("Invalid or expired password reset token", 400);
    }

    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshToken = undefined;
    await user.save();

    return successResponse(null, "Password reset successful! You can now log in with your new password.");
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
