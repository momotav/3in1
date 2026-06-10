/* Paper & ink — letterpress editorial theme.
   Key names kept identical to the dark theme so every component keeps working. */
export const T = {
  bg: "#f4f2ec",        // paper
  panel: "#fbfaf6",     // card paper
  panel2: "#f1efe7",    // input field
  line: "#d9d5c9",      // hairline rule
  gold: "#c8331f",      // accent — handwritten red (repurposed key)
  goldSoft: "#e0492f",
  text: "#1f1d18",      // ink
  muted: "#6b675c",
  dim: "#9a9484",
  kick: "#2f7d1e",      // forest ink-green (re-inked for paper)
  x: "#1f1d18",         // X is ink
  twitch: "#5f3dab",    // deep violet
  ok: "#1d7a3a",
  err: "#c8331f",
};

export const META = {
  kick:   { label: "Kick",   color: T.kick,   glow: "rgba(47,125,30,.16)",  faint: "rgba(47,125,30,.08)",  border: "rgba(47,125,30,.45)" },
  x:      { label: "X",      color: T.x,      glow: "rgba(31,29,24,.12)",   faint: "rgba(31,29,24,.05)",   border: "rgba(31,29,24,.35)" },
  twitch: { label: "Twitch", color: T.twitch, glow: "rgba(95,61,171,.16)",  faint: "rgba(95,61,171,.08)",  border: "rgba(95,61,171,.45)" },
};

export const PLATFORMS = ["kick", "x", "twitch"];
