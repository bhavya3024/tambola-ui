/**
 * Configuration for Next.js fullstack app.
 * Since frontend and backend live in the same Next.js server, API base is relative.
 */

export const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "");
export const WS_URL = API_URL;
