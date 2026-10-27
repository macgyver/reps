import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getExercises } from "@/lib/exercises/data";
import { getLastPerformances, getSession } from "@/lib/sessions/data";
import { DesignSessionView } from "./design-session-view";

export default async function DesignSessionPage({ params }: { params: Promise<{ id: string }> }) {
  let { id } = await params;
  let [session, exercises, user] = await Promise.all([
    getSession(id),
    getExercises(),
    getCurrentUser(),
  ]);

  if (!session) notFound();
  if (session.userId !== user?.id) redirect("/");
  if (session.completedAt) redirect(`/sessions/${id}`);

  let lastPerformances = await getLastPerformances(
    session.exercises.map((exercise) => exercise.exerciseId),
    id,
  );

  return (
    <DesignSessionView
      session={session}
      exercises={exercises}
      lastPerformances={Object.fromEntries(lastPerformances)}
    />
  );
}
