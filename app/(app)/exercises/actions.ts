"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { optionalText } from "@/lib/form";

export type ExerciseFormState = { error: string } | { saved: true } | null;

export async function createExercise(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  let name = optionalText(formData, "name");
  if (!name) {
    return { error: "Name is required" };
  }

  let user = await getCurrentUser();
  if (!user) redirect("/login");

  let supabase = await createClient();
  let { data, error } = await supabase
    .from("exercises")
    .insert({
      name,
      description: optionalText(formData, "description"),
      video_url: optionalText(formData, "videoUrl"),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create exercise" };
  }

  revalidatePath("/exercises");
  redirect(`/exercises/${data.id}/edit`);
}

export async function updateExercise(
  exerciseId: string,
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  let name = optionalText(formData, "name");
  if (!name) {
    return { error: "Name is required" };
  }

  let muscleGroups = formData.getAll("muscleGroup").filter((v) => typeof v === "string");

  let supabase = await createClient();
  let { error } = await supabase
    .from("exercises")
    .update({
      name,
      description: optionalText(formData, "description"),
      video_url: optionalText(formData, "videoUrl"),
      muscle_groups: muscleGroups,
    })
    .eq("id", exerciseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}/edit`);
  return { saved: true };
}

export type AddModificationState = { error: string } | { added: true } | null;

export async function addModification(
  exerciseId: string,
  _prevState: AddModificationState,
  formData: FormData,
): Promise<AddModificationState> {
  let name = optionalText(formData, "name");
  if (!name) {
    return { error: "Modification name is required" };
  }

  let supabase = await createClient();
  let { error } = await supabase
    .from("exercise_modifications")
    .insert({ exercise_id: exerciseId, name });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/exercises/${exerciseId}/edit`);
  return { added: true };
}

export async function deleteModification(exerciseId: string, modificationId: string) {
  let supabase = await createClient();
  let { error } = await supabase.from("exercise_modifications").delete().eq("id", modificationId);

  if (error) {
    redirect(`/exercises/${exerciseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/exercises/${exerciseId}/edit`);
}
