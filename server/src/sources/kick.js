import WebSocket from "ws";
import { Impit } from "impit";

/**
 * Kick live chat — paste a name OR a link, it just works.
 *
 * Kick's chat is a public Pusher socket (keyless). The only hard part is turning
 * a channel slug into the numeric chatroom id, because that endpoint sits behind
 * Cloudflare, which fingerprints the TLS handshake — a normal server request gets
 * a 403. `impit` mimics Chrome's TLS fingerprint, so the lookup goes through from
 * the server, no manual id needed. (A bare numeric id is still accepted and skips
 * the lookup entirely.)
 */
const PUSHER_URL =
  "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false";

const impit = new Impit({ browser: "chrome" });

async function lookupChatroomId(slug) {
  const res = await impit.fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const id = data?.chatroom?.id;
  if (!id) throw new Error("no chatroom id");
  return id;
}

export function createKickSource({ channel, emit, status }) {
  let ws = null, closed = false, reconnectTimer = null, roomId = null;

  async function resolve() {
    if (/^\d+$/.test(channel)) return channel; // numeric id passed directly
    return await lookupChatroomId(channel);     // slug/link -> chatroom id (Cloudflare-safe)
  }

  async function connect() {
    status("connecting");
    try {
      if (!roomId) roomId = await resolve();
    } catch (e) {
      status("error", "lookup failed (" + (e.message || "unknown") + ")");
      return;
    }

    ws = new WebSocket(PUSHER_URL);

    ws.on("open", () => {
      ws.send(JSON.stringify({
        event: "pusher:subscribe",
        data: { auth: "", channel: `chatrooms.${roomId}.v2` },
      }));
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

  return {
    close() {
      closed = true;
      clearTimeout(reconnectTimer);
      try { ws && ws.close(); } catch (_) {}
    },
  };
}
