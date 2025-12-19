/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const WebSocket = require("ws");

// IMPORTANT:
// - Next.js uses PORT (usually 3000)
// - WebSocket server must use its own WS_PORT (default 3001) to avoid conflicts
const PORT = process.env.WS_PORT || 3001;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

function broadcast(message, exclude) {
  const data = typeof message === "string" ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[ws] client connected from ${ip}`);

  ws.send(
    JSON.stringify({
      type: "server_ready",
      ts: Date.now(),
      message: "WebSocket server online",
    }),
  );

  ws.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      console.log("[ws] message", parsed);
      broadcast({ type: "event", from: ip, payload: parsed, ts: Date.now() }, ws);
    } catch (err) {
      console.error("[ws] failed to parse message", err);
    }
  });

  ws.on("close", () => {
    console.log("[ws] client disconnected", ip);
  });

  ws.on("error", (err) => {
    console.error("[ws] client error", err);
  });
});

// Basic heartbeat to keep connections alive
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  });
}, 20000);

server.listen(PORT, () => {
  console.log(`[ws] server listening on ws://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  clearInterval(heartbeatInterval);
  server.close(() => {
    console.log("[ws] server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  clearInterval(heartbeatInterval);
  server.close(() => {
    console.log("[ws] server closed");
    process.exit(0);
  });
});

