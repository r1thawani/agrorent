-- =====================================================================
-- AgroRent: database rules check
--
-- How to run: Supabase dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. The result is a table with one row per check and a
-- PASS or FAIL in the last column.
--
-- What it does: creates four pretend users (an owner, two renters and a
-- stranger), a test tractor and some bookings, then acts as each user and
-- tries things the database should allow or refuse: booking prices,
-- double-booking, privacy, admin rights and reporting a problem.
--
-- Nothing is saved. Everything the script creates is undone at the end, so
-- it is safe to run on the live database as often as you like.
--
-- Needs all migrations up to 012 to have been run. If a "Report a problem"
-- check fails, run migrations/012_report_problem.sql first.
-- =====================================================================

drop table if exists rules_check;
create temp table rules_check (
  no       int,
  area     text,
  tried    text,
  expected text,
  actual   text,
  result   text
);

do $$
declare
  run_id    text := left(replace(gen_random_uuid()::text, '-', ''), 8);
  owner_id  uuid := gen_random_uuid();
  renter1   uuid := gen_random_uuid();
  renter2   uuid := gen_random_uuid();
  stranger  uuid := gen_random_uuid();
  eq_id     uuid := gen_random_uuid();
  b1 uuid;
  b2 uuid;
  res  rules_check[] := '{}';
  n    int := 0;
  ok   boolean;
  got  text;
  v_text text;
  v_num  numeric;
  v_dep  numeric;
  v_count int;
