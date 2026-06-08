# OmniChat

A unified live chat aggregator for **Twitch + Kick + X**. One feed, one socket,
every message tagged by platform — the thing in the mockup.

```
┌──────────────┐   wss   ┌───────────────────────────┐
│  React (web) │ ──────▶ │  Node gateway (server)    │
│  one socket  │ ◀────── │  ref-counted source pool  │
└──────────────┘ unified └───────────┬───────────────┘
                                      │ outbound, server-side
              ┌───────────────────────┼────────────────────────┐
              ▼                        ▼                         ▼
        Twitch IRC/WSS          Kick Pusher WSS            X relay/API
        (anonymous,            (slug→id lookup +          (your worker;
         keyless)               public socket)             paid, see below)
```

The browser never talks to Twitch/Kick/X directly. The gateway owns those
connections, normalizes every message to one shape, and fans them out. This
sidesteps CORS, does Kick's Cloudflare-protected channel-id lookup server-side,
and pools connections so 1,000 viewers of the same channel share one upstream
socket instead of opening 1,000.

## Quick start

```bash
npm install          # installs both workspaces
cp .env.example .env
npm run dev          # server :8787  +  web :5173
```

Open http://localhost:5173 and hit **Demo** to see all three platforms stream
through the real pipeline. For live data, type a channel into a source card:

- **Twitch** — any live channel, e.g. `xqc`. Keyless, works immediately.
- **Kick** — a channel slug (e.g. `trainwreckstv`) or a numeric chatroom id.
- **X** — needs a relay (see below); use `demo` to preview.

## Layout

```
omnichat/
├── server/                 Node gateway (Express + ws)
│   └── src/
│       ├── index.js        HTTP /health + WebSocket /ws
│       ├── hub.js          ref-counted (platform,channel) connection pool
│       └── sources/        twitch.js · kick.js · x.js · demo.js
└── web/                    Vite + React client
    └── src/
        ├── App.jsx
        ├── hooks/useOmniSocket.js   single socket, join/leave, reconnect
        └── components/             Header · SourceCard · Toolbar · MessageRow
```

## Client ↔ server protocol

```jsonc
// client → server
{ "op": "join",  "platform": "twitch", "channel": "xqc" }
{ "op": "leave", "platform": "twitch", "channel": "xqc" }

// server → client
{ "type": "status",  "platform": "kick", "channel": "...", "state": "live", "detail": "room 668" }
{ "type": "message", "id": 42, "platform": "twitch", "user": "user67", "text": "Ansem is cooking", "ts": 0 }
```

## Platform notes (the honest part)

| Platform | Read access | Effort | Cost |
|---|---|---|---|
| **Twitch** | Anonymous IRC-over-WSS | trivial | free |
| **Kick** | Public Pusher socket; slug→id needs a server request | low | free |
| **X** | No keyless path to live broadcast chat | high | paid API or scraper |

- **Kick** chat is not stored after a stream ends — you only capture messages
  while connected. If the slug→id lookup fails (Cloudflare can block datacenter
  IPs), pass a numeric chatroom id directly (DevTools → Network → `channels`).
- **X** has no official live-broadcast-chat endpoint. Run your own worker
  (paid X API, from ~$200/mo, or a scraper) that emits `{"user","text"}` JSON
  frames, then set `X_MODE=relay` and `X_RELAY_URL`. The adapter is in
  `server/src/sources/x.js`.

## Deploy

- **Backend:** `docker build -t omnichat . && docker run -p 8787:8787 --env-file .env omnichat`
  (or any Node host). It's a stateful WebSocket service — use sticky sessions if
  you run multiple instances behind a load balancer.
- **Frontend:** `npm run build` → static `web/dist/` to any CDN. Set
  `VITE_WS_URL=wss://your-gateway/ws` at build time.

## Roadmap ideas

Moderation/feature-on-overlay, TTS, cross-post replies, YouTube/Rumble sources
(same adapter interface — add a file in `sources/` and register it in `hub.js`),
emote rendering, persistence.
