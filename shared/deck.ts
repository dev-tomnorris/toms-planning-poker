/** Modified Fibonacci planning deck + specials — shared by server (validation) and client (UI). */
export const DECK = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "89",
  "?",
  "coffee",
] as const;

export type DeckValue = (typeof DECK)[number];

export const DECK_SET = new Set<string>(DECK);

/** Point cards only (for layout); specials at end of DECK. */
export const DECK_POINT_CARDS = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "89",
] as const;

export const DECK_SPECIALS = ["?", "coffee"] as const;
