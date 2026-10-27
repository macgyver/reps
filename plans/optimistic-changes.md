# Plan: optimistic UI + changelist with manual retry

Goal: on a weak gym signal, every edit should appear instantly, be tracked in a
changelist the person can inspect from a small Settings view, and failed edits
should wait for a manual "Retry" instead of being retried automatically.

Read `AGENTS.md` first. Before writing code, check `node_modules/next/dist/docs/`
for: client functions passed to `<form action>`, `useSyncExternalStore` hydration
guidance, and the client router cache / `staleTimes` defaults (the plan assumes
dynamic pages are refetched on every navigation, so no `revalidatePath` is needed;
confirm that).

Code style (from the user's CLAUDE.md): `let` everywhere, `const` only for
ALL_CAPS module constants; short readable code; no comments that restate the code.
Follow existing idioms: the "compare state during render" pattern instead of
`useEffect` (see `run-session.tsx` `handledState`), SCSS modules with the
variables/mixins in `styles/_variables.scss`, big tap targets, `SubmitButton` for
anything the person waits on.

---

## Key decisions

1. **Mutations go straight from the browser to Supabase, not through server
   actions.** RLS (`db/policies.sql`) is already the security boundary, and
   `db/grants.sql` grants table access to `authenticated`, so the browser client in
   `lib/supabase/client.ts` can write directly. This removes the Vercel function
   hop (and its cold starts, a likely part of the delay the user sees), gives us
   `AbortSignal` timeouts, and avoids an RSC re-render payload per save. Server
   components keep doing all the *reads*.
2. **Client-generated UUIDs** (`crypto.randomUUID()`) for every inserted row. All
   tables use `uuid` PKs with `defaultRandom()`, so supplying `id` works. This lets
   the UI reference rows that haven't reached the server yet (e.g. log a set on an
   exercise that was just added), and makes retries idempotent.
3. **Idempotent writes.** Inserts use `.upsert(row, { onConflict: "id" })` so a
   request that actually landed before timing out is harmless to retry (and a
   retry carries the latest values). Updates/deletes are already idempotent.
   Timestamps the person cares about are captured on the client at the moment of
   the action (`performed_at` for sets, `completed_at` for exercises) so a retry
   hours later doesn't record the wrong time.
4. **One serial queue, first attempt automatic, retries manual.** A change is sent
   as soon as it's enqueued (one request in flight at a time, in order). If it
   fails it stays `failed` until the person presses "Retry failed". Changes that
   depend on a failed one become `blocked` instead of being sent.
5. **Optimistic UI = fold the changelist over server data.** Server components
   still fetch from Supabase; client "view" components apply the changelist on top
   with pure functions. No `useOptimistic` (it only lives for one transition).
6. **Persist to `localStorage`** so a reload or the phone killing the tab never
   loses an unsent set (matches the project rule that typed data is never lost).
7. **Blocking changes** for the two flows that navigate to a server-rendered page
   of a brand-new row (`createSession`, the full `/exercises/new` form): these go
   through the same changelist, but the UI awaits the result before navigating and
   shows `SubmitButton`'s pending state. Everything else is optimistic.
8. **No-JS support is dropped** for these forms (they become client functions).
   Acceptable for this prototype; mention it in the commit message.

Out of scope: true offline navigation (service worker / caching pages),
multi-tab sync, conflict resolution with edits made on another device.

---

## Data model (`lib/changes/types.ts`)

```ts
export type ChangeStatus = "queued" | "sending" | "saved" | "failed" | "blocked";

export type ChangePayload =
  | { kind: "createSession"; sessionId: string; createdAt: string }
  | { kind: "updateSessionDate"; sessionId: string; createdAt: string }
  | { kind: "createExercise"; exerciseId: string; name: string; description: string | null;
      videoUrl: string | null; muscleGroups: string[]; parentExerciseId: string | null }
  | { kind: "updateExercise"; exerciseId: string; name: string; description: string | null;
      videoUrl: string | null; muscleGroups: string[]; parentExerciseId: string | null }
  | { kind: "addSessionExercise"; sessionExerciseId: string; sessionId: string;
      exerciseId: string; exerciseName: string; position: number }
  | { kind: "removeSessionExercise"; sessionExerciseId: string; sessionId: string }
  | { kind: "logSet"; setId: string; sessionId: string; sessionExerciseId: string;
      weight: number | null; reps: number | null; notes: string | null; performedAt: string }
  | { kind: "updateSet"; setId: string; sessionId: string; sessionExerciseId: string;
      weight: number | null; reps: number | null; notes: string | null }
  | { kind: "completeExercise"; sessionId: string; sessionExerciseId: string; completedAt: string };

export type Change = {
  id: string;            // the change's own id
  payload: ChangePayload;
  label: string;         // human summary built at enqueue time, e.g. "Logged 135 lb × 8 reps · Curtsy squat"
  createdAt: string;
  status: ChangeStatus;
  error: string | null;
  attempts: number;
  savedAt: string | null;
};
```

