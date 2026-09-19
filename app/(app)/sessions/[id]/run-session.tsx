"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import type { SessionSuperset } from "@/lib/sessions/data";
import { completeSuperset, logSet, type LogSetState } from "../actions";
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

  let logSetForExercise = logSet.bind(null, sessionId, exercise.id);
  let [state, formAction] = useActionState<LogSetState, FormData>(logSetForExercise, null);

  let [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "success" in state) {
      setCheckedMods([]);
      setFormKey((k) => k + 1);
    }
  }

  function toggleMod(id: string) {
    setCheckedMods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function nextExercise() {
    setExerciseIndex((i) => i + 1);
    setCheckedMods([]);
    setFormKey((k) => k + 1);
  }

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <p className={styles.supersetLabel}>
          Superset {isSingleExercise ? "" : `— exercise ${(exerciseIndex % superset.exercises.length) + 1} of ${superset.exercises.length}`}
        </p>
        <Link href={`/sessions/${sessionId}/design`} className={styles.editLink}>
          Edit session
        </Link>
      </div>
      <h1 className={styles.exerciseName}>{exercise.exerciseName}</h1>

      <form key={formKey} action={formAction} className={styles.form}>
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

        {state && "error" in state ? (
          <p role="alert" className={styles.formError}>
            {state.error}
          </p>
        ) : null}
        <SubmitButton className={styles.logButton} fullWidth pendingLabel="Logging set…">
          Log set
        </SubmitButton>
      </form>

      <div className={styles.navRow}>
        <button type="button" className={styles.nextButton} onClick={nextExercise}>
          {isSingleExercise ? "Next set" : "Next exercise"}
        </button>
        <form action={completeSuperset.bind(null, sessionId, superset.id)}>
          <SubmitButton
            className={styles.completeButton}
            fullWidth
            pendingLabel={isLastSuperset ? "Finishing session…" : "Completing superset…"}
          >
            {isLastSuperset ? "Finish session" : "Complete superset"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
