import React from "react";
import { T, META } from "../theme.js";
import Icon from "./Icon.jsx";

const HINTS = {
  twitch: "Live & keyless. Type a channel that's streaming now (e.g. xqc), or 'demo'.",
  kick: "Live via public Pusher socket. Type a channel slug (auto-resolved server-side) or a numeric id. Try 'demo'.",
  x: "Needs a backend relay (set X_MODE). Type 'demo' to preview the pipeline.",
};

const ERR_LIKE = (s) => s === "error" || s === "reconnecting";

export default function SourceCard({ platform, status, value, onChange, onToggle }) {
  const m = META[platform];
  const connected = status.state === "live";
  const statusColor = connected ? T.ok : ERR_LIKE(status.state) ? T.err : T.dim;
  const statusText = status.detail || status.state;

  const placeholder =
    platform === "kick" ? "channel or id  (e.g. trainwreckstv)"
    : platform === "x" ? "channel  (relay required)"
    : "channel  (e.g. xqc)";

  return (
    <div style={{
      background: T.panel, border: `1px solid ${connected ? m.border : T.line}`, borderRadius: 14,
      padding: "12px 12px 11px", display: "flex", flexDirection: "column", gap: 9,
      boxShadow: connected ? `0 0 0 1px ${m.faint},0 0 26px -12px ${m.glow}` : "none",
      transition: "border-color .25s, box-shadow .25s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: m.faint, display: "grid", placeItems: "center" }}>
          <Icon p={platform} size={platform === "x" ? 12 : 14} />
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, color: platform === "x" ? T.text : m.color }}>{m.label}</span>
        <span style={{
          marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: ".5px",
          textTransform: "uppercase", color: statusColor, maxWidth: 140, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{statusText}</span>
      </div>

      <input
        className="oc-input"
        style={{
          background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, color: T.text,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, padding: "8px 10px", width: "100%",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        placeholder={placeholder}
      />

      <button
        className="oc-btn" onClick={onToggle}
        style={{
          border: connected ? `1px solid ${T.line}` : "none", borderRadius: 8, padding: 8,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: ".5px",
          textTransform: "uppercase", cursor: "pointer",
          background: connected ? "transparent" : m.color,
          color: connected ? T.muted : platform === "twitch" ? "#fff" : "#0a0805",
        }}>
        {connected || status.state === "connecting" ? "Disconnect" : "Connect"}
      </button>

      <p style={{ fontSize: 10.5, color: T.dim, lineHeight: 1.45, fontFamily: "'JetBrains Mono',monospace" }}>
        {HINTS[platform]}
      </p>
    </div>
  );
}
