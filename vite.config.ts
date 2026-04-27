import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: WebSocket API runs on PORT (default 8080); browser uses same-origin /ws via proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ws": {
        target: "http://127.0.0.1:8080",
        ws: true,
      },
    },
  },
});
