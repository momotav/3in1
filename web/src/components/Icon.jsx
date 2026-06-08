import React from "react";
import { META } from "../theme.js";

const PATHS = {
  kick: "M3 3h6v6h3V6h3V3h6v9h-3v3h3v9h-6v-3h-3v-3H9v6H3z",
  x: "M18.9 1.2h3.7l-8 9.1 9.4 12.5h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9zM17.6 20.6h2L6.5 3.3H4.3z",
  twitch: "M4 2 2 6v15h5v3h3l3-3h4l5-5V2zm16 11-3 3h-5l-3 3v-3H6V4h14zM15 7h2v5h-2zm-5 0h2v5h-2z",
};

export default function Icon({ p, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={META[p].color} style={{ display: "block" }}>
      <path d={PATHS[p]} />
    </svg>
  );
}
