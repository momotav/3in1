import React, { useState, useRef, useEffect } from "react";
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
      {/* ink rule across the top, like a letterhead */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: T.text, zIndex: 50 }} />

      <div style={{
        position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto", padding: "0 22px 26px",
        display: "flex", flexDirection: "column", height: "100vh",
      }}>
        <Header total={messages.length} rate={ratePerMin} live={live} online={online} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14, marginBottom: 18 }}>
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
          style={{ flex: 1, overflowY: "auto", padding: "0 2px 28px", borderTop: `1px solid ${T.text}` }}>
          {visible.length === 0 ? (
            <div style={{
              margin: "120px auto 0", textAlign: "center", color: T.muted,
              fontStyle: "italic", fontSize: 17, lineHeight: 1.8, maxWidth: 420,
            }}>
              No messages yet.<br />
              <span style={{ fontSize: 15 }}>Connect a channel above, or press <b style={{ color: T.gold, fontStyle: "normal" }}>Demo</b> to watch all three platforms write in.</span>
            </div>
          ) : (
            visible.map((m) => <MessageRow key={m.id} platform={m.platform} user={m.user} text={m.text} color={m.color} badges={m.badges} fragments={m.fragments} />)
          )}
        </div>
      </div>
    </div>
  );
}
