# Planning Poker

Anonymous planning poker for your team: create a room, share the secret URL, pick a display name, and estimate with a Fibonacci deck plus `?`. Anyone in the room can **Reveal** (with a shared **3 → 2 → 1** countdown) or start a **New round**. No accounts.

## Local development

1. Install dependencies: `npm install`
2. Run the Vite app and PartyKit dev server together:

```bash
npm run dev
```

3. Open the URL Vite prints (usually `http://localhost:5173`). Create a room and join.

The WebSocket server defaults to `127.0.0.1:1999` (PartyKit dev). Override with `VITE_PARTYKIT_HOST` in `.env.local` if needed.

## Deploy

### Frontend (Vercel)

1. Connect this repo to [Vercel](https://vercel.com/).
2. Framework preset: **Other** (static Vite build), or use defaults — `vercel.json` sets `npm run build` and output `dist`.
3. Add an environment variable for production builds:

| Name | Value |
|------|--------|
| `VITE_PARTYKIT_HOST` | Your PartyKit host (below), **without** `https://` or `wss://` — e.g. `my-party.myaccount.partykit.dev` |

Redeploy after changing env vars.

### Realtime (PartyKit)

The collaborative room runs on PartyKit (separate from Vercel).

1. Log in: `npx partykit login`
2. Deploy: `npm run party:deploy` (or `npx partykit deploy`)
3. Note the deployed host PartyKit prints; use it as `VITE_PARTYKIT_HOST` on Vercel.

For logs: `npx partykit tail`.

## Project layout

- `src/` — React (Vite) client
- `party/` — PartyKit room server (`party/index.ts`)
- `shared/` — Types shared between client and server shape (JSON payloads)

## Privacy

Rooms are unguessable URLs (random id). Only people with the link can join.
