import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/utils/email.service";
import { PASSWORD_RESET_EXPIRY_MS } from "@/lib/config/constants";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  const tag = "[forgot-password]";

  try {
    const body = await req.json();
    const { email } = body;

    console.log(`${tag} Request received for email: ${email ?? "(none)"}`);

    if (!email) {
      console.warn(`${tag} Missing email in request body`);
      return errorResponse("Missing email", 400);
    }

    await connectDB();
    const user = await User.findOne({ email });
    const successMsg = "If an account with that email exists, we sent password reset instructions.";

    if (!user) {
      console.log(`${tag} No account found for email: ${email} — returning generic success`);
      return successResponse(null, successMsg);
    }

    console.log(`${tag} Account found (userId: ${user._id}) — generating reset token`);

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = expiry;
    await user.save();

    console.log(`${tag} Reset token saved, expiry: ${expiry.toISOString()} — sending email`);

    try {
      await sendPasswordResetEmail(email, rawToken, user.displayName);
      console.log(`${tag} Password reset email sent successfully to: ${email}`);
    } catch (emailErr: any) {
      console.error(`${tag} Failed to send password reset email to ${email}:`, emailErr?.message || emailErr);
      return errorResponse("Failed to send password reset email. Please try again later.", 502);
    }

    return successResponse(null, successMsg);
  } catch (err: any) {
    console.error(`${tag} Unexpected error:`, err?.message || err);
    return errorResponse(err.message || "Internal server error", 500);
  }
}
