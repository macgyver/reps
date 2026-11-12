"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChangeStatusMarker } from "@/components/change-status";
import { applyToExercises, applyToSession } from "@/lib/changes/apply";
import { useChanges } from "@/lib/changes/hooks";
import { enqueue } from "@/lib/changes/store";
import type { Exercise } from "@/lib/exercises/data";
import type { LastPerformance, Session } from "@/lib/sessions/data";
import { formatMonthDay, formatSet } from "@/lib/sessions/format";
import { useIsClient } from "@/lib/use-is-client";
import { ExercisePicker } from "./exercise-picker";
import styles from "./page.module.scss";

export function DesignSessionView({
  session: serverSession,
  exercises: serverExercises,
  lastPerformances,
}: {
  session: Session;
  exercises: Exercise[];
  lastPerformances: Record<string, LastPerformance>;
}) {
  let changes = useChanges();
  let isClient = useIsClient();
  let session = applyToSession(serverSession, changes);
  let exercises = applyToExercises(serverExercises, changes);
  let nextPosition = Math.max(-1, ...session.exercises.map((e) => e.position)) + 1;
  let removeButtons = useRef(new Map<string, HTMLButtonElement>());
  let searchRef = useRef<HTMLInputElement>(null);

  function remove(index: number) {
    let exercise = session.exercises[index];
    let neighbor = session.exercises[index + 1] ?? session.exercises[index - 1];
    (neighbor ? removeButtons.current.get(neighbor.id) : searchRef.current)?.focus();
    enqueue(
      { kind: "removeSessionExercise", sessionExerciseId: exercise.id, sessionId: session.id },
      `Removed ${exercise.exerciseName} from session`,
    );
  }

  return (
    <main className={styles.main}>
      <h1>Design session</h1>

      <ul className={styles.exerciseList}>
        {session.exercises.map((exercise, index) => {
          let lastPerformance = lastPerformances[exercise.exerciseId];
          return (
            <li key={exercise.id} className={styles.exerciseRow}>
              <div className={styles.exerciseInfo}>
                <span>{exercise.exerciseName}</span> <ChangeStatusMarker entityId={exercise.id} />
                {lastPerformance ? (
                  <p className={styles.lastTime}>
                    Last time{isClient ? ` (${formatMonthDay(lastPerformance.performedAt)})` : null}: {lastPerformance.sets.map((set) => formatSet(set.weight, set.reps)).join(", ")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                ref={(button) => {
                  if (button) removeButtons.current.set(exercise.id, button);
                  else removeButtons.current.delete(exercise.id);
                }}
                className={styles.removeButton}
                aria-label={`Remove ${exercise.exerciseName}`}
                onClick={() => remove(index)}
              >
                Remove
              </button>
            </li>
          );
        })}
        {session.exercises.length === 0 ? (
          <li className={styles.empty}>No exercises yet.</li>
        ) : null}
      </ul>

      <ExercisePicker searchRef={searchRef} sessionId={session.id} exercises={exercises} nextPosition={nextPosition} />

      {session.exercises.length > 0 ? (
        <Link href={`/sessions/${session.id}`} className={styles.startButton}>
          Start session
        </Link>
      ) : null}
    </main>
  );
}
