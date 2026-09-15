import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercises } from "@/lib/exercises/data";
import { getSession } from "@/lib/sessions/data";
import {
  addExerciseToSuperset,
  addSuperset,
  removeSuperset,
  removeSupersetExercise,
} from "../../actions";
import { ExercisePicker } from "./exercise-picker";
import styles from "./page.module.scss";

export default async function DesignSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  let { id } = await params;
  let { error } = await searchParams;
  let [session, exercises, user] = await Promise.all([
    getSession(id),
    getExercises(),
    getCurrentUser(),
  ]);

  if (!session) notFound();
  if (session.userId !== user?.id) redirect("/");
  if (session.completedAt) redirect(`/sessions/${id}`);

  let canStart = session.supersets.some((superset) => superset.exercises.length > 0);

  return (
    <main className={styles.main}>
      <h1>Design session</h1>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}

      <ol className={styles.supersetList}>
        {session.supersets.map((superset, index) => (
          <li key={superset.id} className={styles.superset}>
            <div className={styles.supersetHeader}>
              <span>Superset {index + 1}</span>
              <form action={removeSuperset.bind(null, id, superset.id)}>
                <SubmitButton className={styles.removeButton} pendingLabel="Removing superset…">
                  Remove
                </SubmitButton>
              </form>
            </div>
            <ul className={styles.exerciseList}>
              {superset.exercises.map((exercise) => (
                <li key={exercise.id} className={styles.exerciseRow}>
                  <span>{exercise.exerciseName}</span>
                  <form action={removeSupersetExercise.bind(null, id, exercise.id)}>
                    <SubmitButton
                      className={styles.removeButton}
                      pendingLabel={`Removing ${exercise.exerciseName}…`}
                    >
                      Remove
                    </SubmitButton>
                  </form>
                </li>
              ))}
              {superset.exercises.length === 0 ? (
                <li className={styles.empty}>No exercises yet.</li>
              ) : null}
            </ul>
            <ExercisePicker
              exercises={exercises}
              addAction={addExerciseToSuperset.bind(null, id, superset.id)}
            />
          </li>
        ))}
      </ol>

      <form action={addSuperset.bind(null, id)}>
        <SubmitButton className={styles.addSupersetButton} fullWidth pendingLabel="Adding superset…">
          + Add superset
        </SubmitButton>
      </form>

      {canStart ? (
        <Link href={`/sessions/${id}`} className={styles.startButton}>
          Start session
        </Link>
      ) : null}
    </main>
  );
}
