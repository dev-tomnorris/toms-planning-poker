import { nanoid } from "nanoid";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="page home">
      <header className="page-header">
        <h1 className="title">Planning Poker</h1>
        <p className="lede">
          No sign-in — create a room, share the link, estimate with your team.
          Fibonacci deck plus &ldquo;?&rdquo; when you need more discussion.
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
          You will get a secret URL to share only with your team.
        </p>
      </div>
      <footer className="page-footer">
        <Link to="/" className="muted">
          Home
        </Link>
      </footer>
    </main>
  );
}
