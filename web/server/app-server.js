/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const next = require("next");
const { WebSocketServer } = require("ws");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

function getRuntimeEnv() {
  // Keep the allow-list explicit: only safe-to-expose vars
  return {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  };
}

// In-memory admin config (no persistence)
const adminConfig = {
  showPrintButton: true,
};

function broadcast(wss, message, exclude) {
  const data = typeof message === "string" ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === 1) {
      client.send(data);
    }
  });
}

async function main() {
  const app = next({ dev: false, hostname: HOSTNAME, port: PORT });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => {
    // Runtime public env for client-side (without rebuild)
    if (req.url === "/runtime-env.js") {
      const env = getRuntimeEnv();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.end(`window.__RUNTIME_ENV__ = ${JSON.stringify(env)};`);
      return;
    }

    // Admin config API (very simple, no auth)
    if (req.url.startsWith("/api/admin/config")) {
      if (req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store, max-age=0");
        res.end(JSON.stringify(adminConfig));
        return;
      }
      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 1e6) req.destroy(); // basic guard
        });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body || "{}");
            if (typeof parsed.showPrintButton === "boolean") {
              adminConfig.showPrintButton = parsed.showPrintButton;
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "no-store, max-age=0");
            res.end(JSON.stringify(adminConfig));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "invalid JSON" }));
          }
        });
        return;
      }
    }

    return handle(req, res);
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  // Keep idle connections alive (e.g., behind proxies with idle timeouts)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.ping();
      }
    });
  }, 20000);

  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
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
        // Broadcast to other clients
        broadcast(
          wss,
          { type: "event", from: ip, payload: parsed, ts: Date.now() },
          ws,
        );
      } catch {
        // ignore invalid json
      }
    });
  });

  server.listen(PORT, HOSTNAME, () => {
    console.log(`[app] listening on http://${HOSTNAME}:${PORT}`);
    console.log(`[ws] listening on ws://${HOSTNAME}:${PORT}/ws`);
  });

  process.on("SIGINT", () => {
    clearInterval(heartbeatInterval);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


