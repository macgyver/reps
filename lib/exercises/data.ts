import { createClient } from "@/lib/supabase/server";

export type Exercise = {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  muscleGroups: string[];
  createdBy: string;
  parentExerciseId: string | null;
  parentExerciseName: string | null;
};

type ExerciseRow = {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  muscleGroups: string[];
  createdBy: string;
  parentExerciseId: string | null;
  parent: { name: string } | null;
};

const EXERCISE_SELECT = `
  id,
  name,
  description,
  videoUrl:video_url,
  muscleGroups:muscle_groups,
  createdBy:created_by,
  parentExerciseId:parent_exercise_id,
  parent:exercises!parent_exercise_id(name)
`;

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    videoUrl: row.videoUrl,
    muscleGroups: row.muscleGroups,
    createdBy: row.createdBy,
    parentExerciseId: row.parentExerciseId,
    parentExerciseName: row.parent?.name ?? null,
  };
}

export async function getExercises(): Promise<Exercise[]> {
  let supabase = await createClient();
  let { data, error } = await supabase.from("exercises").select(EXERCISE_SELECT).order("name");

  if (error) throw error;
  return ((data ?? []) as unknown as ExerciseRow[]).map(mapExercise);
}

export async function getExercise(id: string): Promise<Exercise | null> {
  let supabase = await createClient();
  let { data, error } = await supabase
    .from("exercises")
    .select(EXERCISE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapExercise(data as unknown as ExerciseRow) : null;
}
