begin;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select no_plan();

select makerkit.set_identifier('primary_owner', 'test@audiencelab.io');
select makerkit.set_identifier('owner', 'owner@audiencelab.io');
select makerkit.set_identifier('member', 'member@audiencelab.io');
select makerkit.set_identifier('custom', 'custom@audiencelab.io');

-- another user not in the team
select tests.create_supabase_user('test', 'test@supabase.com');

select tests.authenticate_as('owner');

-- Can check if an account is a team member

-- Primary owner
select is(
  (select public.is_team_member(
    makerkit.get_account_id_by_slug('audiencelab'),
    tests.get_supabase_uid('member')
  )),
  true,
  'The primary account owner can check if a member is a team member'
);

select tests.authenticate_as('member');

-- Member
select is(
  (select public.is_team_member(
    makerkit.get_account_id_by_slug('audiencelab'),
    tests.get_supabase_uid('owner')
  )),
  true,
  'The member can check if another member is a team member'
);

select is(
  (select public.has_role_on_account(
    makerkit.get_account_id_by_slug('audiencelab')
  )),
  true,
  'The member can check if they have a role on the account'
);

select isnt_empty(
  $$ select * from public.get_account_members('audiencelab') $$,
  'The member can query the team account memberships using the get_account_members function'
);

select tests.authenticate_as('test');

-- Foreigners
-- Cannot query the team account memberships
select is(
  (select public.is_team_member(
    makerkit.get_account_id_by_slug('audiencelab'),
    tests.get_supabase_uid('owner')
  )),
  false,
  'The foreigner cannot check if a member is a team member'
);

-- Does not have a role on the account
select is(
  (select public.has_role_on_account(
    makerkit.get_account_id_by_slug('audiencelab')
  )),
  false,
  'The foreigner does not have a role on the account'
);

select is_empty(
  $$ select * from public.accounts_memberships where account_id = makerkit.get_account_id_by_slug('audiencelab') $$,
  'The foreigner cannot query the team account memberships'
);

select is_empty(
  $$ select * from public.accounts where id = makerkit.get_account_id_by_slug('audiencelab') $$,
  'The foreigner cannot query the team account'
);

select is_empty(
  $$ select * from public.get_account_members('audiencelab') $$,
  'The foreigner cannot query the team members'
);

select * from finish();

rollback;
