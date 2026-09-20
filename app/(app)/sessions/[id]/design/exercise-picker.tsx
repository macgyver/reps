"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import type { Exercise } from "@/lib/exercises/data";
import styles from "./exercise-picker.module.scss";

export function ExercisePicker({
  exercises,
  addAction,
}: {
  exercises: Exercise[];
  addAction: (formData: FormData) => void;
}) {
  let [query, setQuery] = useState("");
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
        {filtered.length === 0 ? <li className={styles.empty}>No matches.</li> : null}
      </ul>
    </div>
  );
}
