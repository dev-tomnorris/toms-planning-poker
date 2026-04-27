const STORAGE_KEY = "pp-sounds-enabled";

export function getSoundsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundsEnabled(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Short tick for countdown; call after user has enabled sounds (gesture ok). */
export function playTick(frequency = 660): void {
  if (!getSoundsEnabled()) return;
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.frequency.value = frequency;
  osc.type = "sine";
  const now = c.currentTime;
  g.gain.setValueAtTime(0.08, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.start(now);
  osc.stop(now + 0.09);
}

export function playRevealPop(): void {
  if (!getSoundsEnabled()) return;
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.frequency.value = 440;
  osc.type = "triangle";
  const now = c.currentTime;
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.16);
}
