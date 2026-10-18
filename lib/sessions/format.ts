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
