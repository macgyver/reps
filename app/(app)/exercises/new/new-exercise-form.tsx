"use client";

import { useActionState, useState } from "react";
import buttonStyles from "@/components/submit-button.module.scss";
import { MuscleGroupPicker } from "@/components/muscle-group-picker";
import { ParentExercisePicker } from "@/components/parent-exercise-picker";
import { SubmitButton } from "@/components/submit-button";
import type { Exercise } from "@/lib/exercises/data";
import { createExercise, type ExerciseFormState } from "../actions";
import styles from "../form.module.scss";

export function NewExerciseForm({ exercises }: { exercises: Exercise[] }) {
  let [state, formAction] = useActionState<ExerciseFormState, FormData>(createExercise, null);
  let [name, setName] = useState("");

  return (
    <form action={formAction} className={styles.form}>
      <label htmlFor="name" className={styles.label}>
        Name
      </label>
      <input
        id="name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        className={styles.input}
      />

      <label className={styles.label}>Muscle groups</label>
      <MuscleGroupPicker name="muscleGroup" />

      <label htmlFor="parentExerciseId" className={styles.label}>
        Parent exercise
      </label>
      <ParentExercisePicker name="parentExerciseId" exercises={exercises} exerciseName={name} />

{/*      <label htmlFor="description" className={styles.label}>
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
  );
}
