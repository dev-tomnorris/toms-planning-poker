import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import { BootLine } from "../components/BootLine.tsx";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="page home">
      <header className="page-header">
        <h1 className="title">Planning Poker</h1>
        <BootLine />
        <p className="lede">
          No sign-in — create a room, share the secret link. Estimate with a
          modified Fibonacci deck (through 89), &ldquo;?&rdquo; when unsure, or
          ☕ for a coffee break.
        </p>
      </header>
      <div className="actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            navigate(`/room/${nanoid()}`);
          }}
        >
          New room
        </button>
        <p className="hint">
          You get a random room URL — share it only with your team.
        </p>
      </div>
    </main>
  );
}
