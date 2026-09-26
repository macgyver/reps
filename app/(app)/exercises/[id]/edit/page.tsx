import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercise, getExercises } from "@/lib/exercises/data";
import styles from "../../form.module.scss";
import { EditExerciseForm } from "./edit-exercise-form";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let { id } = await params;
  let [exercise, exercises, user] = await Promise.all([
    getExercise(id),
    getExercises(),
    getCurrentUser(),
  ]);

  if (!exercise) notFound();
  if (exercise.createdBy !== user?.id) redirect("/exercises");

  let otherExercises = exercises.filter((e) => e.id !== exercise.id);

  return (
    <main className={styles.main}>
      <h1>Edit exercise</h1>
      <EditExerciseForm exercise={exercise} otherExercises={otherExercises} />
    </main>
  );
}
