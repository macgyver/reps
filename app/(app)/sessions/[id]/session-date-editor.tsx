"use client";

import { useState } from "react";
import { enqueue } from "@/lib/changes/store";
import { formatDateLabel, formatSessionDate } from "@/lib/sessions/format";
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

  let parsed = new Date(localValue);

  function save() {
    if (Number.isNaN(parsed.getTime())) return;
    let isoValue = parsed.toISOString();
    enqueue(
      { kind: "updateSessionDate", sessionId, createdAt: isoValue },
      `Changed session date to ${formatSessionDate(isoValue)}`,
    );
    setEditing(false);
  }

  return (
    <form action={save} className={styles.dateForm}>
      <input
        type="datetime-local"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={styles.dateInput}
        aria-label="Workout date and time"
        autoFocus
      />
      <button type="submit" className={styles.dateSaveButton}>
        Save
      </button>
      <button type="button" className={styles.dateCancelButton} onClick={() => setEditing(false)}>
        Cancel
      </button>
    </form>
  );
}
