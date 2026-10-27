"use client";

import Link from "next/link";
import { useChangeStatus } from "@/lib/changes/hooks";
import styles from "./change-status.module.scss";

export function ChangeStatusMarker({ entityId }: { entityId: string }) {
  let status = useChangeStatus(entityId);
  if (!status) return null;
  if (status === "failed" || status === "blocked") {
    return (
      <Link href="/settings" className={styles.failed}>
        Not saved
      </Link>
    );
  }
  return <span className={styles.saving}>Saving…</span>;
}
