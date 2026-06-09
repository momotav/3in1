import { createTwitchSource } from "./sources/twitch.js";
import { createKickSource } from "./sources/kick.js";
import { createXSource } from "./sources/x.js";
import { createDemoSource } from "./sources/demo.js";

const FACTORIES = { twitch: createTwitchSource, kick: createKickSource, x: createXSource };

let messageId = 0;

/**
 * Turn whatever the user typed into a clean channel/slug/query.
 * Accepts bare names AND full stream links:
 *   twitch.tv/xqc                -> xqc
 *   twitch.tv/popout/xqc/chat    -> xqc
 *   kick.com/trainwreckstv       -> trainwreckstv
 *   x.com/ansem | twitter.com/.. -> @ansem        (mentions search)
 *   "$SOL" / "from:ansem"        -> passed through unchanged (X query)
 */
export function normalizeChannel(platform, raw) {
  let s = String(raw || "").trim();
  if (!s || s.toLowerCase() === "demo") return s.toLowerCase();

  if (platform === "twitch") {
    const m = s.match(/twitch\.tv\/(?:popout\/)?([^/?#]+)/i);
    if (m) s = m[1];
    return s.replace(/^#/, "").toLowerCase();
  }

  if (platform === "kick") {
    const m = s.match(/kick\.com\/([^/?#]+)/i);
    if (m) s = m[1];
    return s.toLowerCase();
  }

  if (platform === "x") {
    const m = s.match(/(?:x|twitter)\.com\/([^/?#]+)/i);
    if (m) {
      const seg = m[1];
      if (!["i", "home", "search", "explore", "hashtag", "messages"].includes(seg.toLowerCase())) {
        return "@" + seg.replace(/^@/, "").toLowerCase();
      }
    }
    return s;
  }
  return s;
}

export class Hub {
  constructor() {
    this.rooms = new Map();
  }

  key(platform, channel) {
    return `${platform}:${String(channel).toLowerCase()}`;
  }

  join(client, platform, channel) {
    if (!FACTORIES[platform] || !channel) return;
    channel = normalizeChannel(platform, channel);
    if (!channel) return;
    const key = this.key(platform, channel);
    let room = this.rooms.get(key);

    if (!room) {
      room = { clients: new Set(), status: { state: "connecting" }, source: null, platform, channel };
      this.rooms.set(key, room);

      const emit = (user, text, extra) => {
        if (!text) return;
        this.broadcast(room, {
          type: "message", id: ++messageId, platform, channel,
          user, text, ts: Date.now(), ...(extra || {}),
        });
      };
      const status = (state, detail) => {
        room.status = { state, detail };
        this.broadcast(room, { type: "status", platform, channel, state, detail });
      };

      const isDemo = String(channel).toLowerCase() === "demo";
      room.source = isDemo
        ? createDemoSource({ platform, emit, status })
        : FACTORIES[platform]({ channel, emit, status });
    }

    room.clients.add(client);
    this.send(client, { type: "status", platform, channel, ...room.status });
  }

  leave(client, platform, channel) {
    channel = normalizeChannel(platform, channel);
    const room = this.rooms.get(this.key(platform, channel));
    if (!room) return;
    room.clients.delete(client);
    this.send(client, { type: "status", platform, channel, state: "offline" });
    if (room.clients.size === 0) this.closeRoom(this.key(platform, channel));
  }

  drop(client) {
    for (const [key, room] of this.rooms) {
      if (room.clients.delete(client) && room.clients.size === 0) this.closeRoom(key);
    }
  }

  closeRoom(key) {
    const room = this.rooms.get(key);
    if (!room) return;
    try { room.source && room.source.close(); } catch (_) {}
    this.rooms.delete(key);
  }

  broadcast(room, msg) {
    const data = JSON.stringify(msg);
    for (const c of room.clients) if (c.readyState === 1) c.send(data);
  }

  send(client, msg) {
    if (client.readyState === 1) client.send(JSON.stringify(msg));
  }

  stats() {
    return {
      rooms: this.rooms.size,
      connections: [...this.rooms.values()].reduce((n, r) => n + r.clients.size, 0),
    };
  }
}
