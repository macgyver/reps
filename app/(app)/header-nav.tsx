"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SubmitButton } from "@/components/submit-button";
import { signOut } from "@/lib/auth/actions";
import { useChanges } from "@/lib/changes/hooks";
import { initChanges } from "@/lib/changes/store";
import styles from "./layout.module.scss";

export function HeaderNav({ userId }: { userId: string }) {
  let changes = useChanges();
  useEffect(() => initChanges(userId), [userId]);

  let unsaved = changes.filter((c) => c.status !== "saved");
  let hasFailed = unsaved.some((c) => c.status === "failed" || c.status === "blocked");
  let summary = `${unsaved.length} change${unsaved.length === 1 ? "" : "s"} not saved`;

  async function handleSignOut() {
    let message = `You have ${summary}. They stay on this device and can be retried after you sign back in. Sign out anyway?`;
    if (unsaved.length > 0 && !confirm(message)) return;
    await signOut();
  }

  return (
    <nav className={styles.nav}>
      <Link href="/exercises" className={styles.navLink}>
        Exercises
      </Link>
      <Link href="/settings" className={styles.navLink}>
        Settings
        {unsaved.length > 0 ? (
          <span className={`${styles.badge} ${hasFailed ? styles.badgeDanger : ""}`} aria-hidden="true">
            {unsaved.length}
          </span>
        ) : null}
      </Link>
      <span className={styles.srOnly} aria-live="polite">
        {unsaved.length > 0 ? summary : ""}
      </span>
      <form action={handleSignOut}>
        <SubmitButton className={styles.signOut} gerund="Signing out">
          Sign out
        </SubmitButton>
      </form>
    </nav>
  );
}
