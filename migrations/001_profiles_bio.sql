-- Adds a per-user bio to profiles.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (IF NOT EXISTS).
--
-- Why: EditProfile used to show a hardcoded bio for everyone and never saved
-- it, because profiles had no column to store it in.

alter table profiles
  add column if not exists bio text
  check (bio is null or char_length(bio) <= 200);

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
