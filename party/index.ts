import type * as Party from "partykit/server";
import type { ClientParticipant, ClientState, Phase } from "../shared/clientState";
import { DECK_SET } from "./constants";

type ClientMessage =
  | { type: "join"; participantId: string; name: string }
  | { type: "vote"; participantId: string; value: string }
  | { type: "reveal"; participantId: string }
  | { type: "new_round"; participantId: string }
  | { type: "set_story"; participantId: string; title: string };

export default class PokerRoom implements Party.Server {
  /** participantId -> display name */
  private names = new Map<string, string>();
  /** participantId -> vote value string */
  private votes = new Map<string, string>();
  /** WebSocket connection id -> participantId */
  private connToParticipant = new Map<string, string>();
  /** participantId -> connection id (one active connection per participant) */
  private participantToConn = new Map<string, string>();

  private phase: Phase = "voting";
  /** 3, 2, or 1 while counting down */
  private countdownStep: number | null = null;
  private storyTitle = "";

  constructor(readonly room: Party.Room) {}

  private broadcastState() {
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
    this.room.broadcast(JSON.stringify({ type: "state", state: payload }));
  }

  private buildParticipants(): ClientParticipant[] {
    const list: ClientParticipant[] = [];
    for (const [id, name] of this.names) {
      const connId = this.participantToConn.get(id);
      const connected =
        connId != null && this.room.getConnection(connId) !== undefined;
      list.push({
        id,
        name,
        connected,
        hasVoted: this.votes.has(id),
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  private scheduleNextCountdownTick() {
    void this.room.storage.setAlarm(Date.now() + 1000);
  }

  onAlarm() {
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

  onConnect(conn: Party.Connection) {
    // Identification happens on first `join` message
    void conn;
  }

  onClose(conn: Party.Connection) {
    const pid = this.connToParticipant.get(conn.id);
    if (pid) {
      this.connToParticipant.delete(conn.id);
      const mapped = this.participantToConn.get(pid);
      if (mapped === conn.id) {
        this.participantToConn.delete(pid);
      }
    }
    this.broadcastState();
  }

  onMessage(raw: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    const text =
      typeof raw === "string"
        ? raw
        : new TextDecoder().decode(raw as ArrayBufferView);
    let msg: ClientMessage;
    try {
      msg = JSON.parse(text) as ClientMessage;
    } catch {
      return;
    }

    const senderPid = this.connToParticipant.get(sender.id);

    if (msg.type === "join") {
      const name = msg.name.trim().slice(0, 40);
      if (!name || !msg.participantId) {
        return;
      }
      if (senderPid && senderPid !== msg.participantId) {
        return;
      }
      this.connToParticipant.set(sender.id, msg.participantId);
      this.participantToConn.set(msg.participantId, sender.id);
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
        this.phase = "countdown";
        this.countdownStep = 3;
        this.broadcastState();
        this.scheduleNextCountdownTick();
        break;
      }
      case "new_round": {
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
}
