import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { createHash } from "crypto";
import { successResponse, errorResponse } from "@/lib/utils/response";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return errorResponse("Missing token", 400);
    }

    await connectDB();
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpiry");

    if (!user) {
      return errorResponse("Invalid or expired verification token", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return successResponse(null, "Email verified successfully! You can now log in.");
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
