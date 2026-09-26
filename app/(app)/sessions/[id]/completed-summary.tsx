import type { SessionWithSets } from "@/lib/sessions/data";
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
                    <span>
                      {set.weight != null ? `${set.weight} lb` : null}
                      {set.weight != null && set.reps != null ? " × " : null}
                      {set.reps != null ? `${set.reps} reps` : null}
                      {set.weight == null && set.reps == null ? "—" : null}
                    </span>
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
