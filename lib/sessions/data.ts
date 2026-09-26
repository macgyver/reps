import { createClient } from "@/lib/supabase/server";

export type SessionExercise = {
  id: string;
  position: number;
  completedAt: string | null;
  exerciseId: string;
  exerciseName: string;
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string;
  completedAt: string | null;
  exercises: SessionExercise[];
};

export type SessionSummary = {
  id: string;
  createdAt: string;
  completedAt: string | null;
};

export async function getSessionsForUser(): Promise<SessionSummary[]> {
  let supabase = await createClient();
  let { data, error } = await supabase
    .from("sessions")
    .select("id, createdAt:created_at, completedAt:completed_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type LoggedSet = {
  id: string;
  performedAt: string | null;
  weight: number | null;
  reps: number | null;
  notes: string | null;
};

export type SessionExerciseWithSets = SessionExercise & {
  sets: LoggedSet[];
};

export type SessionWithSets = Omit<Session, "exercises"> & {
  exercises: SessionExerciseWithSets[];
};

const SESSION_SELECT = `
  id,
  userId:user_id,
  createdAt:created_at,
  completedAt:completed_at,
  exercises:session_exercises(
    id,
    position,
    completedAt:completed_at,
    exerciseId:exercise_id,
    exercise:exercises(name)
  )
`;

export async function getSession(id: string): Promise<Session | null> {
  let supabase = await createClient();
  let { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .order("position", { referencedTable: "session_exercises" })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.userId,
    createdAt: data.createdAt,
    completedAt: data.completedAt,
    exercises: data.exercises.map((exercise) => {
      // supabase-js can't infer this embed is to-one from an untyped
      // query — at runtime PostgREST returns a single object here since
      // session_exercises.exercise_id -> exercises.id is many-to-one.
      let ex = exercise.exercise as unknown as { name: string };
      return {
        id: exercise.id,
        position: exercise.position,
        completedAt: exercise.completedAt,
        exerciseId: exercise.exerciseId,
        exerciseName: ex.name,
      };
    }),
  };
}

const SESSION_WITH_SETS_SELECT = `
  id,
  userId:user_id,
  createdAt:created_at,
  completedAt:completed_at,
  exercises:session_exercises(
    id,
    position,
    completedAt:completed_at,
    exerciseId:exercise_id,
    exercise:exercises(name),
    sets(
      id,
      performedAt:performed_at,
      weight,
      reps,
      notes
    )
  )
`;

export async function getSessionWithSets(id: string): Promise<SessionWithSets | null> {
  let supabase = await createClient();
  let { data, error } = await supabase
    .from("sessions")
    .select(SESSION_WITH_SETS_SELECT)
    .eq("id", id)
    .order("position", { referencedTable: "session_exercises" })
    .order("performed_at", { referencedTable: "session_exercises.sets" })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.userId,
    createdAt: data.createdAt,
    completedAt: data.completedAt,
    exercises: data.exercises.map((exercise) => {
      let ex = exercise.exercise as unknown as { name: string };
      return {
        id: exercise.id,
        position: exercise.position,
        completedAt: exercise.completedAt,
        exerciseId: exercise.exerciseId,
        exerciseName: ex.name,
        sets: exercise.sets,
      };
    }),
  };
}
