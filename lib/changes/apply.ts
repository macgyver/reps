import type { Exercise } from "@/lib/exercises/data";
import type { LoggedSet, Session, SessionExercise, SessionWithSets } from "@/lib/sessions/data";
import { getUserId, LOADED_AT } from "./store";
import type { Change } from "./types";

type OverlayExercise = SessionExercise & { sets?: LoggedSet[] };

function pending(changes: Change[]) {
  return changes.filter((c) => c.status !== "saved" || (c.savedAt ?? "") >= LOADED_AT);
}

export function applyToSession<T extends Session | SessionWithSets>(session: T, changes: Change[]): T {
  let exercises: OverlayExercise[] = session.exercises;
  let result = { ...session } as T;

  for (let { payload: p } of pending(changes)) {
    if (!("sessionId" in p) || p.sessionId !== session.id) continue;

    if (p.kind === "updateSessionDate") {
      result.createdAt = p.createdAt;
    } else if (p.kind === "addSessionExercise") {
      if (exercises.some((e) => e.id === p.sessionExerciseId)) continue;
      exercises = [
        ...exercises,
        {
          id: p.sessionExerciseId,
          position: p.position,
          completedAt: null,
          exerciseId: p.exerciseId,
          exerciseName: p.exerciseName,
          sets: [],
        },
      ].sort((a, b) => a.position - b.position);
    } else if (p.kind === "removeSessionExercise") {
      exercises = exercises.filter((e) => e.id !== p.sessionExerciseId);
    } else if (p.kind === "logSet") {
      exercises = exercises.map((e) =>
        e.id !== p.sessionExerciseId || !e.sets || e.sets.some((s) => s.id === p.setId)
          ? e
          : {
              ...e,
              sets: [
                ...e.sets,
                { id: p.setId, performedAt: p.performedAt, weight: p.weight, reps: p.reps, notes: p.notes },
              ],
            },
      );
    } else if (p.kind === "updateSet") {
      exercises = exercises.map((e) =>
        e.id !== p.sessionExerciseId || !e.sets
          ? e
          : {
              ...e,
              sets: e.sets.map((s) =>
                s.id === p.setId ? { ...s, weight: p.weight, reps: p.reps, notes: p.notes } : s,
              ),
            },
      );
    } else if (p.kind === "completeExercise") {
      exercises = exercises.map((e) =>
        e.id === p.sessionExerciseId && !e.completedAt ? { ...e, completedAt: p.completedAt } : e,
      );
      if (exercises.every((e) => e.completedAt)) result.completedAt ??= p.completedAt;
    }
  }

  result.exercises = exercises as T["exercises"];
  return result;
}

export function applyToSessions(sessions: SessionWithSets[], changes: Change[]): SessionWithSets[] {
  let known = new Set(sessions.map((s) => s.id));
  let created: SessionWithSets[] = [];
  for (let { payload: p } of pending(changes)) {
    if (p.kind !== "createSession" || known.has(p.sessionId)) continue;
    known.add(p.sessionId);
    created.push({
      id: p.sessionId,
      userId: getUserId() ?? "",
      createdAt: p.createdAt,
      completedAt: null,
      exercises: [],
    });
  }
  return [...created, ...sessions]
    .map((s) => applyToSession(s, changes))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function applyToExercises(exercises: Exercise[], changes: Change[]): Exercise[] {
  let list = exercises;
  for (let { payload: p } of pending(changes)) {
    if (p.kind === "createExercise") {
      if (list.some((e) => e.id === p.exerciseId)) continue;
      list = [
        ...list,
        {
          id: p.exerciseId,
          name: p.name,
          description: p.description,
          videoUrl: p.videoUrl,
          muscleGroups: p.muscleGroups,
          createdBy: getUserId() ?? "",
          parentExerciseId: p.parentExerciseId,
          parentExerciseName: null,
        },
      ];
    } else if (p.kind === "updateExercise") {
      list = list.map((e) =>
        e.id === p.exerciseId
          ? {
              ...e,
              name: p.name,
              description: p.description,
              videoUrl: p.videoUrl,
              muscleGroups: p.muscleGroups,
              parentExerciseId: p.parentExerciseId,
            }
          : e,
      );
    }
  }
  if (list === exercises) return list;

  let names = new Map(list.map((e) => [e.id, e.name]));
  return list
    .map((e) => ({
      ...e,
      parentExerciseName: e.parentExerciseId
        ? (names.get(e.parentExerciseId) ?? e.parentExerciseName)
        : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
