/** PartyKit / PartySocket host (no protocol): e.g. `127.0.0.1:1999` or `myproj.username.partykit.dev` */
export function partyKitHost(): string {
  const env = import.meta.env.VITE_PARTYKIT_HOST;
  if (env && env.trim()) return env.trim();
  return "127.0.0.1:1999";
}
