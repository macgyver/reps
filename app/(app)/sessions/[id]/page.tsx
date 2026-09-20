import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSessionWithSets } from "@/lib/sessions/data";
import { CompletedSummary } from "./completed-summary";
import { RunSession } from "./run-session";
import styles from "./page.module.scss";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  let { id } = await params;
  let user = await getCurrentUser();
  if (!user) redirect("/login");

  let session = await getSessionWithSets(id);
  if (!session) notFound();
  if (session.userId !== user.id) redirect("/");

  if (session.completedAt) {
    return <CompletedSummary session={session} />;
  }

  if (session.exercises.length === 0) {
    // Nothing to run yet — adding an exercise is the only thing to do here,
    // so skip straight to the design screen instead of a dead-end message.
    redirect(`/sessions/${id}/design`);
  }

  let currentIndex = session.exercises.findIndex((exercise) => !exercise.completedAt);

  if (currentIndex === -1) {
    return (
      <main className={styles.main}>
        <p>All exercises are complete.</p>
        <Link href={`/sessions/${id}/design`} className={styles.editLink}>
          Edit session
        </Link>
      </main>
    );
  }

  return (
    <RunSession
      sessionId={id}
      exercise={session.exercises[currentIndex]}
      position={currentIndex + 1}
      total={session.exercises.length}
      isLastExercise={currentIndex === session.exercises.length - 1}
    />
  );
}
