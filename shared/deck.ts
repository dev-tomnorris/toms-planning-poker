/** Fibonacci planning deck + unknown — shared by server (validation) and client (UI). */
export const DECK = [
  "0",
  "½",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "20",
  "40",
  "100",
  "?",
] as const;

export type DeckValue = (typeof DECK)[number];

export const DECK_SET = new Set<string>(DECK);
