"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { formatDateLabel } from "@/lib/sessions/format";
import { updateSessionDate, type UpdateSessionDateState } from "../actions";
import styles from "./session-date-editor.module.scss";

// <input type="datetime-local">'s value has no time zone — format/parse it
// against the browser's own local time (never the server's).
function toDatetimeLocalValue(isoDate: string): string {
  let date = new Date(isoDate);
  let pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SessionDateEditor({ sessionId, createdAt }: { sessionId: string; createdAt: string }) {
  let [editing, setEditing] = useState(false);
  let [localValue, setLocalValue] = useState(() => toDatetimeLocalValue(createdAt));
  let action = updateSessionDate.bind(null, sessionId);
  let [state, formAction] = useActionState<UpdateSessionDateState, FormData>(action, null);

  let [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "success" in state) setEditing(false);
  }

  if (!editing) {
    let label = formatDateLabel(createdAt);
    return (
      <button
        type="button"
        className={styles.dateButton}
        aria-label={`Edit workout date: ${label}`}
        onClick={() => setEditing(true)}
      >
        {label}
      </button>
    );
  }

  // Convert in the browser, where "local" correctly means the person's own
  // time zone, before handing it to the server action as a plain ISO string.
  let parsed = new Date(localValue);
  let isoValue = Number.isNaN(parsed.getTime()) ? createdAt : parsed.toISOString();

  return (
    <form action={formAction} className={styles.dateForm}>
      <input
        type="datetime-local"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={styles.dateInput}
        aria-label="Workout date and time"
        autoFocus
      />
      <input type="hidden" name="createdAt" value={isoValue} />
      <SubmitButton className={styles.dateSaveButton} gerund="Saving">
        Save
      </SubmitButton>
      <button type="button" className={styles.dateCancelButton} onClick={() => setEditing(false)}>
        Cancel
      </button>
      {state && "error" in state ? (
        <p role="alert" className={styles.dateError}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
