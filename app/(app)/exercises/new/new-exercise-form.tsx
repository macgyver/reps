"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import buttonStyles from "@/components/submit-button.module.scss";
import { MuscleGroupPicker } from "@/components/muscle-group-picker";
import { ParentExercisePicker } from "@/components/parent-exercise-picker";
import { SubmitButton } from "@/components/submit-button";
import { applyToExercises } from "@/lib/changes/apply";
import { useChanges } from "@/lib/changes/hooks";
import { enqueue } from "@/lib/changes/store";
import type { Exercise } from "@/lib/exercises/data";
import { exerciseFields, failureMessage } from "../exercise-fields";
import styles from "../form.module.scss";

export function NewExerciseForm({ exercises: serverExercises }: { exercises: Exercise[] }) {
  let router = useRouter();
  let exercises = applyToExercises(serverExercises, useChanges());
  let [error, setError] = useState<string | null>(null);
  let [name, setName] = useState("");

  async function create(formData: FormData) {
    setError(null);
    let fields = exerciseFields(formData);
    if (!fields) return setError("Name is required");
    let exerciseId = crypto.randomUUID();
    let change = await enqueue(
      { kind: "createExercise", exerciseId, ...fields },
      `Created exercise ${fields.name}`,
    );
    if (change.status === "saved") router.push(`/exercises/${exerciseId}/edit`);
    else setError(failureMessage(change));
  }

  return (
    <form action={create} className={styles.form}>
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
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <SubmitButton className={buttonStyles.primary} gerund="Creating">
        Create
      </SubmitButton>
    </form>
  );
}
