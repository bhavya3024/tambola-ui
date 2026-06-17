/**
 * Central configuration — reads from Vite env variables.
 *
 * VITE_API_URL should be the full backend origin, e.g.:
 *   - Local:      http://localhost:3000
 *   - Production: https://api.example.com
 *
 * All API helpers derive their base URLs from this single value.
 */

// Strip trailing slash if present
const raw = import.meta.env.VITE_API_URL || "";
export const API_URL = raw.replace(/\/+$/, "");

// WebSocket URL: http→ws, https→wss
export const WS_URL = API_URL.replace(/^http/, "ws");
