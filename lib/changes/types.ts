export type ChangeStatus = "queued" | "sending" | "saved" | "failed" | "blocked";

export type ExerciseFields = {
  exerciseId: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  muscleGroups: string[];
  parentExerciseId: string | null;
};

export type SetFields = {
  setId: string;
  sessionId: string;
  sessionExerciseId: string;
  weight: number | null;
  reps: number | null;
  notes: string | null;
};

export type ChangePayload =
  | { kind: "createSession"; sessionId: string; createdAt: string }
  | { kind: "updateSessionDate"; sessionId: string; createdAt: string }
  | ({ kind: "createExercise" } & ExerciseFields)
  | ({ kind: "updateExercise" } & ExerciseFields)
  | {
      kind: "addSessionExercise";
      sessionExerciseId: string;
      sessionId: string;
      exerciseId: string;
      exerciseName: string;
      position: number;
    }
  | { kind: "removeSessionExercise"; sessionExerciseId: string; sessionId: string }
  | ({ kind: "logSet"; performedAt: string } & SetFields)
  | ({ kind: "updateSet" } & SetFields)
  | { kind: "completeExercise"; sessionId: string; sessionExerciseId: string; completedAt: string };

export type Change = {
  id: string;
  payload: ChangePayload;
  label: string;
  createdAt: string;
  status: ChangeStatus;
  error: string | null;
  attempts: number;
  savedAt: string | null;
};
