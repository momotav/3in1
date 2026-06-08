import WebSocket from "ws";

/**
 * Kick live chat.
 * Kick's chat rides a public Pusher app (the same one kick.com uses in-browser).
 * Reading is keyless. The one thing that needs a server is resolving a channel
 * SLUG (e.g. "trainwreckstv") -> numeric chatroom id, because that REST endpoint
 * sits behind Cloudflare and blocks browser CORS. We do it here with a
 * browser-like request. You can also pass a numeric id directly to skip lookup.
 */
const PUSHER_URL =
  "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

async function lookupChatroomId(slug) {
  const res = await fetch(
    `https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`,
    { headers: BROWSER_HEADERS }
  );
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const id = data?.chatroom?.id;
  if (!id) throw new Error("no chatroom in response");
  return id;
}

export function createKickSource({ channel, emit, status }) {
  let ws = null;
  let closed = false;
  let reconnectTimer = null;
  let roomId = null;

  async function resolve() {
    if (/^\d+$/.test(channel)) return channel;
    return await lookupChatroomId(channel);
  }

  async function connect() {
    status("connecting");
    try {
      if (!roomId) roomId = await resolve();
    } catch (e) {
      status("error", "lookup failed — try numeric id (Cloudflare may block server IP)");
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

  function scheduleReconnect() {
    status("reconnecting");
    reconnectTimer = setTimeout(connect, 3000);
  }

  connect();

  return {
    close() {
      closed = true;
      clearTimeout(reconnectTimer);
      try { ws && ws.close(); } catch (_) {}
    },
  };
}
