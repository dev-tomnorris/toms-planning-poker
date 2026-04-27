/** Display label for a wire vote value (server stores ASCII tokens). */
export function cardDisplayLabel(wire: string): string {
  switch (wire) {
    case "coffee":
      return "☕";
    default:
      return wire;
  }
}
