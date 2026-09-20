"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import styles from "./submit-button.module.scss";

export function SubmitButton({
  children,
  gerund = "Loading",
  pastParticiple,
  succeeded = false,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  gerund?: string;
  pastParticiple?: string;
  succeeded?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  let { pending } = useFormStatus();
  let buttonRef = useRef<HTMLButtonElement>(null);
  let [touchedSinceSuccess, setTouchedSinceSuccess] = useState(false);

  // A new submission always supersedes whatever "touched" state we're
  // carrying, so the next success (if any) gets to show cleanly again.
  let [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (pending) setTouchedSinceSuccess(false);
  }

  useEffect(() => {
    let form = buttonRef.current?.form;
    if (!form) return;
    function handleInput() {
      setTouchedSinceSuccess(true);
    }
    form.addEventListener("input", handleInput);
    return () => form.removeEventListener("input", handleInput);
  }, []);

  let showSuccess = succeeded && !!pastParticiple && !touchedSinceSuccess && !pending;
  // 0 = idle (verb), 1 = pending (gerund), 2 = done (past participle) — a
  // simple left-to-right sequence. Each label slides in from whichever side
  // it's approaching from and out to whichever side it's retreating to,
  // which falls out naturally from just comparing indices below — no need
  // to track transition direction explicitly, forward or in reverse.
  let phase = pending ? 1 : showSuccess ? 2 : 0;

  function positionClass(index: number) {
    if (index === phase) return "";
    return index < phase ? styles.before : styles.after;
  }

  return (
    <>
      <button
        {...rest}
        ref={buttonRef}
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={`${styles.button} ${className}`}
      >
        <span className={styles.content}>
          <span className={`${styles.label} ${positionClass(0)}`} aria-hidden={phase !== 0}>
            {children}
          </span>
          <span className={`${styles.label} ${positionClass(1)}`} aria-hidden={phase !== 1}>
            <span className={styles.spinner} aria-hidden="true" />
            {gerund}
          </span>
          {pastParticiple ? (
            <span className={`${styles.label} ${positionClass(2)}`} aria-hidden={phase !== 2}>
              <svg
                viewBox="0 0 24 24"
                className={`${styles.checkmark} ${phase === 2 ? styles.checkmarkDrawn : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="4 12 10 18 20 6" />
              </svg>
              {pastParticiple}
            </span>
          ) : null}
        </span>
      </button>
      {pending ? (
        <span role="alert" className={styles.srOnly}>
          {gerund}
        </span>
      ) : null}
      {showSuccess ? (
        <span role="alert" className={styles.srOnly}>
          {pastParticiple}
        </span>
      ) : null}
    </>
  );
}
