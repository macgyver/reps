"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import type { LoggedSet, SessionSupersetWithSets } from "@/lib/sessions/data";
import { completeSuperset, logSet, updateSet, type LogSetState } from "../actions";
import styles from "./run-session.module.scss";

export function RunSession({
  sessionId,
  superset,
  isLastSuperset,
}: {
  sessionId: string;
  superset: SessionSupersetWithSets;
  isLastSuperset: boolean;
}) {
  let [exerciseIndex, setExerciseIndex] = useState(0);
  let [checkedMods, setCheckedMods] = useState<string[]>([]);
  let [formKey, setFormKey] = useState(0);
  let [editingSet, setEditingSet] = useState<LoggedSet | null>(null);

  let exercisePosition = (exerciseIndex % superset.exercises.length) + 1;
  let exercise = superset.exercises[exerciseIndex % superset.exercises.length];
  let isSingleExercise = superset.exercises.length === 1;

  let action = editingSet
    ? updateSet.bind(null, sessionId, editingSet.id)
    : logSet.bind(null, sessionId, exercise.id);
  let [state, formAction] = useActionState<LogSetState, FormData>(action, null);

  let [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "success" in state) {
      setEditingSet(null);
      setCheckedMods([]);
      setFormKey((k) => k + 1);
    }
  }

  function toggleMod(id: string) {
    setCheckedMods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function nextExercise() {
    setExerciseIndex((i) => i + 1);
    setEditingSet(null);
    setCheckedMods([]);
    setFormKey((k) => k + 1);
  }

  function startEditingSet(set: LoggedSet) {
    setEditingSet(set);
    setCheckedMods(set.modifications.map((mod) => mod.modificationId));
  }

  function cancelEditingSet() {
    setEditingSet(null);
    setCheckedMods([]);
  }

  function renderSetRow(set: LoggedSet, index: number) {
    return (
      <li key={set.id} className={styles.previousSetRow}>
        <span className={styles.previousSetIndex}>Set {index + 1}</span>
        <span>
          {[set.weight != null ? `${set.weight} lb` : null, set.reps != null ? `${set.reps} reps` : null]
            .filter(Boolean)
            .join(" × ") || "—"}
        </span>
        {set.notes ? <span className={styles.previousSetNotes}>{set.notes}</span> : null}
        <button type="button" className={styles.editSetButton} onClick={() => startEditingSet(set)}>
          Edit
        </button>
      </li>
    );
  }

  // While editing a set, split the summary list around it so the form takes
  // that set's place in the order, instead of always trailing at the end.
  let editingIndex = editingSet ? exercise.sets.findIndex((set) => set.id === editingSet.id) : -1;
  let setsBeforeForm = editingIndex === -1 ? exercise.sets : exercise.sets.slice(0, editingIndex);
  let setsAfterForm = editingIndex === -1 ? [] : exercise.sets.slice(editingIndex + 1);

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <p className={styles.supersetLabel}>
          Superset {isSingleExercise ? "" : `— exercise ${exercisePosition} of ${superset.exercises.length}`}
        </p>
        <Link href={`/sessions/${sessionId}/design`} className={styles.editLink}>
          Edit session
        </Link>
      </div>
      <h1 className={styles.exerciseName}>
        <span className={styles.exercisePosition}>
          {exercisePosition}/{superset.exercises.length}
        </span>{" "}
        {exercise.exerciseName}
      </h1>

      {setsBeforeForm.length > 0 ? (
        <ul className={styles.previousSets}>
          {setsBeforeForm.map((set, i) => renderSetRow(set, i))}
        </ul>
      ) : null}

      <form key={editingSet ? `edit-${editingSet.id}` : `new-${formKey}`} action={formAction} className={styles.form}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.setLegend}>
            Set {editingSet ? editingIndex + 1 : exercise.sets.length + 1}
          </legend>
          <label className={styles.field}>
            Weight
            <input
              name="weight"
              type="number"
              step="any"
              inputMode="decimal"
              defaultValue={editingSet?.weight ?? undefined}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            Reps
            <input
              name="reps"
              type="number"
              inputMode="numeric"
              defaultValue={editingSet?.reps ?? undefined}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            Notes
            <textarea
              name="notes"
              rows={2}
              defaultValue={editingSet?.notes ?? undefined}
              className={styles.textarea}
            />
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
                      defaultValue={
                        editingSet?.modifications.find((m) => m.modificationId === mod.id)?.value ?? undefined
                      }
                      className={styles.modValue}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </fieldset>

        {state && "error" in state ? (
          <p role="alert" className={styles.formError}>
            {state.error}
          </p>
        ) : null}
        <div className={styles.formButtons}>
          <SubmitButton
            className={styles.logButton}
            gerund={editingSet ? "Updating set" : "Logging set"}
          >
            {editingSet ? "Update set" : "Log set"}
          </SubmitButton>
          {editingSet ? (
            <button type="button" className={styles.cancelEditButton} onClick={cancelEditingSet}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {setsAfterForm.length > 0 || editingSet ? (
        <ul className={styles.previousSets}>
          {setsAfterForm.map((set, i) => renderSetRow(set, editingIndex + 1 + i))}
          {editingSet ? (
            <li className={styles.previousSetRow}>
              <span className={styles.previousSetIndex}>Set {exercise.sets.length + 1}</span>
              <span className={styles.previousSetPlaceholder}>New set</span>
              <button type="button" className={styles.editSetButton} onClick={cancelEditingSet}>
                Add
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className={styles.navRow}>
        <button type="button" className={styles.nextButton} onClick={nextExercise}>
          {isSingleExercise ? "Next set" : "Next exercise"}
        </button>
        <form action={completeSuperset.bind(null, sessionId, superset.id)}>
          <SubmitButton
            className={styles.completeButton}
            gerund={isLastSuperset ? "Finishing session" : "Completing superset"}
          >
            {isLastSuperset ? "Finish session" : "Complete superset"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
