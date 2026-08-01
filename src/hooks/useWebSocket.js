import { useEffect, useRef, useState, useCallback } from "react";
import { API_URL } from "../config";

/**
 * Real-time gameplay hook using Server-Sent Events (SSE) stream & HTTP Action endpoints.
 * Compatible with Next.js App Router serverless & standard node deployments.
 */
export function useWebSocket(gameCode, token, onMessage) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!gameCode || !token) return;

    const streamUrl = `${API_URL}/api/games/${gameCode}/stream?token=${token}`;

    try {
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
        console.log(`🔌 SSE connected to game ${gameCode}`);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      es.onerror = (err) => {
        console.error("SSE connection error:", err);
        setConnected(false);
        setError("Connection error");
      };
    } catch (err) {
      setError("Failed to connect");
      console.error("SSE connection failed:", err);
    }
  }, [gameCode, token]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback(
    async (data) => {
      try {
        const res = await fetch(`${API_URL}/api/games/${gameCode}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) {
          onMessageRef.current?.({
            type: "error",
            data: { message: resData.message || "Action failed" },
          });
        }
      } catch (err) {
        console.error("Failed to send action:", err);
      }
    },
    [gameCode, token]
  );

  return { send, connected, error };
}
