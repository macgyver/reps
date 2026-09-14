"use client";

import { useState } from "react";
import type { SessionSuperset } from "@/lib/sessions/data";
import { completeSuperset, logSet } from "../actions";
import styles from "./run-session.module.scss";

export function RunSession({
  sessionId,
  superset,
  isLastSuperset,
}: {
  sessionId: string;
  superset: SessionSuperset;
  isLastSuperset: boolean;
}) {
  let [exerciseIndex, setExerciseIndex] = useState(0);
  let [checkedMods, setCheckedMods] = useState<string[]>([]);
  let [formKey, setFormKey] = useState(0);

  let exercise = superset.exercises[exerciseIndex % superset.exercises.length];
  let isSingleExercise = superset.exercises.length === 1;

  function toggleMod(id: string) {
    setCheckedMods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function nextExercise() {
    setExerciseIndex((i) => i + 1);
    setCheckedMods([]);
    setFormKey((k) => k + 1);
  }

  async function handleLogSet(formData: FormData) {
    await logSet(sessionId, exercise.id, formData);
    setCheckedMods([]);
    setFormKey((k) => k + 1);
  }

  return (
    <div className={styles.container}>
      <p className={styles.supersetLabel}>
        Superset {isSingleExercise ? "" : `— exercise ${(exerciseIndex % superset.exercises.length) + 1} of ${superset.exercises.length}`}
      </p>
      <h1 className={styles.exerciseName}>{exercise.exerciseName}</h1>

      <form key={formKey} action={handleLogSet} className={styles.form}>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            Weight
            <input name="weight" type="number" step="any" inputMode="decimal" className={styles.input} />
          </label>
          <label className={styles.field}>
            Reps
            <input name="reps" type="number" inputMode="numeric" className={styles.input} />
          </label>
        </div>
        <label className={styles.field}>
          Notes
          <textarea name="notes" rows={2} className={styles.textarea} />
        </label>

        {exercise.modifications.length > 0 ? (
          <div className={styles.modifications}>
            {exercise.modifications.map((mod) => (
              <div key={mod.id} className={styles.modRow}>
                <label className={styles.modLabel}>
                  <input
                    type="checkbox"
                    name="modification"
                    value={mod.id}
                    checked={checkedMods.includes(mod.id)}
                    onChange={() => toggleMod(mod.id)}
                  />
                  {mod.name}
                </label>
                {checkedMods.includes(mod.id) ? (
                  <input
                    type="text"
                    name={`modValue_${mod.id}`}
                    placeholder="value (optional)"
                    className={styles.modValue}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <button type="submit" className={styles.logButton}>
          Log set
        </button>
      </form>

      <div className={styles.navRow}>
        <button type="button" className={styles.nextButton} onClick={nextExercise}>
          {isSingleExercise ? "Next set" : "Next exercise"}
        </button>
        <form action={completeSuperset.bind(null, sessionId, superset.id)}>
          <button type="submit" className={styles.completeButton}>
            {isLastSuperset ? "Finish session" : "Complete superset"}
          </button>
        </form>
      </div>
    </div>
  );
}
