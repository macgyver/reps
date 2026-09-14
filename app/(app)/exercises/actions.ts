"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { optionalText } from "@/lib/form";

export async function createExercise(formData: FormData) {
  let name = optionalText(formData, "name");
  if (!name) {
    redirect("/exercises/new?error=Name is required");
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
    redirect(`/exercises/new?error=${encodeURIComponent(error?.message ?? "Could not create exercise")}`);
  }

  revalidatePath("/exercises");
  redirect(`/exercises/${data.id}/edit`);
}

export async function updateExercise(exerciseId: string, formData: FormData) {
  let name = optionalText(formData, "name");
  if (!name) {
    redirect(`/exercises/${exerciseId}/edit?error=Name is required`);
  }

  let supabase = await createClient();
  let { error } = await supabase
    .from("exercises")
    .update({
      name,
      description: optionalText(formData, "description"),
      video_url: optionalText(formData, "videoUrl"),
    })
    .eq("id", exerciseId);

  if (error) {
    redirect(`/exercises/${exerciseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}/edit`);
  redirect(`/exercises/${exerciseId}/edit?saved=1`);
}

export async function addModification(exerciseId: string, formData: FormData) {
  let name = optionalText(formData, "name");
  if (!name) {
    redirect(`/exercises/${exerciseId}/edit?error=Modification name is required`);
  }

  let supabase = await createClient();
  let { error } = await supabase
    .from("exercise_modifications")
    .insert({ exercise_id: exerciseId, name });

  if (error) {
    redirect(`/exercises/${exerciseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/exercises/${exerciseId}/edit`);
}

export async function deleteModification(exerciseId: string, modificationId: string) {
  let supabase = await createClient();
  let { error } = await supabase.from("exercise_modifications").delete().eq("id", modificationId);

  if (error) {
    redirect(`/exercises/${exerciseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/exercises/${exerciseId}/edit`);
}
