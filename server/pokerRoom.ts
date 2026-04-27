import { WebSocket } from "ws";
import type { ClientParticipant, ClientState, Phase } from "../shared/clientState.ts";
import { DECK_SET } from "../shared/deck.ts";

type ClientMessage =
  | { type: "join"; participantId: string; name: string }
  | { type: "vote"; participantId: string; value: string }
  | { type: "reveal"; participantId: string }
  | { type: "new_round"; participantId: string }
  | { type: "set_story"; participantId: string; title: string };

/**
 * One planning-poker room: same protocol as the former PartyKit server.
 * `connectionId` is an opaque id per browser WebSocket connection.
 */
export class PokerRoomEngine {
  private names = new Map<string, string>();
  private votes = new Map<string, string>();
  private connToParticipant = new Map<string, string>();
  private participantToConn = new Map<string, string>();
  /** connectionId -> live socket */
  private sockets = new Map<string, WebSocket>();

  private phase: Phase = "voting";
  private countdownStep: number | null = null;
  private storyTitle = "";
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;

  readonly roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  addSocket(connectionId: string, ws: WebSocket): void {
    this.sockets.set(connectionId, ws);
  }

  removeSocket(connectionId: string): void {
    this.sockets.delete(connectionId);
    const pid = this.connToParticipant.get(connectionId);
    if (pid) {
      this.connToParticipant.delete(connectionId);
      const mapped = this.participantToConn.get(pid);
      if (mapped === connectionId) {
        this.participantToConn.delete(pid);
      }
    }
    this.broadcastState();
  }

  handleMessage(connectionId: string, raw: string): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      return;
    }

    const senderPid = this.connToParticipant.get(connectionId);

    if (msg.type === "join") {
      const name = msg.name.trim().slice(0, 40);
      if (!name || !msg.participantId) {
        return;
      }
      if (senderPid && senderPid !== msg.participantId) {
        return;
      }
      this.connToParticipant.set(connectionId, msg.participantId);
      this.participantToConn.set(msg.participantId, connectionId);
      this.names.set(msg.participantId, name);
      this.broadcastState();
      return;
    }

    if (!senderPid || senderPid !== msg.participantId) {
      return;
    }

    switch (msg.type) {
      case "vote": {
        if (this.phase !== "voting") {
          return;
        }
        if (!DECK_SET.has(msg.value)) {
          return;
        }
        this.votes.set(msg.participantId, msg.value);
        this.broadcastState();
        break;
      }
      case "reveal": {
        if (this.phase !== "voting") {
          return;
        }
        this.clearCountdownTimer();
        this.phase = "countdown";
        this.countdownStep = 3;
        this.broadcastState();
        this.scheduleNextCountdownTick();
        break;
      }
      case "new_round": {
        this.clearCountdownTimer();
        this.phase = "voting";
        this.countdownStep = null;
        this.votes.clear();
        this.storyTitle = "";
        this.broadcastState();
        break;
      }
      case "set_story": {
        if (this.phase !== "voting") {
          return;
        }
        this.storyTitle = msg.title.trim().slice(0, 200);
        this.broadcastState();
        break;
      }
      default:
        break;
    }
  }

  private clearCountdownTimer(): void {
    if (this.countdownTimer != null) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private scheduleNextCountdownTick(): void {
    this.countdownTimer = setTimeout(() => this.tickCountdown(), 1000);
  }

  private tickCountdown(): void {
    this.countdownTimer = null;
    if (this.phase !== "countdown" || this.countdownStep == null) {
      return;
    }
    if (this.countdownStep === 3) {
      this.countdownStep = 2;
      this.broadcastState();
      this.scheduleNextCountdownTick();
      return;
    }
    if (this.countdownStep === 2) {
      this.countdownStep = 1;
      this.broadcastState();
      this.scheduleNextCountdownTick();
      return;
    }
    if (this.countdownStep === 1) {
      this.phase = "revealed";
      this.countdownStep = null;
      this.broadcastState();
    }
  }

  private broadcastState(): void {
    const payload: ClientState = {
      phase: this.phase,
      countdown:
        this.phase === "countdown" && this.countdownStep != null
          ? this.countdownStep
          : null,
      participants: this.buildParticipants(),
      storyTitle: this.storyTitle,
    };
    if (this.phase === "revealed") {
      payload.votes = Object.fromEntries(this.votes);
    }
    const raw = JSON.stringify({ type: "state", state: payload });
    for (const ws of this.sockets.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  }

  private buildParticipants(): ClientParticipant[] {
    const list: ClientParticipant[] = [];
    for (const [id, name] of this.names) {
      const connId = this.participantToConn.get(id);
      const sock = connId != null ? this.sockets.get(connId) : undefined;
      const connected =
        connId != null &&
        sock !== undefined &&
        sock.readyState === WebSocket.OPEN;
      list.push({
        id,
        name,
        connected: Boolean(connected),
        hasVoted: this.votes.has(id),
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }
}
