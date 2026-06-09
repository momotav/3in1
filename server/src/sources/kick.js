import WebSocket from "ws";
import { Impit } from "impit";

const PUSHER_URL =
  "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false";

const impit = new Impit({ browser: "chrome" });

async function lookupChatroomId(slug) {
  const url = `https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`;
  const res = await impit.fetch(url);
  const body = await res.text();

  if (!res.ok) {
    console.error(`[kick] lookup "${slug}" -> HTTP ${res.status}; body[0:200]=${body.slice(0, 200)}`);
    throw new Error("HTTP " + res.status);
  }
  let data;
  try { data = JSON.parse(body); }
  catch {
    console.error(`[kick] lookup "${slug}" -> non-JSON (likely Cloudflare challenge); body[0:200]=${body.slice(0, 200)}`);
    throw new Error("non-JSON response");
  }
  const id = data?.chatroom?.id;
  if (!id) {
    console.error(`[kick] lookup "${slug}" -> no chatroom.id; top-level keys=[${Object.keys(data || {}).join(", ")}]`);
    throw new Error("no chatroom id");
  }
  console.log(`[kick] lookup "${slug}" -> chatroom id ${id}`);
  return id;
}

export function createKickSource({ channel, emit, status }) {
  let ws = null, closed = false, reconnectTimer = null, roomId = null;

  async function resolve() {
    if (/^\d+$/.test(channel)) return channel;
    return await lookupChatroomId(channel);
  }

  async function connect() {
    status("connecting");
    try {
      if (!roomId) roomId = await resolve();
    } catch (e) {
      console.error(`[kick] connect failed for "${channel}":`, e?.message || e);
      status("error", "lookup failed (" + (e.message || "unknown") + ")");
      return;
    }

    ws = new WebSocket(PUSHER_URL);
    ws.on("open", () => {
      ws.send(JSON.stringify({ event: "pusher:subscribe", data: { auth: "", channel: `chatrooms.${roomId}.v2` } }));
      status("live", "room " + roomId);
    });
    ws.on("message", (data) => {
      try {
        const frame = JSON.parse(data.toString());
        if (frame.event && frame.event.includes("ChatMessageEvent")) {
          const d = JSON.parse(frame.data);
          emit(d?.sender?.username || "kick_user", d?.content || "");
        }
      } catch (_) {}
    });
    ws.on("close", () => { if (closed) status("offline"); else scheduleReconnect(); });
    ws.on("error", () => status("error"));
  }

  function scheduleReconnect() { status("reconnecting"); reconnectTimer = setTimeout(connect, 3000); }
  connect();
  return { close() { closed = true; clearTimeout(reconnectTimer); try { ws && ws.close(); } catch (_) {} } };
}
