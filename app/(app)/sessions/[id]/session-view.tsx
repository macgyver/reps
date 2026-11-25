"use client";

import Link from "next/link";
import { useState } from "react";
import { useChanges } from "@/lib/changes/hooks";
import { applyToSession } from "@/lib/changes/apply";
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
  let [viewedId, setViewedId] = useState<string | null>(null);
  let designHref = `/sessions/${session.id}/design`;

  if (session.completedAt) return <CompletedSummary session={session} />;

  if (session.exercises.length === 0) {
    return (
      <main className={styles.main}>
        <p>No exercises yet.</p>
        <Link href={designHref} className={styles.editLink}>
          Add exercises
        </Link>
      </main>
    );
  }

  let viewedIndex = session.exercises.findIndex((exercise) => exercise.id === viewedId);
  let currentIndex =
    viewedIndex !== -1 ? viewedIndex : session.exercises.findIndex((exercise) => !exercise.completedAt);
  if (currentIndex === -1) {
    return (
      <main className={styles.main}>
        <p>All exercises are complete.</p>
        <Link href={designHref} className={styles.editLink}>
          Edit session
        </Link>
      </main>
    );
  }

  let exercise = session.exercises[currentIndex];
  return (
    <RunSession
      key={exercise.id}
      sessionId={session.id}
      createdAt={session.createdAt}
      exercise={exercise}
      position={currentIndex + 1}
      total={session.exercises.length}
      isLastExercise={session.exercises.every((e) => e.id === exercise.id || e.completedAt)}
      lastPerformance={lastPerformances[exercise.exerciseId] ?? null}
      prevId={session.exercises[currentIndex - 1]?.id ?? null}
      nextId={session.exercises[currentIndex + 1]?.id ?? null}
      onNavigate={setViewedId}
    />
  );
}
