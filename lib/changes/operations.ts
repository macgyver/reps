import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChangePayload, ExerciseFields } from "./types";

export const CHANGE_TIMEOUT_MS = 15_000;

function check({ error }: { error: { message: string } | null }) {
  if (error) throw new Error(error.message);
}

function exerciseColumns(p: ExerciseFields) {
  return {
    name: p.name,
    description: p.description,
    video_url: p.videoUrl,
    muscle_groups: p.muscleGroups,
    parent_exercise_id: p.parentExerciseId,
  };
}

export async function runChange(
  payload: ChangePayload,
  supabase: SupabaseClient,
  signal: AbortSignal,
  userId: string,
) {
  let upsert = (table: string, row: object) =>
    supabase.from(table).upsert(row, { onConflict: "id" }).abortSignal(signal);
  let updateSession = async (sessionId: string, row: object) =>
    check(await supabase.from("sessions").update(row).eq("id", sessionId).abortSignal(signal));

  switch (payload.kind) {
    case "createSession":
      return check(
        await upsert("sessions", {
          id: payload.sessionId,
          user_id: userId,
          created_at: payload.createdAt,
        }),
      );
    case "updateSessionDate":
      return updateSession(payload.sessionId, { created_at: payload.createdAt });
    case "createExercise":
      return check(
        await upsert("exercises", {
          id: payload.exerciseId,
          ...exerciseColumns(payload),
          created_by: userId,
        }),
      );
    case "updateExercise":
      return check(
        await supabase
          .from("exercises")
          .update(exerciseColumns(payload))
          .eq("id", payload.exerciseId)
          .abortSignal(signal),
      );
    case "addSessionExercise":
      return check(
        await upsert("session_exercises", {
          id: payload.sessionExerciseId,
          session_id: payload.sessionId,
          exercise_id: payload.exerciseId,
          position: payload.position,
        }),
      );
    case "removeSessionExercise":
      return check(
        await supabase
          .from("session_exercises")
          .delete()
          .eq("id", payload.sessionExerciseId)
          .abortSignal(signal),
      );
    case "logSet":
      return check(
        await upsert("sets", {
          id: payload.setId,
          session_exercise_id: payload.sessionExerciseId,
          weight: payload.weight,
          reps: payload.reps,
          notes: payload.notes,
          performed_at: payload.performedAt,
        }),
      );
    case "updateSet":
      return check(
        await supabase
          .from("sets")
          .update({ weight: payload.weight, reps: payload.reps, notes: payload.notes })
          .eq("id", payload.setId)
          .abortSignal(signal),
      );
    case "setCurrentExercise":
      return updateSession(payload.sessionId, { current_session_exercise_id: payload.sessionExerciseId });
    case "completeSession":
      return updateSession(payload.sessionId, {
        completed_at: payload.completedAt,
        current_session_exercise_id: null,
      });
    case "reopenSession":
      return updateSession(payload.sessionId, { completed_at: null });
  }
}
