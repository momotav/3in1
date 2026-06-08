import WebSocket from "ws";

/**
 * X (Twitter) live source.
 *
 * There is no keyless feed for X, so this is an adapter. Pick a mode via env:
 *
 *   X_MODE=twitterapi   poll twitterapi.io's advanced_search for tweets matching
 *                       a query. The channel you type in the UI IS the query, e.g.
 *                       "@ansem"  ·  "from:ansem"  ·  "to:ansem"  ·  "$SOL"
 *                       Needs:  X_API_KEY=<your twitterapi.io key>
 *                       Optional: X_POLL_MS=10000 (how often to poll, ms)
 *
 *   X_MODE=relay        connect to your own upstream ws that emits {user,text}.
 *                       Needs: X_RELAY_URL
 *
 *   X_MODE=off          (default) reports "not configured"; use the `demo` channel.
 *
 * Note: the hub pools by (platform,channel), so one query = one poller no matter
 * how many viewers are watching — you don't pay per viewer.
 */
export function createXSource({ channel, emit, status }) {
  const mode = process.env.X_MODE || "off";
  if (mode === "twitterapi") return twitterApiSource({ channel, emit, status });
  if (mode === "relay") return relaySource({ channel, emit, status });
  status("error", "not configured (set X_MODE)");
  return { close() {} };
}

/* ---------------- twitterapi.io (advanced_search polling) ---------------- */
function twitterApiSource({ channel, emit, status }) {
  const key = process.env.X_API_KEY;
  if (!key) { status("error", "X_API_KEY not set"); return { close() {} }; }

  const query = String(channel).trim();
  const intervalMs = Number(process.env.X_POLL_MS) || 10000;

  let timer = null;
  let closed = false;
  let primed = false;           // first poll seeds dedupe set without flooding old tweets
  const seen = new Set();
  const order = [];             // ids in insertion order, to cap memory

  function remember(id) {
    seen.add(id); order.push(id);
    if (order.length > 800) seen.delete(order.shift());
  }

  async function poll() {
    if (closed) return;
    try {
      const url =
        "https://api.twitterapi.io/twitter/tweet/advanced_search?" +
        new URLSearchParams({ query, queryType: "Latest" });
      const res = await fetch(url, { headers: { "X-API-Key": key } });

      if (res.status === 401) { status("error", "bad api key"); return; }
      if (res.status === 429) { if (primed) status("live", "rate-limited"); return; }
      if (!res.ok) { status("error", "http " + res.status); return; }

      const data = await res.json();
      const tweets = Array.isArray(data.tweets) ? data.tweets : [];
      // API returns newest-first; reverse so we emit chronologically
      const fresh = tweets.filter((t) => t && t.id && !seen.has(t.id)).reverse();

      for (const t of fresh) {
        remember(t.id);
        if (primed) {
          const user = t.author?.userName || "x_user";
          const text = (t.text || "").replace(/\s+/g, " ").trim();
          if (text) emit(user, text);
        }
      }

      if (!primed) { primed = true; status("live", query); }
    } catch (_) {
      status("error", "network");
    }
  }

  status("connecting");
  poll();
  timer = setInterval(poll, intervalMs);

  return { close() { closed = true; clearInterval(timer); status("offline"); } };
}

/* ---------------- generic relay (your own upstream) ---------------- */
function relaySource({ emit, status }) {
  const url = process.env.X_RELAY_URL;
  if (!url) { status("error", "X_RELAY_URL not set"); return { close() {} }; }

  let ws = null, closed = false, timer = null;
  function connect() {
    status("connecting");
    ws = new WebSocket(url);
    ws.on("open", () => status("live", "relay"));
    ws.on("message", (d) => {
      try { const m = JSON.parse(d.toString()); emit(m.user || "x_user", m.text || ""); } catch (_) {}
    });
    ws.on("close", () => { if (closed) status("offline"); else { status("reconnecting"); timer = setTimeout(connect, 3000); } });
    ws.on("error", () => status("error"));
  }
  connect();
  return { close() { closed = true; clearTimeout(timer); try { ws && ws.close(); } catch (_) {} } };
}
