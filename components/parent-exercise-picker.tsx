"use client";

import { useState } from "react";
import styles from "./parent-exercise-picker.module.scss";

function normalizeWords(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// A variant's name usually contains its parent's name plus extra qualifier
// words (e.g. "deficit curtsy squat" -> "curtsy squat"), so the best parent
// candidate is the shorter name with the most word overlap with the exercise
// being named. Requires a real match (score >= 0.5) — leaving it blank is
// correct when nothing is close.
function bestParentMatch(
  exerciseName: string,
  candidates: { id: string; name: string }[],
): { id: string; name: string } | null {
  let queryWords = normalizeWords(exerciseName);
  if (queryWords.length === 0) return null;
  let querySet = new Set(queryWords);

  let best: { id: string; name: string; score: number; wordCount: number } | null = null;
  for (let candidate of candidates) {
    let candWords = normalizeWords(candidate.name);
    if (candWords.length === 0 || candWords.length >= queryWords.length) continue;

    let overlap = candWords.filter((w) => querySet.has(w)).length;
    let unionSize = new Set([...querySet, ...candWords]).size;
    let score = overlap / unionSize;
    if (score < 0.5) continue;

    if (!best || score > best.score || (score === best.score && candWords.length > best.wordCount)) {
      best = { id: candidate.id, name: candidate.name, score, wordCount: candWords.length };
    }
  }
  return best;
}

export function ParentExercisePicker({
  name,
  exercises,
  exerciseName,
  defaultValue,
}: {
  name: string;
  exercises: { id: string; name: string }[];
  exerciseName: string;
  defaultValue?: string | null;
}) {
  let [selectedId, setSelectedId] = useState(defaultValue ?? "");
  let [isAuto, setIsAuto] = useState(!defaultValue);
  let [lastName, setLastName] = useState(exerciseName);

  if (exerciseName !== lastName) {
    setLastName(exerciseName);
    if (isAuto) {
      let match = bestParentMatch(exerciseName, exercises);
      setSelectedId(match?.id ?? "");
    }
  }

  let sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <select
      name={name}
      value={selectedId}
      onChange={(e) => {
        setSelectedId(e.target.value);
        setIsAuto(false);
      }}
      className={styles.select}
    >
      <option value="">No parent exercise</option>
      {sorted.map((exercise) => (
        <option key={exercise.id} value={exercise.id}>
          {exercise.name}
        </option>
      ))}
    </select>
  );
}
