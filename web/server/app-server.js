/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const next = require("next");
const { WebSocketServer } = require("ws");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

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

  const server = http.createServer((req, res) => handle(req, res));

  const wss = new WebSocketServer({ server, path: "/ws" });
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


