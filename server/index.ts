/**
 * Single process: serves the Vite-built SPA and WebSocket rooms at `/ws/:roomId`.
 * Deploy once (Railway, Fly.io, Render, etc.): `npm run build && npm start`.
 */
import { existsSync } from "node:fs";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import { WebSocketServer } from "ws";

import { PokerRoomEngine } from "./pokerRoom.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 8080;
const distDir = join(__dirname, "../dist");
const distIndex = join(distDir, "index.html");
const serveClient = existsSync(distIndex);

const rooms = new Map<string, PokerRoomEngine>();

function getRoom(roomId: string): PokerRoomEngine {
  let room = rooms.get(roomId);
  if (!room) {
    room = new PokerRoomEngine(roomId);
    rooms.set(roomId, room);
  }
  return room;
}

const app = express();

if (serveClient) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(distIndex);
  });
} else {
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });
}

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const host = request.headers.host ?? "localhost";
  const url = new URL(request.url ?? "/", `http://${host}`);
  const match = url.pathname.match(/^\/ws\/([^/]+)$/);
  if (!match?.[1]) {
    socket.destroy();
    return;
  }
  const roomId = decodeURIComponent(match[1]);
  if (!roomId) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    const room = getRoom(roomId);
    const connectionId = randomUUID();
    room.addSocket(connectionId, ws);

    ws.on("message", (data) => {
      const text = typeof data === "string" ? data : data.toString();
      room.handleMessage(connectionId, text);
    });

    ws.on("close", () => {
      room.removeSocket(connectionId);
    });

    ws.on("error", () => {
      room.removeSocket(connectionId);
    });
  });
});

server.listen(PORT, () => {
  console.log(
    `[planning-poker] ${serveClient ? `static+ws` : `ws-only (vite on :5173)`} http://127.0.0.1:${PORT}`,
  );
});
