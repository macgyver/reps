-- RLS policy conditions, applied by hand instead of via `drizzle-kit push`.
-- `drizzle-kit push` (as of drizzle-orm 0.45.2 / drizzle-kit 0.31.10) creates
-- the named policy shell correctly but silently drops the USING/WITH CHECK
-- expressions on apply — `drizzle-kit generate` emits the right SQL, `push`
-- just doesn't apply it. db/schema.ts only does `.enableRLS()` per table;
-- this file is the actual source of truth for policy conditions. Safe to
-- run repeatedly (drops + recreates each policy).

drop policy if exists "exercises_select_all" on "exercises";
create policy "exercises_select_all" on "exercises" as permissive for select to "authenticated" using (true);

drop policy if exists "exercises_insert_own" on "exercises";
create policy "exercises_insert_own" on "exercises" as permissive for insert to "authenticated" with check (created_by = auth.uid());

drop policy if exists "exercises_update_own" on "exercises";
create policy "exercises_update_own" on "exercises" as permissive for update to "authenticated" using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "exercise_modifications_select_all" on "exercise_modifications";
create policy "exercise_modifications_select_all" on "exercise_modifications" as permissive for select to "authenticated" using (true);

drop policy if exists "exercise_modifications_insert_own" on "exercise_modifications";
create policy "exercise_modifications_insert_own" on "exercise_modifications" as permissive for insert to "authenticated" with check (exists (select 1 from exercises e where e.id = exercise_id and e.created_by = auth.uid()));

drop policy if exists "exercise_modifications_update_own" on "exercise_modifications";
create policy "exercise_modifications_update_own" on "exercise_modifications" as permissive for update to "authenticated" using (exists (select 1 from exercises e where e.id = exercise_id and e.created_by = auth.uid())) with check (exists (select 1 from exercises e where e.id = exercise_id and e.created_by = auth.uid()));

drop policy if exists "exercise_modifications_delete_own" on "exercise_modifications";
create policy "exercise_modifications_delete_own" on "exercise_modifications" as permissive for delete to "authenticated" using (exists (select 1 from exercises e where e.id = exercise_id and e.created_by = auth.uid()));

drop policy if exists "sessions_all_own" on "sessions";
create policy "sessions_all_own" on "sessions" as permissive for all to "authenticated" using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "supersets_all_own" on "supersets";
create policy "supersets_all_own" on "supersets" as permissive for all to "authenticated"
  using (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists "superset_exercises_all_own" on "superset_exercises";
create policy "superset_exercises_all_own" on "superset_exercises" as permissive for all to "authenticated"
  using (exists (
    select 1 from supersets ss
    join sessions s on s.id = ss.session_id
    where ss.id = superset_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from supersets ss
    join sessions s on s.id = ss.session_id
    where ss.id = superset_id and s.user_id = auth.uid()
  ));

drop policy if exists "sets_all_own" on "sets";
create policy "sets_all_own" on "sets" as permissive for all to "authenticated"
  using (exists (
    select 1 from superset_exercises se
    join supersets ss on ss.id = se.superset_id
    join sessions s on s.id = ss.session_id
    where se.id = superset_exercise_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from superset_exercises se
    join supersets ss on ss.id = se.superset_id
    join sessions s on s.id = ss.session_id
    where se.id = superset_exercise_id and s.user_id = auth.uid()
  ));

drop policy if exists "set_modifications_all_own" on "set_modifications";
create policy "set_modifications_all_own" on "set_modifications" as permissive for all to "authenticated"
  using (exists (
    select 1 from sets st
    join superset_exercises se on se.id = st.superset_exercise_id
    join supersets ss on ss.id = se.superset_id
    join sessions s on s.id = ss.session_id
    where st.id = set_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from sets st
    join superset_exercises se on se.id = st.superset_exercise_id
    join supersets ss on ss.id = se.superset_id
    join sessions s on s.id = ss.session_id
    where st.id = set_id and s.user_id = auth.uid()
  ));
