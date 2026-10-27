import { createClient } from "@/lib/supabase/client";
import { isBlocked, dependentsOf } from "./dependencies";
import { CHANGE_TIMEOUT_MS, runChange } from "./operations";
import type { Change, ChangePayload } from "./types";

export const LOADED_AT = new Date().toISOString();

const EMPTY: Change[] = [];
const MAX_CHANGES = 200;
const SAVED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let changes = EMPTY;
let userId: string | null = null;
let isProcessing = false;
let listeners = new Set<() => void>();
let waiters = new Map<string, (change: Change) => void>();

function storageKey() {
  return `reps:changes:${userId}`;
}

function persist() {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(changes));
  } catch {}
}

function load(): Change[] {
  try {
    let stored: Change[] = JSON.parse(localStorage.getItem(storageKey()) ?? "[]");
    let cutoff = Date.now() - SAVED_TTL_MS;
    return stored
      .filter((c) => c.status !== "saved" || Date.parse(c.savedAt ?? c.createdAt) > cutoff)
      .slice(-MAX_CHANGES)
      .map((c) =>
        c.status === "queued" || c.status === "sending"
          ? { ...c, status: "failed", error: "Not sent before the page closed" }
          : c,
      );
  } catch {
    return EMPTY;
  }
}

function set(next: Change[]) {
  changes = next;
  persist();
  listeners.forEach((listener) => listener());
}

function update(id: string, patch: Partial<Change>) {
  set(changes.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  let change = changes.find((c) => c.id === id);
  if (change && change.status !== "queued" && change.status !== "sending") {
    waiters.get(id)?.(change);
    waiters.delete(id);
  }
}

async function send(change: Change) {
  let signal = AbortSignal.timeout(CHANGE_TIMEOUT_MS);
  update(change.id, { status: "sending", attempts: change.attempts + 1, error: null });
  try {
    await runChange(change.payload, createClient(), signal, userId!);
    update(change.id, { status: "saved", savedAt: new Date().toISOString() });
  } catch (e) {
    let error = signal.aborted ? "Timed out" : e instanceof Error ? e.message : "Unknown error";
    update(change.id, { status: "failed", error });
  }
}

async function drain() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    for (let next; (next = changes.find((c) => c.status === "queued")); ) {
      let earlier = changes.slice(0, changes.indexOf(next));
      if (isBlocked(next, earlier)) update(next.id, { status: "blocked", error: null });
      else if (navigator.onLine === false) update(next.id, { status: "failed", error: "Offline" });
      else await send(next);
    }
  } finally {
    isProcessing = false;
  }
}

function hasPending() {
  return changes.some((c) => c.status === "queued" || c.status === "sending");
}

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (hasPending()) event.preventDefault();
}

export function initChanges(id: string) {
  if (id === userId) return;
  userId = id;
  set(load());
  window.addEventListener("beforeunload", warnBeforeUnload);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  return changes;
}

export function getServerSnapshot() {
  return EMPTY;
}

export function enqueue(payload: ChangePayload, label: string): Promise<Change> {
  let change: Change = {
    id: crypto.randomUUID(),
    payload,
    label,
    createdAt: new Date().toISOString(),
    status: "queued",
    error: null,
    attempts: 0,
    savedAt: null,
  };
  let done = new Promise<Change>((resolve) => waiters.set(change.id, resolve));
  set([...changes, change]);
  drain();
  return done;
}

export function retryFailed() {
  set(
    changes.map((c) =>
      c.status === "failed" || c.status === "blocked" ? { ...c, status: "queued", error: null } : c,
    ),
  );
  drain();
}

export function discard(changeId: string) {
  let removed = new Set([changeId, ...dependentsOf(changeId, changes).map((c) => c.id)]);
  for (let change of changes.filter((c) => removed.has(c.id))) {
    waiters.get(change.id)?.({ ...change, status: "failed", error: "Discarded" });
    waiters.delete(change.id);
  }
  set(changes.filter((c) => !removed.has(c.id)));
}

export function clearSaved() {
  set(changes.filter((c) => c.status !== "saved"));
}

export function getUserId() {
  return userId;
}
