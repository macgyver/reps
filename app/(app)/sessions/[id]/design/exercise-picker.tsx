"use client";

import { useId, useState, type RefObject } from "react";
import { enqueue } from "@/lib/changes/store";
import type { Exercise } from "@/lib/exercises/data";
import styles from "./exercise-picker.module.scss";

export function ExercisePicker({
  searchRef,
  sessionId,
  exercises,
  nextPosition,
}: {
  searchRef: RefObject<HTMLInputElement | null>;
  sessionId: string;
  exercises: Exercise[];
  nextPosition: number;
}) {
  let [query, setQuery] = useState("");
  let [activeIndex, setActiveIndex] = useState(-1);
  let listboxId = useId();

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
    setQuery("");
    setActiveIndex(-1);
    searchRef.current?.focus();
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
  }

  let options = [
    ...(trimmedQuery.length >= 3
      ? [{ key: "create", label: `+ Create \u201c${trimmedQuery}\u201d`, exercise: null }]
      : []),
    ...filtered.map((exercise) => ({ key: exercise.id, label: exercise.name, exercise })),
  ];
  let active = options[activeIndex];
  let optionId = (key: string) => `${listboxId}-${key}`;

  function select(option: (typeof options)[number]) {
    if (option.exercise) add(option.exercise.id, option.exercise.name);
    else createAndAdd();
  }

  function moveActive(index: number) {
    setActiveIndex(index);
    if (options[index]) document.getElementById(optionId(options[index].key))?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && options.length > 0) {
      e.preventDefault();
      moveActive(active ? (activeIndex + 1) % options.length : 0);
    } else if (e.key === "ArrowUp" && options.length > 0) {
      e.preventDefault();
      moveActive(active ? (activeIndex - 1 + options.length) % options.length : options.length - 1);
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      select(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (active) setActiveIndex(-1);
      else setQuery("");
    }
  }

  return (
    <div className={styles.picker}>
      <input
        ref={searchRef}
        type="search"
        role="combobox"
        aria-label="Search exercises to add"
        aria-autocomplete="list"
        aria-expanded={options.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={active ? optionId(active.key) : undefined}
        placeholder="Search exercises to add"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className={styles.search}
      />
      <ul id={listboxId} role="listbox" aria-label="Exercises" className={styles.results}>
        {options.map((option, index) => (
          <li
            key={option.key}
            id={optionId(option.key)}
            role="option"
            aria-selected={option === active}
            className={`${styles.option} ${option === active ? styles.optionActive : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select(option)}
            onMouseMove={() => index !== activeIndex && setActiveIndex(index)}
          >
            {option.label}
          </li>
        ))}
      </ul>
      {options.length === 0 ? <p className={styles.empty}>No matches.</p> : null}
      <p role="status" className={styles.srOnly}>
        {trimmedQuery ? `${filtered.length} ${filtered.length === 1 ? "match" : "matches"}` : ""}
      </p>
    </div>
  );
}
