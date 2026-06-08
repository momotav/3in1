import { createTwitchSource } from "./sources/twitch.js";
import { createKickSource } from "./sources/kick.js";
import { createXSource } from "./sources/x.js";
import { createDemoSource } from "./sources/demo.js";

const FACTORIES = { twitch: createTwitchSource, kick: createKickSource, x: createXSource };

let messageId = 0;

/**
 * The Hub owns all upstream platform connections and multiplexes them to
 * frontend clients. Connections are pooled and ref-counted by (platform,channel):
 * the first client to join a channel opens the upstream socket, the last to
 * leave closes it. This keeps us off per-viewer rate limits and CORS.
 */
export class Hub {
  constructor() {
    this.rooms = new Map(); // key -> { source, clients:Set, status, platform, channel }
  }

  key(platform, channel) {
    return `${platform}:${String(channel).toLowerCase()}`;
  }

  join(client, platform, channel) {
    if (!FACTORIES[platform] || !channel) return;
    const key = this.key(platform, channel);
    let room = this.rooms.get(key);

    if (!room) {
      room = { clients: new Set(), status: { state: "connecting" }, source: null, platform, channel };
      this.rooms.set(key, room);

      // `extra` is optional rich metadata (Twitch supplies { color, badges, fragments }).
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
