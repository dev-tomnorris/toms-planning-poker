const STORAGE_KEY = "pp-theme";

/** `terminal` = phosphor green CRT (default); `paper` = amber/light terminal for contrast */
export type Theme = "terminal" | "paper";

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "terminal" || v === "paper") return v;
    // Migrate legacy keys
    if (v === "dark") return "terminal";
    if (v === "light") return "paper";
  } catch {
    /* ignore */
  }
  return "terminal";
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
