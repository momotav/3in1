import React, { useState, useRef, useEffect, useCallback } from "react";
import { T, PLATFORMS } from "./theme.js";
import { useOmniSocket } from "./hooks/useOmniSocket.js";
import Header from "./components/Header.jsx";
import SourceCard from "./components/SourceCard.jsx";
import Toolbar from "./components/Toolbar.jsx";
import MessageRow from "./components/MessageRow.jsx";

export default function App() {
  const { messages, status, online, join, leave, clear, ratePerMin } = useOmniSocket();
  const [inputs, setInputs] = useState({ kick: "", x: "", twitch: "" });
  const [filters, setFilters] = useState({ kick: true, x: true, twitch: true });
  const [autoscroll, setAutoscroll] = useState(true);

  const scrollRef = useRef(null);
  const autoRef = useRef(true);
  useEffect(() => { autoRef.current = autoscroll; }, [autoscroll]);

  const demoOn = PLATFORMS.every((p) => status[p].channel === "demo" && status[p].state === "live");

  const toggleSource = (p) => {
    const isActive = status[p].state === "live" || status[p].state === "connecting";
    if (isActive) leave(p);
    else if (inputs[p].trim()) join(p, inputs[p].trim());
  };

  const toggleDemo = () => {
    const anyDemo = PLATFORMS.some((p) => status[p].channel === "demo");
    if (anyDemo) PLATFORMS.forEach((p) => status[p].channel === "demo" && leave(p));
    else PLATFORMS.forEach((p) => join(p, "demo"));
  };

  useEffect(() => {
    if (autoRef.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (near !== autoRef.current) setAutoscroll(near);
  };

  const resume = () => { setAutoscroll(true); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };
  const live = PLATFORMS.some((p) => status[p].state === "live");
  const visible = messages.filter((m) => filters[m.platform]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, position: "relative" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 50,
        background: `linear-gradient(90deg,transparent,${T.gold} 20%,${T.goldSoft} 50%,${T.gold} 80%,transparent)`,
        boxShadow: "0 0 24px 2px rgba(200,146,58,.35)",
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(120% 90% at 50% -10%,rgba(200,146,58,.10),transparent 55%)",
      }} />

      <div style={{
        position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "0 18px 24px",
        display: "flex", flexDirection: "column", height: "100vh",
      }}>
        <Header total={messages.length} rate={ratePerMin} live={live} online={online} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10, marginBottom: 12 }}>
          {PLATFORMS.map((p) => (
            <SourceCard
              key={p} platform={p} status={status[p]} value={inputs[p]}
              onChange={(v) => setInputs((s) => ({ ...s, [p]: v }))}
              onToggle={() => toggleSource(p)}
            />
          ))}
        </div>

        <Toolbar
          filters={filters} onFilter={(p) => setFilters((f) => ({ ...f, [p]: !f[p] }))}
          demo={demoOn} onDemo={toggleDemo} onClear={clear}
          autoscroll={autoscroll} onResume={resume}
        />

        <div ref={scrollRef} onScroll={onScroll} className="oc-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "4px 2px 24px", display: "flex", flexDirection: "column", gap: 7 }}>
          {visible.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", color: T.dim, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, lineHeight: 1.9 }}>
              <b style={{ color: T.muted }}>no messages yet</b><br />
              connect a channel above, or hit <b style={{ color: T.muted }}>Demo</b> to see all three together
            </div>
          ) : (
            visible.map((m) => <MessageRow key={m.id} platform={m.platform} user={m.user} text={m.text} />)
          )}
        </div>
      </div>
    </div>
  );
}
