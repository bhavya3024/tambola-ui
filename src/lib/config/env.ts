import {
  DEFAULT_PORT,
  DEFAULT_MONGODB_URI,
  DEFAULT_JWT_EXPIRY,
  DEFAULT_REFRESH_EXPIRY,
  DEFAULT_FRONTEND_URL,
  SMTP,
} from "./constants";

export const env = {
  PORT: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
  MONGODB_URI: process.env.MONGODB_URI || DEFAULT_MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || "tambola-super-secret-key-change-in-production",
  JWT_EXPIRY: process.env.JWT_EXPIRY || DEFAULT_JWT_EXPIRY,
  REFRESH_SECRET: process.env.REFRESH_SECRET || "tambola-refresh-secret-key-change-in-production",
  REFRESH_EXPIRY: process.env.REFRESH_EXPIRY || DEFAULT_REFRESH_EXPIRY,

  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || String(SMTP.DEFAULT_PORT), 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || SMTP.DEFAULT_FROM,

  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL,
} as const;
