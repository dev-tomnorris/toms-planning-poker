# Planning Poker

Anonymous planning poker for your team: create a room, share the secret URL, pick a display name, and estimate with a Fibonacci deck plus `?`. Anyone in the room can **Reveal** (with a shared **3 → 2 → 1** countdown) or start a **New round**. No accounts.

The UI and realtime server run in **one Node process**, so you only **deploy once** (e.g. Railway, Fly.io, Render).

## Run locally

**Development (hot reload UI + API):**

```bash
npm install
npm run dev
```

Open **http://localhost:5173** (Vite). WebSocket calls go to **`/ws/...`** on the same origin and are proxied to the API on port **8080**.

**Production-style (single origin, what you ship):**

```bash
npm run build && npm start
```

Open **http://localhost:8080** — static app and WebSockets share one host/port.

Environment:

| Variable | Default | Notes |
|---------|---------|--------|
| `PORT` | `8080` | HTTP + WebSocket server (hosts set this for you). |

## Deploy one service

1. Build: `npm run build` (outputs `dist/`).
2. Start: `npm start` (runs `tsx server/index.ts`).
3. Bind to the platform’s HTTP port (`PORT`). The app serves `dist/` and upgrades **`/ws/:roomId`** to WebSockets.

Works with **Railway**, **Fly.io**, **Render**, **Google Cloud Run** (enable WebSockets), etc.

**Not ideal on Vercel serverless:** this design expects a **long‑running Node** process. Prefer a **container / VM / PaaS with a persistent server** above.

## Project layout

- `src/` — React (Vite) client  
- `server/` — Express + `ws` (`/ws/:roomId`)  
- `shared/` — Deck constants + shared JSON types  

## Privacy

Rooms use unguessable URLs (random id). Only people with the link can join.
