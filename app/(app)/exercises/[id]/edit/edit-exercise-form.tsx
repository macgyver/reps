"use client";

import { useState } from "react";
import buttonStyles from "@/components/submit-button.module.scss";
import { MuscleGroupPicker } from "@/components/muscle-group-picker";
import { ParentExercisePicker } from "@/components/parent-exercise-picker";
import { SubmitButton } from "@/components/submit-button";
import { applyToExercises } from "@/lib/changes/apply";
import { useChanges } from "@/lib/changes/hooks";
import { enqueue } from "@/lib/changes/store";
import type { Exercise } from "@/lib/exercises/data";
import { exerciseFields, failureMessage } from "../../exercise-fields";
import styles from "../../form.module.scss";

export function EditExerciseForm({
  exercise: serverExercise,
  otherExercises: serverOthers,
}: {
  exercise: Exercise;
  otherExercises: Exercise[];
}) {
  let all = applyToExercises([serverExercise, ...serverOthers], useChanges());
  let exercise = all.find((e) => e.id === serverExercise.id) ?? serverExercise;
  let otherExercises = all.filter((e) => e.id !== exercise.id);
  let [result, setResult] = useState<{ error: string } | { saved: true } | null>(null);
  let [name, setName] = useState(exercise.name);

  async function save(formData: FormData) {
    setResult(null);
    let fields = exerciseFields(formData);
    if (!fields) return setResult({ error: "Name is required" });
    let change = await enqueue(
      { kind: "updateExercise", exerciseId: exercise.id, ...fields },
      `Updated exercise ${fields.name}`,
    );
    setResult(change.status === "saved" ? { saved: true } : { error: failureMessage(change) });
  }

  return (
    <form action={save} className={styles.form}>
      <label htmlFor="name" className={styles.label}>
        Name
      </label>
      <input
        id="name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className={styles.input}
      />

      <label className={styles.label}>Muscle groups</label>
      <MuscleGroupPicker name="muscleGroup" defaultValue={exercise.muscleGroups} />

      <label htmlFor="parentExerciseId" className={styles.label}>
        Parent exercise
      </label>
      <ParentExercisePicker
        name="parentExerciseId"
        exercises={otherExercises}
        exerciseName={name}
        defaultValue={exercise.parentExerciseId}
      />
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
      {result && "error" in result ? (
        <p role="alert" className={styles.error}>
          {result.error}
        </p>
      ) : null}
      <SubmitButton
        className={buttonStyles.primary}
        gerund="Saving"
        pastParticiple="Saved"
        succeeded={!!(result && "saved" in result)}
      >
        Save
      </SubmitButton>
    </form>
  );
}
