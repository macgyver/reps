import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercises } from "@/lib/exercises/data";
import { getLastPerformances, getSession } from "@/lib/sessions/data";
import { formatSet } from "@/lib/sessions/format";
import { addExerciseToSession, removeSessionExercise } from "../../actions";
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

  let canStart = session.exercises.length > 0;
  let lastPerformances = await getLastPerformances(
    session.exercises.map((exercise) => exercise.exerciseId),
    id,
  );

  return (
    <main className={styles.main}>
      <h1>Design session</h1>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}

      <ul className={styles.exerciseList}>
        {session.exercises.map((exercise) => {
          let lastPerformance = lastPerformances.get(exercise.exerciseId);
          return (
            <li key={exercise.id} className={styles.exerciseRow}>
              <div>
                <span>{exercise.exerciseName}</span>
                {lastPerformance ? (
                  <p className={styles.lastTime}>
                    Last time: {lastPerformance.sets.map((set) => formatSet(set.weight, set.reps)).join(", ")}
                  </p>
                ) : null}
              </div>
              <form action={removeSessionExercise.bind(null, id, exercise.id)}>
                <SubmitButton
                  className={styles.removeButton}
                  gerund={`Removing ${exercise.exerciseName}`}
                >
                  Remove
                </SubmitButton>
              </form>
            </li>
          );
        })}
        {session.exercises.length === 0 ? (
          <li className={styles.empty}>No exercises yet.</li>
        ) : null}
      </ul>

      <ExercisePicker exercises={exercises} addAction={addExerciseToSession.bind(null, id)} />

      {canStart ? (
        <Link href={`/sessions/${id}`} className={styles.startButton}>
          Start session
        </Link>
      ) : null}
    </main>
  );
}
