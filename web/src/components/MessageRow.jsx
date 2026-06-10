import React from "react";
import { T, META } from "../theme.js";
import Icon from "./Icon.jsx";

const emoteUrl = (platform, id) =>
  platform === "kick"
    ? `https://files.kick.com/emotes/${id}/fullsize`
    : `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`;

// Fallback: parse Kick-style [emote:id:name] tokens out of raw text,
// so emotes render even if the backend didn't pre-split them.
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

// Twitch user colors are tuned for dark UIs; on paper, very light ones vanish.
// Darken anything too bright, keep everything else as the chatter chose it.
function inkSafe(hex) {
  if (!hex || hex[0] !== "#" || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < 165) return hex;
  const f = 150 / lum;
  const d = (v) => Math.round(v * f).toString(16).padStart(2, "0");
  return "#" + d(r) + d(g) + d(b);
}

function Body({ platform, fragments, text }) {
  let frags = fragments && fragments.length ? fragments : parseKickEmotes(text || "");
  const style = { fontSize: 15.5, color: T.text, wordBreak: "break-word", lineHeight: 1.45 };
  if (!frags || frags.length === 0) return <span style={style}>{text}</span>;
  return (
    <span style={style}>
      {frags.map((f, i) =>
        f.type === "emote" ? (
          <img key={i} src={emoteUrl(f.kick ? "kick" : platform, f.id)} alt={f.text} title={f.text}
            style={{ height: 21, verticalAlign: "middle", margin: "0 1px" }} />
        ) : (
          <span key={i}>{f.text}</span>
        )
      )}
    </span>
  );
}

function Row({ platform, user, text, color, badges, fragments }) {
  const m = META[platform];
  const nameColor = inkSafe(color) || m.color;

  return (
    <div className="oc-row" style={{
      display: "grid", gridTemplateColumns: "92px 1fr", gap: 18, alignItems: "baseline",
      borderBottom: `1px solid ${T.line}`, padding: "11px 4px",
    }}>
      <span className="caps" style={{
        fontSize: 9, fontWeight: 700, color: m.color, display: "inline-flex",
        alignItems: "center", gap: 6, paddingTop: 3,
      }}>
        <Icon p={platform} size={10} />
        {m.label}
      </span>

      <div style={{ display: "flex", alignItems: "baseline", gap: 11, minWidth: 0, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: "none" }}>
          {badges && badges.map((b, i) => (
            <img key={i} src={b.url} alt={b.title} title={b.title}
              style={{ height: 14, verticalAlign: "middle", borderRadius: 2 }} />
          ))}
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color: nameColor,
          }}>{user}</span>
        </span>
        <Body platform={platform} fragments={fragments} text={text} />
      </div>
    </div>
  );
}

export default React.memo(Row);
