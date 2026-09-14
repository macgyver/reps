import { integer, numeric, pgSchema, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Stub for Supabase's built-in auth.users table, purely for FK typing.
// drizzle.config.ts scopes push/introspect to the public schema, so this
// is never itself created/altered by drizzle-kit.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// RLS is enabled per table below, but the actual policy conditions live in
// db/policies.sql — `drizzle-kit push` creates named policies correctly but
// silently drops their USING/WITH CHECK expressions on apply, so they're
// applied by hand instead (see db/apply-policies.cjs, run via `npm run db:push`).

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => authUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const exerciseModifications = pgTable("exercise_modifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}).enableRLS();

export const supersets = pgTable("supersets", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}).enableRLS();

export const supersetExercises = pgTable("superset_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  supersetId: uuid("superset_id")
    .notNull()
    .references(() => supersets.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  position: integer("position").notNull(),
}).enableRLS();

export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  supersetExerciseId: uuid("superset_exercise_id")
    .notNull()
    .references(() => supersetExercises.id, { onDelete: "cascade" }),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow(),
  weight: numeric("weight", { mode: "number" }),
  reps: integer("reps"),
  notes: text("notes"),
}).enableRLS();

export const setModifications = pgTable("set_modifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  setId: uuid("set_id")
    .notNull()
    .references(() => sets.id, { onDelete: "cascade" }),
  modificationId: uuid("modification_id")
    .notNull()
    .references(() => exerciseModifications.id),
  value: text("value"),
}).enableRLS();