Labels are computed when enqueuing (the caller knows the exercise name etc.), using
`formatSet` from `lib/sessions/format.ts`.

### Dependencies (`lib/changes/dependencies.ts`)

Each payload kind maps to the entity ids it **creates**, **requires** (must exist),
and **writes** (mutates — used to keep same-row updates in order):

| kind | creates | requires | writes |
|---|---|---|---|
| createSession | sessionId | | |
| updateSessionDate | | sessionId | sessionId |
| createExercise | exerciseId | parentExerciseId? | |
| updateExercise | | exerciseId, parentExerciseId? | exerciseId |
| addSessionExercise | sessionExerciseId | sessionId, exerciseId | |
| removeSessionExercise | | sessionExerciseId | sessionExerciseId |
| logSet | setId | sessionExerciseId | |
| updateSet | | setId | setId |
| completeExercise | | sessionExerciseId | sessionExerciseId, sessionId |

Rule: a change is **blocked** if any *earlier* change in the list whose status is
`failed` or `blocked` creates something it requires, or creates/writes something it
writes. (Earlier `queued`/`sending` changes are fine — the queue is serial, so they
finish first.) Write this as one small pure function `isBlocked(change, earlier)`.

---

## Store (`lib/changes/store.ts`)

Plain module-level store consumed with `useSyncExternalStore` (no context).
Client-only module: it must not import anything from `lib/supabase/server.ts` or
any module that does (that's the `next/headers` client-bundle leak we hit before —
see how `lib/sessions/format.ts` was split out of `lib/sessions/data.ts`).

API:
- `initChanges(userId)` — called once from a client component mounted in
  `app/(app)/layout.tsx` (layout already has access to the user via
  `getCurrentUser`; pass the id down). Loads `localStorage["reps:changes:<userId>"]`
  (wrap every storage access in try/catch). On load: drop `saved` entries older
  than 7 days and cap the list at 200 entries; any `queued`/`sending` entry becomes
  `failed` with error "Not sent before the page closed" (they are *not* sent
  automatically — the person retries).
- `subscribe`, `getSnapshot`, `getServerSnapshot` (returns a shared empty array).
- `enqueue(payload, label): Promise<Change>` — appends a `queued` change, persists,
  kicks the processor, resolves when that change reaches `saved`/`failed`/`blocked`
  (blocking flows await this; optimistic flows ignore it).
- `retryFailed()` — sets every `failed`/`blocked` change back to `queued` (keeping
  order) and kicks the processor.
- `discard(changeId)` — removes the change **and** every later change that is
  transitively blocked by it (anything requiring an id it creates). The Settings UI
  confirms first with the count.
- `clearSaved()`.
- Module constant `LOADED_AT = new Date().toISOString()` for the overlay rule below.

Processor: a single async loop guarded by an `isProcessing` flag. Walk the list in
order; for each `queued` change: if `isBlocked` → mark `blocked`; else if
`navigator.onLine === false` → mark `failed` ("Offline") without a request; else mark
`sending`, `attempts++`, run it, then `saved` (+`savedAt`) or `failed` (+`error`).
Persist and notify after every status change. Immutable updates so
`useSyncExternalStore` sees new snapshots.

Also: add a `beforeunload` listener that calls `preventDefault()` while any change is
`queued` or `sending`.

## Operations (`lib/changes/operations.ts`)

