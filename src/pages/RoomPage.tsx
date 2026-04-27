import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PokerSession } from "../components/PokerSession";
import {
  clearStoredDisplayName,
  getOrCreateParticipantId,
  getStoredDisplayName,
  setStoredDisplayName,
} from "../lib/participantStorage";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const participantId = useMemo(() => getOrCreateParticipantId(), []);
  const [displayName, setDisplayName] = useState(() =>
    roomId ? getStoredDisplayName(roomId) : null,
  );
  const [draftName, setDraftName] = useState("");

  if (!roomId) {
    return (
      <main className="page">
        <p>Missing room.</p>
        <Link to="/">Back home</Link>
      </main>
    );
  }

  if (!displayName) {
    return (
      <main className="page join">
        <header className="page-header">
          <h1 className="title">Join room</h1>
          <p className="lede muted">
            Choose how others see you at the table. No account required.
          </p>
        </header>
        <form
          className="join-form"
          onSubmit={(e) => {
            e.preventDefault();
            const name = draftName.trim().slice(0, 40);
            if (!name) return;
            setStoredDisplayName(roomId, name);
            setDisplayName(name);
          }}
        >
          <label className="field">
            <span className="label">Your name</span>
            <input
              className="input"
              autoComplete="nickname"
              placeholder="Alex"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              autoFocus
            />
          </label>
          <button type="submit" className="btn primary">
            Join table
          </button>
        </form>
        <p className="hint">
          <Link to="/">← Start a different room</Link>
        </p>
      </main>
    );
  }

  return (
    <PokerSession
      roomId={roomId}
      participantId={participantId}
      displayName={displayName}
      onChangeName={() => {
        clearStoredDisplayName(roomId);
        setDisplayName(null);
        setDraftName("");
      }}
    />
  );
}
