import React from "react";
import { T } from "../theme.js";

function StatChip({ label, value }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 11, padding: "6px 11px", borderRadius: 999,
      border: `1px solid ${T.line}`, background: T.panel, color: T.muted, display: "flex", gap: 7, alignItems: "baseline",
    }}>
      <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{value}</span>
      <span style={{ textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
    </div>
  );
}

export default function Header({ total, rate, live, online }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 2px 14px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.5px" }}>
          OMNICHAT<span style={{ color: T.goldSoft }}>.</span>
        </h1>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
          unified&nbsp;stream&nbsp;chat
        </span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        <StatChip label="msgs" value={total} />
        <StatChip label="per min" value={rate} />
        <div style={{
          display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono',monospace",
          fontSize: 12, padding: "7px 13px", borderRadius: 999, border: `1px solid ${T.line}`,
          background: T.panel, color: live ? T.text : T.muted,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: !online ? T.err : live ? T.ok : T.dim,
            boxShadow: live ? `0 0 10px ${T.ok}` : "none",
            animation: live ? "oc-pulse 1.8s infinite" : "none",
          }} />
          {!online ? "disconnected" : live ? "live" : "idle"}
        </div>
      </div>
    </header>
  );
}
