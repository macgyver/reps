import { optionalText } from "@/lib/form";
import type { Change } from "@/lib/changes/types";

export function exerciseFields(formData: FormData) {
  let name = optionalText(formData, "name");
  if (!name) return null;
  return {
    name,
    description: optionalText(formData, "description"),
    videoUrl: optionalText(formData, "videoUrl"),
    muscleGroups: formData.getAll("muscleGroup").filter((v) => typeof v === "string"),
    parentExerciseId: optionalText(formData, "parentExerciseId"),
  };
}

export function failureMessage(change: Change) {
  let reason = change.status === "blocked" ? "waiting on an earlier failed change" : change.error;
  return `Not saved (${reason}). See Settings to retry.`;
}
