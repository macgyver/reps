"use client";

import { useState } from "react";
import { enqueue } from "@/lib/changes/store";
import type { Exercise } from "@/lib/exercises/data";
import styles from "./exercise-picker.module.scss";

export function ExercisePicker({
  sessionId,
  exercises,
  nextPosition,
}: {
  sessionId: string;
  exercises: Exercise[];
  nextPosition: number;
}) {
  let [query, setQuery] = useState("");

  let trimmedQuery = query.trim();
  let filtered = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase()),
  );

  function add(exerciseId: string, exerciseName: string) {
    enqueue(
      {
        kind: "addSessionExercise",
        sessionExerciseId: crypto.randomUUID(),
        sessionId,
        exerciseId,
        exerciseName,
        position: nextPosition,
      },
      `Added ${exerciseName} to session`,
    );
  }

  function createAndAdd() {
    let exerciseId = crypto.randomUUID();
    enqueue(
      {
        kind: "createExercise",
        exerciseId,
        name: trimmedQuery,
        description: null,
        videoUrl: null,
        muscleGroups: [],
        parentExerciseId: null,
      },
      `Created exercise ${trimmedQuery}`,
    );
    add(exerciseId, trimmedQuery);
    setQuery("");
  }

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
            <button
              type="button"
              className={styles.resultButton}
              onClick={() => add(exercise.id, exercise.name)}
            >
              {exercise.name}
            </button>
          </li>
        ))}
        {filtered.length === 0 && trimmedQuery ? (
          <li>
            <button type="button" className={styles.resultButton} onClick={createAndAdd}>
              + Create &ldquo;{trimmedQuery}&rdquo;
            </button>
          </li>
        ) : null}
        {filtered.length === 0 && !trimmedQuery ? <li className={styles.empty}>No matches.</li> : null}
      </ul>
    </div>
  );
}
