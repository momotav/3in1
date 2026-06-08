import WebSocket from "ws";

/**
 * Twitch live chat — keyless, with rich metadata.
 *
 * Reads chat over Twitch's anonymous IRC-over-WebSocket (no API key). The
 * `twitch.tv/tags` capability means every message arrives with metadata:
 *   • color        the chatter's username color
 *   • emotes       positions + ids of Twitch emotes in the text
 *   • badges       e.g. subscriber/12, moderator/1
 *
 * Emotes and color need NO credentials. Badge *images* need a Twitch app
 * (client id + secret, no user login). If TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET
 * are set, we resolve badge artwork; otherwise badges are simply omitted.
 *
 * emit(user, text, { color, badges, fragments })
 */
export function createTwitchSource({ channel, emit, status }) {
  const ch = channel.toLowerCase().replace(/^#/, "");
  let ws = null, closed = false, reconnectTimer = null;
  let badgeMap = null; // "set/version" -> image url, when creds present

  // Best-effort badge artwork (optional, never blocks chat).
  resolveBadges(ch).then((map) => { badgeMap = map; }).catch(() => {});

  function connect() {
    status("connecting");
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    ws.on("open", () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + Math.floor(Math.random() * 99999));
      ws.send("JOIN #" + ch);
      status("live", "#" + ch);
    });

    ws.on("message", (data) => {
      for (const line of data.toString().split("\r\n")) {
        if (!line) continue;
        if (line.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); continue; }
        if (!line.includes("PRIVMSG")) continue;

        const tags = line.startsWith("@") ? parseTags(line.slice(1, line.indexOf(" "))) : {};
        const m = line.match(/:(\w+)!.*PRIVMSG #[^ ]+ :(.*)$/);
        if (!m) continue;

        const user = tags["display-name"] || m[1];
        const text = m[2].replace(/\r?\n$/, "");
        emit(user, text, {
          color: tags.color || null,
          badges: resolveBadgeList(tags.badges, badgeMap),
          fragments: buildFragments(text, tags.emotes),
        });
      }
    });

    ws.on("close", () => { if (closed) status("offline"); else scheduleReconnect(); });
    ws.on("error", () => status("error"));
  }

  function scheduleReconnect() { status("reconnecting"); reconnectTimer = setTimeout(connect, 3000); }
  connect();

  return { close() { closed = true; clearTimeout(reconnectTimer); try { ws && ws.close(); } catch (_) {} } };
}

/* ---------------- IRC tag parsing ---------------- */
function parseTags(raw) {
  const out = {};
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    const k = i === -1 ? part : part.slice(0, i);
    const v = i === -1 ? "" : part.slice(i + 1);
    out[k] = v.replace(/\\s/g, " ").replace(/\\:/g, ";").replace(/\\\\/g, "\\");
  }
  return out;
}

/**
 * Split message text into text/emote fragments using the `emotes` tag.
 * emotes tag: "25:0-4,12-16/1902:6-10" (id:start-end ranges, code-point indices).
 */
function buildFragments(text, emotesTag) {
  if (!emotesTag) return [{ type: "text", text }];
  const cps = Array.from(text); // code-point array (Twitch indices are code points)
  const spans = [];
  for (const group of emotesTag.split("/")) {
    const [id, ranges] = group.split(":");
    if (!ranges) continue;
    for (const r of ranges.split(",")) {
      const [s, e] = r.split("-").map(Number);
      if (Number.isInteger(s) && Number.isInteger(e)) spans.push({ start: s, end: e, id });
    }
  }
  if (spans.length === 0) return [{ type: "text", text }];
  spans.sort((a, b) => a.start - b.start);

  const frags = [];
  let cursor = 0;
  for (const sp of spans) {
    if (sp.start > cursor) frags.push({ type: "text", text: cps.slice(cursor, sp.start).join("") });
    frags.push({ type: "emote", id: sp.id, text: cps.slice(sp.start, sp.end + 1).join("") });
    cursor = sp.end + 1;
  }
  if (cursor < cps.length) frags.push({ type: "text", text: cps.slice(cursor).join("") });
  return frags;
}

function resolveBadgeList(badgesTag, map) {
  if (!badgesTag) return [];
  return badgesTag.split(",").map((b) => {
    const [set, version] = b.split("/");
    const url = map ? map[`${set}/${version}`] || map[`${set}/1`] : null;
    return { title: set, url: url || null };
  }).filter((b) => b.url); // only badges we have artwork for
}

/* ---------------- optional badge artwork (client-credentials, no user login) ---------------- */
async function resolveBadges(login) {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) return null;

  const tokRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
  });
  if (!tokRes.ok) return null;
  const token = (await tokRes.json()).access_token;
  const h = { "Client-Id": id, Authorization: "Bearer " + token };

  const map = {};
  const ingest = (sets) => {
    for (const s of sets || []) for (const v of s.versions || []) {
      map[`${s.set_id}/${v.id}`] = v.image_url_2x || v.image_url_1x;
    }
  };

  // global badges
  const g = await fetch("https://api.twitch.tv/helix/chat/badges/global", { headers: h });
  if (g.ok) ingest((await g.json()).data);

  // channel badges (subscriber tiers, bits, etc.)
  const u = await fetch("https://api.twitch.tv/helix/users?login=" + encodeURIComponent(login), { headers: h });
  if (u.ok) {
    const bid = (await u.json()).data?.[0]?.id;
    if (bid) {
      const c = await fetch("https://api.twitch.tv/helix/chat/badges?broadcaster_id=" + bid, { headers: h });
      if (c.ok) ingest((await c.json()).data);
    }
  }
  return map;
}
