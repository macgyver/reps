"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { signInWithMagicLink, type LoginState } from "./actions";
import styles from "./page.module.scss";

export default function LoginPage() {
  let [state, formAction] = useActionState<LoginState, FormData>(signInWithMagicLink, null);

  if (state && "sent" in state) {
    return (
      <main className={styles.main}>
        <h1 className={styles.brand}>Reps</h1>
        <p className={styles.message}>Check your email for a sign-in link.</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.brand}>Reps</h1>
      <form action={formAction} className={styles.form}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          className={styles.input}
        />
        {state && "error" in state ? (
          <p role="alert" className={styles.error}>
            {state.error}
          </p>
        ) : null}
        <SubmitButton className={styles.submit} gerund="Sending">
          Send magic link
        </SubmitButton>
      </form>
    </main>
  );
}
