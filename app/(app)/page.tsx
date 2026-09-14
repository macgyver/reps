import Link from "next/link";
import { getSessionsForUser } from "@/lib/sessions/data";
import { createSession } from "./sessions/actions";
import styles from "./page.module.scss";

export default async function Home() {
  let sessions = await getSessionsForUser();

  return (
    <main className={styles.main}>
      <form action={createSession}>
        <button type="submit" className={styles.newSessionButton}>
          + New session
        </button>
      </form>

      <ul className={styles.sessionList}>
        {sessions.map((session) => (
          <li key={session.id}>
            <Link href={`/sessions/${session.id}`} className={styles.sessionRow}>
              <span>{new Date(session.createdAt).toLocaleString()}</span>
              <span className={styles.status}>
                {session.completedAt ? "Completed" : "In progress"}
              </span>
            </Link>
          </li>
        ))}
        {sessions.length === 0 ? <li className={styles.empty}>No sessions yet.</li> : null}
      </ul>
    </main>
  );
}
