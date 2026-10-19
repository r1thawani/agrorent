-- "Delete my account" (Edit Profile), done safely.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs 006 to have been run first.
--
-- Every table that points at a profile deletes its rows along with it, so
-- removing a profile outright would also wipe the *other* person's bookings,
-- earnings, reviews, chats and disputes. Instead the account is closed:
--   - refused while the person has a paid booking that hasn't finished;
--   - their open requests are withdrawn (as renter) or declined (as owner),
--     and the other person is told as usual;
--   - their listings are removed (kept hidden if they have booking history);
--   - their personal details are wiped and the profile shows "Deleted user";
--   - /api/delete-account then removes the login itself, which frees the
--     email address for a new sign-up.
-- Shared history stays, under "Deleted user".

alter table profiles add column if not exists deleted_at timestamptz;
grant select (deleted_at) on profiles to anon, authenticated;

-- The profile must outlive its login (see above), so it no longer follows
-- auth.users on delete. on_auth_user_deleted below wipes it instead.
do $$
declare
  v_name text;
begin
  for v_name in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'f'
      and confrelid = 'auth.users'::regclass
  loop
    execute format('alter table profiles drop constraint %I', v_name);
  end loop;
end;
$$;

-- Wipes an account. No checks: delete_account() checks first; a login
-- deleted from the Supabase dashboard comes here directly.
create or replace function close_account(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_eq uuid;
begin
  -- Open requests first, while the names are still there for the
  -- notifications and emails the booking triggers send.
  update bookings set status = 'cancelled', updated_at = now()
  where renter_id = p_user_id and status in ('pending', 'accepted');

  update bookings set status = 'declined', status_reason = 'listing_removed', updated_at = now()
  where owner_id = p_user_id and status in ('pending', 'accepted');

  for v_eq in select id from equipment where owner_id = p_user_id and deleted_at is null loop
    delete from wishlists where equipment_id = v_eq;
    if exists (select 1 from bookings where equipment_id = v_eq) then
      update equipment set deleted_at = now(), is_available = false where id = v_eq;
    else
      delete from equipment where id = v_eq;
    end if;
  end loop;

  delete from wishlists where user_id = p_user_id;
  delete from notifications where user_id = p_user_id;
  delete from email_outbox where user_id = p_user_id and sent_at is null;

  update profiles set
    name = 'Deleted user', email = '', photo_url = null, bio = null,
    phone = null, province = null, district = null, date_of_birth = null,
    deleted_at = now()
  where id = p_user_id;
end;
$$;

-- Called by /api/delete-account (service role only) before it removes the
-- login. Returns 'deleted', or 'already_deleted' when a previous attempt got
-- this far, so the API can simply retry removing the login.
create or replace function delete_account(p_user_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  p profiles;
begin
  select * into p from profiles where id = p_user_id for update;
  if not found then
    raise exception 'Account not found.' using errcode = 'no_data_found';
  end if;
  if p.deleted_at is not null then
    return 'already_deleted';
  end if;
  if p.role = 'admin' then
    raise exception 'Admin accounts can''t be deleted here. Ask another admin to change your role first.'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from bookings
    where renter_id = p_user_id and status = 'confirmed' and end_date >= current_date
  ) then
    raise exception 'You have a paid booking that hasn''t finished yet. Cancel it in My Bookings (if it hasn''t started) or wait until it ends, then try again.'
      using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from bookings
    where owner_id = p_user_id and status = 'confirmed' and end_date >= current_date
  ) then
    raise exception 'Someone has paid to rent your equipment and the rental hasn''t finished yet. You can delete your account once it ends.'
      using errcode = 'check_violation';
  end if;

  perform close_account(p_user_id);
  return 'deleted';
end;
$$;

revoke all on function close_account(uuid), delete_account(uuid) from public, anon, authenticated;
grant execute on function delete_account(uuid) to service_role;

-- A login deleted from the Supabase dashboard closes the account too, so no
-- profile is left behind with a real name and phone number.
create or replace function handle_deleted_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where id = old.id and deleted_at is null) then
    perform close_account(old.id);
  end if;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function handle_deleted_user();

-- Nobody can message a deleted account.
create or replace function block_messages_to_deleted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from conversations c
    join profiles p on p.id = case when c.renter_id = new.sender_id then c.owner_id else c.renter_id end
    where c.id = new.conversation_id and p.deleted_at is not null
  ) then
    raise exception 'This person has deleted their account, so they can''t receive messages.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_block_deleted on messages;
create trigger messages_block_deleted
  before insert on messages
  for each row execute function block_messages_to_deleted();

notify pgrst, 'reload schema';
