"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import type { Exercise } from "@/lib/exercises/data";
import type { CreateExerciseState } from "../../actions";
import styles from "./exercise-picker.module.scss";

export function ExercisePicker({
  exercises,
  addAction,
  createAndAddAction,
}: {
  exercises: Exercise[];
  addAction: (formData: FormData) => void;
  createAndAddAction: (prevState: CreateExerciseState, formData: FormData) => Promise<CreateExerciseState>;
}) {
  let [query, setQuery] = useState("");
  let [createState, createFormAction] = useActionState<CreateExerciseState, FormData>(
    createAndAddAction,
    null,
  );

  // Clear the search after a new exercise is created and added, instead of
  // leaving its name sitting in the box (now matching the exercise that's
  // already been added).
  let [handledCreateState, setHandledCreateState] = useState(createState);
  if (createState !== handledCreateState) {
    setHandledCreateState(createState);
    if (createState?.created) setQuery("");
  }

  let trimmedQuery = query.trim();
  let filtered = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className={styles.picker}>
      <input
        type="search"
        placeholder="Search exercises to add"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.search}
      />
      <ul className={styles.results}>
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <form action={addAction}>
              <input type="hidden" name="exerciseId" value={exercise.id} />
              <SubmitButton className={styles.resultButton} gerund={`Adding ${exercise.name}`}>
                {exercise.name}
              </SubmitButton>
            </form>
          </li>
        ))}
        {filtered.length === 0 && trimmedQuery ? (
          <li>
            <form action={createFormAction}>
              <input type="hidden" name="name" value={trimmedQuery} />
              <SubmitButton className={styles.resultButton} gerund={`Creating ${trimmedQuery}`}>
                + Create &ldquo;{trimmedQuery}&rdquo;
              </SubmitButton>
            </form>
          </li>
        ) : null}
        {filtered.length === 0 && !trimmedQuery ? <li className={styles.empty}>No matches.</li> : null}
      </ul>
    </div>
  );
}
