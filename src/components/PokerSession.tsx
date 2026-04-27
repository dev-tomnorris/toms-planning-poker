import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ClientState } from "../../shared/clientState.ts";
import {
  DECK_POINT_CARDS,
  DECK_SPECIALS,
} from "../constants/deck.ts";
import { cardDisplayLabel } from "../lib/cardLabel.ts";
import {
  averageNumeric,
  isUnanimousCelebration,
  modeVote,
} from "../lib/consensus.ts";
import { hueFromId } from "../lib/hueFromId.ts";
import { useRoomWebSocket } from "../lib/useRoomWebSocket.ts";
import {
  getSoundsEnabled,
  playRevealPop,
  playTick,
  setSoundsEnabled,
} from "../lib/sounds.ts";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
} from "../lib/theme.ts";
import type { Theme } from "../lib/theme.ts";
import { BootLine } from "./BootLine.tsx";

type Props = {
  roomId: string;
  participantId: string;
  displayName: string;
  onChangeName: () => void;
};

export function PokerSession({
  roomId,
  participantId,
  displayName,
  onChangeName,
}: Props) {
  const [state, setState] = useState<ClientState | null>(null);
  /** Local selection while votes are hidden on the server */
  const [picked, setPicked] = useState<string | null>(null);
  const [storyDraft, setStoryDraft] = useState("");
  const storyEditing = useRef(false);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [soundsOn, setSoundsOn] = useState(() => getSoundsEnabled());

  const prevPhase = useRef<string | undefined>(undefined);

  const onServerMessage = useCallback((raw: string) => {
    try {
      const data = JSON.parse(raw) as {
        type: string;
        state?: ClientState;
      };
      if (data.type === "state" && data.state) {
        setState(data.state);
        if (!storyEditing.current) {
          setStoryDraft(data.state.storyTitle);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const { readyState, send } = useRoomWebSocket(roomId, onServerMessage);

  const sendJoin = useCallback(() => {
    send(
      JSON.stringify({
        type: "join",
        participantId,
        name: displayName,
      }),
    );
  }, [send, participantId, displayName]);

  useEffect(() => {
    if (readyState === WebSocket.OPEN) {
      sendJoin();
    }
  }, [readyState, sendJoin]);

  useEffect(() => {
    applyTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSoundsEnabled(soundsOn);
  }, [soundsOn]);

  useEffect(() => {
    if (state?.phase === "countdown" && state.countdown != null) {
      playTick(480 + state.countdown * 55);
    }
  }, [state?.phase, state?.countdown]);

  useEffect(() => {
    const phase = state?.phase;
    const votes = state?.votes;

    if (
      prevPhase.current !== "revealed" &&
      phase === "revealed" &&
      votes &&
      isUnanimousCelebration(votes)
    ) {
      playRevealPop();
      void confetti({
        particleCount: 120,
        spread: 86,
        origin: { y: 0.65 },
        ticks: 120,
      });
    }

    if (phase === "voting" && prevPhase.current === "revealed") {
      setPicked(null);
    }

    prevPhase.current = phase;
  }, [state?.phase, state?.votes]);

  const sendVote = (value: string) => {
    setPicked(value);
    send(
      JSON.stringify({
        type: "vote",
        participantId,
        value,
      }),
    );
  };

  const sendReveal = () => {
    send(JSON.stringify({ type: "reveal", participantId }));
  };

  const sendNewRound = () => {
    send(JSON.stringify({ type: "new_round", participantId }));
  };

  const sendStory = (title: string) => {
    send(
      JSON.stringify({
        type: "set_story",
        participantId,
        title,
      }),
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* ignore */
    }
  };

  const votePhase = state?.phase === "voting";
  const revealed = state?.phase === "revealed";
  const countdown = state?.phase === "countdown";
  const participants = state?.participants ?? [];
  const activeParticipants = participants.filter((p) => p.connected);
  const allVoted =
    activeParticipants.length > 0 &&
    activeParticipants.every((p) => p.hasVoted);

  const mode =
    revealed && state?.votes ? modeVote(state.votes) : null;
  const avg =
    revealed && state?.votes ? averageNumeric(state.votes) : null;

  const modeDisplay = mode != null ? cardDisplayLabel(mode) : null;

  return (
    <main className="page poker">
      <header className="poker-toolbar">
        <div className="toolbar-left">
          <Link to="/" className="muted link-quiet">
            ← Home
          </Link>
          <button type="button" className="btn ghost sm" onClick={copyLink}>
            Copy link
          </button>
        </div>
        <div className="toolbar-right">
          <label className="toggle">
            <input
              type="checkbox"
              checked={soundsOn}
              onChange={(e) => setSoundsOn(e.target.checked)}
            />
            <span>Sounds</span>
          </label>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              setTheme((t) => (t === "terminal" ? "paper" : "terminal"))
            }
            title={
              theme === "terminal"
                ? "Switch to amber paper theme"
                : "Switch to green terminal theme"
            }
          >
            {theme === "terminal" ? "Paper" : "CRT"}
          </button>
          <button type="button" className="btn ghost sm" onClick={onChangeName}>
            Change name
          </button>
        </div>
      </header>

      <BootLine key={roomId} />

      <section className="story-panel">
        <label className="field inline">
          <span className="label">Story / ticket</span>
          <input
            className="input story-input"
            placeholder="Optional title or ticket ID"
            value={storyDraft}
            disabled={!votePhase}
            onFocus={() => {
              storyEditing.current = true;
            }}
            onChange={(e) => setStoryDraft(e.target.value)}
            onBlur={() => {
              storyEditing.current = false;
              if (!votePhase) return;
              sendStory(storyDraft);
            }}
          />
        </label>
      </section>

      <section className="presence">
        <div className="presence-header">
          <h2 className="section-title">Team</h2>
          {allVoted && votePhase ? (
            <span className="pill ok">Everyone voted</span>
          ) : null}
          <span
            className={`pill ${readyState === WebSocket.OPEN ? "ok" : "warn"}`}
          >
            {readyState === WebSocket.OPEN ? "Live" : "Connecting…"}
          </span>
        </div>
        <ul className="participant-list">
          {participants.map((p) => (
            <li key={p.id} className="participant">
              <span
                className="chip"
                style={{
                  background: `hsl(${hueFromId(p.id)} 55% 42%)`,
                }}
              />
              <span className={p.connected ? "" : "muted"}>
                {p.name}
                {!p.connected ? " (away)" : ""}
              </span>
              {votePhase ? (
                <span className="vote-hint">
                  {p.hasVoted ? "Ready" : "Thinking…"}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {countdown && state?.countdown != null ? (
        <div className="countdown-overlay" aria-live="polite">
          <span className="countdown-digit">{state.countdown}</span>
        </div>
      ) : null}

      <section className="deck-section">
        <h2 className="section-title">Your vote</h2>
        <p className="deck-hint muted">
          Fibonacci points (0–89). <abbr title="Need clarification">?</abbr> =
          unsure. <span className="deck-hint__coffee">☕</span> = coffee break
          (not a point).
        </p>
        <div className="deck deck--points">
          {DECK_POINT_CARDS.map((card) => (
            <button
              key={card}
              type="button"
              className={`card-btn ${votePhase && picked === card ? "selected" : ""}`}
              disabled={!votePhase || readyState !== WebSocket.OPEN}
              onClick={() => sendVote(card)}
            >
              {card}
            </button>
          ))}
        </div>
        <div className="deck deck--specials" aria-label="Special cards">
          {DECK_SPECIALS.map((card) => (
            <button
              key={card}
              type="button"
              className={`card-btn card-btn--special ${card === "coffee" ? "card-btn--coffee" : ""} ${votePhase && picked === card ? "selected" : ""}`}
              disabled={!votePhase || readyState !== WebSocket.OPEN}
              onClick={() => sendVote(card)}
              title={
                card === "?"
                  ? "Unsure / need discussion"
                  : "Need a coffee break"
              }
            >
              {card === "coffee" ? "☕" : card}
            </button>
          ))}
        </div>
      </section>

      <section className="actions-bar">
        <button
          type="button"
          className="btn primary"
          disabled={!votePhase || readyState !== WebSocket.OPEN}
          onClick={sendReveal}
        >
          Reveal
        </button>
        <button
          type="button"
          className="btn"
          disabled={!revealed || readyState !== WebSocket.OPEN}
          onClick={sendNewRound}
        >
          New round
        </button>
      </section>

      {revealed && state?.votes ? (
        <section className="reveal-panel">
          <h2 className="section-title">Results</h2>
          <div className="consensus">
            {mode != null ? (
              <p>
                <strong>Mode:</strong> {modeDisplay}
              </p>
            ) : null}
            {avg != null ? (
              <p>
                <strong>Average (numeric):</strong>{" "}
                {avg.toFixed(avg % 1 === 0 ? 0 : 1)}
              </p>
            ) : null}
          </div>
          <div className="revealed-cards">
            {participants.map((p) => {
              const v = state.votes?.[p.id];
              return (
                <div key={p.id} className="revealed-card-wrap">
                  <div className="revealed-label muted">{p.name}</div>
                  <div className="revealed-card flip show">
                    <span className="card-face">
                      {v != null ? cardDisplayLabel(v) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {!state ? (
        <p className="muted centered">Loading room…</p>
      ) : null}
    </main>
  );
}
