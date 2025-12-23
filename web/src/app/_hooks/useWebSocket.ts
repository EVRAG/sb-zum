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
  const [status, setStatus] = useState<Status>("connecting");
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.addEventListener("open", () => setStatus("open"));
    ws.addEventListener("close", () => setStatus("closed"));
    ws.addEventListener("error", () => setStatus("closed"));
    ws.addEventListener("message", (event) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        setLastMessage(event.data);
      }
    });

    return () => {
      ws.close();
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