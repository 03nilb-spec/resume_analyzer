export function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function clampScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function containsTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flexible = escaped.replace(/\\ /g, "\\s+");
  return new RegExp(`(^|[^a-z0-9+#.])${flexible}([^a-z0-9+#.]|$)`, "i").test(text);
}
