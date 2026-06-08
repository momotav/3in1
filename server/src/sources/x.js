import WebSocket from "ws";

/**
 * X (Twitter) live chat.
 *
 * There is NO keyless browser/server path to an X video broadcast's live chat.
 * The official API exposes posts (paid, from $200/mo) and does not surface the
 * in-player live comments at all. So this source is an ADAPTER you point at your
 * own upstream:
 *
 *   X_MODE=relay  + X_RELAY_URL=wss://your-ingest/...   (your scraper/worker pushes
 *                                                         {user,text} JSON frames)
 *   X_MODE=off    (default) -> reports "not configured"; use the `demo` channel to preview.
 *
 * Wire your paid-API or scraper worker to emit JSON frames: {"user":"...","text":"..."}
 */
export function createXSource({ channel, emit, status }) {
  const mode = process.env.X_MODE || "off";

  if (mode === "relay") {
    const url = process.env.X_RELAY_URL;
    if (!url) { status("error", "X_RELAY_URL not set"); return { close() {} }; }

    let ws = null, closed = false, timer = null;
    function connect() {
      status("connecting");
      ws = new WebSocket(url);
      ws.on("open", () => status("live", "relay"));
      ws.on("message", (data) => {
        try { const d = JSON.parse(data.toString()); emit(d.user || "x_user", d.text || ""); } catch (_) {}
      });
      ws.on("close", () => { if (closed) status("offline"); else { status("reconnecting"); timer = setTimeout(connect, 3000); } });
      ws.on("error", () => status("error"));
    }
    connect();
    return { close() { closed = true; clearTimeout(timer); try { ws && ws.close(); } catch (_) {} } };
  }

  // Not configured. Frontend can still show the source; live data needs a relay.
  status("error", "not configured (set X_MODE)");
  return { close() {} };
}
