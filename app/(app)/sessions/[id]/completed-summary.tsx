"use client";

import { PopoverButton } from "@/components/popover-button";
import { useIsClient } from "@/lib/use-is-client";
import type { SessionWithSets } from "@/lib/sessions/data";
import { formatSet } from "@/lib/sessions/format";
import styles from "./completed-summary.module.scss";

function toPlainText(session: SessionWithSets): string {
  let date = new Date(session.createdAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let lines = [`Workout, ${date}`];
  for (let exercise of session.exercises) {
    lines.push("", exercise.exerciseName);
    if (exercise.sets.length === 0) lines.push("  No sets logged");
    exercise.sets.forEach((set, i) => {
      lines.push(`  ${i + 1}. ${formatSet(set.weight, set.reps)}${set.notes ? ` (${set.notes})` : ""}`);
    });
  }
  return lines.join("\n");
}

export function CompletedSummary({ session }: { session: SessionWithSets }) {
  let isClient = useIsClient();
  let canShare = isClient && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(toPlainText(session));
      return { text: "Copied to clipboard!" };
    } catch {
      return { text: "Couldn’t copy", isError: true };
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "Workout", text: toPlainText(session) });
      return null;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null;
      return { text: "Couldn’t share — try Copy as text", isError: true };
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.titleRow}>
        <h1>Session summary</h1>
        <div className={styles.shareButtons}>
          {canShare ? (
            <PopoverButton className={styles.copyButton} action={share}>
              <svg className={styles.buttonIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 15V3M7 8l5-5 5 5M5 12v8h14v-8" />
              </svg>
              Share
            </PopoverButton>
          ) : null}
          <PopoverButton className={styles.copyButton} action={copy}>
            <svg className={styles.buttonIcon} viewBox="0 0 24 24" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
            </svg>
            Copy as text
          </PopoverButton>
        </div>
      </div>
      <p className={styles.date}>{isClient ? new Date(session.createdAt).toLocaleString() : null}</p>

      <ol className={styles.exerciseList}>
        {session.exercises.map((exercise) => (
          <li key={exercise.id} className={styles.exercise}>
            <h2>{exercise.exerciseName}</h2>
            {exercise.sets.length === 0 ? (
              <p className={styles.empty}>No sets logged.</p>
            ) : (
              <ul className={styles.setList}>
                {exercise.sets.map((set, setIndex) => (
                  <li key={set.id} className={styles.set}>
                    <span className={styles.setIndex}>#{setIndex + 1}</span>
                    <span>{formatSet(set.weight, set.reps)}</span>
                    {set.notes ? <span className={styles.notes}>{set.notes}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
