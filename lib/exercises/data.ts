import { createClient } from "@/lib/supabase/server";

export type ExerciseModification = {
  id: string;
  name: string;
};

export type Exercise = {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  muscleGroups: string[];
  createdBy: string;
  modifications: ExerciseModification[];
};

const EXERCISE_SELECT =
  "id, name, description, videoUrl:video_url, muscleGroups:muscle_groups, createdBy:created_by, modifications:exercise_modifications(id, name)";

export async function getExercises(): Promise<Exercise[]> {
  let supabase = await createClient();
  let { data, error } = await supabase.from("exercises").select(EXERCISE_SELECT).order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  let supabase = await createClient();
  let { data, error } = await supabase
    .from("exercises")
    .select(EXERCISE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
