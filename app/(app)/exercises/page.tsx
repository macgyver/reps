import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercises } from "@/lib/exercises/data";
import { ExerciseList } from "./exercise-list";
import styles from "./page.module.scss";

export default async function ExercisesPage() {
  let [exercises, user] = await Promise.all([getExercises(), getCurrentUser()]);

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1>Exercises</h1>
        <Link href="/exercises/new" className={styles.newButton}>
          + New
        </Link>
      </div>
      <ExerciseList exercises={exercises} currentUserId={user?.id} />
    </main>
  );
}
