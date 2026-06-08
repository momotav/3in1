import React from "react";
import { T, META } from "../theme.js";
import Icon from "./Icon.jsx";

function Row({ platform, user, text }) {
  const m = META[platform];
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
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, fontSize: 14, color: platform === "x" ? T.x : m.color, flex: "none" }}>{user}</span>
        <span style={{ fontSize: 15, color: T.text, wordBreak: "break-word", lineHeight: 1.35 }}>{text}</span>
      </div>
    </div>
  );
}

// memoized: a row never changes once rendered, so we skip re-render churn under load
export default React.memo(Row);
