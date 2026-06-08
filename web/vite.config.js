import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy /ws to the backend so the browser only ever talks to one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/ws": { target: "ws://localhost:8787", ws: true },
      "/health": { target: "http://localhost:8787" },
    },
  },
});
