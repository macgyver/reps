"use client";

import Link from "next/link";
import { useState } from "react";
import type { Exercise } from "@/lib/exercises/data";
import styles from "./exercise-list.module.scss";

function ExerciseRow({
  exercise,
  currentUserId,
}: {
  exercise: Exercise;
  currentUserId: string | undefined;
}) {
  return (
    <>
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
    </>
  );
}

// A root exercise plus a collapsed-by-default disclosure for the exercises
// that name it as their parent — recurses so a variant can itself have
// variants.
function ExerciseNode({
  exercise,
  childrenByParent,
  currentUserId,
}: {
  exercise: Exercise;
  childrenByParent: Map<string, Exercise[]>;
  currentUserId: string | undefined;
}) {
  let children = childrenByParent.get(exercise.id) ?? [];

  return (
    <li className={styles.item}>
      <ExerciseRow exercise={exercise} currentUserId={currentUserId} />
      {children.length > 0 ? (
        <details className={styles.variants}>
          <summary className={styles.variantsToggle}>
            {children.length} variant{children.length === 1 ? "" : "s"}
          </summary>
          <ul className={styles.variantsList}>
            {children.map((child) => (
              <ExerciseNode
                key={child.id}
                exercise={child}
                childrenByParent={childrenByParent}
                currentUserId={currentUserId}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

export function ExerciseList({
  exercises,
  currentUserId,
}: {
  exercises: Exercise[];
  currentUserId: string | undefined;
}) {
  let [query, setQuery] = useState("");
  let searching = query.trim().length > 0;
  let filtered = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase()),
  );

  let idSet = new Set(exercises.map((e) => e.id));
  let isRoot = (exercise: Exercise) =>
    !exercise.parentExerciseId || !idSet.has(exercise.parentExerciseId);
  let roots = exercises.filter(isRoot);

  let childrenByParent = new Map<string, Exercise[]>();
  for (let exercise of exercises) {
    if (isRoot(exercise)) continue;
    let siblings = childrenByParent.get(exercise.parentExerciseId!) ?? [];
    siblings.push(exercise);
    childrenByParent.set(exercise.parentExerciseId!, siblings);
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search exercises"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.search}
      />
      {searching ? (
        <ul className={styles.list}>
          {filtered.map((exercise) => (
            <li key={exercise.id} className={styles.item}>
              <ExerciseRow exercise={exercise} currentUserId={currentUserId} />
              {exercise.parentExerciseName ? (
                <p className={styles.parent}>Variant of: {exercise.parentExerciseName}</p>
              ) : null}
            </li>
          ))}
          {filtered.length === 0 ? <li className={styles.empty}>No exercises found.</li> : null}
        </ul>
      ) : (
        <ul className={styles.list}>
          {roots.map((exercise) => (
            <ExerciseNode
              key={exercise.id}
              exercise={exercise}
              childrenByParent={childrenByParent}
              currentUserId={currentUserId}
            />
          ))}
          {roots.length === 0 ? <li className={styles.empty}>No exercises found.</li> : null}
        </ul>
      )}
    </div>
  );
}
