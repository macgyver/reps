"use client";

import Link from "next/link";
import { useState } from "react";
import type { Exercise } from "@/lib/exercises/data";
import styles from "./exercise-list.module.scss";

export function ExerciseList({
  exercises,
  currentUserId,
}: {
  exercises: Exercise[];
  currentUserId: string | undefined;
}) {
  let [query, setQuery] = useState("");
  let filtered = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <input
        type="search"
        placeholder="Search exercises"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.search}
      />
      <ul className={styles.list}>
        {filtered.map((exercise) => (
          <li key={exercise.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.name}>{exercise.name}</span>
              {exercise.createdBy === currentUserId ? (
                <Link href={`/exercises/${exercise.id}/edit`} className={styles.editLink}>
                  Edit
                </Link>
              ) : null}
            </div>
            {exercise.description ? <p className={styles.description}>{exercise.description}</p> : null}
            {exercise.videoUrl ? (
              <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className={styles.video}>
                Watch demo
              </a>
            ) : null}
            {exercise.modifications.length > 0 ? (
              <p className={styles.modifications}>
                Modifications: {exercise.modifications.map((m) => m.name).join(", ")}
              </p>
            ) : null}
          </li>
        ))}
        {filtered.length === 0 ? <li className={styles.empty}>No exercises found.</li> : null}
      </ul>
    </div>
  );
}
