function numericValue(v: string): number | null {
  if (v === "?") return null;
  if (v === "½") return 0.5;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** True if every vote is the same string (including all "?"). */
export function isUnanimous(votes: Record<string, string>): boolean {
  const vals = Object.values(votes);
  if (vals.length <= 1) return false;
  const first = vals[0];
  return vals.every((v) => v === first);
}

export function modeVote(votes: Record<string, string>): string | null {
  const vals = Object.values(votes);
  if (vals.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of vals) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

export function averageNumeric(votes: Record<string, string>): number | null {
  const nums: number[] = [];
  for (const v of Object.values(votes)) {
    const n = numericValue(v);
    if (n !== null) nums.push(n);
  }
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}
