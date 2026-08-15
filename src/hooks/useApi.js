import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useApi() {
  const { getAccessToken, showToast } = useAuth();

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const token = getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const fullUrl = url.startsWith("/api")
        ? url
        : `/api${url.startsWith("/") ? "" : "/"}${url}`;

      try {
        const res = await fetch(fullUrl, { ...options, headers });
        const data = await res.json();

        if (!res.ok && data.message) {
          showToast(data.message, "error");
        }

        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        showToast("Network error. Please try again.", "error");
        return { ok: false, status: 0, data: null };
      }
    },
    [getAccessToken, showToast]
  );

  const get = useCallback((url) => apiFetch(url), [apiFetch]);

  const post = useCallback(
    (url, body) =>
      apiFetch(url, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    [apiFetch]
  );

  return { get, post, apiFetch };
}
