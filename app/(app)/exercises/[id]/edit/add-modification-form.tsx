"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { addModification, type AddModificationState } from "../../actions";
import styles from "../../form.module.scss";

export function AddModificationForm({ exerciseId }: { exerciseId: string }) {
  let addModificationToExercise = addModification.bind(null, exerciseId);
  let [state, formAction] = useActionState<AddModificationState, FormData>(
    addModificationToExercise,
    null,
  );
  let [formKey, setFormKey] = useState(0);

  let [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "added" in state) {
      setFormKey((k) => k + 1);
    }
  }

  return (
    <>
      <form key={formKey} action={formAction} className={styles.addModForm}>
        <input name="name" placeholder="e.g. + twist" required className={styles.input} />
        <SubmitButton className={styles.addButton} pendingLabel="Adding modification…">
          Add
        </SubmitButton>
      </form>
      {state && "error" in state ? (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      ) : null}
    </>
  );
}
