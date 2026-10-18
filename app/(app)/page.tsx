import Link from "next/link";
import buttonStyles from "@/components/submit-button.module.scss";
import { SubmitButton } from "@/components/submit-button";
import { getSessionsWithSetsForUser, type SessionWithSets } from "@/lib/sessions/data";
import { formatSessionDate, formatSet } from "@/lib/sessions/format";
import { createSession } from "./sessions/actions";
import styles from "./page.module.scss";

function summarize(session: SessionWithSets): string {
  if (session.exercises.length === 0) return "No exercises yet";
  return session.exercises.map((exercise) => exercise.exerciseName).join(", ");
}

export default async function Home() {
  let sessions = await getSessionsWithSetsForUser();

  return (
    <main className={styles.main}>
      <form action={createSession}>
        <SubmitButton
          className={`${buttonStyles.primary} ${styles.newSessionButton}`}
          gerund="Creating session"
        >
          + New session
        </SubmitButton>
      </form>

      <ul className={styles.sessionList}>
        {sessions.map((session) => (
          <li key={session.id} className={styles.sessionItem}>
            <div className={styles.sessionRow}>
              <Link
                href={`/sessions/${session.id}`}
                className={styles.sessionLink}
                title={summarize(session)}
              >
                <span>{formatSessionDate(session.createdAt)}</span>
                <span className={styles.status}>
                  {session.completedAt ? "Completed" : "In progress"}
                </span>
              </Link>
              {/* The toggle only — no revealed content inside it, so this
                  element's own size never changes and the row above never
                  shifts. What it reveals lives below as a plain sibling,
                  shown via :has() rather than native details nesting, so it
                  isn't confined to this narrow icon column. */}
              <details className={styles.disclosure}>
                <summary
                  className={styles.disclosureToggle}
                  aria-label="Show workout details"
                  aria-controls={`session-details-${session.id}`}
                >
                  <svg
                    className={styles.disclosureIcon}
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 3 L11 8 L5 13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
              </details>
            </div>
            <div id={`session-details-${session.id}`} className={styles.details}>
              {session.exercises.length === 0 ? (
                <p className={styles.detailsEmpty}>No exercises yet.</p>
              ) : (
                <ul className={styles.exerciseDetailList}>
                  {session.exercises.map((exercise) => (
                    <li key={exercise.id}>
                      <span className={styles.exerciseDetailName}>{exercise.exerciseName}</span>
                      {exercise.sets.length === 0 ? (
                        <p className={styles.detailsEmpty}>No sets logged.</p>
                      ) : (
                        <ul className={styles.setDetailList}>
                          {exercise.sets.map((set, index) => (
                            <li key={set.id}>
                              Set {index + 1}: {formatSet(set.weight, set.reps)}
                              {set.notes ? ` — ${set.notes}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
        {sessions.length === 0 ? <li className={styles.empty}>No sessions yet.</li> : null}
      </ul>
    </main>
  );
}
