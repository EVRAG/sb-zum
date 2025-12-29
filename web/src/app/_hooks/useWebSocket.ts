"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "connecting" | "open" | "closed";

type RuntimeEnv = Partial<{
  NEXT_PUBLIC_WS_URL: string;
  NEXT_PUBLIC_API_URL: string;
}>;

function getRuntimeEnv(): RuntimeEnv {
  if (typeof window === "undefined") return {};
  return (((window as unknown as { __RUNTIME_ENV__?: RuntimeEnv }).__RUNTIME_ENV__ as RuntimeEnv) || {});
}

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  useEffect(() => {
    let stopped = false;

    const clearTimers = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (pingTimer.current) {
        clearInterval(pingTimer.current);
        pingTimer.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer.current) return;
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, 2000);
    };

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus("connecting");

      ws.addEventListener("open", () => {
        setStatus("open");
        // Periodic ping to keep idle connections alive behind proxies/load balancers
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));
          }
        }, 15000);
      });

      ws.addEventListener("close", () => {
        setStatus("closed");
        clearTimers();
        if (!stopped) scheduleReconnect();
      });

      ws.addEventListener("error", () => {
        setStatus("closed");
        ws.close();
      });

      ws.addEventListener("message", (event) => {
        try {
          setLastMessage(JSON.parse(event.data));
        } catch {
          setLastMessage(event.data);
        }
      });
    };

    connect();

    return () => {
      stopped = true;
      clearTimers();
      wsRef.current?.close();
    };
  }, [url]);

  const sendJson = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return { status, lastMessage, sendJson };
}

export function getDefaultWsUrl() {
  const env = getRuntimeEnv();
  if (env.NEXT_PUBLIC_WS_URL) return env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }
  return "ws://localhost:3000/ws";
}

export function getDefaultApiUrl() {
  const env = getRuntimeEnv();
  if (env.NEXT_PUBLIC_API_URL) return env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}