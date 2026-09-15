"use client";

import { useFormStatus } from "react-dom";
import styles from "./page.module.scss";

export function SubmitButton() {
  let { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={styles.submit}>
      {pending ? "Sending…" : "Send magic link"}
    </button>
  );
}
