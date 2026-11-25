"use client";

import Link from "next/link";
import { useState } from "react";
import { useChanges } from "@/lib/changes/hooks";
import { applyToSession } from "@/lib/changes/apply";
import { enqueue } from "@/lib/changes/store";
import type { LastPerformance, SessionWithSets } from "@/lib/sessions/data";
import { CompletedSummary } from "./completed-summary";
import { RunSession } from "./run-session";
import styles from "./page.module.scss";

export function SessionView({
  session: serverSession,
  lastPerformances,
}: {
  session: SessionWithSets;
  lastPerformances: Record<string, LastPerformance>;
}) {
  let session = applyToSession(serverSession, useChanges());
  let [focusHeading, setFocusHeading] = useState(false);

  if (session.completedAt) return <CompletedSummary session={session} />;

  if (session.exercises.length === 0) {
    return (
      <main className={styles.main}>
        <p>No exercises yet.</p>
        <Link href={`/sessions/${session.id}/design`} className={styles.editLink}>
          Add exercises
        </Link>
      </main>
    );
  }

  let currentIndex = Math.max(
    0,
    session.exercises.findIndex((exercise) => exercise.id === session.currentExerciseId),
  );
  let exercise = session.exercises[currentIndex];
  let prev = session.exercises[currentIndex - 1];
  let next = session.exercises[currentIndex + 1];

  function navigate(target: (typeof session.exercises)[number]) {
    enqueue(
      { kind: "setCurrentExercise", sessionId: session.id, sessionExerciseId: target.id },
      `Moved to ${target.exerciseName}`,
    );
    setFocusHeading(true);
  }

  function finish() {
    enqueue({ kind: "completeSession", sessionId: session.id, completedAt: new Date().toISOString() }, "Finished session");
  }

  return (
    <RunSession
      key={exercise.id}
      sessionId={session.id}
      createdAt={session.createdAt}
      exercise={exercise}
      position={currentIndex + 1}
      total={session.exercises.length}
      lastPerformance={lastPerformances[exercise.exerciseId] ?? null}
      onPrev={prev ? () => navigate(prev) : null}
      onNext={next ? () => navigate(next) : null}
      onFinish={finish}
      focusHeading={focusHeading}
    />
  );
}
