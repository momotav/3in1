import React from "react";
import { T, META, PLATFORMS } from "../theme.js";

function pill(bg, color, active) {
  return {
    fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase",
    border: `1px solid ${active ? bg : T.line}`, background: bg, color, padding: "6px 13px",
    borderRadius: 999, cursor: "pointer", fontWeight: active ? 700 : 400,
  };
}

export default function Toolbar({ filters, onFilter, demo, onDemo, onClear, autoscroll, onResume }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      {PLATFORMS.map((p) => (
        <button key={p} className="oc-btn" onClick={() => onFilter(p)}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11, letterSpacing: ".5px", textTransform: "uppercase", padding: "6px 11px",
            borderRadius: 999, cursor: "pointer", border: `1px solid ${T.line}`, background: T.panel,
            color: T.muted, opacity: filters[p] ? 1 : 0.4,
          }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: META[p].color }} />{META[p].label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      {!autoscroll && <button className="oc-btn" onClick={onResume} style={pill(T.gold, "#0a0805", true)}>↓ resume</button>}
      <button className="oc-btn" onClick={onDemo} style={pill(demo ? T.gold : T.panel, demo ? "#0a0805" : T.muted, demo)}>Demo</button>
      <button className="oc-btn" onClick={onClear} style={pill(T.panel, T.muted, false)}>Clear</button>
    </div>
  );
}
