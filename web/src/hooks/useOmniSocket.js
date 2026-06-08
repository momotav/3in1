import { useEffect, useRef, useState, useCallback } from "react";
import { PLATFORMS } from "../theme.js";

const MAX = 250;

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;

const initialStatus = () =>
  Object.fromEntries(PLATFORMS.map((p) => [p, { state: "offline", detail: "", channel: "" }]));

/**
 * Owns the single WebSocket to the backend gateway. Exposes the live message
 * stream, per-platform status, and join/leave actions. Auto-reconnects.
 */
export function useOmniSocket() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(initialStatus);
  const [online, setOnline] = useState(false);

  const ws = useRef(null);
  const idc = useRef(0);
  const outbox = useRef([]); // frames queued while socket is opening
  const active = useRef({}); // platform -> channel currently joined (for resubscribe)
  const stamps = useRef([]);

  const send = useCallback((frame) => {
    const sock = ws.current;
    if (sock && sock.readyState === 1) sock.send(JSON.stringify(frame));
    else outbox.current.push(frame);
  }, []);

  useEffect(() => {
    let closedByUs = false;
    let reconnectTimer = null;

    function connect() {
      const sock = new WebSocket(WS_URL);
      ws.current = sock;

      sock.onopen = () => {
        setOnline(true);
        outbox.current.forEach((f) => sock.send(JSON.stringify(f)));
        outbox.current = [];
        // Re-join anything that was active before a reconnect.
        Object.entries(active.current).forEach(([platform, channel]) =>
          channel && sock.send(JSON.stringify({ op: "join", platform, channel }))
        );
      };

      sock.onmessage = (e) => {
        let m;
        try { m = JSON.parse(e.data); } catch { return; }
        if (m.type === "message") {
          stamps.current.push(Date.now());
          setMessages((prev) => {
            const next = [...prev, { id: ++idc.current, platform: m.platform, user: m.user, text: m.text }];
            return next.length > MAX ? next.slice(-MAX) : next;
          });
        } else if (m.type === "status") {
          setStatus((s) => ({ ...s, [m.platform]: { state: m.state, detail: m.detail || "", channel: m.channel || "" } }));
        }
      };

      sock.onclose = () => {
        setOnline(false);
        if (!closedByUs) reconnectTimer = setTimeout(connect, 2000);
      };
      sock.onerror = () => sock.close();
    }

    connect();
    return () => { closedByUs = true; clearTimeout(reconnectTimer); ws.current && ws.current.close(); };
  }, []);

  const join = useCallback((platform, channel) => {
    active.current[platform] = channel;
    setStatus((s) => ({ ...s, [platform]: { state: "connecting", detail: "", channel } }));
    send({ op: "join", platform, channel });
  }, [send]);

  const leave = useCallback((platform) => {
    const channel = active.current[platform];
    if (channel) send({ op: "leave", platform, channel });
    active.current[platform] = "";
    setStatus((s) => ({ ...s, [platform]: { state: "offline", detail: "", channel: "" } }));
  }, [send]);

  const ratePerMin = useRate(stamps);
  const clear = useCallback(() => { setMessages([]); stamps.current = []; }, []);

  return { messages, status, online, join, leave, clear, ratePerMin };
}

function useRate(stamps) {
  const [rate, setRate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      const cut = Date.now() - 60000;
      stamps.current = stamps.current.filter((s) => s > cut);
      setRate(stamps.current.length);
    }, 1500);
    return () => clearInterval(t);
  }, [stamps]);
  return rate;
}
