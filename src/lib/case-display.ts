const COMPACT_LIMIT = 60;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parameterNames(starterCode: string, functionName: string, count: number): string[] {
  const fallback = Array.from({ length: count }, (_, index) => (count === 1 ? "input" : `input ${index + 1}`));
  const match = new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\(([^)]*)\\)`).exec(starterCode);
  if (!match) return fallback;
  const names = match[1]
    .split(",")
    .map((part) => part.trim().replace(/^\.\.\./, "").split("=")[0].trim())
    .filter(Boolean);
  if (names.length !== count || names.some((name) => !/^[A-Za-z_$][\w$]*$/.test(name))) return fallback;
  return names;
}

export function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  const compact = JSON.stringify(value);
  if (compact === undefined) return String(value);
  if (compact.length <= COMPACT_LIMIT) return JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");
  return JSON.stringify(value, null, 2);
}

export function formatShownValue(shown: string): string {
  if (shown === "undefined") return shown;
  try {
    return formatValue(JSON.parse(shown));
  } catch {
    return shown;
  }
}
