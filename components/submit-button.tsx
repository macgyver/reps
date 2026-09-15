"use client";

import { useFormStatus } from "react-dom";
import styles from "./submit-button.module.scss";

export function SubmitButton({
  children,
  pendingLabel = "Loading",
  className = "",
  fullWidth = false,
  ...rest
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  fullWidth?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  let { pending } = useFormStatus();

  return (
    <span className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""}`}>
      <button
        {...rest}
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={`${styles.button} ${className}`}
      >
        {children}
      </button>
      {pending ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span role="alert" className={styles.srOnly}>
            {pendingLabel}
          </span>
        </>
      ) : null}
    </span>
  );
}
