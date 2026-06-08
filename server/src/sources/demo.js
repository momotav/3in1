/**
 * Demo source. Used when a channel is literally named "demo" for any platform.
 * Emits platform-appropriate simulated chatter through the exact same pipeline
 * as the live sources, so the end-to-end flow can be exercised with no creds.
 */
const LINES = {
  twitch: [
    "Ansem is cooking again", "that resistance gonna break fr", "KEKW the timing",
    "volume confirming the move", "position size matters people", "the data says otherwise",
    "chat is this real", "down bad rn", "clip it",
  ],
  kick: [
    "HYPE just different 👀", "sending it on this one", "my stop just got hunted 💀",
    "this stream carrying my portfolio", "2 more zeros incoming", "gm chat ☀️",
    "W stream", "let him cook", "no thoughts just longs",
  ],
  x: [
    "thanks for the polymarket picks 🔥", "wen entry anon", "up only from here",
    "not financial advice but…", "i AM the exit liquidity", "been here since the lows",
    "ratio'd", "this you?", "saving this thread",
  ],
};

const USERS = ["user91", "user1337", "user67", "degenmax", "solmaxi", "tapeReader",
  "riskmgmt", "moonboi", "quietquant", "gm_gn", "nfa_chad", "vibesonly"];

export function createDemoSource({ platform, emit, status }) {
  status("live", "demo");
  const pool = LINES[platform] || LINES.twitch;
  const timer = setInterval(() => {
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    const text = pool[Math.floor(Math.random() * pool.length)];
    emit(user, text);
  }, 900 + Math.random() * 600);
  return { close() { clearInterval(timer); status("offline"); } };
}
