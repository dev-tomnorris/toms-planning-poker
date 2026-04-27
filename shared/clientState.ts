export type Phase = "voting" | "countdown" | "revealed";

export type ClientParticipant = {
  id: string;
  name: string;
  connected: boolean;
  hasVoted: boolean;
};

export type ClientState = {
  phase: Phase;
  countdown: number | null;
  participants: ClientParticipant[];
  votes?: Record<string, string>;
  storyTitle: string;
};
