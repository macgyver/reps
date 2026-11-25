"use client";

import { useRef, useState } from "react";
import styles from "./popover-button.module.scss";

export type PopoverMessage = { text: string; isError?: boolean };

export function PopoverButton({
  action,
  className = "",
  children,
  ...rest
}: {
  action: () => Promise<PopoverMessage | null>;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  let [message, setMessage] = useState<PopoverMessage | null>(null);
  let timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function handleClick() {
    let result = await action();
    if (!result) return;
    setMessage(result);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setMessage(null), result.isError ? 4000 : 2000);
  }

  return (
    <span className={styles.wrap}>
      <button {...rest} type="button" className={className} onClick={handleClick}>
        {children}
      </button>
      <span role="status" className={styles.region}>
        {message ? (
          <span className={`${styles.popover} ${message.isError ? styles.error : ""}`}>{message.text}</span>
        ) : null}
      </span>
    </span>
  );
}
