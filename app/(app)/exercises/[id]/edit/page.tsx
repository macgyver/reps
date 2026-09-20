import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercise } from "@/lib/exercises/data";
import { deleteModification } from "../../actions";
import styles from "../../form.module.scss";
import { AddModificationForm } from "./add-modification-form";
import { EditExerciseForm } from "./edit-exercise-form";

export default async function EditExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  let { id } = await params;
  let { error: deleteError } = await searchParams;
  let [exercise, user] = await Promise.all([getExercise(id), getCurrentUser()]);

  if (!exercise) notFound();
  if (exercise.createdBy !== user?.id) redirect("/exercises");

  return (
    <main className={styles.main}>
      <h1>Edit exercise</h1>
      <EditExerciseForm exercise={exercise} />

      <section className={styles.modsSection}>
        <h2>Modifications</h2>
        {deleteError ? (
          <p role="alert" className={styles.error}>
            {deleteError}
          </p>
        ) : null}
        <ul className={styles.modsList}>
          {exercise.modifications.map((mod) => (
            <li key={mod.id} className={styles.modRow}>
              <span>{mod.name}</span>
              <form action={deleteModification.bind(null, exercise.id, mod.id)}>
                <SubmitButton
                  className={styles.removeButton}
                  aria-label={`Remove ${mod.name}`}
                  gerund={`Removing ${mod.name}`}
                >
                  Remove
                </SubmitButton>
              </form>
            </li>
          ))}
          {exercise.modifications.length === 0 ? (
            <li className={styles.empty}>No modifications yet.</li>
          ) : null}
        </ul>
        <AddModificationForm exerciseId={exercise.id} />
      </section>
    </main>
  );
}
