import { createExercise } from "../actions";
import styles from "../form.module.scss";

export default async function NewExercisePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let { error } = await searchParams;

  return (
    <main className={styles.main}>
      <h1>New exercise</h1>
      <form action={createExercise} className={styles.form}>
        <label htmlFor="name" className={styles.label}>
          Name
        </label>
        <input id="name" name="name" required autoFocus className={styles.input} />

        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea id="description" name="description" rows={3} className={styles.textarea} />

        <label htmlFor="videoUrl" className={styles.label}>
          Video demo URL
        </label>
        <input id="videoUrl" name="videoUrl" type="url" className={styles.input} />

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
        <button type="submit" className={styles.submit}>
          Create
        </button>
      </form>
    </main>
  );
}
