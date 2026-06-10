import React from "react";
import { T } from "../theme.js";

/* Speech-bubble-with-arrow mark, echoing the brand logo motif */
function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 7h22v15H15l-5 5v-5H5z" stroke={T.text} strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
      <path d="M16 17V9.5M16 9.5l-3.4 3.4M16 9.5l3.4 3.4" stroke={T.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 17, color: T.text, lineHeight: 1 }}>{value}</div>
      <div className="caps" style={{ fontSize: 9, color: T.dim, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Header({ total, rate, live, online }) {
  return (
    <header style={{
      display: "flex", alignItems: "flex-end", gap: 20, padding: "30px 2px 18px", flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <Mark />
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 33,
            letterSpacing: "-.01em", lineHeight: 1, color: T.text,
          }}>
            OmniChat
          </h1>
          <div className="caps" style={{ fontSize: 9.5, color: T.muted, marginTop: 6 }}>
            every message&nbsp;·&nbsp;every platform&nbsp;·&nbsp;one feed
          </div>
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 26, alignItems: "flex-end" }}>
        <Stat label="messages" value={total} />
        <Stat label="per min" value={rate} />
        {/* the red handwritten annotation — the page's signature */}
        <div style={{ minWidth: 96, textAlign: "center", paddingBottom: 2 }}>
          {!online ? (
            <span className="caps" style={{ fontSize: 10, color: T.err }}>disconnected</span>
          ) : live ? (
            <span style={{
              fontFamily: "'Caveat',cursive", fontWeight: 700, fontSize: 30, color: T.gold,
              display: "inline-block", transform: "rotate(-5deg)", lineHeight: .8,
              borderBottom: `2px solid ${T.gold}`, paddingBottom: 2,
            }}>
              live!
            </span>
          ) : (
            <span className="caps" style={{ fontSize: 10, color: T.dim }}>idle</span>
          )}
        </div>
      </div>
    </header>
  );
}
