import type { Change, ChangePayload } from "./types";

type Refs = { creates: string[]; requires: string[]; writes: string[] };

function ids(...values: (string | null)[]): string[] {
  return values.filter((v) => v !== null);
}

export function getRefs(payload: ChangePayload): Refs {
  switch (payload.kind) {
    case "createSession":
      return { creates: [payload.sessionId], requires: [], writes: [] };
    case "updateSessionDate":
      return { creates: [], requires: [payload.sessionId], writes: [payload.sessionId] };
    case "createExercise":
      return { creates: [payload.exerciseId], requires: ids(payload.parentExerciseId), writes: [] };
    case "updateExercise":
      return {
        creates: [],
        requires: ids(payload.exerciseId, payload.parentExerciseId),
        writes: [payload.exerciseId],
      };
    case "addSessionExercise":
      return {
        creates: [payload.sessionExerciseId],
        requires: [payload.sessionId, payload.exerciseId],
        writes: [],
      };
    case "removeSessionExercise":
      return {
        creates: [],
        requires: [payload.sessionExerciseId],
        writes: [payload.sessionExerciseId],
      };
    case "logSet":
      return { creates: [payload.setId], requires: [payload.sessionExerciseId], writes: [] };
    case "updateSet":
      return { creates: [], requires: [payload.setId], writes: [payload.setId] };
    case "completeExercise":
      return {
        creates: [],
        requires: [payload.sessionExerciseId],
        writes: [payload.sessionExerciseId, payload.sessionId],
      };
  }
}

function overlaps(a: string[], b: string[]): boolean {
  return a.some((id) => b.includes(id));
}

export function isBlocked(change: Change, earlier: Change[]): boolean {
  let { requires, writes } = getRefs(change.payload);
  return earlier.some((other) => {
    if (other.status !== "failed" && other.status !== "blocked") return false;
    let theirs = getRefs(other.payload);
    return (
      overlaps(theirs.creates, requires) ||
      overlaps([...theirs.creates, ...theirs.writes], writes)
    );
  });
}

export function dependentsOf(changeId: string, changes: Change[]): Change[] {
  let start = changes.findIndex((c) => c.id === changeId);
  if (start === -1) return [];
  let created = new Set(getRefs(changes[start].payload).creates);
  let dependents: Change[] = [];
  for (let change of changes.slice(start + 1)) {
    let { requires, creates } = getRefs(change.payload);
    if (!requires.some((id) => created.has(id))) continue;
    dependents.push(change);
    creates.forEach((id) => created.add(id));
  }
  return dependents;
}
