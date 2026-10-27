import { useSyncExternalStore } from "react";
import { getRefs } from "./dependencies";
import { getServerSnapshot, getSnapshot, subscribe } from "./store";
import type { Change, ChangeStatus } from "./types";

export function useChanges(): Change[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useChangeStatus(entityId: string): ChangeStatus | null {
  let changes = useChanges();
  let worst: ChangeStatus | null = null;
  for (let change of changes) {
    if (change.status === "saved") continue;
    let { creates, writes } = getRefs(change.payload);
    if (!creates.includes(entityId) && !writes.includes(entityId)) continue;
    if (change.status === "failed" || change.status === "blocked") return change.status;
    worst = change.status;
  }
  return worst;
}
