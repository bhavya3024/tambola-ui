import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user.model";
import { hashPassword } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { sendVerificationEmail } from "@/lib/utils/email.service";
import { EMAIL_VERIFICATION_EXPIRY_MS } from "@/lib/config/constants";
import { randomBytes, createHash } from "crypto";

function generateVerificationToken(): { raw: string; hashed: string } {
  const raw = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, displayName } = body;

    if (!username || !email || !password || !displayName) {
      return errorResponse("Missing required fields", 400);
    }

    await connectDB();

    const userWithEmail = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpiry"
    );
    const userWithUsername = await User.findOne({ username });

    if (userWithEmail) {
      if (userWithEmail.isEmailVerified) {
        return errorResponse("Email already registered", 409);
      }

      if (userWithUsername && userWithUsername._id.toString() !== userWithEmail._id.toString()) {
        return errorResponse("Username already taken", 409);
      }

      const hashedPassword = await hashPassword(password);
      const { raw: verifyToken, hashed: hashedVerifyToken } = generateVerificationToken();
      const verifyExpiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

      userWithEmail.username = username;
      userWithEmail.password = hashedPassword;
      userWithEmail.displayName = displayName;
      userWithEmail.emailVerificationToken = hashedVerifyToken;
      userWithEmail.emailVerificationExpiry = verifyExpiry;
      userWithEmail.refreshToken = undefined;
      userWithEmail.passwordResetToken = undefined;
      userWithEmail.passwordResetExpiry = undefined;

      await userWithEmail.save();

      sendVerificationEmail(email, verifyToken, displayName).catch((err) => {
        console.error("Failed to send verification email:", err);
      });

      return successResponse(
        { email: userWithEmail.email, username: userWithEmail.username },
        "Registration successful! Please check your email to verify your account.",
        200
      );
    }

    if (userWithUsername) {
      return errorResponse("Username already taken", 409);
    }

    const hashedPassword = await hashPassword(password);
    const { raw: verifyToken, hashed: hashedVerifyToken } = generateVerificationToken();
    const verifyExpiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      displayName,
      isEmailVerified: false,
      emailVerificationToken: hashedVerifyToken,
      emailVerificationExpiry: verifyExpiry,
    });

    sendVerificationEmail(email, verifyToken, displayName).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return successResponse(
      { email: user.email, username: user.username },
      "Registration successful! Please check your email to verify your account.",
      201
    );
  } catch (err: any) {
    console.error("Register error:", err);
    return errorResponse(err.message || "Internal server error", 500);
  }
}
