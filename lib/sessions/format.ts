export function formatSet(weight: number | null, reps: number | null): string {
  return (
    [weight != null ? `${weight} lb` : null, reps != null ? `${reps} reps` : null]
      .filter(Boolean)
      .join(" × ") || "—"
  );
}

// Day/month and hour/minute only — no year, no seconds. For a list of
// recent sessions, those two just add noise.
export function formatSessionDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Full month name, day only — e.g. "July 10" — for the small date label
// while running a session.
export function formatDateLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}
