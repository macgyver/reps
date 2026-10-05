import type { SessionWithSets } from "@/lib/sessions/data";
import { formatSet } from "@/lib/sessions/format";
import styles from "./completed-summary.module.scss";

export function CompletedSummary({ session }: { session: SessionWithSets }) {
  return (
    <main className={styles.main}>
      <h1>Session summary</h1>
      <p className={styles.date}>{new Date(session.createdAt).toLocaleString()}</p>

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
