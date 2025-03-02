begin;
create extension "basejump-supabase_test_helpers" version '0.0.6';

select no_plan();

select makerkit.set_identifier('primary_owner', 'test@audiencelab.io');
select makerkit.set_identifier('owner', 'owner@audiencelab.io');
select makerkit.set_identifier('member', 'member@audiencelab.io');
select makerkit.set_identifier('custom', 'custom@audiencelab.io');

-- another user not in the team
select tests.create_supabase_user('test', 'test@supabase.com');

select tests.authenticate_as('member');

-- run an update query
update public.accounts_memberships set account_role = 'owner' where user_id = auth.uid() and account_id = makerkit.get_account_id_by_slug('audiencelab');

select row_eq(
    $$ select account_role from public.accounts_memberships where user_id = auth.uid() and account_id = makerkit.get_account_id_by_slug('audiencelab'); $$,
    row('member'::varchar),
    'Updates fail silently to any field of the accounts_membership table'
);

select * from finish();

rollback;