import { getExercises } from "@/lib/exercises/data";
import { NewExerciseForm } from "./new-exercise-form";
import styles from "../form.module.scss";

export default async function NewExercisePage() {
  let exercises = await getExercises();

  return (
    <main className={styles.main}>
      <h1>New exercise</h1>
      <NewExerciseForm exercises={exercises} />
    </main>
  );
}
