"use client";

import { useActionState } from "react";
import buttonStyles from "@/components/submit-button.module.scss";
import { SubmitButton } from "@/components/submit-button";
import { createExercise, type ExerciseFormState } from "../actions";
import styles from "../form.module.scss";

export default function NewExercisePage() {
  let [state, formAction] = useActionState<ExerciseFormState, FormData>(createExercise, null);

  return (
    <main className={styles.main}>
      <h1>New exercise</h1>
      <form action={formAction} className={styles.form}>
        <label htmlFor="name" className={styles.label}>
          Name
        </label>
        <input id="name" name="name" required autoFocus className={styles.input} />

{/*        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea id="description" name="description" rows={3} className={styles.textarea} />

        <label htmlFor="videoUrl" className={styles.label}>
          Video demo URL
        </label>
        <input id="videoUrl" name="videoUrl" type="url" className={styles.input} />
*/}
        {state && "error" in state ? (
          <p role="alert" className={styles.error}>
            {state.error}
          </p>
        ) : null}
        <SubmitButton className={buttonStyles.primary} gerund="Creating">
          Create
        </SubmitButton>
      </form>
    </main>
  );
}
