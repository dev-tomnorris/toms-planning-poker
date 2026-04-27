import { useEffect, useState } from "react";

const QUIPS = [
  "> planning-poker · session ready",
  "> estimators assemble",
  "> connect websocket… ok",
  "> fibonacci sequence loaded · specials: ? · ☕",
  "> no login required · share url only with your team",
  "> commit often · estimate honestly",
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  return reduced;
}

type Props = {
  /** Optional fixed line (e.g. room boot). Otherwise random quip on mount. */
  line?: string;
  className?: string;
};

export function BootLine({ line, className = "" }: Props) {
  const [full] = useState(
    () => line ?? QUIPS[Math.floor(Math.random() * QUIPS.length)],
  );
  const reduced = usePrefersReducedMotion();
  const [shownLen, setShownLen] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const step = 22;
    const id = window.setInterval(() => {
      i += 1;
      setShownLen(i);
      if (i >= full.length) {
        window.clearInterval(id);
      }
    }, step);
    return () => window.clearInterval(id);
  }, [full, reduced]);

  const visibleText = reduced ? full : full.slice(0, shownLen);
  const typingComplete = reduced || shownLen >= full.length;

  return (
    <p
      className={`boot-line ${className}`.trim()}
      aria-live={typingComplete ? "polite" : "off"}
    >
      <span className="boot-line__text">{visibleText}</span>
      {!typingComplete ? (
        <span className="boot-line__cursor" aria-hidden />
      ) : null}
    </p>
  );
}
