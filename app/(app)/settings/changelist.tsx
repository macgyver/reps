"use client";

import { useChanges } from "@/lib/changes/hooks";
import { dependentsOf } from "@/lib/changes/dependencies";
import { clearSaved, discard, retryFailed } from "@/lib/changes/store";
import type { Change } from "@/lib/changes/types";
import { formatTimeAgo } from "@/lib/sessions/format";
import styles from "./page.module.scss";

function statusText(change: Change): string {
  switch (change.status) {
    case "queued":
      return "Queued";
    case "sending":
      return "Saving…";
    case "saved":
      return "Saved";
    case "failed":
      return `Failed: ${change.error}`;
    case "blocked":
      return "Waiting on a failed change";
  }
}

export function Changelist() {
  let changes = useChanges();
  let failedCount = changes.filter((c) => c.status === "failed" || c.status === "blocked").length;
  let newestFirst = changes.toReversed();

  function handleDiscard(change: Change) {
    let count = dependentsOf(change.id, changes).length;
    let message = `Discard "${change.label}"?`;
    if (count > 0) message += ` ${count} dependent change${count === 1 ? "" : "s"} will be discarded too.`;
    if (confirm(message)) discard(change.id);
  }

  return (
    <>
      <div className={styles.actions}>
        <button type="button" className={styles.retryButton} disabled={failedCount === 0} onClick={retryFailed}>
          Retry failed ({failedCount})
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!changes.some((c) => c.status === "saved")}
          onClick={clearSaved}
        >
          Clear saved
        </button>
      </div>

      <ul className={styles.list}>
        {newestFirst.map((change) => {
          let isProblem = change.status === "failed" || change.status === "blocked";
          return (
            <li key={change.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span>{change.label}</span>
                <span className={styles.meta}>{formatTimeAgo(change.createdAt)}</span>
                <span className={isProblem ? styles.problem : styles.meta}>{statusText(change)}</span>
              </div>
              {isProblem ? (
                <button type="button" className={styles.discardButton} onClick={() => handleDiscard(change)}>
                  Discard
                </button>
              ) : null}
            </li>
          );
        })}
        {changes.length === 0 ? <li className={styles.empty}>No changes yet.</li> : null}
      </ul>
    </>
  );
}
