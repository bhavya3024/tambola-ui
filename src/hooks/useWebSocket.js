import { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebSocket hook for real-time game communication.
 * Connects to /ws/game/:code?token=<JWT>
 *
 * @param {string} gameCode - The game room code
 * @param {string} token - JWT access token
 * @param {function} onMessage - Callback for incoming messages
 * @returns {{ send, connected, error }}
 */
export function useWebSocket(gameCode, token, onMessage) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref current
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!gameCode || !token) return;

    // Determine ws/wss based on current protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/game/${gameCode}?token=${token}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        console.log(`🔌 WebSocket connected to game ${gameCode}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("Connection error");
      };

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;

        // Auto-reconnect if not a clean close
        if (event.code !== 1000 && event.code !== 1001) {
          console.log("🔄 Reconnecting in 3s...");
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      setError("Failed to connect");
      console.error("WebSocket connection failed:", err);
    }
  }, [gameCode, token]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Send a message
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected, cannot send:", data);
    }
  }, []);

  return { send, connected, error };
}
