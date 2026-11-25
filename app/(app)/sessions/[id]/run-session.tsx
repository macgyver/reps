"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChangeStatusMarker } from "@/components/change-status";
import { enqueue } from "@/lib/changes/store";
import { optionalText, parseNumber } from "@/lib/form";
import type { LastPerformance, LoggedSet, SessionExerciseWithSets } from "@/lib/sessions/data";
import { formatMonthDay, formatSet } from "@/lib/sessions/format";
import { useIsClient } from "@/lib/use-is-client";
import { SessionDateEditor } from "./session-date-editor";
import styles from "./run-session.module.scss";

export function RunSession({
  sessionId,
  createdAt,
  exercise,
  position,
  total,
  isLastExercise,
  lastPerformance,
  prevId,
  nextId,
  onNavigate,
  focusHeading,
}: {
  sessionId: string;
  createdAt: string;
  exercise: SessionExerciseWithSets;
  position: number;
  total: number;
  isLastExercise: boolean;
  lastPerformance: LastPerformance | null;
  prevId: string | null;
  nextId: string | null;
  onNavigate: (sessionExerciseId: string | null) => void;
  focusHeading: boolean;
}) {
  let headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusHeading) headingRef.current?.focus();
  }, [focusHeading]);

  let [formKey, setFormKey] = useState(0);
  let isClient = useIsClient();
  let [editingSet, setEditingSet] = useState<LoggedSet | null>(null);

  function saveSet(formData: FormData) {
    let fields = {
      sessionId,
      sessionExerciseId: exercise.id,
      weight: parseNumber(formData, "weight"),
      reps: parseNumber(formData, "reps"),
      notes: optionalText(formData, "notes"),
    };
    let summary = `${formatSet(fields.weight, fields.reps)} · ${exercise.exerciseName}`;
    if (editingSet) {
      enqueue({ kind: "updateSet", setId: editingSet.id, ...fields }, `Updated set to ${summary}`);
    } else {
      let performedAt = new Date().toISOString();
      enqueue({ kind: "logSet", setId: crypto.randomUUID(), performedAt, ...fields }, `Logged ${summary}`);
    }
    setEditingSet(null);
    setFormKey((k) => k + 1);
  }

  function completeExercise() {
    let completedAt = new Date().toISOString();
    let label = isLastExercise ? "Finished session" : `Completed ${exercise.exerciseName}`;
    enqueue({ kind: "completeExercise", sessionId, sessionExerciseId: exercise.id, completedAt }, label);
    onNavigate(null);
  }

  function saveSetAndComplete(formData: FormData) {
    saveSet(formData);
    completeExercise();
  }

  function startEditingSet(set: LoggedSet) {
    setEditingSet(set);
  }

  function cancelEditingSet() {
    setEditingSet(null);
  }

  function renderSetRow(set: LoggedSet, index: number) {
    return (
      <li key={set.id} className={styles.previousSetRow}>
        <span className={styles.previousSetIndex}>Set {index + 1}</span>
        <span>{formatSet(set.weight, set.reps)}</span>
        {set.notes ? <span className={styles.previousSetNotes}>{set.notes}</span> : null}
        <ChangeStatusMarker entityId={set.id} />
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
        <SessionDateEditor sessionId={sessionId} createdAt={createdAt} />
        <Link href={`/sessions/${sessionId}/design`} className={styles.editLink}>
          Edit session
        </Link>
      </div>
      <nav className={styles.stepNav} aria-label="Exercises">
        <button
          type="button"
          className={styles.stepButton}
          aria-label="Previous exercise"
          disabled={!prevId}
          onClick={() => onNavigate(prevId)}
        >
          <svg className={styles.chevron} viewBox="0 0 10 16" aria-hidden="true">
            <path d="M7.5 2.5 2.5 8l5 5.5" />
          </svg>
          Previous
        </button>
        <p className={styles.positionLabel}>
          Exercise {position} of {total}
        </p>
        <button
          type="button"
          className={`${styles.stepButton} ${styles.stepNext}`}
          aria-label="Next exercise"
          disabled={!nextId}
          onClick={() => onNavigate(nextId)}
        >
          Next
          <svg className={styles.chevron} viewBox="0 0 10 16" aria-hidden="true">
            <path d="m2.5 2.5 5 5.5-5 5.5" />
          </svg>
        </button>
      </nav>
      <h1 ref={headingRef} tabIndex={-1} className={styles.exerciseName}>{exercise.exerciseName}</h1>
      {lastPerformance ? (
        <p className={styles.lastTime}>
          Last time{isClient ? ` (${formatMonthDay(lastPerformance.performedAt)})` : null}: {lastPerformance.sets.map((set) => formatSet(set.weight, set.reps)).join(", ")}
        </p>
      ) : null}
      {exercise.sets.length > 0 ? (
        <p className={styles.lastTime}>
          This session: {exercise.sets.map((set) => formatSet(set.weight, set.reps)).join(", ")}
        </p>
      ) : null}

      {setsBeforeForm.length > 0 ? (
        <ul className={styles.previousSets}>
          {setsBeforeForm.map((set, i) => renderSetRow(set, i))}
        </ul>
      ) : null}

      <form key={editingSet ? `edit-${editingSet.id}` : `new-${formKey}`} action={saveSet} className={styles.form}>
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
        </fieldset>

        <div className={styles.formButtons}>
          <button type="submit" className={styles.logButton}>
            {editingSet ? "Update set" : "Log set"}
          </button>
          {editingSet ? (
            <button type="button" className={styles.cancelEditButton} onClick={cancelEditingSet}>
              Cancel
            </button>
          ) : null}
        </div>
        {editingSet || exercise.completedAt ? null : (
          <button type="submit" formAction={saveSetAndComplete} className={styles.logAndCompleteButton}>
            {isLastExercise ? "Log set and finish session" : "Log set and complete exercise"}
          </button>
        )}
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

      {exercise.completedAt ? null : (
        <div className={styles.navRow}>
          <button type="button" className={styles.completeButton} onClick={completeExercise}>
            {isLastExercise ? "Finish session" : "Complete exercise"}
          </button>
        </div>
      )}

    </div>
  );
}
