import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSession, getSessionWithSets } from "@/lib/sessions/data";
import { CompletedSummary } from "./completed-summary";
import { RunSession } from "./run-session";
import styles from "./page.module.scss";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  let { id } = await params;
  let user = await getCurrentUser();
  if (!user) redirect("/login");

  let session = await getSession(id);
  if (!session) notFound();
  if (session.userId !== user.id) redirect("/");

  if (session.completedAt) {
    let full = await getSessionWithSets(id);
    if (!full) notFound();
    return <CompletedSummary session={full} />;
  }

  let currentSupersetIndex = session.supersets.findIndex((superset) => !superset.completedAt);

  if (currentSupersetIndex === -1) {
    return (
      <main className={styles.main}>
        <p>All supersets are complete.</p>
      </main>
    );
  }

  let currentSuperset = session.supersets[currentSupersetIndex];
  let isLastSuperset = currentSupersetIndex === session.supersets.length - 1;

  if (currentSuperset.exercises.length === 0) {
    return (
      <main className={styles.main}>
        <p>This superset has no exercises. Remove it from the design screen.</p>
      </main>
    );
  }

  return <RunSession sessionId={id} superset={currentSuperset} isLastSuperset={isLastSuperset} />;
}