begin
  -- Everything inside this block is undone at the end (see the last lines).
  begin
    -- ---------------------------------------------------------------
    -- Setup, as the database administrator
    -- ---------------------------------------------------------------
    -- Profiles only: since migration 007 a profile doesn't need a login
    -- account, so no real sign-up (or email) is involved.
    insert into profiles (id, name, email)
    values
      (owner_id, 'Test Owner',    'test-owner-'    || run_id || '@agrorent.test'),
      (renter1,  'Test Renter 1', 'test-renter1-'  || run_id || '@agrorent.test'),
      (renter2,  'Test Renter 2', 'test-renter2-'  || run_id || '@agrorent.test'),
      (stranger, 'Test Stranger', 'test-stranger-' || run_id || '@agrorent.test');

    insert into equipment (id, owner_id, name, category, price_day, province, district, location, pickup_address)
    values (eq_id, owner_id, 'Test Tractor', 'Tractors', 500, 'Lusaka', 'Lusaka', 'Lusaka', 'Plot 1, Chilanga Road');

    -- ---------------------------------------------------------------
    -- 1. The database works out the price itself
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      -- The renter sends a fake price and status on purpose.
      insert into bookings (equipment_id, renter_id, owner_id, start_date, end_date, status, total_price, down_payment)
      values (eq_id, renter1, renter1, current_date + 30, current_date + 37, 'confirmed', 1, 1)
      returning id, total_price, down_payment, status::text into b1, v_num, v_dep, v_text;
      ok  := v_num = 3675 and v_dep = 919 and v_text = 'pending';
      got := 'Saved as ' || v_text || ', total K' || v_num || ', deposit K' || v_dep;
    exception when others then
      ok := false; got := 'Error: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Prices', 'Renter requests 7 days at K500 a day, sending a fake total of K1 and status "confirmed"',
                      'Database ignores the fake values: pending, total K3,675, deposit K919', got,
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 2. A request does not hold the dates
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter2, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into bookings (equipment_id, renter_id, start_date, end_date)
      values (eq_id, renter2, current_date + 33, current_date + 40)
      returning id into b2;
      ok := true; got := 'Request saved';
    exception when others then
      ok := false; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Booking', 'A second renter requests dates that overlap the first request',
                      'Allowed, because a request does not reserve the dates', got,
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 3. A renter cannot confirm their own booking without paying
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      update bookings set status = 'confirmed' where id = b1;
    exception when others then
      null;
    end;
    reset role;
    select status::text into v_text from bookings where id = b1;
    ok := v_text = 'pending';
    n := n + 1;
    res := res || row(n, 'Booking', 'Renter tries to change their own request to "confirmed" directly',
                      'No change, the booking stays pending', 'Status is ' || v_text,
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 4. A stranger cannot see other people's bookings
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) into v_count from bookings where id in (b1, b2);
    reset role;
    ok := v_count = 0;
    n := n + 1;
    res := res || row(n, 'Privacy', 'A stranger looks for the two bookings',
                      'Sees 0 bookings', 'Saw ' || v_count || ' bookings',
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 5. A stranger cannot accept a request for someone else's equipment
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      perform accept_booking(b1);
      ok := false; got := 'Accepted';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Booking', 'A stranger tries to accept the first renter''s request',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 6. The owner accepts the first request
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      select status::text into v_text from accept_booking(b1);
      ok := v_text = 'accepted'; got := 'Status is ' || v_text;
    exception when others then
      ok := false; got := 'Error: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Booking', 'Owner accepts the first request',
                      'Accepted, and the renter now has time to pay', got,
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 7. The owner cannot accept an overlapping request at the same time
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      perform accept_booking(b2);
      ok := false; got := 'Accepted';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Double booking', 'Owner tries to accept the overlapping request while the first renter can still pay',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 8. The renter pays the deposit
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      v_text := pay_deposit(b1, 'mobile-money');
      ok := v_text = 'confirmed'; got := 'Result: ' || v_text;
    exception when others then
      ok := false; got := 'Error: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Booking', 'First renter pays the K919 deposit',
                      'Booking confirmed', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 9. Paying declines the overlapping request automatically
    -- ---------------------------------------------------------------
    select status::text into v_text from bookings where id = b2;
    ok := v_text = 'declined';
    n := n + 1;
    res := res || row(n, 'Double booking', 'Check the second renter''s overlapping request after the payment',
                      'Declined automatically', 'Status is ' || coalesce(v_text, 'missing'),
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 10. Nobody can request dates that are already paid for
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter2, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into bookings (equipment_id, renter_id, start_date, end_date)
      values (eq_id, renter2, current_date + 35, current_date + 36);
      ok := false; got := 'Request saved';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Double booking', 'Second renter requests dates inside the paid booking',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 11. Email addresses are private (signed-in user)
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      select email into v_text from profiles where id = owner_id;
      ok := false; got := 'Could read it: ' || coalesce(v_text, '(empty)');
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Privacy', 'A signed-in stranger tries to read the owner''s email address',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 12. Email addresses are private (not signed in)
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
    begin
      select email into v_text from profiles where id = owner_id;
      ok := false; got := 'Could read it: ' || coalesce(v_text, '(empty)');
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Privacy', 'A visitor who is not signed in tries to read the owner''s email address',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 13. Users cannot make themselves an admin
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      update profiles set role = 'admin' where id = renter1;
    exception when others then
      null;
    end;
    reset role;
    select role::text into v_text from profiles where id = renter1;
    ok := v_text <> 'admin';
    n := n + 1;
    res := res || row(n, 'Admin rights', 'A renter tries to change their own account to admin',
                      'No change', 'Role is ' || v_text, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 14. A stranger cannot report a booking they are not part of
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into disputes (booking_id, reporter_id, against_id, reason)
      values (b1, stranger, owner_id, 'Testing a report on someone else''s booking');
      ok := false; got := 'Report saved';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Report a problem', 'A stranger reports the first renter''s booking',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 15. A report must be against the other person on the booking
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into disputes (booking_id, reporter_id, against_id, reason)
      values (b1, renter1, stranger, 'Testing a report against the wrong person');
      ok := false; got := 'Report saved';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Report a problem', 'First renter reports their booking but names the stranger',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 16. Only confirmed or completed bookings can be reported
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter2, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into disputes (booking_id, reporter_id, against_id, reason)
      values (b2, renter2, owner_id, 'Testing a report on a declined request');
      ok := false; got := 'Report saved';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Report a problem', 'Second renter reports their declined request',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 17. A real problem on a confirmed booking can be reported
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into disputes (booking_id, reporter_id, against_id, reason)
      values (b1, renter1, owner_id, 'The tractor would not start at pickup');
      ok := true; got := 'Report saved';
    exception when others then
      ok := false; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Report a problem', 'First renter reports a problem with their confirmed booking',
                      'Report saved for the admin', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 18. Only one open report per person per booking
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into disputes (booking_id, reporter_id, against_id, reason)
      values (b1, renter1, owner_id, 'Reporting the same booking a second time');
      ok := false; got := 'Report saved';
    exception when others then
      ok := true; got := 'Refused: ' || sqlerrm;
    end;
    reset role;
    n := n + 1;
    res := res || row(n, 'Report a problem', 'First renter reports the same booking again while the first report is open',
                      'Refused', got, case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- ---------------------------------------------------------------
    -- 19. Only an admin can resolve a report
    -- ---------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', renter1, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      update disputes set status = 'resolved' where booking_id = b1;
    exception when others then
      null;
    end;
    reset role;
    select status::text into v_text from disputes where booking_id = b1;
    ok := v_text = 'open';
    n := n + 1;
    res := res || row(n, 'Report a problem', 'First renter tries to mark their own report as resolved',
                      'No change, the report stays open', 'Status is ' || coalesce(v_text, 'missing'),
                      case when ok then 'PASS' else 'FAIL' end)::rules_check;

    -- Undo everything above.
    raise exception 'undo_test_data';
  exception when others then
    if sqlerrm <> 'undo_test_data' then
      n := n + 1;
      res := res || row(n, 'Script', 'Running the checks', 'All checks run',
                        'Stopped early: ' || sqlerrm, 'FAIL')::rules_check;
    end if;
  end;

  insert into rules_check select * from unnest(res);
end $$;

select no         as "#",
       area       as "Area",
       tried      as "What we tried",
       expected   as "Expected",
       actual     as "What happened",
       result     as "Result"
from rules_check
order by no;
