const TIME_ZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

export function formatDateTime(value: Date | string | undefined): string {
  if (!value) return "—";
  return dateTime.format(new Date(value));
}

export function formatDuration(from: Date | undefined, to: Date | undefined): string {
  if (!from || !to) return "—";
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
