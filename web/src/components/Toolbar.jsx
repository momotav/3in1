import React from "react";
import { T, META, PLATFORMS } from "../theme.js";

export default function Toolbar({ filters, onFilter, demo, onDemo, onClear, autoscroll, onResume }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
      <span className="caps" style={{ fontSize: 9, color: T.dim }}>showing</span>
      {PLATFORMS.map((p) => (
        <button key={p} className="oc-btn caps" onClick={() => onFilter(p)}
          aria-pressed={filters[p]}
          style={{
            background: "none", border: "none", fontSize: 10.5, fontWeight: 700, padding: "2px 0 4px",
            color: filters[p] ? META[p].color : T.dim,
            borderBottom: filters[p] ? `2px solid ${META[p].color}` : "2px solid transparent",
            textDecoration: filters[p] ? "none" : "line-through",
          }}>
          {META[p].label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      {!autoscroll && (
        <button className="oc-btn caps" onClick={onResume}
          style={{ background: T.gold, color: T.bg, border: "none", borderRadius: 3, padding: "6px 12px", fontSize: 10, fontWeight: 700 }}>
          ↓ resume
        </button>
      )}
      <button className="oc-btn" onClick={onDemo}
        style={{
          background: "none", border: "none",
          fontFamily: "'Caveat',cursive", fontWeight: 700, fontSize: 23, lineHeight: 1,
          color: demo ? T.gold : T.muted,
          borderBottom: demo ? `2px solid ${T.gold}` : "2px solid transparent",
          transform: "rotate(-2deg)",
        }}>
        demo
      </button>
      <button className="oc-btn caps" onClick={onClear}
        style={{ background: "none", border: "none", fontSize: 10, color: T.dim, padding: "2px 0" }}>
        clear
      </button>
    </div>
  );
}
