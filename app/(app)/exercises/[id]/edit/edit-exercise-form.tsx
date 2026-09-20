"use client";

import { useActionState } from "react";
import buttonStyles from "@/components/submit-button.module.scss";
import { MuscleGroupPicker } from "@/components/muscle-group-picker";
import { SubmitButton } from "@/components/submit-button";
import type { Exercise } from "@/lib/exercises/data";
import { updateExercise, type ExerciseFormState } from "../../actions";
import styles from "../../form.module.scss";

export function EditExerciseForm({ exercise }: { exercise: Exercise }) {
  let updateThisExercise = updateExercise.bind(null, exercise.id);
  let [state, formAction] = useActionState<ExerciseFormState, FormData>(updateThisExercise, null);

  return (
    <form action={formAction} className={styles.form}>
      <label htmlFor="name" className={styles.label}>
        Name
      </label>
      <input id="name" name="name" defaultValue={exercise.name} required className={styles.input} />

      <label className={styles.label}>Muscle groups</label>
      <MuscleGroupPicker name="muscleGroup" defaultValue={exercise.muscleGroups} />
{/*
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
*/}
      {state && "error" in state ? (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      ) : null}
      <SubmitButton
        className={buttonStyles.primary}
        gerund="Saving"
        pastParticiple="Saved"
        succeeded={!!(state && "saved" in state)}
      >
        Save
      </SubmitButton>
    </form>
  );
}
