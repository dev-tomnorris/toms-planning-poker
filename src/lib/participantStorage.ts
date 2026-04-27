import { nanoid } from "nanoid";

const PARTICIPANT_KEY = "pp-participant-id";

export function getOrCreateParticipantId(): string {
  try {
    let id = localStorage.getItem(PARTICIPANT_KEY);
    if (!id) {
      id = nanoid();
      localStorage.setItem(PARTICIPANT_KEY, id);
    }
    return id;
  } catch {
    return nanoid();
  }
}

export function displayNameStorageKey(roomId: string): string {
  return `pp-display-name-${roomId}`;
}

export function getStoredDisplayName(roomId: string): string | null {
  try {
    return localStorage.getItem(displayNameStorageKey(roomId));
  } catch {
    return null;
  }
}

export function setStoredDisplayName(roomId: string, name: string): void {
  try {
    localStorage.setItem(displayNameStorageKey(roomId), name);
  } catch {
    /* ignore quota */
  }
}

export function clearStoredDisplayName(roomId: string): void {
  try {
    localStorage.removeItem(displayNameStorageKey(roomId));
  } catch {
    /* ignore */
  }
}
