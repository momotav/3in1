import React from "react";
import { T, META } from "../theme.js";
import Icon from "./Icon.jsx";

const emoteUrl = (platform, id) =>
  platform === "kick"
    ? `https://files.kick.com/emotes/${id}/fullsize`
    : `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`;

// Fallback: parse Kick-style [emote:id:name] tokens out of raw text,
// so emotes render even if the backend didn't pre-split them into fragments.
function parseKickEmotes(text) {
  const re = /\[emote:(\d+):([^\]]+)\]/g;
  const parts = [];
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", text: text.slice(last, m.index) });
    parts.push({ type: "emote", id: m[1], text: m[2], kick: true });
    last = m.index + m[0].length;
  }
  if (parts.length === 0) return null;
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

function Body({ platform, fragments, text }) {
  let frags = fragments && fragments.length ? fragments : parseKickEmotes(text || "");
  if (!frags || frags.length === 0) {
    return <span style={{ fontSize: 15, color: T.text, wordBreak: "break-word", lineHeight: 1.35 }}>{text}</span>;
  }
  return (
    <span style={{ fontSize: 15, color: T.text, wordBreak: "break-word", lineHeight: 1.35 }}>
      {frags.map((f, i) =>
        f.type === "emote" ? (
          <img
            key={i}
            src={emoteUrl(f.kick ? "kick" : platform, f.id)}
            alt={f.text}
            title={f.text}
            style={{ height: 22, verticalAlign: "middle", margin: "0 1px" }}
          />
        ) : (
          <span key={i}>{f.text}</span>
        )
      )}
    </span>
  );
}

function Row({ platform, user, text, color, badges, fragments }) {
  const m = META[platform];
  const nameColor = color || (platform === "x" ? T.x : m.color);

  return (
    <div className="oc-row" style={{
      display: "grid", gridTemplateColumns: "132px 1fr", gap: 14, alignItems: "center",
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: 14, padding: "13px 16px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 9,
        border: `1px solid ${m.border}`, fontWeight: 700, fontSize: 13, boxShadow: `0 0 16px -8px ${m.glow}`,
      }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: m.faint, display: "grid", placeItems: "center" }}>
          <Icon p={platform} size={platform === "x" ? 11 : 13} />
        </span>
        <span style={{ color: platform === "x" ? T.text : m.color }}>{m.label}</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: "none" }}>
          {badges && badges.map((b, i) => (
            <img key={i} src={b.url} alt={b.title} title={b.title}
              style={{ height: 16, verticalAlign: "middle", borderRadius: 3 }} />
          ))}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, fontSize: 14, color: nameColor }}>{user}</span>
        </span>
        <Body platform={platform} fragments={fragments} text={text} />
      </div>
    </div>
  );
}

export default React.memo(Row);
