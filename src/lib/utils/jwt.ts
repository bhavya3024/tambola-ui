import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { env } from "../config/env";
import { DEFAULT_EXPIRY_SECONDS } from "../config/constants";
import { NextRequest } from "next/server";
import { User, IUser } from "../models/user.model";
import { connectDB } from "../db";

function parseExpirySeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return DEFAULT_EXPIRY_SECONDS;
  const val = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return val;
    case "m": return val * 60;
    case "h": return val * 3600;
    case "d": return val * 86400;
    default: return DEFAULT_EXPIRY_SECONDS;
  }
}

export function signAccessToken(payload: { sub: string; username: string }) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: parseExpirySeconds(env.JWT_EXPIRY),
  });
}

export function signRefreshToken(payload: { sub: string }) {
  return jwt.sign(payload, env.REFRESH_SECRET, {
    expiresIn: parseExpirySeconds(env.REFRESH_EXPIRY),
  });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET) as { sub: string; username: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, env.REFRESH_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 2,
    });
  } catch (e) {
    console.error("Argon2 error fallback:", e);
    // Fallback if native module fails
    const crypto = await import("crypto");
    return "$scrypt$" + crypto.scryptSync(password, "salt", 64).toString("hex");
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (hash.startsWith("$argon2")) {
      return await argon2.verify(hash, password);
    }
    if (hash.startsWith("$scrypt$")) {
      const crypto = await import("crypto");
      const derived = crypto.scryptSync(password, "salt", 64).toString("hex");
      return hash === "$scrypt$" + derived;
    }
    return false;
  } catch (e) {
    console.error("Verify password error:", e);
    return false;
  }
}

export async function getAuthUser(req: NextRequest): Promise<IUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return null;
  }

  await connectDB();
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    return null;
  }
  return user;
}
