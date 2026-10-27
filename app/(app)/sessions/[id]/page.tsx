import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLastPerformances, getSessionWithSets } from "@/lib/sessions/data";
import { SessionView } from "./session-view";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  let { id } = await params;
  let user = await getCurrentUser();
  if (!user) redirect("/login");

  let session = await getSessionWithSets(id);
  if (!session) notFound();
  if (session.userId !== user.id) redirect("/");

  let lastPerformances = await getLastPerformances(
    session.exercises.map((exercise) => exercise.exerciseId),
    id,
  );

  return <SessionView session={session} lastPerformances={Object.fromEntries(lastPerformances)} />;
}
