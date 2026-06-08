import WebSocket from "ws";

/**
 * Twitch live chat — anonymous, keyless.
 * Connects to Twitch's public IRC-over-WebSocket endpoint as a `justinfan`
 * read-only user. No API key, no OAuth required for reading chat.
 */
export function createTwitchSource({ channel, emit, status }) {
  const ch = channel.toLowerCase().replace(/^#/, "");
  let ws = null;
  let closed = false;
  let reconnectTimer = null;

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
      const text = data.toString();
      for (const line of text.split("\r\n")) {
        if (!line) continue;
        if (line.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); continue; }
        if (line.includes("PRIVMSG")) {
          let display = null;
          if (line.startsWith("@")) {
            for (const tag of line.slice(1, line.indexOf(" ")).split(";")) {
              const [k, v] = tag.split("=");
              if (k === "display-name" && v) display = v;
            }
          }
          const m = line.match(/:(\w+)!.*PRIVMSG #[^ ]+ :(.*)$/);
          if (m) emit(display || m[1], m[2].trim());
        }
      }
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