`runChange(payload, supabase, signal)` — one `switch` on `kind`, each case a direct
`supabase-js` call with `.abortSignal(signal)`; throw on `error`. Use
`AbortSignal.timeout(15_000)` per change. Map DB column names exactly as the
current server actions do (`app/(app)/sessions/actions.ts`,
`app/(app)/exercises/actions.ts`) — port their logic, including:
- `createExercise`: `created_by` must be the current user id (RLS checks it) — get it
  from `initChanges(userId)`.
- `completeExercise`: update the session_exercise's `completed_at`, then count
  remaining incomplete exercises in that session and set the session's
  `completed_at` when zero (same as today, but with the client's `completedAt`).
- `addSessionExercise`: use the client-computed `position` (max existing position
  + 1 on the overlaid list), not the server-side count — the count approach also
  produces duplicate positions after a removal.
- Verify `upsert` works under the RLS policies for each table (sets,
  session_exercises, sessions have `for all` policies; exercises has separate
  insert/update policies, both `created_by = auth.uid()`). If an expired JWT makes a
  request fail, the person's retry will go through after supabase-js refreshes it —
  no special handling.

Smoke-test early that the browser client is authenticated (the `@supabase/ssr`
cookies set at login should be readable by `createBrowserClient`): log one set via
the new path before building everything else.

## Overlay (`lib/changes/apply.ts`, pure functions)

Which changes to apply: every change that is not `saved`, plus `saved` changes with
`savedAt >= LOADED_AT` (server data fetched before the save in this tab may not
reflect it yet; anything saved before this page load already does). Apply in list
order; every operation must be idempotent against data that already contains it
(dedupe inserts by id).

- `applyToSession<T extends Session | SessionWithSets>(session, changes): T` —
  date, add/remove session exercises (keep sorted by position), sets
  (log/update, only if the shape has `sets`), completeExercise (set exercise
  `completedAt`; if every exercise is now complete, set session `completedAt`).
- `applyToSessions(sessions, changes)` — homepage list: map `applyToSession`, plus
  prepend sessions from `createSession` changes that aren't in the server list.
- `applyToExercises(exercises, changes)` — create/update, including
  `parentExerciseName` lookup from the list itself.

Hooks (`lib/changes/hooks.ts`): `useChanges()`, plus
`useChangeStatus(entityId): ChangeStatus | null` returning the worst non-saved
status among changes that create/write that entity — drives inline markers.

---

## UI changes

### Header indicator + Settings view
- `app/(app)/layout.tsx`: add a "Settings" nav link (`/settings`). A small client
  component next to it shows a count badge of non-saved changes; badge uses
  `--danger` if any are `failed`/`blocked`. Include a visually-hidden
  `aria-live="polite"` region announcing e.g. "2 changes not saved".
- New `app/(app)/settings/page.tsx` (server shell) + `changelist.tsx` (client):
  - Top: "Retry failed (N)" button (disabled when N = 0), "Clear saved".
  - List, newest first: label, relative time ("2 min ago"), status text —
    *Queued*, *Saving…*, *Saved*, *Failed: {error}*, *Waiting on a failed change* —
    and for failed/blocked rows a "Discard" button (confirm with dependent count).
  - Empty state: "No changes yet."
  - Big tap targets, spartan, matches `page.module.scss` styling elsewhere.
- Sign out (`layout.tsx`): if any non-saved changes exist, `confirm()` before
  submitting ("You have N unsaved changes on this device…"). They stay in
  localStorage keyed by user id either way.

### Inline status marker
`components/change-status.tsx`: given an entity id, renders nothing when saved,
"Saving…" (muted) when queued/sending, "Not saved" (danger, links to `/settings`)
when failed/blocked. Use on: set rows in the run view, session-exercise rows in the
design view, homepage session rows, exercise list rows.

### Run session (`app/(app)/sessions/[id]/page.tsx`, `run-session.tsx`)
- Page: fetch `getSessionWithSets(id)` and `getLastPerformances` for **all** the
  session's exercise ids; convert the Map to a plain `Record` before passing to the
  client. Keep the auth/ownership checks server-side. Render a new client
  `SessionView` with the raw session.
- `SessionView`: `applyToSession` → if `completedAt`, render `CompletedSummary`
  (it has no server imports, so it can render on the client); if no exercises,
  render a short message linking to the design page (replaces the server
  redirect, since pending adds may exist only in the overlay); if all complete,
  the existing "All exercises are complete" content; otherwise `RunSession` for the
  first incomplete exercise. This is what makes "Complete exercise" advance
  instantly.
- `RunSession`: the form's `action` becomes a client function that reads FormData,
  enqueues `logSet` (new `crypto.randomUUID()`, `performedAt: new Date().toISOString()`)
  or `updateSet`, then resets exactly as the success branch does today
  (`setEditingSet(null)`, bump `formKey`). Drop `useActionState`/`LogSetState`. Keep
  a plain submit button (no pending state needed — it's instant). Number parsing
  ported from `parseNumber` in `actions.ts`.
- "Complete exercise"/"Finish session": `onClick` enqueues `completeExercise`.
- `SessionDateEditor`: enqueue `updateSessionDate` with the already-converted ISO
  value and close the editor immediately; the label shows the overlaid date.

### Design session (`design/page.tsx`, `exercise-picker.tsx`)
- Page keeps fetching; move the list + picker + "Start session" link into a client
  `DesignSessionView` that applies `applyToSession` and `applyToExercises`.
- Add → enqueue `addSessionExercise`. Remove → enqueue `removeSessionExercise`.
- Quick-create → enqueue `createExercise` (bare: name only) then
  `addSessionExercise` referencing the new id; clear the search input immediately.
- Drop the `?error=` search param handling (errors now live in the changelist).

### Homepage (`app/(app)/page.tsx`)
Move the session list into a client component applying `applyToSessions`.
"+ New session" stays a blocking flow: `enqueue(createSession)` with a client id,
await it, then `router.push(`/sessions/${id}/design`)` on `saved`; on failure show
an inline `role="alert"` error ("Couldn't create session — see Settings").
Keep `SubmitButton` for its pending state (use a form whose client action awaits
the promise so `useFormStatus` stays pending).

### Exercises
- `/exercises/new`: blocking — enqueue `createExercise`, await, navigate to the edit
  page on success, inline error on failure. The form's typed values must survive a
  failure (they will — it's the same mounted form).
- Edit form: optimistic `updateExercise`; show "Saved" from `SubmitButton`'s
  `succeeded` state only after the change actually reaches `saved` (await the
  promise in the action), but the overlay updates immediately. Edit page's defaults
  and `exercise-list.tsx` apply `applyToExercises`.

### Delete dead code
Remove the server actions that moved to the client (`logSet`, `updateSet`,
`updateSessionDate`, `completeExercise`, `addExerciseToSession`,
`removeSessionExercise`, `createExerciseAndAddToSession`, `createSession`,
`createExercise`, `updateExercise`) and their state types. Delete the action files if
empty; delete `lib/form.ts` if nothing uses it anymore.

---

## Implementation order (verify after each step)

1. Types, dependencies, store, operations, overlay, hooks. Settings page +
   header indicator. Wire **only `logSet`** end-to-end and smoke-test auth + upsert.
2. Rest of the run-session flows (`updateSet`, `completeExercise`,
   `updateSessionDate`, `SessionView`).
3. Design session flows.
4. Homepage list + `createSession`.
5. Exercise create/edit + list overlay.
6. Delete dead server actions.

After each step: `npx eslint`, `npx tsc --noEmit`, `npm run build` (the build needs
the sandbox disabled in this environment). Manual check in the browser with
DevTools network throttling:
- "Offline": log 3 sets → all appear instantly with "Not saved"; badge shows 3 in
  danger; Settings shows them failed with "Offline". Go online, "Retry failed" →
  all saved, badge clears, reload shows them from the server, no duplicates.
- Offline: log a set, then edit it → the update shows "Waiting on a failed change";
  retry runs both in order and the server ends with the edited values.
- Offline: quick-create an exercise in Design → add is blocked behind the create;
  Discard the create → confirm says 1 dependent change; both disappear.
- "Slow 3G": log a set and reload mid-request → after reload it's "failed" with "Not
  sent before the page closed"; retry → exactly one row in the DB.
- Complete the last exercise offline → completed summary shows instantly.
- Nothing is ever retried without pressing the button.

Commit only when the user asks (end messages with the attribution lines from the
system reminder).
