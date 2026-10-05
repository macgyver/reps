export function formatSet(weight: number | null, reps: number | null): string {
  return (
    [weight != null ? `${weight} lb` : null, reps != null ? `${reps} reps` : null]
      .filter(Boolean)
      .join(" × ") || "—"
  );
}
