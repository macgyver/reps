import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercise } from "@/lib/exercises/data";
import { addModification, deleteModification, updateExercise } from "../../actions";
import styles from "../../form.module.scss";

export default async function EditExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  let { id } = await params;
  let { error, saved } = await searchParams;
  let [exercise, user] = await Promise.all([getExercise(id), getCurrentUser()]);

  if (!exercise) notFound();
  if (exercise.createdBy !== user?.id) redirect("/exercises");

  return (
    <main className={styles.main}>
      <h1>Edit exercise</h1>
      <form action={updateExercise.bind(null, exercise.id)} className={styles.form}>
        <label htmlFor="name" className={styles.label}>
          Name
        </label>
        <input id="name" name="name" defaultValue={exercise.name} required className={styles.input} />

        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={exercise.description ?? ""}
          className={styles.textarea}
        />

        <label htmlFor="videoUrl" className={styles.label}>
          Video demo URL
        </label>
        <input
          id="videoUrl"
          name="videoUrl"
          type="url"
          defaultValue={exercise.videoUrl ?? ""}
          className={styles.input}
        />

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
        {saved ? <p className={styles.success}>Saved.</p> : null}
        <button type="submit" className={styles.submit}>
          Save
        </button>
      </form>

      <section className={styles.modsSection}>
        <h2>Modifications</h2>
        <ul className={styles.modsList}>
          {exercise.modifications.map((mod) => (
            <li key={mod.id} className={styles.modRow}>
              <span>{mod.name}</span>
              <form action={deleteModification.bind(null, exercise.id, mod.id)}>
                <button type="submit" className={styles.removeButton} aria-label={`Remove ${mod.name}`}>
                  Remove
                </button>
              </form>
            </li>
          ))}
          {exercise.modifications.length === 0 ? (
            <li className={styles.empty}>No modifications yet.</li>
          ) : null}
        </ul>
        <form action={addModification.bind(null, exercise.id)} className={styles.addModForm}>
          <input name="name" placeholder="e.g. + twist" required className={styles.input} />
          <button type="submit" className={styles.addButton}>
            Add
          </button>
        </form>
      </section>
    </main>
  );
}
