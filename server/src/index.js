import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import "dotenv/config";
import { Hub } from "./hub.js";

const app = express();
const hub = new Hub();

app.get("/health", (_req, res) => res.json({ ok: true, ...hub.stats() }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

/**
 * Client protocol (JSON frames):
 *   client -> server:  { op: "join",  platform, channel }
 *                      { op: "leave", platform, channel }
 *   server -> client:  { type: "hello" }
 *                      { type: "status",  platform, channel, state, detail }
 *                      { type: "message", id, platform, channel, user, text, ts }
 */
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (raw) => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return; }
    if (m.op === "join") hub.join(ws, m.platform, m.channel);
    else if (m.op === "leave") hub.leave(ws, m.platform, m.channel);
  });

  ws.on("close", () => hub.drop(ws));
  ws.send(JSON.stringify({ type: "hello", ts: Date.now() }));
});

// Heartbeat: drop dead clients so their rooms get released.
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
wss.on("close", () => clearInterval(heartbeat));

const PORT = process.env.PORT || 8787;
server.listen(PORT, () => console.log(`[omnichat] server listening on :${PORT}`));
