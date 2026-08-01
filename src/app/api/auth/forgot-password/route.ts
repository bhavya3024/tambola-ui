import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/utils/email.service";
import { PASSWORD_RESET_EXPIRY_MS } from "@/lib/config/constants";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return errorResponse("Missing email", 400);
    }

    await connectDB();
    const user = await User.findOne({ email });
    const successMsg = "If an account with that email exists, we sent password reset instructions.";

    if (!user) {
      return successResponse(null, successMsg);
    }

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = expiry;
    await user.save();

    sendPasswordResetEmail(email, rawToken, user.displayName).catch((err) => {
      console.error("Failed to send reset email:", err);
    });

    return successResponse(null, successMsg);
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
