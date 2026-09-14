"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { optionalText } from "@/lib/form";

export async function createSession() {
  let user = await getCurrentUser();
  if (!user) redirect("/login");

  let supabase = await createClient();
  let { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/?error=${encodeURIComponent(error?.message ?? "Could not create session")}`);
  }

  redirect(`/sessions/${data.id}/design`);
}

export async function addSuperset(sessionId: string) {
  let supabase = await createClient();
  let { count } = await supabase
    .from("supersets")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  let { error } = await supabase.from("supersets").insert({
    session_id: sessionId,
    position: count ?? 0,
  });

  if (error) {
    redirect(`/sessions/${sessionId}/design?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${sessionId}/design`);
}

export async function removeSuperset(sessionId: string, supersetId: string) {
  let supabase = await createClient();
  let { error } = await supabase.from("supersets").delete().eq("id", supersetId);

  if (error) {
    redirect(`/sessions/${sessionId}/design?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${sessionId}/design`);
}

export async function addExerciseToSuperset(
  sessionId: string,
  supersetId: string,
  formData: FormData,
) {
  let exerciseId = formData.get("exerciseId");
  if (typeof exerciseId !== "string" || !exerciseId) {
    redirect(`/sessions/${sessionId}/design?error=Pick an exercise`);
  }

  let supabase = await createClient();
  let { count } = await supabase
    .from("superset_exercises")
    .select("id", { count: "exact", head: true })
    .eq("superset_id", supersetId);

  let { error } = await supabase.from("superset_exercises").insert({
    superset_id: supersetId,
    exercise_id: exerciseId,
    position: count ?? 0,
  });

  if (error) {
    redirect(`/sessions/${sessionId}/design?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${sessionId}/design`);
}

export async function removeSupersetExercise(sessionId: string, supersetExerciseId: string) {
  let supabase = await createClient();
  let { error } = await supabase
    .from("superset_exercises")
    .delete()
    .eq("id", supersetExerciseId);

  if (error) {
    redirect(`/sessions/${sessionId}/design?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/sessions/${sessionId}/design`);
}

export async function logSet(sessionId: string, supersetExerciseId: string, formData: FormData) {
  let weightRaw = formData.get("weight");
  let repsRaw = formData.get("reps");
  let weight = typeof weightRaw === "string" && weightRaw.trim() ? Number(weightRaw) : null;
  let reps = typeof repsRaw === "string" && repsRaw.trim() ? Number(repsRaw) : null;

  let supabase = await createClient();
  let { data, error } = await supabase
    .from("sets")
    .insert({
      superset_exercise_id: supersetExerciseId,
      weight,
      reps,
      notes: optionalText(formData, "notes"),
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error?.message ?? "Could not log set")}`);
  }

  let modificationIds = formData.getAll("modification").filter((v) => typeof v === "string");
  if (modificationIds.length > 0) {
    let rows = modificationIds.map((modificationId) => ({
      set_id: data.id,
      modification_id: modificationId,
      value: optionalText(formData, `modValue_${modificationId}`),
    }));
    let { error: modError } = await supabase.from("set_modifications").insert(rows);
    if (modError) {
      redirect(`/sessions/${sessionId}?error=${encodeURIComponent(modError.message)}`);
    }
  }

  revalidatePath(`/sessions/${sessionId}`);
}

export async function completeSuperset(sessionId: string, supersetId: string) {
  let supabase = await createClient();
  let now = new Date().toISOString();

  let { error } = await supabase
    .from("supersets")
    .update({ completed_at: now })
    .eq("id", supersetId);

  if (error) {
    redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`);
  }

  let { count } = await supabase
    .from("supersets")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .is("completed_at", null);

  if ((count ?? 0) === 0) {
    await supabase.from("sessions").update({ completed_at: now }).eq("id", sessionId);
  }

  revalidatePath(`/sessions/${sessionId}`);
}
