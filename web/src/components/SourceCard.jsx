import React from "react";
import { T, META } from "../theme.js";
import Icon from "./Icon.jsx";

const HINTS = {
  twitch: "Paste a channel link or name — twitch.tv/xqc or just xqc.",
  kick: "Paste a channel link or name — kick.com/yourchannel.",
  x: "Paste a profile link, @handle, or any search like $SOL.",
};

const ERR_LIKE = (s) => s === "error" || s === "reconnecting";

export default function SourceCard({ platform, status, value, onChange, onToggle }) {
  const m = META[platform];
  const connected = status.state === "live";
  const statusColor = connected ? T.ok : ERR_LIKE(status.state) ? T.err : T.dim;

  return (
    <div style={{
      background: T.panel, border: `1px solid ${connected ? m.border : T.line}`, borderRadius: 4,
      padding: "15px 16px 13px", display: "flex", flexDirection: "column", gap: 11,
      boxShadow: connected ? `0 2px 14px -6px ${m.glow}` : "0 1px 3px rgba(31,29,24,.04)",
      transition: "border-color .25s, box-shadow .25s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon p={platform} size={platform === "x" ? 13 : 15} />
        <span style={{
          fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 17, color: m.color,
        }}>{m.label}</span>
        <span className="caps" style={{
          marginLeft: "auto", fontSize: 8.5, color: statusColor,
          maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{status.detail || status.state}</span>
      </div>

      <input
        className="oc-input"
        style={{
          background: "transparent", border: "none", borderBottom: `1px solid ${T.line}`,
          color: T.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5,
          padding: "7px 1px", width: "100%",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        placeholder={platform === "twitch" ? "twitch.tv/…  or channel name" : platform === "kick" ? "kick.com/…  or channel name" : "x.com/…  or search query"}
      />

      <button
        className="oc-btn caps" onClick={onToggle}
        style={{
          border: `1px solid ${T.text}`, borderRadius: 3, padding: "8px 10px 7px",
          fontSize: 10, fontWeight: 700,
          background: connected ? "transparent" : T.text,
          color: connected ? T.text : T.bg,
        }}>
        {connected || status.state === "connecting" ? "Disconnect" : "Connect"}
      </button>

      <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, fontStyle: "italic" }}>
        {HINTS[platform]}
      </p>
    </div>
  );
}
