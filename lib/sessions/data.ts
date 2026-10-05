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

type SessionWithSetsRow = {
  id: string;
  userId: string;
  createdAt: string;
  completedAt: string | null;
  exercises: {
    id: string;
    position: number;
    completedAt: string | null;
    exerciseId: string;
    exercise: unknown;
    sets: LoggedSet[];
  }[];
};

function mapSessionWithSets(row: SessionWithSetsRow): SessionWithSets {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    exercises: row.exercises.map((exercise) => {
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
  return data ? mapSessionWithSets(data as unknown as SessionWithSetsRow) : null;
}

export async function getSessionsWithSetsForUser(): Promise<SessionWithSets[]> {
  let supabase = await createClient();
  let { data, error } = await supabase
    .from("sessions")
    .select(SESSION_WITH_SETS_SELECT)
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "session_exercises" })
    .order("performed_at", { referencedTable: "session_exercises.sets" });

  if (error) throw error;
  return ((data ?? []) as unknown as SessionWithSetsRow[]).map(mapSessionWithSets);
}

export type LastPerformance = {
  performedAt: string;
  sets: { weight: number | null; reps: number | null }[];
};

// For each exercise id, the sets logged the last time it showed up in a
// *different* session — so "last time you did this" has something to
// compare against while designing or running the current one.
export async function getLastPerformances(
  exerciseIds: string[],
  excludeSessionId: string,
): Promise<Map<string, LastPerformance>> {
  if (exerciseIds.length === 0) return new Map();

  let supabase = await createClient();
  let { data, error } = await supabase
    .from("session_exercises")
    .select("exerciseId:exercise_id, session:sessions(createdAt:created_at), sets(weight, reps)")
    .in("exercise_id", exerciseIds)
    .neq("session_id", excludeSessionId);

  if (error) throw error;

  let latestByExercise = new Map<string, LastPerformance>();
  for (let row of data ?? []) {
    if (row.sets.length === 0) continue;
    let session = row.session as unknown as { createdAt: string } | null;
    if (!session) continue;

    let current = latestByExercise.get(row.exerciseId);
    if (!current || session.createdAt > current.performedAt) {
      latestByExercise.set(row.exerciseId, { performedAt: session.createdAt, sets: row.sets });
    }
  }

  return latestByExercise;
}
