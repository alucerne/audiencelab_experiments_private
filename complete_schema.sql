/*
 * -------------------------------------------------------
 * Supabase SaaS Starter Kit Schema
 * This is the schema for the Supabase SaaS Starter Kit.
 * It includes the schema for accounts, account roles, role permissions, memberships, invitations, subscriptions, and more.
 * -------------------------------------------------------
 */
/*
 * -------------------------------------------------------
 * Section: Revoke default privileges from public schema
 * We will revoke all default privileges from public schema on functions to prevent public access to them
 * -------------------------------------------------------
 */
-- Create a private Makerkit schema
create schema if not exists kit;

create extension if not exists "unaccent" schema kit;

-- We remove all default privileges from public schema on functions to
--   prevent public access to them
alter default privileges
revoke
execute on functions
from
  public;

revoke all on schema public
from
  public;

revoke all PRIVILEGES on database "postgres"
from
  "anon";

revoke all PRIVILEGES on schema "public"
from
  "anon";

revoke all PRIVILEGES on schema "storage"
from
  "anon";

revoke all PRIVILEGES on all SEQUENCES in schema "public"
from
  "anon";

revoke all PRIVILEGES on all SEQUENCES in schema "storage"
from
  "anon";

revoke all PRIVILEGES on all FUNCTIONS in schema "public"
from
  "anon";

revoke all PRIVILEGES on all FUNCTIONS in schema "storage"
from
  "anon";

revoke all PRIVILEGES on all TABLES in schema "public"
from
  "anon";

revoke all PRIVILEGES on all TABLES in schema "storage"
from
  "anon";

-- We remove all default privileges from public schema on functions to
--   prevent public access to them by default
alter default privileges in schema public
revoke
execute on functions
from
  anon,
  authenticated;

-- we allow the authenticated role to execute functions in the public schema
grant usage on schema public to authenticated;

-- we allow the service_role role to execute functions in the public schema
grant usage on schema public to service_role;

/*
 * -------------------------------------------------------
 * Section: Enums
 * We create the enums for the schema
 * -------------------------------------------------------
 */
/*
* Permissions
- We create the permissions for the Supabase MakerKit. These permissions are used to manage the permissions for the roles
- The permissions are 'roles.manage', 'billing.manage', 'settings.manage', 'members.manage', and 'invites.manage'.
- You can add more permissions as needed.
*/
create type public.app_permissions as enum(
  'roles.manage',
  'billing.manage',
  'settings.manage',
  'members.manage',
  'invites.manage'
);

/*
* Subscription Status
- We create the subscription status for the Supabase MakerKit. These statuses are used to manage the status of the subscriptions
- The statuses are 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', and 'paused'.
- You can add more statuses as needed.
*/
create type public.subscription_status as ENUM(
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

/*
Payment Status
- We create the payment status for the Supabase MakerKit. These statuses are used to manage the status of the payments
*/
create type public.payment_status as ENUM('pending', 'succeeded', 'failed');

/*
* Billing Provider
- We create the billing provider for the Supabase MakerKit. These providers are used to manage the billing provider for the accounts
- The providers are 'stripe', 'lemon-squeezy', and 'paddle'.
- You can add more providers as needed.
*/
create type public.billing_provider as ENUM('stripe', 'lemon-squeezy', 'paddle');

/*
* Subscription Item Type
- We create the subscription item type for the Supabase MakerKit. These types are used to manage the type of the subscription items
- The types are 'flat', 'per_seat', and 'metered'.
- You can add more types as needed.
*/
create type public.subscription_item_type as ENUM('flat', 'per_seat', 'metered');

/*
* Invitation Type
- We create the invitation type for the Supabase MakerKit. These types are used to manage the type of the invitation
*/
create type public.invitation as (email text, role varchar(50));

/*
 * -------------------------------------------------------
 * Section: App Configuration
 * We create the configuration for the Supabase MakerKit to enable or disable features
 * -------------------------------------------------------
 */
create table if not exists
  public.config (
    enable_team_accounts boolean default true not null,
    enable_account_billing boolean default true not null,
    enable_team_account_billing boolean default true not null,
    billing_provider public.billing_provider default 'stripe' not null
  );

comment on table public.config is 'Configuration for the Supabase MakerKit.';

comment on column public.config.enable_team_accounts is 'Enable team accounts';

comment on column public.config.enable_account_billing is 'Enable billing for individual accounts';

comment on column public.config.enable_team_account_billing is 'Enable billing for team accounts';

comment on column public.config.billing_provider is 'The billing provider to use';

-- RLS(config)
alter table public.config enable row level security;

-- create config row
insert into
  public.config (
    enable_team_accounts,
    enable_account_billing,
    enable_team_account_billing
  )
values
  (true, true, true);

-- Revoke all on accounts table from authenticated and service_role
revoke all on public.config
from
  authenticated,
  service_role;

-- Open up access to config table for authenticated users and service_role
grant
select
  on public.config to authenticated,
  service_role;

-- RLS
-- SELECT(config):
-- Authenticated users can read the config
create policy "public config can be read by authenticated users" on public.config for
select
  to authenticated using (true);

-- Function to get the config settings
create
or replace function public.get_config () returns json
set
  search_path = '' as $$
declare
    result record;
begin
    select
        *
    from
        public.config
    limit 1 into result;

    return row_to_json(result);

end;

$$ language plpgsql;

-- Automatically set timestamps on tables when a row is inserted or updated
create
or replace function public.trigger_set_timestamps () returns trigger
set
  search_path = '' as $$
begin
    if TG_OP = 'INSERT' then
        new.created_at = now();

        new.updated_at = now();

    else
        new.updated_at = now();

        new.created_at = old.created_at;

    end if;

    return NEW;

end
$$ language plpgsql;

-- Automatically set user tracking on tables when a row is inserted or updated
create
or replace function public.trigger_set_user_tracking () returns trigger
set
  search_path = '' as $$
begin
    if TG_OP = 'INSERT' then
        new.created_by = auth.uid();
        new.updated_by = auth.uid();

    else
        new.updated_by = auth.uid();

        new.created_by = old.created_by;

    end if;

    return NEW;

end
$$ language plpgsql;

grant
execute on function public.get_config () to authenticated,
service_role;

-- Function "public.is_set"
-- Check if a field is set in the config
create
or replace function public.is_set (field_name text) returns boolean
set
  search_path = '' as $$
declare
    result boolean;
begin
    execute format('select %I from public.config limit 1', field_name) into result;

    return result;

end;

$$ language plpgsql;

grant
execute on function public.is_set (text) to authenticated;

/*
 * -------------------------------------------------------
 * Section: Accounts
 * We create the schema for the accounts. Accounts are the top level entity in the Supabase MakerKit. They can be team or personal accounts.
 * -------------------------------------------------------
 */
-- Accounts table
create table if not exists
  public.accounts (
    id uuid unique not null default extensions.uuid_generate_v4 (),
    primary_owner_user_id uuid references auth.users on delete cascade not null default auth.uid (),
    name varchar(255) not null,
    slug text unique,
    email varchar(320) unique,
    is_personal_account boolean default false not null,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    created_by uuid references auth.users,
    updated_by uuid references auth.users,
    picture_url varchar(1000),
    public_data jsonb default '{}'::jsonb not null,
    delivr_org_id text null,
    delivr_project_id text null,
    restricted boolean default false not null,
    primary key (id),
    whitelabel_host_account_id uuid references public.accounts (id) on delete set null
  );

comment on table public.accounts is 'Accounts are the top level entity in the Supabase MakerKit. They can be team or personal accounts.';

comment on column public.accounts.is_personal_account is 'Whether the account is a personal account or not';

comment on column public.accounts.name is 'The name of the account';

comment on column public.accounts.slug is 'The slug of the account';

comment on column public.accounts.primary_owner_user_id is 'The primary owner of the account';

comment on column public.accounts.email is 'The email of the account. For teams, this is the email of the team (if any)';

-- Enable RLS on the accounts table
alter table "public"."accounts" enable row level security;

-- Revoke all on accounts table from authenticated and service_role
revoke all on public.accounts
from
  authenticated,
  service_role;

-- Open up access to accounts
grant
select
,
  insert,
update,
delete on table public.accounts to authenticated,
service_role;

-- constraint that conditionally allows nulls on the slug ONLY if
--  personal_account is true
alter table public.accounts
add constraint accounts_slug_null_if_personal_account_true check (
  (
    is_personal_account = true
    and slug is null
  )
  or (
    is_personal_account = false
    and slug is not null
  )
);

-- Indexes
create index if not exists ix_accounts_primary_owner_user_id on public.accounts (primary_owner_user_id);

create index if not exists ix_accounts_is_personal_account on public.accounts (is_personal_account);

-- constraint to ensure that the primary_owner_user_id is unique for personal accounts
create unique index unique_personal_account on public.accounts (primary_owner_user_id)
where
  is_personal_account = true;

-- RLS on the accounts table
-- UPDATE(accounts):
-- Team owners can update their accounts
create policy accounts_self_update on public.accounts
for update
  to authenticated using (
    (
      select
        auth.uid ()
    ) = primary_owner_user_id
  )
with
  check (
    (
      select
        auth.uid ()
    ) = primary_owner_user_id
  );

-- Function "public.transfer_team_account_ownership"
-- Function to transfer the ownership of a team account to another user
create
or replace function public.transfer_team_account_ownership (target_account_id uuid, new_owner_id uuid) returns void
set
  search_path = '' as $$
begin
    if current_user not in('service_role') then
        raise exception 'You do not have permission to transfer account ownership';
    end if;

    -- verify the user is already a member of the account
    if not exists(
        select
            1
        from
            public.accounts_memberships
        where
            target_account_id = account_id
            and user_id = new_owner_id) then
        raise exception 'The new owner must be a member of the account';
    end if;

    -- update the primary owner of the account
    update
        public.accounts
    set
        primary_owner_user_id = new_owner_id
    where
        id = target_account_id
        and is_personal_account = false;

    -- update membership assigning it the hierarchy role
    update
        public.accounts_memberships
    set
        account_role =(
            public.get_upper_system_role())
    where
        target_account_id = account_id
        and user_id = new_owner_id
        and account_role <>(
            public.get_upper_system_role());

end;

$$ language plpgsql;

grant
execute on function public.transfer_team_account_ownership (uuid, uuid) to service_role;

-- Function "public.is_account_owner"
-- Function to check if a user is the primary owner of an account
create
or replace function public.is_account_owner (account_id uuid) returns boolean
set
  search_path = '' as $$
    select
        exists(
            select
                1
            from
                public.accounts
            where
                id = is_account_owner.account_id
                and primary_owner_user_id = auth.uid());
$$ language sql;

grant
execute on function public.is_account_owner (uuid) to authenticated,
service_role;

-- Function "kit.protect_account_fields"
-- Function to protect account fields from being updated
create
or replace function kit.protect_account_fields () returns trigger as $$
begin
    if current_user in('authenticated', 'anon') then
	if new.id <> old.id or new.is_personal_account <>
	    old.is_personal_account or new.primary_owner_user_id <>
	    old.primary_owner_user_id or new.email <> old.email then
            raise exception 'You do not have permission to update this field';

        end if;

    end if;

    return NEW;

end
$$ language plpgsql
set
  search_path = '';

-- trigger to protect account fields
create trigger protect_account_fields before
update on public.accounts for each row
execute function kit.protect_account_fields ();

-- Function "public.get_upper_system_role"
-- Function to get the highest system role for an account
create
or replace function public.get_upper_system_role () returns varchar
set
  search_path = '' as $$
declare
    role varchar(50);
begin
    select name from public.roles
      where hierarchy_level = 1 into role;

    return role;
end;
$$ language plpgsql;

grant
execute on function public.get_upper_system_role () to service_role;

-- Function "kit.add_current_user_to_new_account"
-- Trigger to add the current user to a new account as the primary owner
create
or replace function kit.add_current_user_to_new_account () returns trigger language plpgsql security definer
set
  search_path = '' as $$
begin
    if new.primary_owner_user_id = auth.uid() then
        insert into public.accounts_memberships(
            account_id,
            user_id,
            account_role)
        values(
            new.id,
            auth.uid(),
            public.get_upper_system_role());

    end if;

    return NEW;

end;

$$;

-- trigger the function whenever a new account is created
create trigger "add_current_user_to_new_account"
after insert on public.accounts for each row
when (new.is_personal_account = false)
execute function kit.add_current_user_to_new_account ();

-- create a trigger to update the account email when the primary owner email is updated
create
or replace function kit.handle_update_user_email () returns trigger language plpgsql security definer
set
  search_path = '' as $$
begin
    update
        public.accounts
    set
        email = new.email
    where
        primary_owner_user_id = new.id
        and is_personal_account = true;

    return new;

end;

$$;

-- trigger the function every time a user email is updated only if the user is the primary owner of the account and
-- the account is personal account
create trigger "on_auth_user_updated"
after
update of email on auth.users for each row
execute procedure kit.handle_update_user_email ();

/*
 * -------------------------------------------------------
 * Section: Roles
 * We create the schema for the roles. Roles are the roles for an account. For example, an account might have the roles 'owner', 'admin', and 'member'.
 * -------------------------------------------------------
 */
-- Roles Table
create table if not exists
  public.roles (
    name varchar(50) not null,
    hierarchy_level int not null check (hierarchy_level > 0),
    primary key (name),
    unique (hierarchy_level)
  );

-- Revoke all on roles table from authenticated and service_role
revoke all on public.roles
from
  authenticated,
  service_role;

-- Open up access to roles table for authenticated users and service_role
grant
select
on table public.roles to authenticated,
service_role;

-- RLS
alter table public.roles enable row level security;

/*
 * -------------------------------------------------------
 * Section: Memberships
 * We create the schema for the memberships. Memberships are the memberships for an account. For example, a user might be a member of an account with the role 'owner'.
 * -------------------------------------------------------
 */
-- Account Memberships table
create table if not exists
  public.accounts_memberships (
    user_id uuid references auth.users on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    account_role varchar(50) references public.roles (name) not null,
    created_at timestamptz default current_timestamp not null,
    updated_at timestamptz default current_timestamp not null,
    created_by uuid references auth.users,
    updated_by uuid references auth.users,
    primary key (user_id, account_id)
  );

comment on table public.accounts_memberships is 'The memberships for an account';

comment on column public.accounts_memberships.account_id is 'The account the membership is for';

comment on column public.accounts_memberships.account_role is 'The role for the membership';

-- Revoke all on accounts_memberships table from authenticated and service_role
revoke all on public.accounts_memberships
from
  authenticated,
  service_role;

-- Open up access to accounts_memberships table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.accounts_memberships to authenticated,
service_role;

-- Indexes on the accounts_memberships table
create index ix_accounts_memberships_account_id on public.accounts_memberships (account_id);

create index ix_accounts_memberships_user_id on public.accounts_memberships (user_id);

create index ix_accounts_memberships_account_role on public.accounts_memberships (account_role);

-- Enable RLS on the accounts_memberships table
alter table public.accounts_memberships enable row level security;

-- Function "kit.prevent_account_owner_membership_delete"
-- Trigger to prevent a primary owner from being removed from an account
create
or replace function kit.prevent_account_owner_membership_delete () returns trigger
set
  search_path = '' as $$
begin
    if exists(
        select
            1
        from
            public.accounts
        where
            id = old.account_id
            and primary_owner_user_id = old.user_id) then
    raise exception 'The primary account owner cannot be removed from the account membership list';

end if;

    return old;

end;

$$ language plpgsql;

create
or replace trigger prevent_account_owner_membership_delete_check before delete on public.accounts_memberships for each row
execute function kit.prevent_account_owner_membership_delete ();

-- Function "kit.prevent_memberships_update"
-- Trigger to prevent updates to account memberships with the exception of the account_role
create
or replace function kit.prevent_memberships_update () returns trigger
set
  search_path = '' as $$
begin
    if new.account_role <> old.account_role then
        return new;
    end if;

    raise exception 'Only the account_role can be updated';

end; $$ language plpgsql;

create
or replace trigger prevent_memberships_update_check before
update on public.accounts_memberships for each row
execute function kit.prevent_memberships_update ();

-- Function "public.has_role_on_account"
-- Function to check if a user has a role on an account
create
or replace function public.has_role_on_account (
  account_id uuid,
  account_role varchar(50) default null
) returns boolean language sql security definer
set
  search_path = '' as $$
    select
        exists(
            select
                1
            from
                public.accounts_memberships membership
            where
                membership.user_id = (select auth.uid())
                and membership.account_id = has_role_on_account.account_id
                and((membership.account_role = has_role_on_account.account_role
                    or has_role_on_account.account_role is null)));
$$;

grant
execute on function public.has_role_on_account (uuid, varchar) to authenticated;

-- Function "public.is_team_member"
-- Check if a user is a team member of an account or not
create
or replace function public.is_team_member (account_id uuid, user_id uuid) returns boolean language sql security definer
set
  search_path = '' as $$
    select
        exists(
            select
                1
            from
                public.accounts_memberships membership
            where
                public.has_role_on_account(account_id)
                and membership.user_id = is_team_member.user_id
                and membership.account_id = is_team_member.account_id);
$$;

grant
execute on function public.is_team_member (uuid, uuid) to authenticated,
service_role;

-- RLS
-- SELECT(roles)
-- authenticated users can query roles
create policy roles_read on public.roles for
select
  to authenticated using (
    true
  );

-- Function "public.can_action_account_member"
-- Check if a user can perform management actions on an account member
create
or replace function public.can_action_account_member (target_team_account_id uuid, target_user_id uuid) returns boolean
set
  search_path = '' as $$
declare
    permission_granted boolean;
    target_user_hierarchy_level int;
    current_user_hierarchy_level int;
    is_account_owner boolean;
    target_user_role varchar(50);
begin
    if target_user_id = auth.uid() then
      raise exception 'You cannot update your own account membership with this function';
    end if;

    -- an account owner can action any member of the account
    if public.is_account_owner(target_team_account_id) then
      return true;
    end if;

     -- check the target user is the primary owner of the account
    select
        exists (
            select
                1
            from
                public.accounts
            where
                id = target_team_account_id
                and primary_owner_user_id = target_user_id) into is_account_owner;

    if is_account_owner then
        raise exception 'The primary account owner cannot be actioned';
    end if;

    -- validate the auth user has the required permission on the account
    -- to manage members of the account
    select
 public.has_permission(auth.uid(), target_team_account_id,
     'members.manage'::public.app_permissions) into
     permission_granted;

    -- if the user does not have the required permission, raise an exception
    if not permission_granted then
      raise exception 'You do not have permission to action a member from this account';
    end if;

    -- get the role of the target user
    select
        am.account_role,
        r.hierarchy_level
    from
        public.accounts_memberships as am
    join
        public.roles as r on am.account_role = r.name
    where
        am.account_id = target_team_account_id
        and am.user_id = target_user_id
    into target_user_role, target_user_hierarchy_level;

    -- get the hierarchy level of the current user
    select
        r.hierarchy_level into current_user_hierarchy_level
    from
        public.roles as r
    join
        public.accounts_memberships as am on r.name = am.account_role
    where
        am.account_id = target_team_account_id
        and am.user_id = auth.uid();

    if target_user_role is null then
      raise exception 'The target user does not have a role on the account';
    end if;

    if current_user_hierarchy_level is null then
      raise exception 'The current user does not have a role on the account';
    end if;

    -- check the current user has a higher role than the target user
    if current_user_hierarchy_level >= target_user_hierarchy_level then
      raise exception 'You do not have permission to action a member from this account';
    end if;

    return true;

end;

$$ language plpgsql;

grant
execute on function public.can_action_account_member (uuid, uuid) to authenticated,
service_role;

-- RLS
-- SELECT(accounts_memberships):
-- Users can read their team members account memberships
create policy accounts_memberships_read on public.accounts_memberships for
select
  to authenticated using (
    (
      (
        select
          auth.uid ()
      ) = user_id
    )
    or is_team_member (account_id, user_id)
  );

create
or replace function public.is_account_team_member (target_account_id uuid) returns boolean
set
  search_path = '' as $$
    select exists(
        select 1
        from public.accounts_memberships as membership
        where public.is_team_member (membership.account_id, target_account_id)
    );
$$ language sql;

grant
execute on function public.is_account_team_member (uuid) to authenticated,
service_role;

-- RLS on the accounts table
-- SELECT(accounts):
-- Users can read the an account if
--   - they are the primary owner of the account
--   - they have a role on the account
--   - they are reading an account of the same team
--   - if they are the whitelabel host of the team

create policy accounts_read on public.accounts for
select
  to authenticated using (
  (
    auth.uid() = primary_owner_user_id
  )
  or public.has_role_on_account(id)
  or public.is_account_team_member(id)
  or (
    whitelabel_host_account_id is not null
    and public.has_role_on_account(whitelabel_host_account_id)
  )
);

-- DELETE(accounts_memberships):
-- Users with the required role can remove members from an account or remove their own
create policy accounts_memberships_delete on public.accounts_memberships for delete to authenticated using (
  (
    user_id = (
      select
        auth.uid ()
    )
  )
  or public.can_action_account_member (account_id, user_id)
);

/*
 * -------------------------------------------------------
 * Section: Role Permissions
 * We create the schema for the role permissions. Role permissions are the permissions for a role.
 * For example, the 'owner' role might have the 'roles.manage' permission.
 * -------------------------------------------------------
 */
-- Create table for roles permissions
create table if not exists
  public.role_permissions (
    id bigint generated by default as identity primary key,
    role varchar(50) references public.roles (name) not null,
    permission public.app_permissions not null,
    unique (role, permission)
  );

comment on table public.role_permissions is 'The permissions for a role';

comment on column public.role_permissions.role is 'The role the permission is for';

comment on column public.role_permissions.permission is 'The permission for the role';

-- Indexes on the role_permissions table
create index ix_role_permissions_role on public.role_permissions (role);

-- Revoke all on role_permissions table from authenticated and service_role
revoke all on public.role_permissions
from
  authenticated,
  service_role;

-- Open up access to role_permissions table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.role_permissions to service_role;

-- Authenticated users can read role permissions
grant
select
  on table public.role_permissions to authenticated;

-- Function "public.has_permission"
-- Create a function to check if a user has a permission
create
or replace function public.has_permission (
  user_id uuid,
  account_id uuid,
  permission_name public.app_permissions
) returns boolean
set
  search_path = '' as $$
begin
    return exists(
        select
            1
        from
            public.accounts_memberships
	    join public.role_permissions on
		accounts_memberships.account_role =
		role_permissions.role
        where
            accounts_memberships.user_id = has_permission.user_id
            and accounts_memberships.account_id = has_permission.account_id
            and role_permissions.permission = has_permission.permission_name);

end;

$$ language plpgsql;

grant
execute on function public.has_permission (uuid, uuid, public.app_permissions) to authenticated,
service_role;

-- Function "public.has_more_elevated_role"
-- Check if a user has a more elevated role than the target role
create
or replace function public.has_more_elevated_role (
  target_user_id uuid,
  target_account_id uuid,
  role_name varchar
) returns boolean
set
  search_path = '' as $$
declare
    declare is_primary_owner boolean;
    user_role_hierarchy_level int;
    target_role_hierarchy_level int;
begin
    -- Check if the user is the primary owner of the account
    select
        exists (
            select
                1
            from
                public.accounts
            where
                id = target_account_id
                and primary_owner_user_id = target_user_id) into is_primary_owner;

    -- If the user is the primary owner, they have the highest role and can
    --   perform any action
    if is_primary_owner then
        return true;
    end if;

    -- Get the hierarchy level of the user's role within the account
    select
        hierarchy_level into user_role_hierarchy_level
    from
        public.roles
    where
        name =(
            select
                account_role
            from
                public.accounts_memberships
            where
                account_id = target_account_id
                and target_user_id = user_id);

    if user_role_hierarchy_level is null then
        return false;
    end if;

    -- Get the hierarchy level of the target role
    select
        hierarchy_level into target_role_hierarchy_level
    from
        public.roles
    where
        name = role_name;

    -- If the target role does not exist, the user cannot perform the action
    if target_role_hierarchy_level is null then
        return false;
    end if;

    -- If the user's role is higher than the target role, they can perform
    --   the action
    return user_role_hierarchy_level < target_role_hierarchy_level;

end;

$$ language plpgsql;

grant
execute on function public.has_more_elevated_role (uuid, uuid, varchar) to authenticated,
service_role;

-- Function "public.has_same_role_hierarchy_level"
-- Check if a user has the same role hierarchy level as the target role
create
or replace function public.has_same_role_hierarchy_level (
  target_user_id uuid,
  target_account_id uuid,
  role_name varchar
) returns boolean
set
  search_path = '' as $$
declare
    is_primary_owner boolean;
    user_role_hierarchy_level int;
    target_role_hierarchy_level int;
begin
    -- Check if the user is the primary owner of the account
    select
        exists (
            select
                1
            from
                public.accounts
            where
                id = target_account_id
                and primary_owner_user_id = target_user_id) into is_primary_owner;

    -- If the user is the primary owner, they have the highest role and can perform any action
    if is_primary_owner then
        return true;
    end if;

    -- Get the hierarchy level of the user's role within the account
    select
        hierarchy_level into user_role_hierarchy_level
    from
        public.roles
    where
        name =(
            select
                account_role
            from
                public.accounts_memberships
            where
                account_id = target_account_id
                and target_user_id = user_id);

    -- If the user does not have a role in the account, they cannot perform the action
    if user_role_hierarchy_level is null then
        return false;
    end if;

    -- Get the hierarchy level of the target role
    select
        hierarchy_level into target_role_hierarchy_level
    from
        public.roles
    where
        name = role_name;

    -- If the target role does not exist, the user cannot perform the action
    if target_role_hierarchy_level is null then
        return false;
    end if;

   -- check the user's role hierarchy level is the same as the target role
    return user_role_hierarchy_level = target_role_hierarchy_level;

end;

$$ language plpgsql;

grant
execute on function public.has_same_role_hierarchy_level (uuid, uuid, varchar) to authenticated,
service_role;

-- Enable RLS on the role_permissions table
alter table public.role_permissions enable row level security;

-- RLS on the role_permissions table
-- SELECT(role_permissions):
-- Authenticated Users can read global permissions
create policy role_permissions_read on public.role_permissions for
select
  to authenticated using (true);

/*
 * -------------------------------------------------------
 * Section: Invitations
 * We create the schema for the invitations. Invitations are the invitations for an account sent to a user to join the account.
 * -------------------------------------------------------
 */
create table if not exists
  public.invitations (
    id serial primary key,
    email varchar(255) not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    invited_by uuid references auth.users on delete cascade not null,
    role varchar(50) references public.roles (name) not null,
    invite_token varchar(255) unique not null,
    created_at timestamptz default current_timestamp not null,
    updated_at timestamptz default current_timestamp not null,
    expires_at timestamptz default current_timestamp + interval '7 days' not null,
    unique (email, account_id)
  );

comment on table public.invitations is 'The invitations for an account';

comment on column public.invitations.account_id is 'The account the invitation is for';

comment on column public.invitations.invited_by is 'The user who invited the user';

comment on column public.invitations.role is 'The role for the invitation';

comment on column public.invitations.invite_token is 'The token for the invitation';

comment on column public.invitations.expires_at is 'The expiry date for the invitation';

comment on column public.invitations.email is 'The email of the user being invited';

-- Indexes on the invitations table
create index ix_invitations_account_id on public.invitations (account_id);

-- Revoke all on invitations table from authenticated and service_role
revoke all on public.invitations
from
  authenticated,
  service_role;

-- Open up access to invitations table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.invitations to authenticated,
service_role;

-- Enable RLS on the invitations table
alter table public.invitations enable row level security;

-- Function "kit.check_team_account"
-- Function to check if the account is a team account or not when inserting or updating an invitation
create
or replace function kit.check_team_account () returns trigger
set
  search_path = '' as $$
begin
    if(
        select
            is_personal_account
        from
            public.accounts
        where
            id = new.account_id) then
        raise exception 'Account must be an team account';

    end if;

    return NEW;

end;

$$ language plpgsql;

create trigger only_team_accounts_check before insert
or
update on public.invitations for each row
execute procedure kit.check_team_account ();

-- RLS on the invitations table
-- SELECT(invitations):
-- Users can read invitations to users of an account they are a member of
create policy invitations_read_self on public.invitations for
select
  to authenticated using (public.has_role_on_account (account_id));

-- INSERT(invitations):
-- Users can create invitations to users of an account they are
-- a member of and have the 'invites.manage' permission AND the target role is not higher than the user's role
create policy invitations_create_self on public.invitations for insert to authenticated
with
  check (
    public.is_set ('enable_team_accounts')
    and public.has_permission (
      (
        select
          auth.uid ()
      ),
      account_id,
      'invites.manage'::public.app_permissions
    )
    and (public.has_more_elevated_role (
      (
        select
          auth.uid ()
      ),
      account_id,
      role
    ) or public.has_same_role_hierarchy_level(
      (
        select
          auth.uid ()
      ),
      account_id,
      role
    ))
  );

-- UPDATE(invitations):
-- Users can update invitations to users of an account they are a member of and have the 'invites.manage' permission AND
-- the target role is not higher than the user's role
create policy invitations_update on public.invitations
for update
  to authenticated using (
    public.has_permission (
      (
        select
          auth.uid ()
      ),
      account_id,
      'invites.manage'::public.app_permissions
    )
    and public.has_more_elevated_role (
      (
        select
          auth.uid ()
      ),
      account_id,
      role
    )
  )
with
  check (
    public.has_permission (
      (
        select
          auth.uid ()
      ),
      account_id,
      'invites.manage'::public.app_permissions
    )
    and public.has_more_elevated_role (
      (
        select
          auth.uid ()
      ),
      account_id,
      role
    )
  );

-- DELETE(public.invitations):
-- Users can delete invitations to users of an account they are a member of and have the 'invites.manage' permission
create policy invitations_delete on public.invitations for delete to authenticated using (
  has_role_on_account (account_id)
  and public.has_permission (
    (
      select
        auth.uid ()
    ),
    account_id,
    'invites.manage'::public.app_permissions
  )
);

-- Functions "public.accept_invitation"
-- Function to accept an invitation to an account
create
or replace function accept_invitation (token text, user_id uuid) returns uuid
set
  search_path = '' as $$
declare
    target_account_id uuid;
    target_role varchar(50);
begin
    select
        account_id,
        role into target_account_id,
        target_role
    from
        public.invitations
    where
        invite_token = token
        and expires_at > now();

    if not found then
        raise exception 'Invalid or expired invitation token';
    end if;

    insert into public.accounts_memberships(
        user_id,
        account_id,
        account_role)
    values (
        accept_invitation.user_id,
        target_account_id,
        target_role);

    delete from public.invitations
    where invite_token = token;

    return target_account_id;
end;

$$ language plpgsql;

grant
execute on function accept_invitation (text, uuid) to service_role;

/*
 * -------------------------------------------------------
 * Section: Billing Customers
 * We create the schema for the billing customers. Billing customers are the customers for an account in the billing provider. For example, a user might have a customer in the billing provider with the customer ID 'cus_123'.
 * -------------------------------------------------------
 */
-- Account Subscriptions table
create table
  public.billing_customers (
    account_id uuid references public.accounts (id) on delete cascade not null,
    id serial primary key,
    email text,
    provider public.billing_provider not null,
    customer_id text not null,
    unique (account_id, customer_id, provider)
  );

comment on table public.billing_customers is 'The billing customers for an account';

comment on column public.billing_customers.account_id is 'The account the billing customer is for';

comment on column public.billing_customers.provider is 'The provider of the billing customer';

comment on column public.billing_customers.customer_id is 'The customer ID for the billing customer';

comment on column public.billing_customers.email is 'The email of the billing customer';

-- Indexes on the billing_customers table
create index ix_billing_customers_account_id on public.billing_customers (account_id);

-- Revoke all on billing_customers table from authenticated and service_role
revoke all on public.billing_customers
from
  authenticated,
  service_role;

-- Open up relevant access to billing_customers table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.billing_customers to service_role;

-- Open up access to billing_customers table for authenticated users
grant
select
  on table public.billing_customers to authenticated,
  service_role;

-- Enable RLS on billing_customers table
alter table public.billing_customers enable row level security;

-- RLS on the billing_customers table
-- SELECT(billing_customers):
-- Users can read account subscriptions on an account they are a member of
create policy billing_customers_read_self on public.billing_customers for
select
  to authenticated using (
    account_id = (
      select
        auth.uid ()
    )
    or has_role_on_account (account_id)
  );

/*
 * -------------------------------------------------------
 * Section: Subscriptions
 * We create the schema for the subscriptions. Subscriptions are the subscriptions for an account to a product. For example, a user might have a subscription to a product with the status 'active'.
 * -------------------------------------------------------
 */
-- Subscriptions table
create table if not exists
  public.subscriptions (
    id text not null primary key,
    account_id uuid references public.accounts (id) on delete cascade not null,
    billing_customer_id int references public.billing_customers on delete cascade not null,
    status public.subscription_status not null,
    active bool not null,
    billing_provider public.billing_provider not null,
    cancel_at_period_end bool not null,
    currency varchar(3) not null,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    period_starts_at timestamptz not null,
    period_ends_at timestamptz not null,
    trial_starts_at timestamptz,
    trial_ends_at timestamptz
  );

comment on table public.subscriptions is 'The subscriptions for an account';

comment on column public.subscriptions.account_id is 'The account the subscription is for';

comment on column public.subscriptions.billing_provider is 'The provider of the subscription';

comment on column public.subscriptions.cancel_at_period_end is 'Whether the subscription will be canceled at the end of the period';

comment on column public.subscriptions.currency is 'The currency for the subscription';

comment on column public.subscriptions.status is 'The status of the subscription';

comment on column public.subscriptions.period_starts_at is 'The start of the current period for the subscription';

comment on column public.subscriptions.period_ends_at is 'The end of the current period for the subscription';

comment on column public.subscriptions.trial_starts_at is 'The start of the trial period for the subscription';

comment on column public.subscriptions.trial_ends_at is 'The end of the trial period for the subscription';

comment on column public.subscriptions.active is 'Whether the subscription is active';

comment on column public.subscriptions.billing_customer_id is 'The billing customer ID for the subscription';

-- Revoke all on subscriptions table from authenticated and service_role
revoke all on public.subscriptions
from
  authenticated,
  service_role;

-- Open up relevant access to subscriptions table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.subscriptions to service_role;

grant
select
  on table public.subscriptions to authenticated;

-- Indexes on the subscriptions table
create index ix_subscriptions_account_id on public.subscriptions (account_id);

-- Enable RLS on subscriptions table
alter table public.subscriptions enable row level security;

-- RLS on the subscriptions table
-- SELECT(subscriptions):
-- Users can read account subscriptions on an account they are a member of
create policy subscriptions_read_self on public.subscriptions for
select
  to authenticated using (
    (
      has_role_on_account (account_id)
      and public.is_set ('enable_team_account_billing')
    )
    or (
      account_id = (
        select
          auth.uid ()
      )
      and public.is_set ('enable_account_billing')
    )
  );

-- Function "public.upsert_subscription"
-- Insert or Update a subscription and its items in the database when receiving a webhook from the billing provider
create
or replace function public.upsert_subscription (
  target_account_id uuid,
  target_customer_id varchar(255),
  target_subscription_id text,
  active bool,
  status public.subscription_status,
  billing_provider public.billing_provider,
  cancel_at_period_end bool,
  currency varchar(3),
  period_starts_at timestamptz,
  period_ends_at timestamptz,
  line_items jsonb,
  trial_starts_at timestamptz default null,
  trial_ends_at timestamptz default null
) returns public.subscriptions
set
  search_path = '' as $$
declare
    new_subscription public.subscriptions;
    new_billing_customer_id int;
begin
    insert into public.billing_customers(
        account_id,
        provider,
        customer_id)
    values (
        target_account_id,
        billing_provider,
        target_customer_id)
on conflict (
    account_id,
    provider,
    customer_id)
    do update set
        provider = excluded.provider
    returning
        id into new_billing_customer_id;

    insert into public.subscriptions(
        account_id,
        billing_customer_id,
        id,
        active,
        status,
        billing_provider,
        cancel_at_period_end,
        currency,
        period_starts_at,
        period_ends_at,
        trial_starts_at,
        trial_ends_at)
    values (
        target_account_id,
        new_billing_customer_id,
        target_subscription_id,
        active,
        status,
        billing_provider,
        cancel_at_period_end,
        currency,
        period_starts_at,
        period_ends_at,
        trial_starts_at,
        trial_ends_at)
on conflict (
    id)
    do update set
        active = excluded.active,
        status = excluded.status,
        cancel_at_period_end = excluded.cancel_at_period_end,
        currency = excluded.currency,
        period_starts_at = excluded.period_starts_at,
        period_ends_at = excluded.period_ends_at,
        trial_starts_at = excluded.trial_starts_at,
        trial_ends_at = excluded.trial_ends_at
    returning
        * into new_subscription;

    -- Upsert subscription items and delete ones that are not in the line_items array
    with item_data as (
        select
            (line_item ->> 'id')::varchar as line_item_id,
            (line_item ->> 'product_id')::varchar as prod_id,
            (line_item ->> 'variant_id')::varchar as var_id,
            (line_item ->> 'type')::public.subscription_item_type as type,
            (line_item ->> 'price_amount')::numeric as price_amt,
            (line_item ->> 'quantity')::integer as qty,
            (line_item ->> 'interval')::varchar as intv,
            (line_item ->> 'interval_count')::integer as intv_count
        from
            jsonb_array_elements(line_items) as line_item
    ),
    line_item_ids as (
        select line_item_id from item_data
    ),
    deleted_items as (
        delete from
            public.subscription_items
        where
            public.subscription_items.subscription_id = new_subscription.id
            and public.subscription_items.id not in (select line_item_id from line_item_ids)
        returning *
    )
    insert into public.subscription_items(
        id,
        subscription_id,
        product_id,
        variant_id,
        type,
        price_amount,
        quantity,
        interval,
        interval_count)
    select
        line_item_id,
        target_subscription_id,
        prod_id,
        var_id,
        type,
        price_amt,
        qty,
        intv,
        intv_count
    from
        item_data
    on conflict (id)
        do update set
            product_id = excluded.product_id,
            variant_id = excluded.variant_id,
            price_amount = excluded.price_amount,
            quantity = excluded.quantity,
            interval = excluded.interval,
            type = excluded.type,
            interval_count = excluded.interval_count;

    return new_subscription;

end;

$$ language plpgsql;

grant
execute on function public.upsert_subscription (
  uuid,
  varchar,
  text,
  bool,
  public.subscription_status,
  public.billing_provider,
  bool,
  varchar,
  timestamptz,
  timestamptz,
  jsonb,
  timestamptz,
  timestamptz
) to service_role;

/* -------------------------------------------------------
* Section: Subscription Items
* We create the schema for the subscription items. Subscription items are the items in a subscription.
* For example, a subscription might have a subscription item with the product ID 'prod_123' and the variant ID 'var_123'.
* -------------------------------------------------------
*/
create table if not exists
  public.subscription_items (
    id varchar(255) not null primary key,
    subscription_id text references public.subscriptions (id) on delete cascade not null,
    product_id varchar(255) not null,
    variant_id varchar(255) not null,
    type public.subscription_item_type not null,
    price_amount numeric,
    quantity integer not null default 1,
    interval varchar(255) not null,
    interval_count integer not null check (interval_count > 0),
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    unique (subscription_id, product_id, variant_id)
  );

comment on table public.subscription_items is 'The items in a subscription';

comment on column public.subscription_items.subscription_id is 'The subscription the item is for';

comment on column public.subscription_items.product_id is 'The product ID for the item';

comment on column public.subscription_items.variant_id is 'The variant ID for the item';

comment on column public.subscription_items.price_amount is 'The price amount for the item';

comment on column public.subscription_items.quantity is 'The quantity of the item';

comment on column public.subscription_items.interval is 'The interval for the item';

comment on column public.subscription_items.interval_count is 'The interval count for the item';

comment on column public.subscription_items.created_at is 'The creation date of the item';

comment on column public.subscription_items.updated_at is 'The last update date of the item';

-- Revoke all access to subscription_items table for authenticated users and service_role
revoke all on public.subscription_items
from
  authenticated,
  service_role;

-- Open up relevant access to subscription_items table for authenticated users and service_role
grant
select
  on table public.subscription_items to authenticated,
  service_role;

grant insert,
update,
delete on table public.subscription_items to service_role;

-- Indexes
-- Indexes on the subscription_items table
create index ix_subscription_items_subscription_id on public.subscription_items (subscription_id);

-- RLS
alter table public.subscription_items enable row level security;

-- SELECT(subscription_items)
-- Users can read subscription items on a subscription they are a member of
create policy subscription_items_read_self on public.subscription_items for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.subscriptions
      where
        id = subscription_id
        and (
          account_id = (
            select
              auth.uid ()
          )
          or has_role_on_account (account_id)
        )
    )
  );

/**
 * -------------------------------------------------------
 * Section: Orders
 * We create the schema for the subscription items. Subscription items are the items in a subscription.
 * For example, a subscription might have a subscription item with the product ID 'prod_123' and the variant ID 'var_123'.
 * -------------------------------------------------------
 */
create table if not exists
  public.orders (
    id text not null primary key,
    account_id uuid references public.accounts (id) on delete cascade not null,
    billing_customer_id int references public.billing_customers on delete cascade not null,
    status public.payment_status not null,
    billing_provider public.billing_provider not null,
    total_amount numeric not null,
    currency varchar(3) not null,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp
  );

comment on table public.orders is 'The one-time orders for an account';

comment on column public.orders.account_id is 'The account the order is for';

comment on column public.orders.billing_provider is 'The provider of the order';

comment on column public.orders.total_amount is 'The total amount for the order';

comment on column public.orders.currency is 'The currency for the order';

comment on column public.orders.status is 'The status of the order';

comment on column public.orders.billing_customer_id is 'The billing customer ID for the order';

-- Revoke all access to orders table for authenticated users and service_role
revoke all on public.orders
from
  authenticated,
  service_role;

-- Open up access to orders table for authenticated users and service_role
grant
select
  on table public.orders to authenticated;

grant
select
,
  insert,
update,
delete on table public.orders to service_role;

-- Indexes
-- Indexes on the orders table
create index ix_orders_account_id on public.orders (account_id);

-- RLS
alter table public.orders enable row level security;

-- SELECT(orders)
-- Users can read orders on an account they are a member of or the account is their own
create policy orders_read_self on public.orders for
select
  to authenticated using (
    (
      account_id = (
        select
          auth.uid ()
      )
      and public.is_set ('enable_account_billing')
    )
    or (
      has_role_on_account (account_id)
      and public.is_set ('enable_team_account_billing')
    )
  );

/**
 * -------------------------------------------------------
 * Section: Order Items
 * We create the schema for the order items. Order items are the items in an order.
 * -------------------------------------------------------
 */
create table if not exists
  public.order_items (
    id text not null primary key,
    order_id text references public.orders (id) on delete cascade not null,
    product_id text not null,
    variant_id text not null,
    price_amount numeric,
    quantity integer not null default 1,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    unique (order_id, product_id, variant_id)
  );

comment on table public.order_items is 'The items in an order';

comment on column public.order_items.order_id is 'The order the item is for';

comment on column public.order_items.order_id is 'The order the item is for';

comment on column public.order_items.product_id is 'The product ID for the item';

comment on column public.order_items.variant_id is 'The variant ID for the item';

comment on column public.order_items.price_amount is 'The price amount for the item';

comment on column public.order_items.quantity is 'The quantity of the item';

comment on column public.order_items.created_at is 'The creation date of the item';

comment on column public.order_items.updated_at is 'The last update date of the item';

-- Revoke all access to order_items table for authenticated users and service_role
revoke all on public.order_items
from
  authenticated,
  service_role;

-- Open up relevant access to order_items table for authenticated users and service_role
grant
select
  on table public.order_items to authenticated,
  service_role;

grant insert, update, delete on table public.order_items to service_role;

-- Indexes on the order_items table
create index ix_order_items_order_id on public.order_items (order_id);

-- RLS
alter table public.order_items enable row level security;

-- SELECT(order_items):
-- Users can read order items on an order they are a member of
create policy order_items_read_self on public.order_items for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.orders
      where
        id = order_id
        and (
          account_id = (
            select
              auth.uid ()
          )
          or has_role_on_account (account_id)
        )
    )
  );

-- Function "public.upsert_order"
-- Insert or update an order and its items when receiving a webhook from the billing provider
create
or replace function public.upsert_order (
  target_account_id uuid,
  target_customer_id varchar(255),
  target_order_id text,
  status public.payment_status,
  billing_provider public.billing_provider,
  total_amount numeric,
  currency varchar(3),
  line_items jsonb
) returns public.orders
set
  search_path = '' as $$
declare
    new_order public.orders;
    new_billing_customer_id int;
begin
    insert into public.billing_customers(
        account_id,
        provider,
        customer_id)
    values (
        target_account_id,
        billing_provider,
        target_customer_id)
on conflict (
    account_id,
    provider,
    customer_id)
    do update set
        provider = excluded.provider
    returning
        id into new_billing_customer_id;

    insert into public.orders(
        account_id,
        billing_customer_id,
        id,
        status,
        billing_provider,
        total_amount,
        currency)
    values (
        target_account_id,
        new_billing_customer_id,
        target_order_id,
        status,
        billing_provider,
        total_amount,
        currency)
on conflict (
    id)
    do update set
        status = excluded.status,
        total_amount = excluded.total_amount,
        currency = excluded.currency
    returning
        * into new_order;

    -- Upsert order items and delete ones that are not in the line_items array
    with item_data as (
        select
            (line_item ->> 'id')::varchar as line_item_id,
            (line_item ->> 'product_id')::varchar as prod_id,
            (line_item ->> 'variant_id')::varchar as var_id,
            (line_item ->> 'price_amount')::numeric as price_amt,
            (line_item ->> 'quantity')::integer as qty
        from
            jsonb_array_elements(line_items) as line_item
    ),
    line_item_ids as (
        select line_item_id from item_data
    ),
    deleted_items as (
        delete from
            public.order_items
        where
            public.order_items.order_id = new_order.id
            and public.order_items.id not in (select line_item_id from line_item_ids)
        returning *
    )
    insert into public.order_items(
        id,
        order_id,
        product_id,
        variant_id,
        price_amount,
        quantity)
    select
        line_item_id,
        target_order_id,
        prod_id,
        var_id,
        price_amt,
        qty
    from
        item_data
    on conflict (id)
        do update set
            price_amount = excluded.price_amount,
            product_id = excluded.product_id,
            variant_id = excluded.variant_id,
            quantity = excluded.quantity;

    return new_order;

end;

$$ language plpgsql;

grant
execute on function public.upsert_order (
  uuid,
  varchar,
  text,
  public.payment_status,
  public.billing_provider,
  numeric,
  varchar,
  jsonb
) to service_role;

/**
 * -------------------------------------------------------
 * Section: Notifications
 * We create the schema for the notifications. Notifications are the notifications for an account.
 * -------------------------------------------------------
 */
create type public.notification_channel as enum('in_app', 'email');

create type public.notification_type as enum('info', 'warning', 'error');

create table if not exists
  public.notifications (
    id bigint generated always as identity primary key,
    account_id uuid not null references public.accounts (id) on delete cascade,
    type public.notification_type not null default 'info',
    body varchar(5000) not null,
    link varchar(255),
    channel public.notification_channel not null default 'in_app',
    dismissed boolean not null default false,
    expires_at timestamptz default (now() + interval '1 month'),
    created_at timestamptz not null default now()
  );

comment on table notifications is 'The notifications for an account';

comment on column notifications.account_id is 'The account the notification is for (null for system messages)';

comment on column notifications.type is 'The type of the notification';

comment on column notifications.body is 'The body of the notification';

comment on column notifications.link is 'The link for the notification';

comment on column notifications.channel is 'The channel for the notification';

comment on column notifications.dismissed is 'Whether the notification has been dismissed';

comment on column notifications.expires_at is 'The expiry date for the notification';

comment on column notifications.created_at is 'The creation date for the notification';

-- Revoke all access to notifications table for authenticated users and service_role
revoke all on public.notifications
from
  authenticated,
  service_role;

-- Open up relevant access to notifications table for authenticated users and service_role
grant
select
,
update on table public.notifications to authenticated,
service_role;

grant insert on table public.notifications to service_role;

-- enable realtime
alter publication supabase_realtime
add table public.notifications;

-- Indexes
-- Indexes on the notifications table
-- index for selecting notifications for an account that are not dismissed and not expired
create index idx_notifications_account_dismissed on notifications (account_id, dismissed, expires_at);

-- RLS
alter table public.notifications enable row level security;

-- SELECT(notifications):
-- Users can read notifications on an account they are a member of
create policy notifications_read_self on public.notifications for
select
  to authenticated using (
    account_id = (
      select
        auth.uid ()
    )
    or has_role_on_account (account_id)
  );

-- UPDATE(notifications):
-- Users can set notifications to read on an account they are a member of
create policy notifications_update_self on public.notifications
for update
  to authenticated using (
    account_id = (
      select
        auth.uid ()
    )
    or has_role_on_account (account_id)
  );

-- Function "kit.update_notification_dismissed_status"
-- Make sure the only updatable field is the dismissed status and nothing else
create
or replace function kit.update_notification_dismissed_status () returns trigger
set
  search_path to '' as $$
begin
    old.dismissed := new.dismissed;

    if (new is distinct from old) then
         raise exception 'UPDATE of columns other than "dismissed" is forbidden';
    end if;

    return old;
end;
$$ language plpgsql;

-- add trigger when updating a notification to update the dismissed status
create trigger update_notification_dismissed_status before
update on public.notifications for each row
execute procedure kit.update_notification_dismissed_status ();

/**
 * -------------------------------------------------------
 * Section: Slugify
 * We create the schema for the slugify functions. Slugify functions are used to create slugs from strings.
 * We use this for ensure unique slugs for accounts.
 * -------------------------------------------------------
 */
-- Create a function to slugify a string
-- useful for turning an account name into a unique slug
create
or replace function kit.slugify ("value" text) returns text as $$
    -- removes accents (diacritic signs) from a given string --
    with "unaccented" as(
        select
            kit.unaccent("value") as "value"
),
-- lowercases the string
"lowercase" as(
    select
        lower("value") as "value"
    from
        "unaccented"
),
-- remove single and double quotes
"removed_quotes" as(
    select
	regexp_replace("value", '[''"]+', '',
	    'gi') as "value"
    from
        "lowercase"
),
-- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen('-')
"hyphenated" as(
    select
	regexp_replace("value", '[^a-z0-9\\-_]+', '-',
	    'gi') as "value"
    from
        "removed_quotes"
),
-- trims hyphens('-') if they exist on the head or tail of
--   the string
"trimmed" as(
    select
	regexp_replace(regexp_replace("value", '\-+$',
	    ''), '^\-', '') as "value" from "hyphenated"
)
        select
            "value"
        from
            "trimmed";
$$ language SQL strict immutable
set
  search_path to '';

grant
execute on function kit.slugify (text) to service_role,
authenticated;

-- Function "kit.set_slug_from_account_name"
-- Set the slug from the account name and increment if the slug exists
create
or replace function kit.set_slug_from_account_name () returns trigger language plpgsql security definer
set
  search_path = '' as $$
declare
    sql_string varchar;
    tmp_slug varchar;
    increment integer;
    tmp_row record;
    tmp_row_count integer;
begin
    tmp_row_count = 1;

    increment = 0;

    while tmp_row_count > 0 loop
        if increment > 0 then
            tmp_slug = kit.slugify(new.name || ' ' || increment::varchar);

        else
            tmp_slug = kit.slugify(new.name);

        end if;

	sql_string = format('select count(1) cnt from public.accounts where slug = ''' || tmp_slug ||
	    '''; ');

        for tmp_row in execute (sql_string)
            loop
                raise notice 'tmp_row %', tmp_row;

                tmp_row_count = tmp_row.cnt;

            end loop;

        increment = increment +1;

    end loop;

    new.slug := tmp_slug;

    return NEW;

end
$$;

-- Create a trigger to set the slug from the account name
create trigger "set_slug_from_account_name" before insert on public.accounts for each row when (
  NEW.name is not null
  and NEW.slug is null
  and NEW.is_personal_account = false
)
execute procedure kit.set_slug_from_account_name ();

-- Create a trigger when a name is updated to update the slug
create trigger "update_slug_from_account_name" before
update on public.accounts for each row when (
  NEW.name is not null
  and NEW.name <> OLD.name
  and NEW.is_personal_account = false
)
execute procedure kit.set_slug_from_account_name ();

-- Function "kit.setup_new_user"
-- Setup a new user account after user creation
create
or replace function kit.setup_new_user () returns trigger language plpgsql security definer
set
  search_path = '' as $$
declare
    user_name text;
    picture_url text;
begin
    if new.raw_user_meta_data ->> 'name' is not null then
        user_name := new.raw_user_meta_data ->> 'name';

    end if;

    if user_name is null and new.email is not null then
        user_name := split_part(new.email, '@', 1);

    end if;

    if user_name is null then
        user_name := '';

    end if;

    if new.raw_user_meta_data ->> 'avatar_url' is not null then
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    else
        picture_url := null;
    end if;

    insert into public.accounts(
        id,
        primary_owner_user_id,
        name,
        is_personal_account,
        picture_url,
        email)
    values (
        new.id,
        new.id,
        user_name,
        true,
        picture_url,
        new.email);

    return new;

end;

$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure kit.setup_new_user ();

/**
 * -------------------------------------------------------
 * Section: Functions
 * We create the schema for the functions. Functions are the custom functions for the application.
 * -------------------------------------------------------
 */
-- Function "public.create_team_account"
-- Create a team account if team accounts are enabled
create
or replace function public.create_team_account (account_name text) returns public.accounts
set
  search_path = '' as $$
declare
    new_account public.accounts;
begin
    if (not public.is_set('enable_team_accounts')) then
        raise exception 'Team accounts are not enabled';
    end if;

    insert into public.accounts(
        name,
        is_personal_account)
    values (
        account_name,
        false)
returning
    * into new_account;

    return new_account;

end;

$$ language plpgsql;

grant
execute on function public.create_team_account (text) to authenticated,
service_role;

-- RLS(public.accounts)
-- Authenticated users can create team accounts
create policy create_org_account on public.accounts for insert to authenticated
with
  check (
    public.is_set ('enable_team_accounts')
    and public.accounts.is_personal_account = false
  );

-- Function "public.create_invitation"
-- create an invitation to an account
create
or replace function public.create_invitation (account_id uuid, email text, role varchar(50)) returns public.invitations
set
  search_path = '' as $$
declare
    new_invitation public.invitations;
    invite_token text;
begin
    invite_token := extensions.uuid_generate_v4();

    insert into public.invitations(
        email,
        account_id,
        invited_by,
        role,
        invite_token)
    values (
        email,
        account_id,
        auth.uid(),
        role,
        invite_token)
returning
    * into new_invitation;

    return new_invitation;

end;

$$ language plpgsql;

--
-- VIEW "user_account_workspace":
-- we create a view to load the general app data for the authenticated
-- user which includes the user accounts and memberships
create or replace view
  public.user_account_workspace
with
  (security_invoker = true) as
select
  accounts.id as id,
  accounts.name as name,
  accounts.picture_url as picture_url,
  (
    select
      status
    from
      public.subscriptions
    where
      account_id = accounts.id
    limit
      1
  ) as subscription_status
from
  public.accounts
where
  primary_owner_user_id = (select auth.uid ())
  and accounts.is_personal_account = true
limit
  1;

grant
select
  on public.user_account_workspace to authenticated,
  service_role;

--
-- VIEW "user_accounts":
-- we create a view to load the user's accounts and memberships
-- useful to display the user's accounts in the app
create or replace view
  public.user_accounts (id, name, picture_url, slug, role)
with
  (security_invoker = true) as
select
  account.id,
  account.name,
  account.picture_url,
  account.slug,
  membership.account_role
from
  public.accounts account
  join public.accounts_memberships membership on account.id = membership.account_id
where
  membership.user_id = (select auth.uid ())
  and account.is_personal_account = false
  and account.id in (
    select
      account_id
    from
      public.accounts_memberships
    where
      user_id = (select auth.uid ())
  );

grant
select
  on public.user_accounts to authenticated,
  service_role;

--
-- Function "public.team_account_workspace"
-- Load all the data for a team account workspace
create or replace function public.team_account_workspace(account_slug text)
returns table (
  id uuid,
  name varchar(255),
  picture_url varchar(1000),
  slug text,
  role varchar(50),
  role_hierarchy_level int,
  primary_owner_user_id uuid,
  subscription_status public.subscription_status,
  permissions public.app_permissions[],
  restricted boolean,
  is_whitelabel_host boolean,
  whitelabel_restricted boolean,
  whitelabel_company_name text
)
set search_path to ''
as $$
begin
    return QUERY
    select
        accounts.id,
        accounts.name,
        accounts.picture_url,
        accounts.slug,
        accounts_memberships.account_role,
        roles.hierarchy_level,
        accounts.primary_owner_user_id,
        subscriptions.status,
        array_agg(role_permissions.permission),
        accounts.restricted,
        exists (
          select 1
          from public.whitelabel_credits
          where whitelabel_credits.account_id = accounts.id
        ) as is_whitelabel_host,
        coalesce(
          (
            select wc2.restricted
            from public.whitelabel_credits wc2
            where wc2.account_id = accounts.whitelabel_host_account_id
          ),
          false
        ) as whitelabel_restricted,
        (
          select wb.company_name
          from public.whitelabel_branding wb
          where wb.account_id = accounts.whitelabel_host_account_id
        ) as whitelabel_company_name
    from
        public.accounts
        join public.accounts_memberships on accounts.id = accounts_memberships.account_id
        left join public.subscriptions on accounts.id = subscriptions.account_id
        join public.roles on accounts_memberships.account_role = roles.name
        left join public.role_permissions on accounts_memberships.account_role = role_permissions.role
    where
        accounts.slug = account_slug
        and public.accounts_memberships.user_id = (select auth.uid())
    group by
        accounts.id,
        accounts_memberships.account_role,
        subscriptions.status,
        roles.hierarchy_level,
        accounts.restricted;
end;
$$ language plpgsql;

grant
execute on function public.team_account_workspace (text) to authenticated,
service_role;

-- Functions "public.get_account_members"
-- Function to get the members of an account by the account slug
create
or replace function public.get_account_members (account_slug text) returns table (
  id uuid,
  user_id uuid,
  account_id uuid,
  role varchar(50),
  role_hierarchy_level int,
  primary_owner_user_id uuid,
  name varchar,
  email varchar,
  picture_url varchar,
  created_at timestamptz,
  updated_at timestamptz
) language plpgsql
set
  search_path = '' as $$
begin
    return QUERY
    select
        acc.id,
        am.user_id,
        am.account_id,
        am.account_role,
        r.hierarchy_level,
        a.primary_owner_user_id,
        acc.name,
        acc.email,
        acc.picture_url,
        am.created_at,
        am.updated_at
    from
        public.accounts_memberships am
        join public.accounts a on a.id = am.account_id
        join public.accounts acc on acc.id = am.user_id
        join public.roles r on r.name = am.account_role
    where
        a.slug = account_slug;

end;

$$;

grant
execute on function public.get_account_members (text) to authenticated,
service_role;

-- Function "public.get_account_invitations"
-- List the account invitations by the account slug
create
or replace function public.get_account_invitations (account_slug text) returns table (
  id integer,
  email varchar(255),
  account_id uuid,
  invited_by uuid,
  role varchar(50),
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz,
  inviter_name varchar,
  inviter_email varchar
)
set
  search_path = '' as $$
begin
    return query
    select
        invitation.id,
        invitation.email,
        invitation.account_id,
        invitation.invited_by,
        invitation.role,
        invitation.created_at,
        invitation.updated_at,
        invitation.expires_at,
        account.name,
        account.email
    from
        public.invitations as invitation
        join public.accounts as account on invitation.account_id = account.id
    where
        account.slug = account_slug;

end;

$$ language plpgsql;

grant
execute on function public.get_account_invitations (text) to authenticated,
service_role;

-- Function "public.add_invitations_to_account"
-- Add invitations to an account
create
or replace function public.add_invitations_to_account (
  account_slug text,
  invitations public.invitation[]
) returns public.invitations[]
set
  search_path = '' as $$
declare
    new_invitation public.invitations;
    all_invitations public.invitations[] := array[]::public.invitations[];
    invite_token text;
    email text;
    role varchar(50);
begin
    FOREACH email,
    role in array invitations loop
        invite_token := extensions.uuid_generate_v4();

        insert into public.invitations(
            email,
            account_id,
            invited_by,
            role,
            invite_token)
        values (
            email,
(
                select
                    id
                from
                    public.accounts
                where
                    slug = account_slug), auth.uid(), role, invite_token)
    returning
        * into new_invitation;

        all_invitations := array_append(all_invitations, new_invitation);

    end loop;

    return all_invitations;

end;

$$ language plpgsql;

grant
execute on function public.add_invitations_to_account (text, public.invitation[]) to authenticated,
service_role;

-- Function "public.has_active_subscription"
-- Check if a user has an active subscription on an account - ie. it's trialing or active
-- Useful to gate access to features that require a subscription
create
or replace function public.has_active_subscription (target_account_id uuid) returns boolean
set
  search_path = '' as $$
begin
    return exists (
        select
            1
        from
            public.subscriptions
        where
            account_id = target_account_id
            and active = true);

end;

$$ language plpgsql;

grant
execute on function public.has_active_subscription (uuid) to authenticated,
service_role;

-- Storage
-- Account Image
insert into
  storage.buckets (id, name, PUBLIC)
values
  ('account_image', 'account_image', true);

-- Function: get the storage filename as a UUID.
-- Useful if you want to name files with UUIDs related to an account
create
or replace function kit.get_storage_filename_as_uuid (name text) returns uuid
set
  search_path = '' as $$
begin
    return replace(storage.filename(name), concat('.',
	storage.extension(name)), '')::uuid;

end;

$$ language plpgsql;

grant
execute on function kit.get_storage_filename_as_uuid (text) to authenticated,
service_role;

-- RLS policies for storage bucket account_image
create policy account_image on storage.objects for all using (
  bucket_id = 'account_image'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_role_on_account(kit.get_storage_filename_as_uuid(name))
  )
)
with check (
  bucket_id = 'account_image'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_permission(
      auth.uid(),
      kit.get_storage_filename_as_uuid(name),
      'settings.manage'
    )
  )
);-- Seed the roles table with default roles 'owner' and 'member'
insert into public.roles(
    name,
    hierarchy_level)
values (
    'owner',
    1);

insert into public.roles(
    name,
    hierarchy_level)
values (
    'member',
    2);

-- We seed the role_permissions table with the default roles and permissions
insert into public.role_permissions(
  role,
  permission)
values (
  'owner',
  'roles.manage'),
(
  'owner',
  'billing.manage'),
(
  'owner',
  'settings.manage'),
(
  'owner',
  'members.manage'),
(
  'owner',
  'invites.manage'),
(
  'member',
  'settings.manage'),
(
  'member',
  'invites.manage');create policy delete_team_account
    on public.accounts
    for delete
    to authenticated
    using (
        auth.uid() = primary_owner_user_id
    );-- Add pgsodium extension for encryption features
-- Uncomment the line below if you need pgsodium functionality
-- create extension if not exists pgsodium; -- Create agency_credit_pricing table
CREATE TABLE IF NOT EXISTS public.agency_credit_pricing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('audience', 'enrichment', 'pixel', 'custom_model')),
  price_per_credit_cents integer NOT NULL DEFAULT 0,
  cost_per_credit_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, credit_type)
);

-- Create overage_credit_purchases table
CREATE TABLE IF NOT EXISTS public.overage_credit_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('audience', 'enrichment', 'pixel', 'custom_model')),
  credits integer NOT NULL DEFAULT 0,
  price_per_credit_cents integer NOT NULL DEFAULT 0,
  cost_per_credit_cents integer NOT NULL DEFAULT 0,
  billed_to_client boolean NOT NULL DEFAULT false,
  billed_to_agency boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.agency_credit_pricing IS 'Stores per-credit pricing for each agency';
COMMENT ON TABLE public.overage_credit_purchases IS 'Stores client overage credit purchases for billing';

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_agency_credit_pricing_agency_id ON public.agency_credit_pricing(agency_id);
CREATE INDEX IF NOT EXISTS ix_overage_credit_purchases_client_id ON public.overage_credit_purchases(client_id);
CREATE INDEX IF NOT EXISTS ix_overage_credit_purchases_agency_id ON public.overage_credit_purchases(agency_id);
CREATE INDEX IF NOT EXISTS ix_overage_credit_purchases_billed_to_client ON public.overage_credit_purchases(billed_to_client);

-- Set up RLS
ALTER TABLE public.agency_credit_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overage_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_credit_pricing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.overage_credit_purchases TO authenticated;
GRANT ALL ON public.agency_credit_pricing TO service_role;
GRANT ALL ON public.overage_credit_purchases TO service_role;

-- RLS Policies for agency_credit_pricing
CREATE POLICY "Users can view their agency's credit pricing" ON public.agency_credit_pricing
  FOR SELECT TO authenticated
  USING (
    public.has_role_on_account(agency_id)
  );

CREATE POLICY "Agency owners can manage their credit pricing" ON public.agency_credit_pricing
  FOR ALL TO authenticated
  USING (
    public.has_role_on_account(agency_id) AND 
    public.has_permission(auth.uid(), agency_id, 'billing.manage'::app_permissions)
  );

-- RLS Policies for overage_credit_purchases
CREATE POLICY "Clients can view their own purchases" ON public.overage_credit_purchases
  FOR SELECT TO authenticated
  USING (
    public.has_role_on_account(client_id)
  );

CREATE POLICY "Clients can create their own purchases" ON public.overage_credit_purchases
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role_on_account(client_id)
  );

CREATE POLICY "Agencies can view their clients' purchases" ON public.overage_credit_purchases
  FOR SELECT TO authenticated
  USING (
    public.has_role_on_account(agency_id)
  );

CREATE POLICY "Service role can manage all purchases" ON public.overage_credit_purchases
  FOR ALL TO service_role
  USING (true);

-- Insert default pricing for existing agencies (if any)
-- This will be populated by the application when agencies set their pricing -- Studio Enrichment Feature - Database Changes
-- This migration documents the database changes needed for the Studio enrichment feature
-- Note: The Studio enrichment feature is primarily real-time and doesn't require persistent storage
-- However, we may want to track usage for analytics and billing purposes

-- =============================================================================
-- OPTIONAL: Studio Enrichment Usage Tracking Table
-- =============================================================================
-- This table is optional and can be added if you want to track enrichment usage
-- for analytics, billing, or audit purposes

-- Uncomment the following if you want to track enrichment usage:

/*
create table if not exists public.studio_enrichment_log (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null, -- Studio session identifier
  data_source text not null check (data_source in ('audience', 'webhook')),
  rows_processed integer not null default 0,
  fields_enriched text[] not null, -- Array of enrichment fields requested
  success_count integer not null default 0,
  error_count integer not null default 0,
  processing_time_ms integer, -- Time taken for enrichment in milliseconds
  created_at timestamptz not null default now()
);

-- revoke permissions on public.studio_enrichment_log
revoke all on public.studio_enrichment_log from public, service_role;

-- grant required permissions on public.studio_enrichment_log
grant select, insert on public.studio_enrichment_log to authenticated;
grant select, insert, update, delete on public.studio_enrichment_log to service_role;

-- Indexes for performance
create index ix_studio_enrichment_log_account_id on public.studio_enrichment_log(account_id);
create index ix_studio_enrichment_log_user_id on public.studio_enrichment_log(user_id);
create index ix_studio_enrichment_log_created_at on public.studio_enrichment_log(created_at);

-- RLS
alter table public.studio_enrichment_log enable row level security;

-- Realtime (optional)
-- alter publication supabase_realtime add table studio_enrichment_log;

-- SELECT policy
create policy select_studio_enrichment_log
  on public.studio_enrichment_log
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- INSERT policy
create policy insert_studio_enrichment_log
  on public.studio_enrichment_log
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

-- UPDATE policy
create policy update_studio_enrichment_log
  on public.studio_enrichment_log
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- DELETE policy
create policy delete_studio_enrichment_log
  on public.studio_enrichment_log
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );
*/

-- =============================================================================
-- EXISTING TABLES USED BY STUDIO ENRICHMENT
-- =============================================================================
-- The following tables already exist and are used by the Studio enrichment feature:

-- 1. public.accounts - For account identification and RLS
-- 2. public.job_enrich - For the main enrichment feature (CSV uploads)
-- 3. public.audience - For audience data access in Studio
-- 4. auth.users - For user authentication

-- =============================================================================
-- NO ADDITIONAL CHANGES REQUIRED
-- =============================================================================
-- The Studio enrichment feature is designed to work with existing infrastructure:

-- ✅ Authentication: Uses existing auth.users and public.accounts
-- ✅ Authorization: Uses existing RLS policies and has_role_on_account function
-- ✅ Data Access: Uses existing audience table and GCS storage
-- ✅ Real-time: Uses existing Supabase realtime subscriptions
-- ✅ API Security: Uses existing enhanceRouteHandler pattern

-- =============================================================================
-- DEPLOYMENT NOTES
-- =============================================================================

-- For staging/production deployment:

-- 1. The Studio enrichment feature requires NO database changes
-- 2. All existing tables and policies are sufficient
-- 3. The feature uses the existing /api/enrich endpoint
-- 4. Authentication and authorization use existing patterns

-- If you want to track usage (optional):
-- 1. Uncomment the studio_enrichment_log table creation above
-- 2. Run this migration in your staging/production environment
-- 3. Update the enrichment API to log usage

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify existing tables exist:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('accounts', 'job_enrich', 'audience');
*/

-- Verify RLS policies exist:
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'job_enrich', 'audience');
*/

-- Verify functions exist:
/*
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('has_role_on_account', 'is_account_owner');
*/ -- Studio Segments Feature - Database Schema
-- This migration creates the segments table for saving Studio segments

-- =============================================================================
-- SEGMENTS TABLE
-- =============================================================================

create table if not exists public.segments (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  description text null,
  source_type text not null check (source_type in ('audience', 'webhook_upload', 'csv_upload')),
  source_id text not null, -- audience_id or upload_id
  filters jsonb not null default '[]'::jsonb, -- Array of filter objects
  enrichment_fields text[] not null default '[]', -- Array of enrichment field names
  custom_columns jsonb not null default '[]'::jsonb, -- Array of custom column definitions
  tags text[] not null default '[]', -- Array of tags
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- revoke permissions on public.segments
revoke all on public.segments from public, service_role;

-- grant required permissions on public.segments
grant select, insert, update, delete on public.segments to authenticated;
grant select, insert, update, delete on public.segments to service_role;

-- Indexes for performance
create index ix_segments_account_id on public.segments(account_id);
create index ix_segments_created_by on public.segments(created_by);
create index ix_segments_source_type on public.segments(source_type);
create index ix_segments_created_at on public.segments(created_at);
create index ix_segments_deleted on public.segments(deleted);

-- RLS
alter table public.segments enable row level security;

-- Realtime
alter publication supabase_realtime add table segments;

-- SELECT policy
create policy select_segments
  on public.segments
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- INSERT policy
create policy insert_segments
  on public.segments
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

-- UPDATE policy
create policy update_segments
  on public.segments
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- DELETE policy
create policy delete_segments
  on public.segments
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger
create trigger set_timestamps_segments
  before update on public.segments
  for each row
  execute function public.trigger_set_timestamps();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create a segment with automatic naming
create or replace function public.create_studio_segment(
  p_account_id uuid,
  p_name text,
  p_description text default null,
  p_source_type text,
  p_source_id text,
  p_filters jsonb default '[]'::jsonb,
  p_enrichment_fields text[] default '[]',
  p_custom_columns jsonb default '[]'::jsonb,
  p_tags text[] default '[]'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_segment_id uuid;
  v_user_id uuid;
begin
  -- Get current user
  v_user_id := auth.uid();
  
  -- Validate user has access to account
  if not public.has_role_on_account(p_account_id) then
    raise exception 'Access denied to account %', p_account_id;
  end if;
  
  -- Create segment
  insert into public.segments (
    account_id,
    name,
    description,
    source_type,
    source_id,
    filters,
    enrichment_fields,
    custom_columns,
    tags,
    created_by
  ) values (
    p_account_id,
    p_name,
    p_description,
    p_source_type,
    p_source_id,
    p_filters,
    p_enrichment_fields,
    p_custom_columns,
    p_tags,
    v_user_id
  )
  returning id into v_segment_id;
  
  return v_segment_id;
end;
$$;

-- Grant execute permission
grant execute on function public.create_studio_segment(uuid, text, text, text, text, jsonb, text[], jsonb, text[]) to authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify table exists:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'segments';
*/

-- Verify RLS policies exist:
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'segments';
*/

-- Verify function exists:
/*
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_studio_segment';
*/ create extension if not exists pg_cron;

-- Create a table to store one-time tokens (nonces)
CREATE TABLE IF NOT EXISTS public.nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_token TEXT NOT NULL, -- token sent to client (hashed)
    nonce TEXT NOT NULL, -- token stored in DB (hashed)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL, -- Optional to support anonymous tokens
    purpose TEXT NOT NULL, -- e.g., 'password-reset', 'email-verification', etc.
    
    -- Status fields
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at TIMESTAMPTZ,
    revoked BOOLEAN NOT NULL DEFAULT FALSE, -- For administrative revocation
    revoked_reason TEXT, -- Reason for revocation if applicable
    
    -- Audit fields
    verification_attempts INTEGER NOT NULL DEFAULT 0, -- Track attempted uses
    last_verification_at TIMESTAMPTZ, -- Timestamp of last verification attempt
    last_verification_ip INET, -- For tracking verification source
    last_verification_user_agent TEXT, -- For tracking client information
    
    -- Extensibility fields
    metadata JSONB DEFAULT '{}'::JSONB, -- optional metadata
    scopes TEXT[] DEFAULT '{}' -- OAuth-style authorized scopes
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_nonces_status ON public.nonces (client_token, user_id, purpose, expires_at)
  WHERE used_at IS NULL AND revoked = FALSE;

-- Enable Row Level Security (RLS)
ALTER TABLE public.nonces ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Users can view their own nonces for verification
CREATE POLICY "Users can read their own nonces"
  ON public.nonces
  FOR SELECT
  USING (
    user_id = (select auth.uid())
  );

-- Create a function to create a nonce
CREATE OR REPLACE FUNCTION public.create_nonce(
  p_user_id UUID DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL,
  p_expires_in_seconds INTEGER DEFAULT 3600, -- 1 hour by default
  p_metadata JSONB DEFAULT NULL,
  p_scopes TEXT[] DEFAULT NULL,
  p_revoke_previous BOOLEAN DEFAULT TRUE -- New parameter to control automatic revocation
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_token TEXT;
  v_nonce TEXT;
  v_expires_at TIMESTAMPTZ;
  v_id UUID;
  v_plaintext_token TEXT;
  v_revoked_count INTEGER;
BEGIN
  -- Revoke previous tokens for the same user and purpose if requested
  -- This only applies if a user ID is provided (not for anonymous tokens)
  IF p_revoke_previous = TRUE AND p_user_id IS NOT NULL THEN
    WITH revoked AS (
      UPDATE public.nonces
      SET 
        revoked = TRUE,
        revoked_reason = 'Superseded by new token with same purpose'
      WHERE 
        user_id = p_user_id
        AND purpose = p_purpose
        AND used_at IS NULL
        AND revoked = FALSE
        AND expires_at > NOW()
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_revoked_count FROM revoked;
  END IF;

  -- Generate a 6-digit token
  v_plaintext_token := (100000 + floor(random() * 900000))::text;
  v_client_token := crypt(v_plaintext_token, gen_salt('bf'));
  
  -- Still generate a secure nonce for internal use
  v_nonce := encode(gen_random_bytes(24), 'base64');
  v_nonce := crypt(v_nonce, gen_salt('bf'));
  
  -- Calculate expiration time
  v_expires_at := NOW() + (p_expires_in_seconds * interval '1 second');
  
  -- Insert the new nonce
  INSERT INTO public.nonces (
    client_token,
    nonce,
    user_id,
    expires_at,
    metadata,
    purpose,
    scopes
  )
  VALUES (
    v_client_token,
    v_nonce,
    p_user_id,
    v_expires_at,
    COALESCE(p_metadata, '{}'::JSONB),
    p_purpose,
    COALESCE(p_scopes, '{}'::TEXT[])
  )
  RETURNING id INTO v_id;
  
  -- Return the token information
  -- Note: returning the plaintext token, not the hash
  RETURN jsonb_build_object(
    'id', v_id,
    'token', v_plaintext_token,
    'expires_at', v_expires_at,
    'revoked_previous_count', COALESCE(v_revoked_count, 0)
  );
END;
$$;

grant execute on function public.create_nonce to service_role;

-- Create a function to verify a nonce
CREATE OR REPLACE FUNCTION public.verify_nonce(
  p_token TEXT,
  p_purpose TEXT,
  p_user_id UUID DEFAULT NULL,
  p_required_scopes TEXT[] DEFAULT NULL,
  p_max_verification_attempts INTEGER DEFAULT 5,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nonce RECORD;
  v_matching_count INTEGER;
BEGIN 
  -- Add debugging info
  RAISE NOTICE 'Verifying token: %, purpose: %, user_id: %', p_token, p_purpose, p_user_id;
  
  -- Count how many matching tokens exist before verification attempt
  SELECT COUNT(*) INTO v_matching_count 
  FROM public.nonces
  WHERE purpose = p_purpose;
  
  -- Update verification attempt counter and tracking info for all matching tokens
  UPDATE public.nonces
  SET 
    verification_attempts = verification_attempts + 1,
    last_verification_at = NOW(),
    last_verification_ip = COALESCE(p_ip, last_verification_ip),
    last_verification_user_agent = COALESCE(p_user_agent, last_verification_user_agent)
  WHERE 
    client_token = crypt(p_token, client_token)
    AND purpose = p_purpose;

  -- Find the nonce by token and purpose
  -- Modified to handle user-specific tokens better
  SELECT *
  INTO v_nonce
  FROM public.nonces
  WHERE 
    client_token = crypt(p_token, client_token)
    AND purpose = p_purpose
    -- Only apply user_id filter if the token was created for a specific user
    AND (
      -- Case 1: Anonymous token (user_id is NULL in DB)
      (user_id IS NULL) 
      OR 
      -- Case 2: User-specific token (check if user_id matches)
      (user_id = p_user_id)
    )
    AND used_at IS NULL
    AND NOT revoked
    AND expires_at > NOW();
  
  -- Check if nonce exists
  IF v_nonce.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid or expired token'
    );
  END IF;
  
  -- Check if max verification attempts exceeded
  IF p_max_verification_attempts > 0 AND v_nonce.verification_attempts > p_max_verification_attempts THEN
    -- Automatically revoke the token
    UPDATE public.nonces
    SET 
      revoked = TRUE,
      revoked_reason = 'Maximum verification attempts exceeded'
    WHERE id = v_nonce.id;
    
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Token revoked due to too many verification attempts',
      'max_attempts_exceeded', true
    );
  END IF;
  
  -- Check scopes if required
  IF p_required_scopes IS NOT NULL AND array_length(p_required_scopes, 1) > 0 THEN
    -- Fix scope validation to properly check if token scopes contain all required scopes
    -- Using array containment check: array1 @> array2 (array1 contains array2)
    IF NOT (v_nonce.scopes @> p_required_scopes) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'message', 'Token does not have required permissions',
        'token_scopes', v_nonce.scopes,
        'required_scopes', p_required_scopes
      );
    END IF;
  END IF;
  
  -- Mark nonce as used
  UPDATE public.nonces
  SET used_at = NOW()
  WHERE id = v_nonce.id;
  
  -- Return success with metadata
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_nonce.user_id,
    'metadata', v_nonce.metadata,
    'scopes', v_nonce.scopes,
    'purpose', v_nonce.purpose
  );
END;
$$;

grant execute on function public.verify_nonce to authenticated,service_role;

-- Create a function to revoke a nonce
CREATE OR REPLACE FUNCTION public.revoke_nonce(
  p_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE public.nonces
  SET 
    revoked = TRUE,
    revoked_reason = p_reason
  WHERE 
    id = p_id
    AND used_at IS NULL
    AND NOT revoked
  RETURNING 1 INTO v_affected_rows;
  
  RETURN v_affected_rows > 0;
END;
$$;

grant execute on function public.revoke_nonce to service_role;

-- Create a function to clean up expired nonces
CREATE OR REPLACE FUNCTION kit.cleanup_expired_nonces(
  p_older_than_days INTEGER DEFAULT 1,
  p_include_used BOOLEAN DEFAULT TRUE,
  p_include_revoked BOOLEAN DEFAULT TRUE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count and delete expired or used nonces based on parameters
  WITH deleted AS (
    DELETE FROM public.nonces
    WHERE 
      (
        -- Expired and unused tokens
        (expires_at < NOW() AND used_at IS NULL)
        
        -- Used tokens older than specified days (if enabled)
        OR (p_include_used = TRUE AND used_at < NOW() - (p_older_than_days * interval '1 day'))
        
        -- Revoked tokens older than specified days (if enabled)
        OR (p_include_revoked = TRUE AND revoked = TRUE AND created_at < NOW() - (p_older_than_days * interval '1 day'))
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  
  RETURN v_count;
END;
$$;

-- Create a function to get token status (for administrative use)
CREATE OR REPLACE FUNCTION public.get_nonce_status(
  p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nonce public.nonces;
BEGIN
  SELECT * INTO v_nonce FROM public.nonces WHERE id = p_id;
  
  IF v_nonce.id IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;
  
  RETURN jsonb_build_object(
    'exists', true,
    'purpose', v_nonce.purpose,
    'user_id', v_nonce.user_id,
    'created_at', v_nonce.created_at,
    'expires_at', v_nonce.expires_at,
    'used_at', v_nonce.used_at,
    'revoked', v_nonce.revoked,
    'revoked_reason', v_nonce.revoked_reason,
    'verification_attempts', v_nonce.verification_attempts,
    'last_verification_at', v_nonce.last_verification_at,
    'last_verification_ip', v_nonce.last_verification_ip,
    'is_valid', (v_nonce.used_at IS NULL AND NOT v_nonce.revoked AND v_nonce.expires_at > NOW())
  );
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.nonces IS 'Table for storing one-time tokens with enhanced security and audit features';
COMMENT ON FUNCTION public.create_nonce IS 'Creates a new one-time token for a specific purpose with enhanced options';
COMMENT ON FUNCTION public.verify_nonce IS 'Verifies a one-time token, checks scopes, and marks it as used';
COMMENT ON FUNCTION public.revoke_nonce IS 'Administratively revokes a token to prevent its use';
COMMENT ON FUNCTION kit.cleanup_expired_nonces IS 'Cleans up expired, used, or revoked tokens based on parameters';
COMMENT ON FUNCTION public.get_nonce_status IS 'Retrieves the status of a token for administrative purposes';create table if not exists public.audience (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  filters jsonb not null default '{}',
  name text not null,
  webhook_url text null,
  scheduled_refresh boolean not null default false,
  refresh_interval integer null,
  next_scheduled_refresh timestamptz null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.audience
revoke all on public.audience from public, service_role;

-- grant required permissions on public.audience
grant select, insert, delete on public.audience to authenticated;
grant select, insert, update, delete on public.audience to service_role;

-- Indexes
create index ix_audience_account_id on public.audience(account_id);

-- RLS
alter table public.audience enable row level security;


-- SELECT(public.audience)
create policy select_audience
  on public.audience
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.audience)
create policy delete_audience
  on public.audience
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.audience)
create policy update_audience
  on public.audience
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.audience)
create policy insert_audience
  on public.audience
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

-- create extension pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Audience refresh cron job function
CREATE OR REPLACE FUNCTION create_audience_refresh_cron(
  p_job_name TEXT,
  p_cron_expression TEXT,
  p_audience_id UUID,
  p_account_id UUID,
  p_refresh_interval INTEGER
) RETURNS VOID AS $$
DECLARE
  job_exists INTEGER;
  next_run timestamptz;
BEGIN
  SELECT COUNT(*) INTO job_exists FROM cron.job WHERE jobname = p_job_name;
  
  IF job_exists > 0 THEN
    PERFORM cron.unschedule(p_job_name);
  END IF;
  
  PERFORM cron.schedule(
    p_job_name, 
    p_cron_expression, 
    format(
      $cmd$
        SELECT net.http_post(
          url := 'http://host.docker.internal:3000/api/db/refresh',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Supabase-Event-Signature', 'WEBHOOKSECRET'
          ),
          body := jsonb_build_object(
            'audience_id', '%s',
            'account_id', '%s'
          ),
          timeout_milliseconds := 5000
        ) AS request_id;
      $cmd$,
      p_audience_id,
      p_account_id
    )
  );
  
  -- Compute the next scheduled refresh time.
  -- Here we assume that refresh jobs always run at midnight.
  -- For a 30-day interval we add one month; for others, we add the exact number of days.
  IF p_refresh_interval = 30 THEN
    next_run := date_trunc('month', now()) + interval '1 month';
  ELSE
    next_run := date_trunc('day', now()) + (p_refresh_interval || ' days')::interval;
  END IF;

  UPDATE public.audience
  SET scheduled_refresh = true,
      refresh_interval = p_refresh_interval,
      next_scheduled_refresh = next_run
  WHERE id = p_audience_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove refresh cron job function
CREATE OR REPLACE FUNCTION remove_audience_cron_job(p_job_name TEXT, p_audience_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE public.audience
  SET scheduled_refresh = false,
      refresh_interval = NULL,
      next_scheduled_refresh = NULL
  WHERE id = p_audience_id;
  
  PERFORM cron.unschedule(p_job_name);
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.audience
    SET scheduled_refresh = false,
        refresh_interval = NULL,
        next_scheduled_refresh = NULL
    WHERE id = p_audience_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION create_audience_refresh_cron(TEXT, TEXT, UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_audience_refresh_cron(TEXT, TEXT, UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION remove_audience_cron_job(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_audience_cron_job(TEXT, UUID) TO service_role;create table if not exists public.enqueue_job (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  audience_id uuid not null references public.audience(id) on delete cascade,
  status text not null default 'no data',
  csv_url text null,
  current integer null,
  total integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payload_enqueue text null,
  payload_process text null,
  payload_hydrate text null,
  resolution_time double precision null,
  update_count integer null
);

-- revoke permissions on public.enqueue_job
revoke all on public.enqueue_job from public, service_role;

-- grant required permissions on public.enqueue_job
grant select, insert, delete on public.enqueue_job to authenticated;
grant select, insert, update, delete on public.enqueue_job to service_role;

-- Indexes
create index ix_enqueue_job_account_id on public.enqueue_job(account_id);
create index ix_enqueue_job_audience_id on public.enqueue_job(audience_id);

-- RLS
alter table public.enqueue_job enable row level security;

-- Realtime
alter publication supabase_realtime add table enqueue_job;

-- SELECT(public.enqueue_job)
create policy select_enqueue_job
  on public.enqueue_job
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.enqueue_job)
create policy delete_enqueue_job
  on public.enqueue_job
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.enqueue_job)
create policy update_enqueue_job
  on public.enqueue_job
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.enqueue_job)
create policy insert_enqueue_job
  on public.enqueue_job
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );


create function public.updated_at_column() returns trigger
  language plpgsql
as
$$
BEGIN
    NEW.updated_at = now();

    NEW.resolution_time = extract(epoch from (NEW.updated_at - NEW.created_at));

    IF NEW.update_count IS NULL THEN
        NEW.update_count = 1;
    ELSE
        NEW.update_count = NEW.update_count + 1;
    END IF;

    RETURN NEW;
END;
$$;

alter function public.updated_at_column() owner to postgres;
grant execute on function public.updated_at_column() to service_role;

create trigger set_updated_at
  before update
  on public.enqueue_job
  for each row
  execute procedure public.updated_at_column();create table if not exists public.job_enrich (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  status text not null default 'submitted',
  csv_url text null,
  payload_enqueue text null,
  total integer null,
  payload_hydrate text null,
  payload_load text null,
  resolution_time double precision null,
  update_count integer null,
  path text null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.job_enrich
revoke all on public.job_enrich from public, service_role;

-- grant required permissions on public.job_enrich
grant select, insert, delete on public.job_enrich to authenticated;
grant select, insert, update, delete on public.job_enrich to service_role;

-- Indexes
create index ix_job_enrich_account_id on public.job_enrich(account_id);

-- RLS
alter table public.job_enrich enable row level security;

-- Realtime
alter publication supabase_realtime add table job_enrich;

-- SELECT(public.job_enrich)
create policy select_job_enrich
  on public.job_enrich
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.job_enrich)
create policy delete_job_enrich
  on public.job_enrich
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.job_enrich)
create policy update_job_enrich
  on public.job_enrich
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.job_enrich)
create policy insert_job_enrich
  on public.job_enrich
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );create type public.interest_status as enum(
  'processing',
  'ready',
  'rejected'
);

create table if not exists public.interests_custom (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  topic_id text not null,
  topic text null,
  description text not null,
  status public.interest_status not null default 'processing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.interests_custom
revoke all on public.interests_custom from public, service_role;

-- grant required permissions on public.interests_custom
grant select, insert, delete on public.interests_custom to authenticated;
grant select, insert, update, delete on public.interests_custom to service_role;

-- Indexes
create index ix_interests_custom_account_id on public.interests_custom(account_id);

-- RLS
alter table public.interests_custom enable row level security;

-- SELECT(public.interests_custom)
create policy select_interests_custom
  on public.interests_custom
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.interests_custom)
create policy delete_interests_custom
  on public.interests_custom
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.interests_custom)
create policy update_interests_custom
  on public.interests_custom
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.interests_custom)
create policy insert_interests_custom
  on public.interests_custom
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

select cron.schedule(
  'update-interests-daily',
  '0 2 * * *',              -- every day at 2:00 AM UTC
  $$
    SELECT net.http_post(
      url := 'http://host.docker.internal:3000/api/db/interest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Supabase-Event-Signature', 'WEBHOOKSECRET'
      ),
      timeout_milliseconds := 20000
    );
  $$
);
create table if not exists public.credits (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  monthly_audience_limit integer not null default 20,
  max_custom_interests integer not null default 1,
  audience_size_limit integer not null default 500000,
  b2b_access boolean not null default true,
  intent_access boolean not null default true,
  monthly_pixel_limit integer not null default 1,
  pixel_size_limit integer not null default 100000,
  monthly_enrichment_limit integer not null default 1,
  enrichment_size_limit integer not null default 500000,
  current_audience integer not null default 0,
  current_pixel integer not null default 0,
  current_enrichment integer not null default 0,
  current_custom integer not null default 0,
  whitelabel_host_account_id uuid references public.accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.credits
revoke all on public.credits from public, service_role;

-- grant required permissions on public.credits
grant select on public.credits to authenticated;
grant select, insert, update, delete on public.credits to service_role;

-- Indexes
create index ix_credits_account_id on public.credits(account_id);

-- RLS
alter table public.credits enable row level security;

-- SELECT(public.credits)
create policy select_credits
  on public.credits
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id)
    or public.has_role_on_account(whitelabel_host_account_id)
  );

CREATE OR REPLACE FUNCTION public.create_team_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_personal_account = false THEN
    INSERT INTO public.credits(account_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_team_credits() FROM public;

CREATE TRIGGER after_team_account_insert
AFTER INSERT ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.create_team_credits();


CREATE OR REPLACE FUNCTION public.increment_custom_interests_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.credits
    SET current_custom = current_custom + 1
  WHERE account_id = NEW.account_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_custom_interests_count() FROM public;

CREATE TRIGGER after_insert_interests_custom
AFTER INSERT ON public.interests_custom
FOR EACH ROW
EXECUTE FUNCTION public.increment_custom_interests_count();

CREATE OR REPLACE FUNCTION public.increment_enrichment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.credits
    SET current_enrichment = current_enrichment + 1
  WHERE account_id = NEW.account_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_enrichment_count() FROM public;

CREATE TRIGGER after_insert_job_enrich
AFTER INSERT ON public.job_enrich
FOR EACH ROW
EXECUTE FUNCTION public.increment_enrichment_count();

CREATE OR REPLACE FUNCTION public.decrement_enrichment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status)
     AND (NEW.status IN ('NO_DATA', 'FAILED')) THEN
     
    UPDATE public.credits
    SET current_enrichment = GREATEST(current_enrichment - 1, 0)
    WHERE account_id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_enrichment_count() FROM public;

CREATE TRIGGER after_failed_job_enrich
AFTER UPDATE ON public.job_enrich
FOR EACH ROW
EXECUTE FUNCTION public.decrement_enrichment_count();

CREATE OR REPLACE FUNCTION public.increment_audience_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
      FROM public.enqueue_job 
     WHERE audience_id = NEW.audience_id
  ) = 1 THEN
    UPDATE public.credits
       SET current_audience = current_audience + 1
     WHERE account_id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_audience_count() FROM public;

CREATE TRIGGER after_insert_enqueue_job
AFTER INSERT ON public.enqueue_job
FOR EACH ROW
EXECUTE FUNCTION public.increment_audience_count();

CREATE OR REPLACE FUNCTION public.decrement_audience_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
      FROM public.enqueue_job 
     WHERE audience_id = OLD.audience_id
  ) = 0 THEN
    UPDATE public.credits
       SET current_audience = current_audience - 1
     WHERE account_id = OLD.account_id;
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_audience_count() FROM public;

CREATE TRIGGER after_delete_enqueue_job
AFTER DELETE ON public.enqueue_job
FOR EACH ROW
EXECUTE FUNCTION public.decrement_audience_count();

SELECT cron.schedule(
  'reset-monthly-credits',
  '0 0 1 * *',    -- at 00:00 UTC on day-of-month 1
  $$
    UPDATE public.credits AS c
    SET
      current_enrichment = 0,
      current_audience   = (
        SELECT COUNT(DISTINCT a.id)
        FROM public.audience     AS a
        JOIN public.enqueue_job  AS j
          ON j.audience_id = a.id
        WHERE a.account_id = c.account_id
          AND a.deleted    = FALSE
      ),
      current_pixel = (
        SELECT COUNT(*)
        FROM public.pixel AS p
        WHERE p.account_id = c.account_id
          AND p.deleted = FALSE
      )
    ;
  $$
);
create table if not exists public.signup_codes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  permissions jsonb not null default '{}'::jsonb,
  max_usage int,
  enabled boolean not null default true,
  expires_at timestamptz,
  whitelabel_host_account_id uuid references public.accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.signup_codes
revoke all on public.signup_codes from public, service_role;

-- grant required permissions on public.signup_codes
grant select, insert, update, delete on public.signup_codes to service_role;

-- Indexes
create index ix_signup_codes_code on public.signup_codes(whitelabel_host_account_id);

-- RLS
alter table public.signup_codes enable row level security;

-- SELECT(public.signup_codes)
create policy select_signup_codes
  on public.signup_codes
  for select
  to authenticated
  using (
    public.has_role_on_account(whitelabel_host_account_id) 
  );

-- UPDATE(public.signup_codes)
create policy update_signup_codes
  on public.signup_codes
  for update
  to authenticated
  using (
    public.has_role_on_account(whitelabel_host_account_id) 
  )
  with check (
    public.has_role_on_account(whitelabel_host_account_id) 
  );

-- INSERT(public.signup_codes)
create policy insert_signup_codes
  on public.signup_codes
  for insert
  to authenticated
  with check (
    public.has_role_on_account(whitelabel_host_account_id) 
  );

create table if not exists public.signup_code_usages (
  id uuid primary key default uuid_generate_v4(),
  signup_code_id uuid not null references public.signup_codes(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  whitelabel_host_account_id uuid references public.accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.signup_code_usages
revoke all on public.signup_code_usages from public, service_role;

-- grant required permissions on public.signup_code_usages
grant select, insert, update, delete on public.signup_code_usages to service_role;

-- Indexes
create index ix_signup_code_usages_account_id on public.signup_code_usages(account_id);

-- RLS
alter table public.signup_code_usages enable row level security;

create policy select_signup_code_usages_by_host
on public.signup_code_usages
for select
to authenticated
using (
  public.has_role_on_account(whitelabel_host_account_id)
);-- Add resell_prices and total_amount_cents columns to signup_codes table
ALTER TABLE public.signup_codes 
ADD COLUMN IF NOT EXISTS resell_prices jsonb,
ADD COLUMN IF NOT EXISTS total_amount_cents integer;

-- Add comments for documentation
COMMENT ON COLUMN public.signup_codes.resell_prices IS 'JSON object containing resell prices for different credit types';
COMMENT ON COLUMN public.signup_codes.total_amount_cents IS 'Total amount in cents for the magic signup link'; create sequence departments_id_seq;
create table if not exists public.ref_departments (
    id integer default nextval('departments_id_seq'::regclass) not null constraint departments_pkey primary key,
    nome text not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP
);

comment on table ref_departments is 'Table storing department categories';

alter table ref_departments owner to postgres;

create unique index idx_departments_nome on ref_departments (nome);

grant delete, insert, references, select, trigger, truncate, update on ref_departments to authenticated;

grant delete, insert, references, select, trigger, truncate, update on ref_departments to service_role;

insert into public.ref_departments (id, nome, created_at)
values  (1, 'Administrative', '2025-03-12 20:27:50.427230 +00:00'),
        (2, 'Community And Social Services', '2025-03-12 20:27:50.641384 +00:00'),
        (3, 'Education', '2025-03-12 20:27:50.863301 +00:00'),
        (4, 'Engineering', '2025-03-12 20:27:51.078323 +00:00'),
        (5, 'Executive', '2025-03-12 20:27:51.273722 +00:00'),
        (6, 'Finance', '2025-03-12 20:27:51.390764 +00:00'),
        (7, 'Government', '2025-03-12 20:27:51.491060 +00:00'),
        (8, 'Health Services', '2025-03-12 20:27:51.596993 +00:00'),
        (9, 'Human Resources', '2025-03-12 20:27:51.703354 +00:00'),
        (10, 'Information Technology', '2025-03-12 20:27:51.920554 +00:00'),
        (11, 'Legal', '2025-03-12 20:27:52.014837 +00:00'),
        (12, 'Marketing', '2025-03-12 20:27:52.223041 +00:00'),
        (13, 'Media And Communications', '2025-03-12 20:27:52.318096 +00:00'),
        (14, 'Military And Protective Services', '2025-03-12 20:27:52.429725 +00:00'),
        (15, 'Operations', '2025-03-12 20:27:52.626039 +00:00'),
        (16, 'Product Management', '2025-03-12 20:27:52.723566 +00:00'),
        (17, 'Real Estate', '2025-03-12 20:27:52.825604 +00:00'),
        (18, 'Sales', '2025-03-12 20:27:53.020584 +00:00');

create sequence industries_id_seq;

create table if not exists public.ref_industries (
    id integer default nextval('industries_id_seq'::regclass) not null constraint industries_pkey primary key,
    nome text not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP
);

comment on table ref_industries is 'Table storing industry categories';

alter table ref_industries owner to postgres;

create unique index idx_industries_nome on ref_industries(nome);

grant delete, insert, references, select, trigger, truncate, update on ref_industries to authenticated;

grant delete, insert, references, select, trigger, truncate, update on ref_industries to service_role;

insert into public.ref_industries (id, nome, created_at)
values  (1, 'Accounting', '2025-03-12 20:26:17.445928 +00:00'),
        (2, 'Administration Of Justice', '2025-03-12 20:26:17.559704 +00:00'),
        (3, 'Advertising Services', '2025-03-12 20:26:17.669573 +00:00'),
        (4, 'Airlines And Aviation', '2025-03-12 20:26:17.872527 +00:00'),
        (5, 'Alternative Dispute Resolution', '2025-03-12 20:26:18.112994 +00:00'),
        (6, 'Alternative Medicine', '2025-03-12 20:26:18.231397 +00:00'),
        (7, 'Animation And Post-Production', '2025-03-12 20:26:18.330818 +00:00'),
        (8, 'Appliances, Electrical, And Electronics Manufacturing', '2025-03-12 20:26:18.435617 +00:00'),
        (9, 'Architecture And Planning', '2025-03-12 20:26:18.608795 +00:00'),
        (10, 'Armed Forces', '2025-03-12 20:26:18.718006 +00:00'),
        (11, 'Artists And Writers', '2025-03-12 20:26:18.816355 +00:00'),
        (12, 'Automation Machinery Manufacturing', '2025-03-12 20:26:18.910983 +00:00'),
        (13, 'Automotive', '2025-03-12 20:26:19.078008 +00:00'),
        (14, 'Aviation And Aerospace Component Manufacturing', '2025-03-12 20:26:19.274346 +00:00'),
        (15, 'Banking', '2025-03-12 20:26:19.474460 +00:00'),
        (16, 'Beverage Manufacturing', '2025-03-12 20:26:19.591339 +00:00'),
        (17, 'Biotechnology Research', '2025-03-12 20:26:19.711446 +00:00'),
        (18, 'Book And Periodical Publishing', '2025-03-12 20:26:19.920509 +00:00'),
        (19, 'Broadcast Media Production And Distribution', '2025-03-12 20:26:20.003971 +00:00'),
        (20, 'Building Construction', '2025-03-12 20:26:20.131316 +00:00'),
        (21, 'Business Consulting And Services', '2025-03-12 20:26:20.216700 +00:00'),
        (22, 'Business Skills Training', '2025-03-12 20:26:20.295196 +00:00'),
        (23, 'Capital Markets', '2025-03-12 20:26:20.392429 +00:00'),
        (24, 'Chemical Manufacturing', '2025-03-12 20:26:20.482145 +00:00'),
        (25, 'Civic And Social Organizations', '2025-03-12 20:26:20.588163 +00:00'),
        (26, 'Civil Engineering', '2025-03-12 20:26:20.704948 +00:00'),
        (27, 'Commercial Real Estate', '2025-03-12 20:26:20.795068 +00:00'),
        (28, 'Computer And Network Security', '2025-03-12 20:26:20.998807 +00:00'),
        (29, 'Computer Games', '2025-03-12 20:26:21.095922 +00:00'),
        (30, 'Computer Hardware Manufacturing', '2025-03-12 20:26:21.186293 +00:00'),
        (31, 'Computer Networking', '2025-03-12 20:26:21.286420 +00:00'),
        (32, 'Computers And Electronics Manufacturing', '2025-03-12 20:26:21.395794 +00:00'),
        (33, 'Consumer Electronics', '2025-03-12 20:26:21.486909 +00:00'),
        (34, 'Consumer Goods', '2025-03-12 20:26:21.589149 +00:00'),
        (35, 'Consumer Services', '2025-03-12 20:26:21.683435 +00:00'),
        (36, 'Cosmetics', '2025-03-12 20:26:21.773711 +00:00'),
        (37, 'Dairy Product Manufacturing', '2025-03-12 20:26:21.872289 +00:00'),
        (38, 'Defense And Space Manufacturing', '2025-03-12 20:26:21.969249 +00:00'),
        (39, 'Design Services', '2025-03-12 20:26:22.054738 +00:00'),
        (40, 'E-Learning Providers', '2025-03-12 20:26:22.150476 +00:00'),
        (41, 'Education Administration Programs', '2025-03-12 20:26:22.241638 +00:00'),
        (42, 'Entertainment Providers', '2025-03-12 20:26:22.336559 +00:00'),
        (43, 'Environmental Services', '2025-03-12 20:26:22.426608 +00:00'),
        (44, 'Events Services', '2025-03-12 20:26:22.515656 +00:00'),
        (45, 'Executive Offices', '2025-03-12 20:26:22.612614 +00:00'),
        (46, 'Facilities Services', '2025-03-12 20:26:22.716396 +00:00'),
        (47, 'Farming', '2025-03-12 20:26:22.812923 +00:00'),
        (48, 'Financial Services', '2025-03-12 20:26:22.933547 +00:00'),
        (49, 'Fine Art', '2025-03-12 20:26:23.024041 +00:00'),
        (50, 'Fisheries', '2025-03-12 20:26:23.129099 +00:00'),
        (51, 'Food And Beverage Services', '2025-03-12 20:26:23.224834 +00:00'),
        (52, 'Freight And Package Transportation', '2025-03-12 20:26:23.313174 +00:00'),
        (53, 'Fundraising', '2025-03-12 20:26:23.414153 +00:00'),
        (54, 'Furniture And Home Furnishings Manufacturing', '2025-03-12 20:26:23.509409 +00:00'),
        (55, 'Gambling Facilities And Casinos', '2025-03-12 20:26:23.599233 +00:00'),
        (56, 'Glass, Ceramics And Concrete Manufacturing', '2025-03-12 20:26:23.700465 +00:00'),
        (57, 'Government Administration', '2025-03-12 20:26:23.787756 +00:00'),
        (58, 'Government Relations Services', '2025-03-12 20:26:23.878818 +00:00'),
        (59, 'Health, Wellness And Fitness', '2025-03-12 20:26:23.973535 +00:00'),
        (60, 'Higher Education', '2025-03-12 20:26:24.066971 +00:00'),
        (61, 'Hospitality', '2025-03-12 20:26:24.141781 +00:00'),
        (62, 'Hospitals And Health Care', '2025-03-12 20:26:24.216474 +00:00'),
        (63, 'Human Resources Services', '2025-03-12 20:26:24.325585 +00:00'),
        (64, 'Individual And Family Services', '2025-03-12 20:26:24.425656 +00:00'),
        (65, 'Industrial Machinery Manufacturing', '2025-03-12 20:26:24.511633 +00:00'),
        (66, 'Insurance', '2025-03-12 20:26:24.587890 +00:00'),
        (67, 'International Affairs', '2025-03-12 20:26:24.669764 +00:00'),
        (68, 'International Trade And Development', '2025-03-12 20:26:24.761387 +00:00'),
        (69, 'Internet', '2025-03-12 20:26:24.853718 +00:00'),
        (70, 'Internet Publishing', '2025-03-12 20:26:24.933638 +00:00'),
        (71, 'Investment Banking', '2025-03-12 20:26:25.017352 +00:00'),
        (72, 'Investment Management', '2025-03-12 20:26:25.119881 +00:00'),
        (73, 'It Services And It Consulting', '2025-03-12 20:26:25.213585 +00:00'),
        (74, 'Judiciary', '2025-03-12 20:26:25.311073 +00:00'),
        (75, 'Law Enforcement', '2025-03-12 20:26:25.446927 +00:00'),
        (76, 'Law Practice', '2025-03-12 20:26:25.553911 +00:00'),
        (77, 'Leasing Real Estate', '2025-03-12 20:26:25.642891 +00:00'),
        (78, 'Legal Services', '2025-03-12 20:26:25.732057 +00:00'),
        (79, 'Legislative Offices', '2025-03-12 20:26:25.838237 +00:00'),
        (80, 'Leisure, Travel & Tourism', '2025-03-12 20:26:25.932285 +00:00'),
        (81, 'Libraries', '2025-03-12 20:26:26.023009 +00:00'),
        (82, 'Logistics And Supply Chain', '2025-03-12 20:26:26.125597 +00:00'),
        (83, 'Machinery Manufacturing', '2025-03-12 20:26:26.237246 +00:00'),
        (84, 'Manufacturing', '2025-03-12 20:26:26.339863 +00:00'),
        (85, 'Maritime Transportation', '2025-03-12 20:26:26.431147 +00:00'),
        (86, 'Market Research', '2025-03-12 20:26:26.524916 +00:00'),
        (87, 'Marketing Services', '2025-03-12 20:26:26.622540 +00:00'),
        (88, 'Mechanical Or Industrial Engineering', '2025-03-12 20:26:26.716065 +00:00'),
        (89, 'Medical Equipment Manufacturing', '2025-03-12 20:26:26.812790 +00:00'),
        (90, 'Medical Practices', '2025-03-12 20:26:26.910793 +00:00'),
        (91, 'Mental Health Care', '2025-03-12 20:26:27.022985 +00:00'),
        (92, 'Military', '2025-03-12 20:26:27.123366 +00:00'),
        (93, 'Mining', '2025-03-12 20:26:27.221289 +00:00'),
        (94, 'Mobile Gaming Apps', '2025-03-12 20:26:27.313430 +00:00'),
        (95, 'Motion Pictures And Film', '2025-03-12 20:26:27.408142 +00:00'),
        (96, 'Motor Vehicle Manufacturing', '2025-03-12 20:26:27.495814 +00:00'),
        (97, 'Movies, Videos, And Sound', '2025-03-12 20:26:27.588672 +00:00'),
        (98, 'Museums, Historical Sites, And Zoos', '2025-03-12 20:26:27.680951 +00:00'),
        (99, 'Musicians', '2025-03-12 20:26:27.768432 +00:00'),
        (100, 'Nanotechnology Research', '2025-03-12 20:26:27.860239 +00:00'),
        (101, 'Newspaper Publishing', '2025-03-12 20:26:27.958547 +00:00'),
        (102, 'Newspapers', '2025-03-12 20:26:28.052544 +00:00'),
        (103, 'Non-Profit Organizations', '2025-03-12 20:26:28.160002 +00:00'),
        (104, 'Oil And Gas', '2025-03-12 20:26:28.253664 +00:00'),
        (105, 'Online Audio And Video Media', '2025-03-12 20:26:28.355922 +00:00'),
        (106, 'Outsourcing And Offshoring Consulting', '2025-03-12 20:26:28.454720 +00:00'),
        (107, 'Packaging And Containers Manufacturing', '2025-03-12 20:26:28.555029 +00:00'),
        (108, 'Paper And Forest Product Manufacturing', '2025-03-12 20:26:28.636430 +00:00'),
        (109, 'Personal Care Product Manufacturing', '2025-03-12 20:26:28.729005 +00:00'),
        (110, 'Pharmaceutical Manufacturing', '2025-03-12 20:26:28.807518 +00:00'),
        (111, 'Philanthropic Fundraising Services', '2025-03-12 20:26:28.893930 +00:00'),
        (112, 'Photography', '2025-03-12 20:26:28.979423 +00:00'),
        (113, 'Plastics Manufacturing', '2025-03-12 20:26:29.061908 +00:00'),
        (114, 'Political Organizations', '2025-03-12 20:26:29.150718 +00:00'),
        (115, 'Primary And Secondary Education', '2025-03-12 20:26:29.244751 +00:00'),
        (116, 'Printing Services', '2025-03-12 20:26:29.343446 +00:00'),
        (117, 'Professional Training And Coaching', '2025-03-12 20:26:29.429045 +00:00'),
        (118, 'Program Development', '2025-03-12 20:26:29.514578 +00:00'),
        (119, 'Public Policy Offices', '2025-03-12 20:26:29.606632 +00:00'),
        (120, 'Public Relations And Communications Services', '2025-03-12 20:26:29.702447 +00:00'),
        (121, 'Public Safety', '2025-03-12 20:26:29.786091 +00:00'),
        (122, 'Railroad Equipment Manufacturing', '2025-03-12 20:26:29.932795 +00:00'),
        (123, 'Ranching', '2025-03-12 20:26:30.041980 +00:00'),
        (124, 'Recreational Facilities', '2025-03-12 20:26:30.142809 +00:00'),
        (125, 'Religious Institutions', '2025-03-12 20:26:30.237629 +00:00'),
        (126, 'Renewable Energy Semiconductor Manufacturing', '2025-03-12 20:26:30.328518 +00:00'),
        (127, 'Renewables & Environment', '2025-03-12 20:26:30.426065 +00:00'),
        (128, 'Research', '2025-03-12 20:26:30.542916 +00:00'),
        (129, 'Research Services', '2025-03-12 20:26:30.655678 +00:00'),
        (130, 'Restaurants', '2025-03-12 20:26:30.759179 +00:00'),
        (131, 'Retail', '2025-03-12 20:26:30.848922 +00:00'),
        (132, 'Retail Apparel And Fashion', '2025-03-12 20:26:30.959634 +00:00'),
        (133, 'Retail Art Supplies', '2025-03-12 20:26:31.056901 +00:00'),
        (134, 'Retail Groceries', '2025-03-12 20:26:31.166762 +00:00'),
        (135, 'Retail Luxury Goods And Jewelry', '2025-03-12 20:26:31.262142 +00:00'),
        (136, 'Retail Office Equipment', '2025-03-12 20:26:31.438213 +00:00'),
        (137, 'Security And Investigations', '2025-03-12 20:26:31.528389 +00:00'),
        (138, 'Semiconductor Manufacturing', '2025-03-12 20:26:31.634990 +00:00'),
        (139, 'Shipbuilding', '2025-03-12 20:26:31.746176 +00:00'),
        (140, 'Software Development', '2025-03-12 20:26:31.854171 +00:00'),
        (141, 'Spectator Sports', '2025-03-12 20:26:31.944531 +00:00'),
        (142, 'Sporting Goods Manufacturing', '2025-03-12 20:26:32.047787 +00:00'),
        (143, 'Sports', '2025-03-12 20:26:32.146773 +00:00'),
        (144, 'Strategic Management Services', '2025-03-12 20:26:32.243757 +00:00'),
        (145, 'Supermarkets', '2025-03-12 20:26:32.338782 +00:00'),
        (146, 'Technology, Information And Internet', '2025-03-12 20:26:32.431160 +00:00'),
        (147, 'Telecommunications', '2025-03-12 20:26:32.534054 +00:00'),
        (148, 'Textile Manufacturing', '2025-03-12 20:26:32.643159 +00:00'),
        (149, 'Think Tanks', '2025-03-12 20:26:32.726097 +00:00'),
        (150, 'Tobacco Manufacturing', '2025-03-12 20:26:32.833237 +00:00'),
        (151, 'Translation And Localization', '2025-03-12 20:26:32.918508 +00:00'),
        (152, 'Transportation, Logistics, Supply Chain And Storage', '2025-03-12 20:26:33.000676 +00:00'),
        (153, 'Travel Arrangements', '2025-03-12 20:26:33.086016 +00:00'),
        (154, 'Truck Transportation', '2025-03-12 20:26:33.198663 +00:00'),
        (155, 'Utilities', '2025-03-12 20:26:33.322707 +00:00'),
        (156, 'Venture Capital And Private Equity Principals', '2025-03-12 20:26:33.431893 +00:00'),
        (157, 'Veterinary Services', '2025-03-12 20:26:33.526832 +00:00'),
        (158, 'Warehousing And Storage', '2025-03-12 20:26:33.618345 +00:00'),
        (159, 'Wellness And Fitness Services', '2025-03-12 20:26:33.736991 +00:00'),
        (160, 'Wholesale', '2025-03-12 20:26:33.860460 +00:00'),
        (161, 'Wholesale Building Materials', '2025-03-12 20:26:33.955450 +00:00'),
        (162, 'Wholesale Import And Export', '2025-03-12 20:26:34.057762 +00:00'),
        (163, 'Wine And Spirits', '2025-03-12 20:26:34.145237 +00:00'),
        (164, 'Wireless Services', '2025-03-12 20:26:34.232800 +00:00'),
        (165, 'Writing And Editing', '2025-03-12 20:26:34.330906 +00:00');
    
create sequence seniority_levels_id_seq;
create table if not exists public.ref_seniority_levels (
    id integer default nextval('seniority_levels_id_seq'::regclass) not null constraint seniority_levels_pkey primary key,
    level text not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP
);

comment on table ref_seniority_levels is 'Table storing seniority level categories';

alter table ref_seniority_levels owner to postgres;

create unique index idx_seniority_levels_level on ref_seniority_levels(level);

grant delete, insert, references, select, trigger, truncate, update on ref_seniority_levels to authenticated;

grant delete, insert, references, select, trigger, truncate, update on ref_seniority_levels to service_role;

insert into public.ref_seniority_levels (id, level, created_at)
values  (1, 'Cxo', '2025-03-12 20:33:42.728932 +00:00'),
        (2, 'Director', '2025-03-12 20:33:42.943558 +00:00'),
        (3, 'Manager', '2025-03-12 20:33:43.051649 +00:00'),
        (4, 'Staff', '2025-03-12 20:33:43.257750 +00:00'),
        (5, 'Vp', '2025-03-12 20:33:43.455845 +00:00');

create sequence sic_codes_id_seq;
create table ref_sic_codes (
    id integer default nextval('sic_codes_id_seq'::regclass) not null constraint sic_codes_pkey primary key,
    code text not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP
);

comment on table ref_sic_codes is 'Table storing Standard Industrial Classification (SIC) codes';

alter table ref_sic_codes owner to postgres;

create unique index idx_sic_codes_code on ref_sic_codes(code);

grant delete, insert, references, select, trigger, truncate, update on ref_sic_codes to authenticated;

grant delete, insert, references, select, trigger, truncate, update on ref_sic_codes to service_role;

insert into public.ref_sic_codes (id, code, created_at)
values  (1, '8011', '2025-03-12 20:31:02.665319 +00:00'),
        (2, '7389', '2025-03-12 20:31:02.857152 +00:00'),
        (3, '8221', '2025-03-12 20:31:03.047871 +00:00'),
        (4, '8211', '2025-03-12 20:31:03.239243 +00:00'),
        (5, '8742', '2025-03-12 20:31:03.441613 +00:00'),
        (6, '8062', '2025-03-12 20:31:03.635589 +00:00'),
        (7, '6531', '2025-03-12 20:31:03.861794 +00:00'),
        (8, '7371', '2025-03-12 20:31:03.949164 +00:00'),
        (9, '5812', '2025-03-12 20:31:04.145515 +00:00'),
        (10, '6411', '2025-03-12 20:31:04.245355 +00:00'),
        (11, '8741', '2025-03-12 20:31:04.352017 +00:00'),
        (12, '8111', '2025-03-12 20:31:04.466242 +00:00'),
        (13, '7372', '2025-03-12 20:31:04.651357 +00:00'),
        (14, '6021', '2025-03-12 20:31:04.747234 +00:00'),
        (15, '8711', '2025-03-12 20:31:04.845048 +00:00'),
        (16, '8748', '2025-03-12 20:31:04.979879 +00:00'),
        (17, '7361', '2025-03-12 20:31:05.070926 +00:00'),
        (18, '7011', '2025-03-12 20:31:05.292809 +00:00'),
        (19, '8322', '2025-03-12 20:31:05.391780 +00:00'),
        (20, '8043', '2025-03-12 20:31:05.588308 +00:00'),
        (21, '9711', '2025-03-12 20:31:05.707898 +00:00'),
        (22, '4813', '2025-03-12 20:31:05.814176 +00:00'),
        (23, '7379', '2025-03-12 20:31:05.916448 +00:00'),
        (24, '6211', '2025-03-12 20:31:06.023190 +00:00'),
        (25, '2834', '2025-03-12 20:31:06.120273 +00:00'),
        (26, '9111', '2025-03-12 20:31:06.339629 +00:00'),
        (27, '6282', '2025-03-12 20:31:06.442100 +00:00'),
        (28, '5311', '2025-03-12 20:31:06.544619 +00:00'),
        (29, '5411', '2025-03-12 20:31:06.659467 +00:00'),
        (30, '6022', '2025-03-12 20:31:06.748504 +00:00'),
        (31, '8721', '2025-03-12 20:31:06.843801 +00:00'),
        (32, '7374', '2025-03-12 20:31:06.951398 +00:00'),
        (33, '9223', '2025-03-12 20:31:07.074150 +00:00'),
        (34, '5999', '2025-03-12 20:31:07.163807 +00:00'),
        (35, '7373', '2025-03-12 20:31:07.271997 +00:00'),
        (36, '4731', '2025-03-12 20:31:07.385208 +00:00'),
        (37, '7311', '2025-03-12 20:31:07.504402 +00:00'),
        (38, '8731', '2025-03-12 20:31:07.600587 +00:00'),
        (39, '6719', '2025-03-12 20:31:07.698837 +00:00'),
        (40, '8099', '2025-03-12 20:31:07.813794 +00:00'),
        (41, '5961', '2025-03-12 20:31:07.898608 +00:00'),
        (42, '5511', '2025-03-12 20:31:07.991551 +00:00'),
        (43, '1521', '2025-03-12 20:31:08.092908 +00:00'),
        (44, '4911', '2025-03-12 20:31:08.197071 +00:00'),
        (45, '6311', '2025-03-12 20:31:08.312633 +00:00'),
        (46, '8661', '2025-03-12 20:31:08.397720 +00:00'),
        (47, '1731', '2025-03-12 20:31:08.523042 +00:00'),
        (48, '7999', '2025-03-12 20:31:08.622748 +00:00'),
        (49, '8641', '2025-03-12 20:31:08.722751 +00:00'),
        (50, '6799', '2025-03-12 20:31:08.846572 +00:00'),
        (51, '8049', '2025-03-12 20:31:08.958607 +00:00'),
        (52, '5084', '2025-03-12 20:31:09.057614 +00:00'),
        (53, '3571', '2025-03-12 20:31:09.163025 +00:00'),
        (54, '6331', '2025-03-12 20:31:09.251237 +00:00'),
        (55, '5912', '2025-03-12 20:31:09.358699 +00:00'),
        (56, '5734', '2025-03-12 20:31:09.461718 +00:00'),
        (57, '8351', '2025-03-12 20:31:09.569998 +00:00'),
        (58, '4213', '2025-03-12 20:31:09.659404 +00:00'),
        (59, '8082', '2025-03-12 20:31:09.752486 +00:00'),
        (60, '5045', '2025-03-12 20:31:09.855413 +00:00'),
        (61, '8699', '2025-03-12 20:31:09.946580 +00:00'),
        (62, '8299', '2025-03-12 20:31:10.045368 +00:00'),
        (63, '8042', '2025-03-12 20:31:10.141112 +00:00'),
        (64, '8093', '2025-03-12 20:31:10.244611 +00:00'),
        (65, '3674', '2025-03-12 20:31:10.350448 +00:00'),
        (66, '6141', '2025-03-12 20:31:10.456838 +00:00'),
        (67, '6324', '2025-03-12 20:31:10.566069 +00:00'),
        (68, '6321', '2025-03-12 20:31:10.661927 +00:00'),
        (69, '3714', '2025-03-12 20:31:10.769007 +00:00'),
        (70, '8222', '2025-03-12 20:31:10.864811 +00:00'),
        (71, '6512', '2025-03-12 20:31:10.953834 +00:00'),
        (72, '8399', '2025-03-12 20:31:11.046402 +00:00'),
        (73, '7363', '2025-03-12 20:31:11.139777 +00:00'),
        (74, '6162', '2025-03-12 20:31:11.234852 +00:00'),
        (75, '3841', '2025-03-12 20:31:11.337597 +00:00'),
        (76, '8732', '2025-03-12 20:31:11.451849 +00:00'),
        (77, '5621', '2025-03-12 20:31:11.564058 +00:00'),
        (78, '2711', '2025-03-12 20:31:11.658722 +00:00'),
        (79, '8712', '2025-03-12 20:31:11.750754 +00:00'),
        (80, '4812', '2025-03-12 20:31:11.859162 +00:00'),
        (81, '9199', '2025-03-12 20:31:11.962809 +00:00'),
        (82, '3812', '2025-03-12 20:31:12.058815 +00:00'),
        (83, '1542', '2025-03-12 20:31:12.153027 +00:00'),
        (84, '8733', '2025-03-12 20:31:12.240882 +00:00'),
        (85, '1711', '2025-03-12 20:31:12.349680 +00:00'),
        (86, '4833', '2025-03-12 20:31:12.442738 +00:00'),
        (87, '1799', '2025-03-12 20:31:12.548604 +00:00'),
        (88, '8051', '2025-03-12 20:31:12.669223 +00:00'),
        (89, '5211', '2025-03-12 20:31:12.789571 +00:00'),
        (90, '7299', '2025-03-12 20:31:12.876258 +00:00'),
        (91, '7375', '2025-03-12 20:31:12.977335 +00:00'),
        (92, '5099', '2025-03-12 20:31:13.070169 +00:00'),
        (93, '6513', '2025-03-12 20:31:13.166186 +00:00'),
        (94, '3999', '2025-03-12 20:31:13.257094 +00:00'),
        (95, '3711', '2025-03-12 20:31:13.341312 +00:00'),
        (96, '3577', '2025-03-12 20:31:13.444531 +00:00'),
        (97, '4512', '2025-03-12 20:31:13.529773 +00:00'),
        (98, '5731', '2025-03-12 20:31:13.612841 +00:00'),
        (99, '9431', '2025-03-12 20:31:13.699503 +00:00'),
        (100, '5065', '2025-03-12 20:31:13.796545 +00:00'),
        (101, '4225', '2025-03-12 20:31:13.924588 +00:00'),
        (102, '3663', '2025-03-12 20:31:14.013794 +00:00'),
        (103, '5651', '2025-03-12 20:31:14.108132 +00:00'),
        (104, '1311', '2025-03-12 20:31:14.192914 +00:00'),
        (105, '4841', '2025-03-12 20:31:14.289759 +00:00'),
        (106, '5399', '2025-03-12 20:31:14.380602 +00:00'),
        (107, '4899', '2025-03-12 20:31:14.482312 +00:00'),
        (108, '5063', '2025-03-12 20:31:14.579750 +00:00'),
        (109, '7991', '2025-03-12 20:31:14.699085 +00:00'),
        (110, '2741', '2025-03-12 20:31:14.815202 +00:00'),
        (111, '5122', '2025-03-12 20:31:14.905411 +00:00'),
        (112, '4724', '2025-03-12 20:31:14.985094 +00:00'),
        (113, '5141', '2025-03-12 20:31:15.070678 +00:00'),
        (114, '6061', '2025-03-12 20:31:15.159498 +00:00'),
        (115, '9221', '2025-03-12 20:31:15.261670 +00:00'),
        (116, '5085', '2025-03-12 20:31:15.365733 +00:00'),
        (117, '3089', '2025-03-12 20:31:15.454228 +00:00'),
        (118, '6722', '2025-03-12 20:31:15.544807 +00:00'),
        (119, '7699', '2025-03-12 20:31:15.626552 +00:00'),
        (120, '1389', '2025-03-12 20:31:15.716332 +00:00'),
        (121, '4832', '2025-03-12 20:31:15.802802 +00:00'),
        (122, '5047', '2025-03-12 20:31:15.878671 +00:00'),
        (123, '8999', '2025-03-12 20:31:15.972020 +00:00'),
        (124, '7382', '2025-03-12 20:31:16.062521 +00:00'),
        (125, '5963', '2025-03-12 20:31:16.168838 +00:00'),
        (126, '3721', '2025-03-12 20:31:16.267050 +00:00'),
        (127, '7359', '2025-03-12 20:31:16.368586 +00:00'),
        (128, '3842', '2025-03-12 20:31:16.468760 +00:00'),
        (129, '6159', '2025-03-12 20:31:16.592388 +00:00'),
        (130, '8231', '2025-03-12 20:31:16.729151 +00:00'),
        (131, '6733', '2025-03-12 20:31:16.849264 +00:00'),
        (132, '5199', '2025-03-12 20:31:16.962707 +00:00'),
        (133, '8611', '2025-03-12 20:31:17.092233 +00:00'),
        (134, '7349', '2025-03-12 20:31:17.198685 +00:00'),
        (135, '5541', '2025-03-12 20:31:17.293994 +00:00'),
        (136, '8071', '2025-03-12 20:31:17.400535 +00:00'),
        (137, '8621', '2025-03-12 20:31:17.503923 +00:00'),
        (138, '7538', '2025-03-12 20:31:17.604554 +00:00'),
        (139, '8361', '2025-03-12 20:31:17.682387 +00:00'),
        (140, '7997', '2025-03-12 20:31:17.762946 +00:00'),
        (141, '5149', '2025-03-12 20:31:17.857513 +00:00'),
        (142, '5531', '2025-03-12 20:31:17.955061 +00:00'),
        (143, '5712', '2025-03-12 20:31:18.060715 +00:00'),
        (144, '7381', '2025-03-12 20:31:18.154863 +00:00'),
        (145, '5942', '2025-03-12 20:31:18.241191 +00:00'),
        (146, '9311', '2025-03-12 20:31:18.322418 +00:00'),
        (147, '7231', '2025-03-12 20:31:18.425660 +00:00'),
        (148, '9224', '2025-03-12 20:31:18.522772 +00:00'),
        (149, '5499', '2025-03-12 20:31:18.607374 +00:00'),
        (150, '8713', '2025-03-12 20:31:18.694328 +00:00'),
        (151, '8021', '2025-03-12 20:31:18.804952 +00:00'),
        (152, '6794', '2025-03-12 20:31:18.898180 +00:00'),
        (153, '5169', '2025-03-12 20:31:18.983133 +00:00'),
        (154, '7812', '2025-03-12 20:31:19.070276 +00:00'),
        (155, '5941', '2025-03-12 20:31:19.155277 +00:00'),
        (156, '7941', '2025-03-12 20:31:19.239395 +00:00'),
        (157, '3826', '2025-03-12 20:31:19.332034 +00:00'),
        (158, '6029', '2025-03-12 20:31:19.452517 +00:00'),
        (159, '5044', '2025-03-12 20:31:19.546748 +00:00'),
        (160, '6552', '2025-03-12 20:31:19.638373 +00:00'),
        (161, '5331', '2025-03-12 20:31:19.729217 +00:00'),
        (162, '2844', '2025-03-12 20:31:19.818640 +00:00'),
        (163, '7929', '2025-03-12 20:31:19.918550 +00:00'),
        (164, '5947', '2025-03-12 20:31:20.015884 +00:00'),
        (165, '5012', '2025-03-12 20:31:20.116438 +00:00'),
        (166, '5046', '2025-03-12 20:31:20.219857 +00:00'),
        (167, '3724', '2025-03-12 20:31:20.315827 +00:00'),
        (168, '3728', '2025-03-12 20:31:20.394931 +00:00'),
        (169, '2759', '2025-03-12 20:31:20.476321 +00:00'),
        (170, '9441', '2025-03-12 20:31:20.566141 +00:00'),
        (171, '2731', '2025-03-12 20:31:20.670668 +00:00'),
        (172, '8069', '2025-03-12 20:31:20.775869 +00:00'),
        (173, '5661', '2025-03-12 20:31:20.862727 +00:00'),
        (174, '8743', '2025-03-12 20:31:20.954561 +00:00'),
        (175, '6399', '2025-03-12 20:31:21.048941 +00:00'),
        (176, '2721', '2025-03-12 20:31:21.143929 +00:00'),
        (177, '2899', '2025-03-12 20:31:21.248125 +00:00'),
        (178, '5611', '2025-03-12 20:31:21.343731 +00:00'),
        (179, '5072', '2025-03-12 20:31:21.441326 +00:00'),
        (180, '3599', '2025-03-12 20:31:21.545110 +00:00'),
        (181, '7922', '2025-03-12 20:31:21.632885 +00:00'),
        (182, '8734', '2025-03-12 20:31:21.736913 +00:00'),
        (183, '2752', '2025-03-12 20:31:21.825411 +00:00'),
        (184, '4953', '2025-03-12 20:31:21.918507 +00:00'),
        (185, '7629', '2025-03-12 20:31:22.013122 +00:00'),
        (186, '9621', '2025-03-12 20:31:22.116174 +00:00'),
        (187, '4212', '2025-03-12 20:31:22.204658 +00:00'),
        (188, '9451', '2025-03-12 20:31:22.294837 +00:00'),
        (189, '5031', '2025-03-12 20:31:22.385853 +00:00'),
        (190, '2099', '2025-03-12 20:31:22.485572 +00:00'),
        (191, '4111', '2025-03-12 20:31:22.589879 +00:00'),
        (192, '2821', '2025-03-12 20:31:22.692166 +00:00'),
        (193, '2869', '2025-03-12 20:31:22.792772 +00:00'),
        (194, '4581', '2025-03-12 20:31:22.899090 +00:00'),
        (195, '2835', '2025-03-12 20:31:23.002041 +00:00'),
        (196, '2911', '2025-03-12 20:31:23.098402 +00:00'),
        (197, '9512', '2025-03-12 20:31:23.193863 +00:00'),
        (198, '2086', '2025-03-12 20:31:23.283333 +00:00'),
        (199, '7336', '2025-03-12 20:31:23.376598 +00:00'),
        (200, '4311', '2025-03-12 20:31:23.467807 +00:00'),
        (201, '6163', '2025-03-12 20:31:23.558960 +00:00'),
        (202, '5082', '2025-03-12 20:31:23.646894 +00:00'),
        (203, '1623', '2025-03-12 20:31:23.738069 +00:00'),
        (204, '8412', '2025-03-12 20:31:23.835880 +00:00'),
        (205, '1382', '2025-03-12 20:31:23.922024 +00:00'),
        (206, '1541', '2025-03-12 20:31:24.010843 +00:00'),
        (207, '4119', '2025-03-12 20:31:24.098413 +00:00'),
        (208, '7378', '2025-03-12 20:31:24.196828 +00:00'),
        (209, '7514', '2025-03-12 20:31:24.292417 +00:00'),
        (210, '5172', '2025-03-12 20:31:24.415594 +00:00'),
        (211, '5719', '2025-03-12 20:31:24.492709 +00:00'),
        (212, '4215', '2025-03-12 20:31:24.595500 +00:00'),
        (213, '5013', '2025-03-12 20:31:24.695715 +00:00'),
        (214, '3625', '2025-03-12 20:31:24.788477 +00:00'),
        (215, '3575', '2025-03-12 20:31:24.896241 +00:00'),
        (216, '6732', '2025-03-12 20:31:24.986473 +00:00'),
        (217, '6153', '2025-03-12 20:31:25.080956 +00:00'),
        (218, '3572', '2025-03-12 20:31:25.180572 +00:00'),
        (219, '6712', '2025-03-12 20:31:25.290989 +00:00'),
        (220, '8331', '2025-03-12 20:31:25.377255 +00:00'),
        (221, '5944', '2025-03-12 20:31:25.478209 +00:00'),
        (222, '9121', '2025-03-12 20:31:25.596068 +00:00'),
        (223, '7319', '2025-03-12 20:31:25.690913 +00:00'),
        (224, '2819', '2025-03-12 20:31:25.787493 +00:00'),
        (225, '3679', '2025-03-12 20:31:25.895557 +00:00'),
        (226, '5049', '2025-03-12 20:31:25.994171 +00:00'),
        (227, '3699', '2025-03-12 20:31:26.081935 +00:00'),
        (228, '5992', '2025-03-12 20:31:26.180778 +00:00'),
        (229, '2621', '2025-03-12 20:31:26.295625 +00:00'),
        (230, '3829', '2025-03-12 20:31:26.501224 +00:00'),
        (231, '4941', '2025-03-12 20:31:26.586766 +00:00'),
        (232, '9721', '2025-03-12 20:31:26.676937 +00:00'),
        (233, '1522', '2025-03-12 20:31:26.766478 +00:00'),
        (234, '5051', '2025-03-12 20:31:26.855251 +00:00'),
        (235, '1611', '2025-03-12 20:31:26.950749 +00:00'),
        (236, '4513', '2025-03-12 20:31:27.042079 +00:00'),
        (237, '5461', '2025-03-12 20:31:27.154921 +00:00'),
        (238, '3559', '2025-03-12 20:31:27.244466 +00:00'),
        (239, '1629', '2025-03-12 20:31:27.338600 +00:00'),
        (240, '7334', '2025-03-12 20:31:27.439689 +00:00'),
        (241, '4789', '2025-03-12 20:31:27.551206 +00:00'),
        (242, '7291', '2025-03-12 20:31:27.663734 +00:00'),
        (243, '9211', '2025-03-12 20:31:27.792349 +00:00'),
        (244, '5813', '2025-03-12 20:31:27.886128 +00:00'),
        (245, '9611', '2025-03-12 20:31:27.992385 +00:00'),
        (246, '5943', '2025-03-12 20:31:28.104312 +00:00'),
        (247, '5191', '2025-03-12 20:31:28.186588 +00:00'),
        (248, '6798', '2025-03-12 20:31:28.274551 +00:00'),
        (249, '5083', '2025-03-12 20:31:28.367520 +00:00'),
        (250, '3823', '2025-03-12 20:31:28.454319 +00:00'),
        (251, '8059', '2025-03-12 20:31:28.540462 +00:00'),
        (252, '3825', '2025-03-12 20:31:28.676946 +00:00'),
        (253, '5945', '2025-03-12 20:31:28.777736 +00:00'),
        (254, '5632', '2025-03-12 20:31:28.898626 +00:00'),
        (255, '5112', '2025-03-12 20:31:28.983175 +00:00'),
        (256, '9511', '2025-03-12 20:31:29.078383 +00:00'),
        (257, '6099', '2025-03-12 20:31:29.168834 +00:00'),
        (258, '2841', '2025-03-12 20:31:29.278955 +00:00'),
        (259, '7532', '2025-03-12 20:31:29.369940 +00:00'),
        (260, '3761', '2025-03-12 20:31:29.458554 +00:00'),
        (261, '0742', '2025-03-12 20:31:29.588621 +00:00'),
        (262, '5251', '2025-03-12 20:31:29.687932 +00:00'),
        (263, '4924', '2025-03-12 20:31:29.807609 +00:00'),
        (264, '5699', '2025-03-12 20:31:29.903523 +00:00'),
        (265, '3561', '2025-03-12 20:31:30.011281 +00:00'),
        (266, '3533', '2025-03-12 20:31:30.109354 +00:00'),
        (267, '5074', '2025-03-12 20:31:30.220781 +00:00'),
        (268, '3312', '2025-03-12 20:31:30.321126 +00:00'),
        (269, '1381', '2025-03-12 20:31:30.412061 +00:00'),
        (270, '7992', '2025-03-12 20:31:30.540064 +00:00'),
        (271, '2836', '2025-03-12 20:31:30.643480 +00:00'),
        (272, '4931', '2025-03-12 20:31:30.743138 +00:00'),
        (273, '3672', '2025-03-12 20:31:30.843395 +00:00'),
        (274, '4491', '2025-03-12 20:31:30.945771 +00:00'),
        (275, '3993', '2025-03-12 20:31:31.051708 +00:00'),
        (276, '2891', '2025-03-12 20:31:31.157616 +00:00'),
        (277, '5932', '2025-03-12 20:31:31.263546 +00:00'),
        (278, '3585', '2025-03-12 20:31:31.368799 +00:00'),
        (279, '5087', '2025-03-12 20:31:31.480212 +00:00'),
        (280, '2531', '2025-03-12 20:31:31.601332 +00:00'),
        (281, '3652', '2025-03-12 20:31:31.702054 +00:00'),
        (282, '8811', '2025-03-12 20:31:31.796423 +00:00'),
        (283, '8052', '2025-03-12 20:31:31.916161 +00:00'),
        (284, '8249', '2025-03-12 20:31:32.010193 +00:00'),
        (285, '9641', '2025-03-12 20:31:32.111056 +00:00'),
        (286, '1761', '2025-03-12 20:31:32.215339 +00:00'),
        (287, '5088', '2025-03-12 20:31:32.321918 +00:00'),
        (288, '4522', '2025-03-12 20:31:32.435940 +00:00'),
        (289, '5021', '2025-03-12 20:31:32.558734 +00:00'),
        (290, '7032', '2025-03-12 20:31:32.665054 +00:00'),
        (291, '7513', '2025-03-12 20:31:32.765799 +00:00'),
        (292, '3531', '2025-03-12 20:31:32.863784 +00:00'),
        (293, '5136', '2025-03-12 20:31:32.945944 +00:00'),
        (294, '1531', '2025-03-12 20:31:33.055916 +00:00'),
        (295, '0781', '2025-03-12 20:31:33.155870 +00:00'),
        (296, '8041', '2025-03-12 20:31:33.243254 +00:00'),
        (297, '2431', '2025-03-12 20:31:33.348333 +00:00'),
        (298, '8631', '2025-03-12 20:31:33.450051 +00:00'),
        (299, '2052', '2025-03-12 20:31:33.536630 +00:00'),
        (300, '6361', '2025-03-12 20:31:33.624599 +00:00'),
        (301, '7323', '2025-03-12 20:31:33.724852 +00:00'),
        (302, '7331', '2025-03-12 20:31:33.827632 +00:00'),
        (303, '8744', '2025-03-12 20:31:33.928619 +00:00'),
        (304, '6035', '2025-03-12 20:31:34.017912 +00:00'),
        (305, '0782', '2025-03-12 20:31:34.117079 +00:00'),
        (306, '5182', '2025-03-12 20:31:34.208128 +00:00'),
        (307, '5023', '2025-03-12 20:31:34.317466 +00:00'),
        (308, '5722', '2025-03-12 20:31:34.424433 +00:00'),
        (309, '5153', '2025-03-12 20:31:34.526682 +00:00'),
        (310, '3949', '2025-03-12 20:31:34.626782 +00:00'),
        (311, '3523', '2025-03-12 20:31:34.728908 +00:00'),
        (312, '9222', '2025-03-12 20:31:34.817931 +00:00'),
        (313, '3845', '2025-03-12 20:31:34.921897 +00:00'),
        (314, '3441', '2025-03-12 20:31:35.021665 +00:00'),
        (315, '2879', '2025-03-12 20:31:35.111872 +00:00'),
        (316, '7819', '2025-03-12 20:31:35.228249 +00:00'),
        (317, '1751', '2025-03-12 20:31:35.331599 +00:00'),
        (318, '6111', '2025-03-12 20:31:35.429340 +00:00'),
        (319, '2084', '2025-03-12 20:31:35.534463 +00:00'),
        (320, '6519', '2025-03-12 20:31:35.635570 +00:00'),
        (321, '3491', '2025-03-12 20:31:35.727755 +00:00'),
        (322, '6062', '2025-03-12 20:31:35.822806 +00:00'),
        (323, '8092', '2025-03-12 20:31:35.913293 +00:00'),
        (324, '3661', '2025-03-12 20:31:36.004174 +00:00'),
        (325, '3511', '2025-03-12 20:31:36.105139 +00:00'),
        (326, '5137', '2025-03-12 20:31:36.198603 +00:00'),
        (327, '1742', '2025-03-12 20:31:36.290973 +00:00'),
        (328, '7322', '2025-03-12 20:31:36.384358 +00:00'),
        (329, '1794', '2025-03-12 20:31:36.472504 +00:00'),
        (330, '2851', '2025-03-12 20:31:36.571111 +00:00'),
        (331, '9411', '2025-03-12 20:31:36.664060 +00:00'),
        (332, '2024', '2025-03-12 20:31:36.767197 +00:00'),
        (333, '9651', '2025-03-12 20:31:36.861254 +00:00'),
        (334, '5091', '2025-03-12 20:31:36.958961 +00:00'),
        (335, '1721', '2025-03-12 20:31:37.054028 +00:00'),
        (336, '4011', '2025-03-12 20:31:37.140061 +00:00'),
        (337, '6726', '2025-03-12 20:31:37.238098 +00:00'),
        (338, '5075', '2025-03-12 20:31:37.348711 +00:00'),
        (339, '3751', '2025-03-12 20:31:37.436079 +00:00'),
        (340, '6351', '2025-03-12 20:31:37.536133 +00:00'),
        (341, '1743', '2025-03-12 20:31:37.633100 +00:00'),
        (342, '0191', '2025-03-12 20:31:37.720586 +00:00'),
        (343, '5995', '2025-03-12 20:31:37.827958 +00:00'),
        (344, '3731', '2025-03-12 20:31:37.970585 +00:00'),
        (345, '3613', '2025-03-12 20:31:38.084283 +00:00'),
        (346, '3469', '2025-03-12 20:31:38.175860 +00:00'),
        (347, '9531', '2025-03-12 20:31:38.297574 +00:00'),
        (348, '2782', '2025-03-12 20:31:38.392981 +00:00'),
        (349, '5713', '2025-03-12 20:31:38.498573 +00:00'),
        (350, '4121', '2025-03-12 20:31:38.594576 +00:00'),
        (351, '3444', '2025-03-12 20:31:38.692807 +00:00'),
        (352, '5231', '2025-03-12 20:31:38.791420 +00:00'),
        (353, '4922', '2025-03-12 20:31:38.892793 +00:00'),
        (354, '5521', '2025-03-12 20:31:38.976003 +00:00'),
        (355, '6541', '2025-03-12 20:31:39.067217 +00:00'),
        (356, '7313', '2025-03-12 20:31:39.159524 +00:00'),
        (357, '2048', '2025-03-12 20:31:39.272252 +00:00'),
        (358, '4729', '2025-03-12 20:31:39.373971 +00:00'),
        (359, '7539', '2025-03-12 20:31:39.487926 +00:00'),
        (360, '7353', '2025-03-12 20:31:39.594603 +00:00'),
        (361, '7996', '2025-03-12 20:31:39.684892 +00:00'),
        (362, '1771', '2025-03-12 20:31:39.782275 +00:00'),
        (363, '3272', '2025-03-12 20:31:39.873972 +00:00'),
        (364, '2015', '2025-03-12 20:31:39.963344 +00:00'),
        (365, '9229', '2025-03-12 20:31:40.065697 +00:00'),
        (366, '2329', '2025-03-12 20:31:40.153294 +00:00'),
        (367, '3643', '2025-03-12 20:31:40.255395 +00:00'),
        (368, '5113', '2025-03-12 20:31:40.349553 +00:00'),
        (369, '7342', '2025-03-12 20:31:40.438508 +00:00'),
        (370, '7376', '2025-03-12 20:31:40.567572 +00:00'),
        (371, '5032', '2025-03-12 20:31:40.677017 +00:00'),
        (372, '2653', '2025-03-12 20:31:40.772075 +00:00'),
        (373, '9661', '2025-03-12 20:31:40.870853 +00:00'),
        (374, '2842', '2025-03-12 20:31:40.967597 +00:00'),
        (375, '3499', '2025-03-12 20:31:41.072013 +00:00'),
        (376, '3443', '2025-03-12 20:31:41.182947 +00:00'),
        (377, '3621', '2025-03-12 20:31:41.269339 +00:00'),
        (378, '3317', '2025-03-12 20:31:41.356261 +00:00'),
        (379, '5148', '2025-03-12 20:31:41.450723 +00:00'),
        (380, '2022', '2025-03-12 20:31:41.543915 +00:00'),
        (381, '4725', '2025-03-12 20:31:41.642048 +00:00'),
        (382, '7221', '2025-03-12 20:31:41.764153 +00:00'),
        (383, '2833', '2025-03-12 20:31:41.847494 +00:00'),
        (384, '3589', '2025-03-12 20:31:41.934033 +00:00'),
        (385, '7549', '2025-03-12 20:31:42.038553 +00:00'),
        (386, '0752', '2025-03-12 20:31:42.140929 +00:00'),
        (387, '3429', '2025-03-12 20:31:42.235954 +00:00'),
        (388, '7993', '2025-03-12 20:31:42.331505 +00:00'),
        (389, '7521', '2025-03-12 20:31:42.423232 +00:00'),
        (390, '3646', '2025-03-12 20:31:42.515344 +00:00'),
        (391, '3651', '2025-03-12 20:31:42.608957 +00:00'),
        (392, '5064', '2025-03-12 20:31:42.693409 +00:00'),
        (393, '5078', '2025-03-12 20:31:42.785583 +00:00'),
        (394, '5139', '2025-03-12 20:31:42.869328 +00:00'),
        (395, '4226', '2025-03-12 20:31:42.962915 +00:00'),
        (396, '3398', '2025-03-12 20:31:43.080395 +00:00'),
        (397, '7832', '2025-03-12 20:31:43.174353 +00:00'),
        (398, '1791', '2025-03-12 20:31:43.268273 +00:00'),
        (399, '3273', '2025-03-12 20:31:43.368387 +00:00'),
        (400, '2082', '2025-03-12 20:31:43.456378 +00:00'),
        (401, '7822', '2025-03-12 20:31:43.549718 +00:00'),
        (402, '3544', '2025-03-12 20:31:43.645182 +00:00'),
        (403, '8063', '2025-03-12 20:31:43.729274 +00:00'),
        (404, '5094', '2025-03-12 20:31:43.824294 +00:00'),
        (405, '4493', '2025-03-12 20:31:43.924642 +00:00'),
        (406, '5092', '2025-03-12 20:31:44.033915 +00:00'),
        (407, '3569', '2025-03-12 20:31:44.140416 +00:00'),
        (408, '3069', '2025-03-12 20:31:44.228504 +00:00'),
        (409, '5181', '2025-03-12 20:31:44.339378 +00:00'),
        (410, '6371', '2025-03-12 20:31:44.449921 +00:00'),
        (411, '3442', '2025-03-12 20:31:44.557895 +00:00'),
        (412, '9532', '2025-03-12 20:31:44.663195 +00:00'),
        (413, '2051', '2025-03-12 20:31:44.753668 +00:00'),
        (414, '3291', '2025-03-12 20:31:44.851281 +00:00'),
        (415, '5052', '2025-03-12 20:31:44.937712 +00:00'),
        (416, '2813', '2025-03-12 20:31:45.022822 +00:00'),
        (417, '5192', '2025-03-12 20:31:45.106883 +00:00'),
        (418, '2041', '2025-03-12 20:31:45.203536 +00:00'),
        (419, '3546', '2025-03-12 20:31:45.282955 +00:00'),
        (420, '2631', '2025-03-12 20:31:45.374939 +00:00'),
        (421, '2023', '2025-03-12 20:31:45.460095 +00:00'),
        (422, '5093', '2025-03-12 20:31:45.561288 +00:00'),
        (423, '3535', '2025-03-12 20:31:45.651391 +00:00'),
        (424, '6036', '2025-03-12 20:31:45.747870 +00:00'),
        (425, '3021', '2025-03-12 20:31:45.840706 +00:00'),
        (426, '5946', '2025-03-12 20:31:45.937018 +00:00'),
        (427, '3669', '2025-03-12 20:31:46.032119 +00:00'),
        (428, '3579', '2025-03-12 20:31:46.125505 +00:00'),
        (429, '2011', '2025-03-12 20:31:46.246399 +00:00'),
        (430, '1752', '2025-03-12 20:31:46.340898 +00:00'),
        (431, '5921', '2025-03-12 20:31:46.426688 +00:00'),
        (432, '3851', '2025-03-12 20:31:46.525351 +00:00'),
        (433, '3827', '2025-03-12 20:31:46.616582 +00:00'),
        (434, '2421', '2025-03-12 20:31:46.713239 +00:00'),
        (435, '6082', '2025-03-12 20:31:46.820017 +00:00'),
        (436, '3713', '2025-03-12 20:31:46.917805 +00:00'),
        (437, '3011', '2025-03-12 20:31:47.012710 +00:00'),
        (438, '4939', '2025-03-12 20:31:47.124827 +00:00'),
        (439, '1741', '2025-03-12 20:31:47.229436 +00:00'),
        (440, '3944', '2025-03-12 20:31:47.326891 +00:00'),
        (441, '4214', '2025-03-12 20:31:47.416231 +00:00'),
        (442, '3822', '2025-03-12 20:31:47.498674 +00:00'),
        (443, '5736', '2025-03-12 20:31:47.592778 +00:00'),
        (444, '2033', '2025-03-12 20:31:47.699621 +00:00'),
        (445, '2087', '2025-03-12 20:31:47.807945 +00:00'),
        (446, '5949', '2025-03-12 20:31:47.909368 +00:00'),
        (447, '2026', '2025-03-12 20:31:48.009720 +00:00'),
        (448, '7383', '2025-03-12 20:31:48.110787 +00:00'),
        (449, '1796', '2025-03-12 20:31:48.212949 +00:00'),
        (450, '2843', '2025-03-12 20:31:48.301489 +00:00'),
        (451, '6081', '2025-03-12 20:31:48.393559 +00:00'),
        (452, '3519', '2025-03-12 20:31:48.490800 +00:00'),
        (453, '7335', '2025-03-12 20:31:48.582199 +00:00'),
        (454, '3563', '2025-03-12 20:31:48.673111 +00:00'),
        (455, '3465', '2025-03-12 20:31:48.778678 +00:00'),
        (456, '5641', '2025-03-12 20:31:48.871011 +00:00'),
        (457, '2389', '2025-03-12 20:31:48.964559 +00:00'),
        (458, '7542', '2025-03-12 20:31:49.058315 +00:00'),
        (459, '2676', '2025-03-12 20:31:49.163725 +00:00'),
        (460, '3081', '2025-03-12 20:31:49.252826 +00:00'),
        (461, '7841', '2025-03-12 20:31:49.341305 +00:00'),
        (462, '3861', '2025-03-12 20:31:49.441370 +00:00'),
        (463, '7352', '2025-03-12 20:31:49.563536 +00:00'),
        (464, '3479', '2025-03-12 20:31:49.648990 +00:00'),
        (465, '8243', '2025-03-12 20:31:49.753893 +00:00'),
        (466, '9999', '2025-03-12 20:31:49.852136 +00:00'),
        (467, '3648', '2025-03-12 20:31:49.988341 +00:00'),
        (468, '3843', '2025-03-12 20:31:50.103032 +00:00'),
        (469, '8031', '2025-03-12 20:31:50.191907 +00:00'),
        (470, '4499', '2025-03-12 20:31:50.306088 +00:00'),
        (471, '9131', '2025-03-12 20:31:50.401711 +00:00'),
        (472, '3357', '2025-03-12 20:31:50.509109 +00:00'),
        (473, '5571', '2025-03-12 20:31:50.611555 +00:00'),
        (474, '3678', '2025-03-12 20:31:50.701971 +00:00'),
        (475, '3537', '2025-03-12 20:31:50.804467 +00:00'),
        (476, '7911', '2025-03-12 20:31:50.900188 +00:00'),
        (477, '4932', '2025-03-12 20:31:50.982780 +00:00'),
        (478, '2038', '2025-03-12 20:31:51.082586 +00:00'),
        (479, '7623', '2025-03-12 20:31:51.186779 +00:00'),
        (480, '4612', '2025-03-12 20:31:51.307169 +00:00'),
        (481, '0783', '2025-03-12 20:31:51.454592 +00:00'),
        (482, '3545', '2025-03-12 20:31:51.540149 +00:00'),
        (483, '3471', '2025-03-12 20:31:51.637748 +00:00'),
        (484, '2671', '2025-03-12 20:31:51.722703 +00:00'),
        (485, '7261', '2025-03-12 20:31:51.805112 +00:00'),
        (486, '2325', '2025-03-12 20:31:51.898649 +00:00'),
        (487, '7338', '2025-03-12 20:31:51.988958 +00:00'),
        (488, '2434', '2025-03-12 20:31:52.074030 +00:00'),
        (489, '3568', '2025-03-12 20:31:52.156565 +00:00'),
        (490, '5131', '2025-03-12 20:31:52.257512 +00:00'),
        (491, '5143', '2025-03-12 20:31:52.339977 +00:00'),
        (492, '5171', '2025-03-12 20:31:52.441523 +00:00'),
        (493, '7384', '2025-03-12 20:31:52.593334 +00:00'),
        (494, '7241', '2025-03-12 20:31:52.673821 +00:00'),
        (495, '3694', '2025-03-12 20:31:52.758518 +00:00'),
        (496, '3565', '2025-03-12 20:31:52.847873 +00:00'),
        (497, '2672', '2025-03-12 20:31:52.935861 +00:00'),
        (498, '3691', '2025-03-12 20:31:53.022965 +00:00'),
        (499, '2043', '2025-03-12 20:31:53.119049 +00:00'),
        (500, '2326', '2025-03-12 20:31:53.228573 +00:00'),
        (501, '3556', '2025-03-12 20:31:53.326535 +00:00'),
        (502, '5735', '2025-03-12 20:31:53.421136 +00:00'),
        (503, '2599', '2025-03-12 20:31:53.526492 +00:00'),
        (504, '5033', '2025-03-12 20:31:53.623141 +00:00'),
        (505, '4959', '2025-03-12 20:31:53.714048 +00:00'),
        (506, '1622', '2025-03-12 20:31:53.811020 +00:00'),
        (507, '9631', '2025-03-12 20:31:53.916846 +00:00'),
        (508, '3423', '2025-03-12 20:31:54.026826 +00:00'),
        (509, '2273', '2025-03-12 20:31:54.146805 +00:00'),
        (510, '5261', '2025-03-12 20:31:54.245238 +00:00'),
        (511, '2673', '2025-03-12 20:31:54.350440 +00:00'),
        (512, '3432', '2025-03-12 20:31:54.476289 +00:00'),
        (513, '5147', '2025-03-12 20:31:54.593558 +00:00'),
        (514, '4151', '2025-03-12 20:31:54.695612 +00:00'),
        (515, '3541', '2025-03-12 20:31:54.801006 +00:00'),
        (516, '3221', '2025-03-12 20:31:54.896781 +00:00'),
        (517, '8651', '2025-03-12 20:31:55.004937 +00:00'),
        (518, '5948', '2025-03-12 20:31:55.114739 +00:00'),
        (519, '5014', '2025-03-12 20:31:55.211896 +00:00'),
        (520, '5551', '2025-03-12 20:31:55.307952 +00:00'),
        (521, '2064', '2025-03-12 20:31:55.412849 +00:00'),
        (522, '8422', '2025-03-12 20:31:55.505976 +00:00'),
        (523, '5142', '2025-03-12 20:31:55.611021 +00:00'),
        (524, '3053', '2025-03-12 20:31:55.728530 +00:00'),
        (525, '6011', '2025-03-12 20:31:55.830697 +00:00'),
        (526, '6221', '2025-03-12 20:31:55.975231 +00:00'),
        (527, '2522', '2025-03-12 20:31:56.073452 +00:00'),
        (528, '4952', '2025-03-12 20:31:56.194080 +00:00'),
        (529, '3578', '2025-03-12 20:31:56.306606 +00:00'),
        (530, '3612', '2025-03-12 20:31:56.411768 +00:00'),
        (531, '3799', '2025-03-12 20:31:56.507789 +00:00'),
        (532, '8244', '2025-03-12 20:31:56.616727 +00:00'),
        (533, '7218', '2025-03-12 20:31:56.734756 +00:00'),
        (534, '3594', '2025-03-12 20:31:56.837681 +00:00'),
        (535, '3564', '2025-03-12 20:31:56.943979 +00:00'),
        (536, '2396', '2025-03-12 20:31:57.059457 +00:00'),
        (537, '3555', '2025-03-12 20:31:57.173025 +00:00'),
        (538, '3462', '2025-03-12 20:31:57.292269 +00:00'),
        (539, '2679', '2025-03-12 20:31:57.419618 +00:00'),
        (540, '2771', '2025-03-12 20:31:57.531292 +00:00'),
        (541, '1241', '2025-03-12 20:31:57.633490 +00:00'),
        (542, '2399', '2025-03-12 20:31:57.732773 +00:00'),
        (543, '2512', '2025-03-12 20:31:57.850848 +00:00'),
        (544, '5145', '2025-03-12 20:31:57.961624 +00:00'),
        (545, '3086', '2025-03-12 20:31:58.066955 +00:00'),
        (546, '7948', '2025-03-12 20:31:58.173368 +00:00'),
        (547, '5561', '2025-03-12 20:31:58.277943 +00:00'),
        (548, '3494', '2025-03-12 20:31:58.379981 +00:00'),
        (549, '6553', '2025-03-12 20:31:58.486504 +00:00'),
        (550, '5193', '2025-03-12 20:31:58.591871 +00:00'),
        (551, '3593', '2025-03-12 20:31:58.684974 +00:00'),
        (552, '2789', '2025-03-12 20:31:58.784225 +00:00'),
        (553, '4412', '2025-03-12 20:31:58.879731 +00:00'),
        (554, '2066', '2025-03-12 20:31:58.980507 +00:00'),
        (555, '3732', '2025-03-12 20:31:59.082772 +00:00'),
        (556, '3231', '2025-03-12 20:31:59.204762 +00:00'),
        (557, '3821', '2025-03-12 20:31:59.316858 +00:00'),
        (558, '6289', '2025-03-12 20:31:59.428170 +00:00'),
        (559, '3448', '2025-03-12 20:31:59.540317 +00:00'),
        (560, '5983', '2025-03-12 20:31:59.667598 +00:00'),
        (561, '3911', '2025-03-12 20:31:59.771888 +00:00'),
        (562, '1793', '2025-03-12 20:31:59.874517 +00:00'),
        (563, '3542', '2025-03-12 20:31:59.982408 +00:00'),
        (564, '8072', '2025-03-12 20:32:00.116490 +00:00'),
        (565, '3411', '2025-03-12 20:32:00.215915 +00:00'),
        (566, '5043', '2025-03-12 20:32:00.324139 +00:00'),
        (567, '1442', '2025-03-12 20:32:00.432034 +00:00'),
        (568, '3844', '2025-03-12 20:32:00.524285 +00:00'),
        (569, '2085', '2025-03-12 20:32:00.637545 +00:00'),
        (570, '3446', '2025-03-12 20:32:00.759333 +00:00'),
        (571, '3355', '2025-03-12 20:32:00.870417 +00:00'),
        (572, '2013', '2025-03-12 20:32:00.975785 +00:00'),
        (573, '5039', '2025-03-12 20:32:01.086078 +00:00'),
        (574, '2339', '2025-03-12 20:32:01.179653 +00:00'),
        (575, '0751', '2025-03-12 20:32:01.298895 +00:00'),
        (576, '6231', '2025-03-12 20:32:01.397114 +00:00'),
        (577, '3532', '2025-03-12 20:32:01.491731 +00:00'),
        (578, '3633', '2025-03-12 20:32:01.577363 +00:00'),
        (579, '4222', '2025-03-12 20:32:01.675238 +00:00'),
        (580, '7041', '2025-03-12 20:32:01.767321 +00:00'),
        (581, '3743', '2025-03-12 20:32:01.923666 +00:00'),
        (582, '3562', '2025-03-12 20:32:02.109882 +00:00'),
        (583, '5111', '2025-03-12 20:32:02.217132 +00:00'),
        (584, '5962', '2025-03-12 20:32:02.336572 +00:00'),
        (585, '2499', '2025-03-12 20:32:02.458832 +00:00'),
        (586, '5599', '2025-03-12 20:32:02.591633 +00:00'),
        (587, '2541', '2025-03-12 20:32:02.687944 +00:00'),
        (588, '2521', '2025-03-12 20:32:02.775210 +00:00'),
        (589, '3229', '2025-03-12 20:32:02.931108 +00:00'),
        (590, '3496', '2025-03-12 20:32:03.030883 +00:00'),
        (591, '2511', '2025-03-12 20:32:03.126735 +00:00'),
        (592, '3492', '2025-03-12 20:32:03.236030 +00:00'),
        (593, '4481', '2025-03-12 20:32:03.336350 +00:00'),
        (594, '3433', '2025-03-12 20:32:03.457340 +00:00'),
        (595, '3399', '2025-03-12 20:32:03.552567 +00:00'),
        (596, '2812', '2025-03-12 20:32:03.644376 +00:00'),
        (597, '5162', '2025-03-12 20:32:03.743770 +00:00'),
        (598, '3241', '2025-03-12 20:32:03.859243 +00:00'),
        (599, '2211', '2025-03-12 20:32:03.952547 +00:00'),
        (600, '5984', '2025-03-12 20:32:04.057800 +00:00'),
        (601, '5441', '2025-03-12 20:32:04.154745 +00:00'),
        (602, '3498', '2025-03-12 20:32:04.277092 +00:00'),
        (603, '4961', '2025-03-12 20:32:04.363382 +00:00'),
        (604, '7217', '2025-03-12 20:32:04.448380 +00:00'),
        (605, '2796', '2025-03-12 20:32:04.549514 +00:00'),
        (606, '3351', '2025-03-12 20:32:04.677183 +00:00'),
        (607, '3296', '2025-03-12 20:32:04.856834 +00:00'),
        (608, '3325', '2025-03-12 20:32:04.965986 +00:00'),
        (609, '3334', '2025-03-12 20:32:05.116489 +00:00'),
        (610, '5146', '2025-03-12 20:32:05.220327 +00:00'),
        (611, '3639', '2025-03-12 20:32:05.320000 +00:00'),
        (612, '7216', '2025-03-12 20:32:05.417024 +00:00'),
        (613, '2079', '2025-03-12 20:32:05.519677 +00:00'),
        (614, '5993', '2025-03-12 20:32:05.626103 +00:00'),
        (615, '3629', '2025-03-12 20:32:05.737868 +00:00'),
        (616, '3645', '2025-03-12 20:32:05.846475 +00:00'),
        (617, '2092', '2025-03-12 20:32:05.933760 +00:00'),
        (618, '3211', '2025-03-12 20:32:06.045245 +00:00'),
        (619, '7515', '2025-03-12 20:32:06.140995 +00:00'),
        (620, '0181', '2025-03-12 20:32:06.240201 +00:00'),
        (621, '2321', '2025-03-12 20:32:06.351603 +00:00'),
        (622, '7692', '2025-03-12 20:32:06.453977 +00:00'),
        (623, '2542', '2025-03-12 20:32:06.566743 +00:00'),
        (624, '0723', '2025-03-12 20:32:06.658392 +00:00'),
        (625, '5271', '2025-03-12 20:32:06.757297 +00:00'),
        (626, '4449', '2025-03-12 20:32:06.858728 +00:00'),
        (627, '7213', '2025-03-12 20:32:06.960985 +00:00'),
        (628, '0741', '2025-03-12 20:32:07.057111 +00:00'),
        (629, '3824', '2025-03-12 20:32:07.169456 +00:00'),
        (630, '3534', '2025-03-12 20:32:07.270094 +00:00'),
        (631, '2221', '2025-03-12 20:32:07.375483 +00:00'),
        (632, '2515', '2025-03-12 20:32:07.464263 +00:00'),
        (633, '3316', '2025-03-12 20:32:07.565258 +00:00'),
        (634, '3695', '2025-03-12 20:32:07.693480 +00:00'),
        (635, '5194', '2025-03-12 20:32:07.799014 +00:00'),
        (636, '3634', '2025-03-12 20:32:07.905939 +00:00'),
        (637, '2037', '2025-03-12 20:32:07.990731 +00:00'),
        (638, '3549', '2025-03-12 20:32:08.095720 +00:00'),
        (639, '7033', '2025-03-12 20:32:08.197818 +00:00'),
        (640, '2074', '2025-03-12 20:32:08.343221 +00:00'),
        (641, '4142', '2025-03-12 20:32:08.434300 +00:00'),
        (642, '3449', '2025-03-12 20:32:08.530591 +00:00'),
        (643, '2992', '2025-03-12 20:32:08.616104 +00:00'),
        (644, '4923', '2025-03-12 20:32:08.703624 +00:00'),
        (645, '3354', '2025-03-12 20:32:08.804593 +00:00'),
        (646, '4619', '2025-03-12 20:32:08.909969 +00:00'),
        (647, '0762', '2025-03-12 20:32:09.004778 +00:00'),
        (648, '3452', '2025-03-12 20:32:09.108438 +00:00'),
        (649, '5015', '2025-03-12 20:32:09.223989 +00:00'),
        (650, '2047', '2025-03-12 20:32:09.321521 +00:00'),
        (651, '1041', '2025-03-12 20:32:09.420557 +00:00'),
        (652, '2754', '2025-03-12 20:32:09.540411 +00:00'),
        (653, '2873', '2025-03-12 20:32:09.657649 +00:00'),
        (654, '3356', '2025-03-12 20:32:09.764981 +00:00'),
        (655, '0291', '2025-03-12 20:32:09.879775 +00:00'),
        (656, '2435', '2025-03-12 20:32:09.971307 +00:00'),
        (657, '7312', '2025-03-12 20:32:10.060139 +00:00'),
        (658, '3341', '2025-03-12 20:32:10.156502 +00:00'),
        (659, '3715', '2025-03-12 20:32:10.267885 +00:00'),
        (660, '3315', '2025-03-12 20:32:10.385420 +00:00'),
        (661, '3143', '2025-03-12 20:32:10.485357 +00:00'),
        (662, '1021', '2025-03-12 20:32:10.574830 +00:00'),
        (663, '2361', '2025-03-12 20:32:10.673874 +00:00'),
        (664, '2032', '2025-03-12 20:32:10.774704 +00:00'),
        (665, '5159', '2025-03-12 20:32:10.866644 +00:00'),
        (666, '2448', '2025-03-12 20:32:10.977595 +00:00'),
        (667, '2111', '2025-03-12 20:32:11.096225 +00:00'),
        (668, '1781', '2025-03-12 20:32:11.268914 +00:00'),
        (669, '5421', '2025-03-12 20:32:11.383815 +00:00'),
        (670, '7536', '2025-03-12 20:32:11.484586 +00:00'),
        (671, '0115', '2025-03-12 20:32:11.600235 +00:00'),
        (672, '3764', '2025-03-12 20:32:11.707885 +00:00'),
        (673, '3592', '2025-03-12 20:32:11.819877 +00:00'),
        (674, '2952', '2025-03-12 20:32:11.925336 +00:00'),
        (675, '5994', '2025-03-12 20:32:12.019777 +00:00'),
        (676, '3271', '2025-03-12 20:32:12.112684 +00:00'),
        (677, '1422', '2025-03-12 20:32:12.202314 +00:00'),
        (678, '1795', '2025-03-12 20:32:12.293768 +00:00'),
        (679, '3548', '2025-03-12 20:32:12.392839 +00:00'),
        (680, '4013', '2025-03-12 20:32:12.493642 +00:00'),
        (681, '7021', '2025-03-12 20:32:12.579660 +00:00'),
        (682, '4221', '2025-03-12 20:32:12.670078 +00:00'),
        (683, '3431', '2025-03-12 20:32:12.756250 +00:00'),
        (684, '3451', '2025-03-12 20:32:12.849037 +00:00'),
        (685, '3524', '2025-03-12 20:32:12.953653 +00:00'),
        (686, '3052', '2025-03-12 20:32:13.047835 +00:00'),
        (687, '7622', '2025-03-12 20:32:13.160557 +00:00'),
        (688, '2095', '2025-03-12 20:32:13.249596 +00:00'),
        (689, '1321', '2025-03-12 20:32:13.347276 +00:00'),
        (690, '0119', '2025-03-12 20:32:13.447302 +00:00'),
        (691, '5144', '2025-03-12 20:32:13.534197 +00:00'),
        (692, '4489', '2025-03-12 20:32:13.624325 +00:00'),
        (693, '2096', '2025-03-12 20:32:13.723019 +00:00'),
        (694, '2452', '2025-03-12 20:32:13.817171 +00:00'),
        (695, '3321', '2025-03-12 20:32:13.912812 +00:00'),
        (696, '3677', '2025-03-12 20:32:14.009407 +00:00'),
        (697, '3566', '2025-03-12 20:32:14.123285 +00:00'),
        (698, '3339', '2025-03-12 20:32:14.227151 +00:00'),
        (699, '2395', '2025-03-12 20:32:14.354381 +00:00'),
        (700, '2951', '2025-03-12 20:32:14.451302 +00:00'),
        (701, '7212', '2025-03-12 20:32:14.561268 +00:00'),
        (702, '1221', '2025-03-12 20:32:14.659039 +00:00'),
        (703, '2035', '2025-03-12 20:32:14.761062 +00:00'),
        (704, '3171', '2025-03-12 20:32:14.870108 +00:00'),
        (705, '4822', '2025-03-12 20:32:14.975491 +00:00'),
        (706, '6514', '2025-03-12 20:32:15.061497 +00:00'),
        (707, '3644', '2025-03-12 20:32:15.163387 +00:00'),
        (708, '2822', '2025-03-12 20:32:15.259527 +00:00'),
        (709, '3631', '2025-03-12 20:32:15.373474 +00:00'),
        (710, '3931', '2025-03-12 20:32:15.473385 +00:00'),
        (711, '3567', '2025-03-12 20:32:15.587786 +00:00'),
        (712, '3324', '2025-03-12 20:32:15.679760 +00:00'),
        (713, '2893', '2025-03-12 20:32:15.776012 +00:00'),
        (714, '3253', '2025-03-12 20:32:15.872318 +00:00'),
        (715, '5431', '2025-03-12 20:32:15.968868 +00:00'),
        (716, '0721', '2025-03-12 20:32:16.077837 +00:00'),
        (717, '2791', '2025-03-12 20:32:16.230964 +00:00'),
        (718, '2311', '2025-03-12 20:32:16.329426 +00:00'),
        (719, '3536', '2025-03-12 20:32:16.520188 +00:00'),
        (720, '3353', '2025-03-12 20:32:16.620487 +00:00'),
        (721, '3554', '2025-03-12 20:32:16.830760 +00:00'),
        (722, '7933', '2025-03-12 20:32:16.923491 +00:00'),
        (723, '3484', '2025-03-12 20:32:17.004193 +00:00'),
        (724, '3275', '2025-03-12 20:32:17.106279 +00:00'),
        (725, '6091', '2025-03-12 20:32:17.207343 +00:00'),
        (726, '7519', '2025-03-12 20:32:17.297884 +00:00'),
        (727, '3647', '2025-03-12 20:32:17.417271 +00:00'),
        (728, '6515', '2025-03-12 20:32:17.508087 +00:00'),
        (729, '2331', '2025-03-12 20:32:17.596864 +00:00'),
        (730, '2335', '2025-03-12 20:32:17.715590 +00:00'),
        (731, '2426', '2025-03-12 20:32:17.806736 +00:00'),
        (732, '3369', '2025-03-12 20:32:17.895852 +00:00'),
        (733, '2254', '2025-03-12 20:32:17.981544 +00:00'),
        (734, '5198', '2025-03-12 20:32:18.072388 +00:00'),
        (735, '4131', '2025-03-12 20:32:18.162751 +00:00'),
        (736, '2075', '2025-03-12 20:32:18.255103 +00:00'),
        (737, '2514', '2025-03-12 20:32:18.365776 +00:00'),
        (738, '5451', '2025-03-12 20:32:18.467241 +00:00'),
        (739, '3085', '2025-03-12 20:32:18.574936 +00:00'),
        (740, '3084', '2025-03-12 20:32:18.690020 +00:00'),
        (741, '3251', '2025-03-12 20:32:18.805413 +00:00'),
        (742, '2874', '2025-03-12 20:32:18.912511 +00:00'),
        (743, '4783', '2025-03-12 20:32:19.012561 +00:00'),
        (744, '2591', '2025-03-12 20:32:19.132689 +00:00'),
        (745, '3873', '2025-03-12 20:32:19.234632 +00:00'),
        (746, '5989', '2025-03-12 20:32:19.352732 +00:00'),
        (747, '2656', '2025-03-12 20:32:19.447919 +00:00'),
        (748, '2611', '2025-03-12 20:32:19.555907 +00:00'),
        (749, '4785', '2025-03-12 20:32:19.654870 +00:00'),
        (750, '3083', '2025-03-12 20:32:19.743835 +00:00'),
        (751, '2299', '2025-03-12 20:32:19.833477 +00:00'),
        (752, '3635', '2025-03-12 20:32:19.925359 +00:00'),
        (753, '2253', '2025-03-12 20:32:20.042793 +00:00'),
        (754, '2295', '2025-03-12 20:32:20.126331 +00:00'),
        (755, '3281', '2025-03-12 20:32:20.221211 +00:00'),
        (756, '0211', '2025-03-12 20:32:20.306284 +00:00'),
        (757, '7537', '2025-03-12 20:32:20.406213 +00:00'),
        (758, '5048', '2025-03-12 20:32:20.499314 +00:00'),
        (759, '3942', '2025-03-12 20:32:20.585501 +00:00'),
        (760, '2392', '2025-03-12 20:32:20.670229 +00:00'),
        (761, '2732', '2025-03-12 20:32:20.754696 +00:00'),
        (762, '4925', '2025-03-12 20:32:20.845169 +00:00'),
        (763, '5154', '2025-03-12 20:32:20.952243 +00:00'),
        (764, '7694', '2025-03-12 20:32:21.060494 +00:00'),
        (765, '3641', '2025-03-12 20:32:21.162420 +00:00'),
        (766, '2439', '2025-03-12 20:32:21.246347 +00:00'),
        (767, '2394', '2025-03-12 20:32:21.360003 +00:00'),
        (768, '4971', '2025-03-12 20:32:21.456290 +00:00'),
        (769, '3421', '2025-03-12 20:32:21.543808 +00:00'),
        (770, '2493', '2025-03-12 20:32:21.641773 +00:00'),
        (771, '7829', '2025-03-12 20:32:21.728834 +00:00'),
        (772, '3149', '2025-03-12 20:32:21.837034 +00:00'),
        (773, '3131', '2025-03-12 20:32:21.940366 +00:00'),
        (774, '3463', '2025-03-12 20:32:22.053447 +00:00'),
        (775, '2761', '2025-03-12 20:32:22.150080 +00:00'),
        (776, '3671', '2025-03-12 20:32:22.258326 +00:00'),
        (777, '2341', '2025-03-12 20:32:22.351069 +00:00'),
        (778, '0241', '2025-03-12 20:32:22.437600 +00:00'),
        (779, '0851', '2025-03-12 20:32:22.537428 +00:00'),
        (780, '3061', '2025-03-12 20:32:22.647272 +00:00'),
        (781, '1081', '2025-03-12 20:32:22.732713 +00:00'),
        (782, '3292', '2025-03-12 20:32:22.826388 +00:00'),
        (783, '2281', '2025-03-12 20:32:22.923455 +00:00'),
        (784, '3297', '2025-03-12 20:32:23.013967 +00:00'),
        (785, '3363', '2025-03-12 20:32:23.105294 +00:00'),
        (786, '2034', '2025-03-12 20:32:23.201923 +00:00'),
        (787, '2865', '2025-03-12 20:32:23.306041 +00:00'),
        (788, '4492', '2025-03-12 20:32:23.409332 +00:00'),
        (789, '7377', '2025-03-12 20:32:23.522175 +00:00'),
        (790, '3269', '2025-03-12 20:32:23.604958 +00:00'),
        (791, '3365', '2025-03-12 20:32:23.691893 +00:00'),
        (792, '3493', '2025-03-12 20:32:23.778424 +00:00'),
        (793, '3792', '2025-03-12 20:32:23.866265 +00:00'),
        (794, '7211', '2025-03-12 20:32:23.965996 +00:00'),
        (795, '2045', '2025-03-12 20:32:24.070881 +00:00'),
        (796, '3624', '2025-03-12 20:32:24.163884 +00:00'),
        (797, '2046', '2025-03-12 20:32:24.264791 +00:00'),
        (798, '3489', '2025-03-12 20:32:24.357731 +00:00'),
        (799, '2451', '2025-03-12 20:32:24.451148 +00:00'),
        (800, '3965', '2025-03-12 20:32:24.540177 +00:00'),
        (801, '3692', '2025-03-12 20:32:24.636606 +00:00'),
        (802, '2077', '2025-03-12 20:32:24.751508 +00:00'),
        (803, '1011', '2025-03-12 20:32:24.856441 +00:00'),
        (804, '2892', '2025-03-12 20:32:24.951199 +00:00'),
        (805, '3412', '2025-03-12 20:32:25.054310 +00:00'),
        (806, '3483', '2025-03-12 20:32:25.149367 +00:00'),
        (807, '3596', '2025-03-12 20:32:25.241913 +00:00'),
        (808, '3795', '2025-03-12 20:32:25.326463 +00:00'),
        (809, '0139', '2025-03-12 20:32:25.427526 +00:00'),
        (810, '1423', '2025-03-12 20:32:25.534987 +00:00'),
        (811, '0213', '2025-03-12 20:32:25.628181 +00:00'),
        (812, '0161', '2025-03-12 20:32:25.722221 +00:00'),
        (813, '0175', '2025-03-12 20:32:25.832111 +00:00'),
        (814, '2657', '2025-03-12 20:32:25.936699 +00:00'),
        (815, '1099', '2025-03-12 20:32:26.029007 +00:00'),
        (816, '7534', '2025-03-12 20:32:26.115719 +00:00'),
        (817, '3632', '2025-03-12 20:32:26.214021 +00:00'),
        (818, '2261', '2025-03-12 20:32:26.331857 +00:00'),
        (819, '2131', '2025-03-12 20:32:26.439351 +00:00'),
        (820, '3425', '2025-03-12 20:32:26.569540 +00:00'),
        (821, '0971', '2025-03-12 20:32:26.673236 +00:00'),
        (822, '3553', '2025-03-12 20:32:26.778162 +00:00'),
        (823, '2491', '2025-03-12 20:32:26.872059 +00:00'),
        (824, '3088', '2025-03-12 20:32:26.981290 +00:00'),
        (825, '2895', '2025-03-12 20:32:27.074899 +00:00'),
        (826, '2297', '2025-03-12 20:32:27.174557 +00:00'),
        (827, '0212', '2025-03-12 20:32:27.276428 +00:00'),
        (828, '2411', '2025-03-12 20:32:27.405852 +00:00'),
        (829, '2252', '2025-03-12 20:32:27.520307 +00:00'),
        (830, '2068', '2025-03-12 20:32:27.626110 +00:00'),
        (831, '7533', '2025-03-12 20:32:27.727251 +00:00'),
        (832, '3082', '2025-03-12 20:32:27.874391 +00:00'),
        (833, '7215', '2025-03-12 20:32:27.977547 +00:00'),
        (834, '2675', '2025-03-12 20:32:28.073688 +00:00'),
        (835, '3161', '2025-03-12 20:32:28.182815 +00:00'),
        (836, '3961', '2025-03-12 20:32:28.287910 +00:00'),
        (837, '2677', '2025-03-12 20:32:28.380658 +00:00'),
        (838, '3482', '2025-03-12 20:32:28.479388 +00:00'),
        (839, '4424', '2025-03-12 20:32:28.573885 +00:00'),
        (840, '0811', '2025-03-12 20:32:28.676663 +00:00'),
        (841, '3769', '2025-03-12 20:32:28.777221 +00:00'),
        (842, '2337', '2025-03-12 20:32:28.885778 +00:00'),
        (843, '3675', '2025-03-12 20:32:28.986172 +00:00'),
        (844, '2241', '2025-03-12 20:32:29.073978 +00:00'),
        (845, '3295', '2025-03-12 20:32:29.175307 +00:00'),
        (846, '3366', '2025-03-12 20:32:29.274750 +00:00'),
        (847, '3087', '2025-03-12 20:32:29.366781 +00:00'),
        (848, '3676', '2025-03-12 20:32:29.504164 +00:00'),
        (849, '4141', '2025-03-12 20:32:29.611260 +00:00'),
        (850, '3495', '2025-03-12 20:32:29.695321 +00:00'),
        (851, '2449', '2025-03-12 20:32:29.796809 +00:00'),
        (852, '3199', '2025-03-12 20:32:29.923646 +00:00'),
        (853, '3172', '2025-03-12 20:32:30.019492 +00:00'),
        (854, '3144', '2025-03-12 20:32:30.120320 +00:00'),
        (855, '3274', '2025-03-12 20:32:30.223625 +00:00'),
        (856, '2053', '2025-03-12 20:32:30.335505 +00:00'),
        (857, '3716', '2025-03-12 20:32:30.447772 +00:00'),
        (858, '0172', '2025-03-12 20:32:30.558327 +00:00'),
        (859, '3951', '2025-03-12 20:32:30.668672 +00:00'),
        (860, '2875', '2025-03-12 20:32:30.765251 +00:00'),
        (861, '4613', '2025-03-12 20:32:30.877777 +00:00'),
        (862, '2824', '2025-03-12 20:32:30.968212 +00:00'),
        (863, '3299', '2025-03-12 20:32:31.065025 +00:00'),
        (864, '2436', '2025-03-12 20:32:31.252926 +00:00'),
        (865, '4173', '2025-03-12 20:32:31.356944 +00:00'),
        (866, '3331', '2025-03-12 20:32:31.459636 +00:00'),
        (867, '2021', '2025-03-12 20:32:31.551200 +00:00'),
        (868, '2655', '2025-03-12 20:32:31.654204 +00:00'),
        (869, '1479', '2025-03-12 20:32:31.766325 +00:00'),
        (870, '3466', '2025-03-12 20:32:31.909722 +00:00'),
        (871, '2091', '2025-03-12 20:32:32.044825 +00:00'),
        (872, '7219', '2025-03-12 20:32:32.142015 +00:00'),
        (873, '5714', '2025-03-12 20:32:32.250099 +00:00'),
        (874, '1446', '2025-03-12 20:32:32.336683 +00:00'),
        (875, '3552', '2025-03-12 20:32:32.510410 +00:00'),
        (876, '1499', '2025-03-12 20:32:32.613413 +00:00'),
        (877, '3953', '2025-03-12 20:32:32.711757 +00:00'),
        (878, '4741', '2025-03-12 20:32:32.821075 +00:00'),
        (879, '2519', '2025-03-12 20:32:32.921165 +00:00'),
        (880, '2441', '2025-03-12 20:32:33.012555 +00:00'),
        (881, '7641', '2025-03-12 20:32:33.110915 +00:00'),
        (882, '2678', '2025-03-12 20:32:33.272352 +00:00'),
        (883, '3255', '2025-03-12 20:32:33.383151 +00:00'),
        (884, '3264', '2025-03-12 20:32:33.489333 +00:00'),
        (885, '3313', '2025-03-12 20:32:33.591652 +00:00'),
        (886, '0254', '2025-03-12 20:32:33.688390 +00:00'),
        (887, '3497', '2025-03-12 20:32:33.844584 +00:00'),
        (888, '4231', '2025-03-12 20:32:33.973701 +00:00'),
        (889, '3586', '2025-03-12 20:32:34.074535 +00:00'),
        (890, '2353', '2025-03-12 20:32:34.179775 +00:00'),
        (891, '2393', '2025-03-12 20:32:34.265572 +00:00'),
        (892, '3582', '2025-03-12 20:32:34.363883 +00:00'),
        (893, '1455', '2025-03-12 20:32:34.459685 +00:00'),
        (894, '3142', '2025-03-12 20:32:34.557195 +00:00'),
        (895, '2816', '2025-03-12 20:32:34.698638 +00:00'),
        (896, '3995', '2025-03-12 20:32:34.794676 +00:00'),
        (897, '2098', '2025-03-12 20:32:34.881400 +00:00'),
        (898, '3364', '2025-03-12 20:32:34.983760 +00:00'),
        (899, '0252', '2025-03-12 20:32:35.075690 +00:00'),
        (900, '0131', '2025-03-12 20:32:35.167368 +00:00'),
        (901, '0279', '2025-03-12 20:32:35.256075 +00:00'),
        (902, '0134', '2025-03-12 20:32:35.353094 +00:00'),
        (903, '2323', '2025-03-12 20:32:35.458361 +00:00'),
        (904, '1429', '2025-03-12 20:32:35.583803 +00:00'),
        (905, '0111', '2025-03-12 20:32:35.688075 +00:00'),
        (906, '2652', '2025-03-12 20:32:35.798598 +00:00'),
        (907, '2067', '2025-03-12 20:32:35.899067 +00:00'),
        (908, '2298', '2025-03-12 20:32:35.988697 +00:00'),
        (909, '3581', '2025-03-12 20:32:36.099780 +00:00'),
        (910, '3915', '2025-03-12 20:32:36.204097 +00:00'),
        (911, '0174', '2025-03-12 20:32:36.294515 +00:00'),
        (912, '2063', '2025-03-12 20:32:36.387167 +00:00'),
        (913, '2284', '2025-03-12 20:32:36.488295 +00:00'),
        (914, '2062', '2025-03-12 20:32:36.588341 +00:00'),
        (915, '1481', '2025-03-12 20:32:36.691005 +00:00'),
        (916, '3955', '2025-03-12 20:32:36.800330 +00:00'),
        (917, '3543', '2025-03-12 20:32:36.890495 +00:00'),
        (918, '3991', '2025-03-12 20:32:36.983545 +00:00'),
        (919, '0711', '2025-03-12 20:32:37.073812 +00:00'),
        (920, '2097', '2025-03-12 20:32:37.167263 +00:00'),
        (921, '2044', '2025-03-12 20:32:37.279514 +00:00'),
        (922, '2674', '2025-03-12 20:32:37.385321 +00:00'),
        (923, '0272', '2025-03-12 20:32:37.477027 +00:00'),
        (924, '0921', '2025-03-12 20:32:37.582824 +00:00'),
        (925, '2391', '2025-03-12 20:32:37.697497 +00:00'),
        (926, '2381', '2025-03-12 20:32:37.793033 +00:00'),
        (927, '4482', '2025-03-12 20:32:37.883944 +00:00'),
        (928, '0182', '2025-03-12 20:32:37.992653 +00:00'),
        (929, '2369', '2025-03-12 20:32:38.084109 +00:00'),
        (930, '3996', '2025-03-12 20:32:38.195488 +00:00'),
        (931, '1222', '2025-03-12 20:32:38.304607 +00:00'),
        (932, '1411', '2025-03-12 20:32:38.400014 +00:00'),
        (933, '2861', '2025-03-12 20:32:38.501791 +00:00'),
        (934, '3952', '2025-03-12 20:32:38.616946 +00:00'),
        (935, '1459', '2025-03-12 20:32:38.753997 +00:00'),
        (936, '2061', '2025-03-12 20:32:38.851649 +00:00'),
        (937, '3914', '2025-03-12 20:32:38.945653 +00:00'),
        (938, '2251', '2025-03-12 20:32:39.033020 +00:00'),
        (939, '1094', '2025-03-12 20:32:39.127338 +00:00'),
        (940, '0831', '2025-03-12 20:32:39.221349 +00:00'),
        (941, '3261', '2025-03-12 20:32:39.371708 +00:00'),
        (942, '2121', '2025-03-12 20:32:39.465476 +00:00'),
        (943, '2823', '2025-03-12 20:32:39.608324 +00:00'),
        (945, '2231', '2025-03-12 20:32:39.820785 +00:00'),
        (947, '3111', '2025-03-12 20:32:40.081092 +00:00'),
        (949, '0251', '2025-03-12 20:32:40.316466 +00:00'),
        (951, '2258', '2025-03-12 20:32:40.517012 +00:00'),
        (953, '0761', '2025-03-12 20:32:40.710971 +00:00'),
        (955, '2999', '2025-03-12 20:32:40.927669 +00:00'),
        (957, '6792', '2025-03-12 20:32:41.121657 +00:00'),
        (959, '2296', '2025-03-12 20:32:41.309596 +00:00'),
        (961, '0173', '2025-03-12 20:32:41.535052 +00:00'),
        (963, '2269', '2025-03-12 20:32:41.756596 +00:00'),
        (965, '0132', '2025-03-12 20:32:41.952067 +00:00'),
        (967, '3322', '2025-03-12 20:32:42.157397 +00:00'),
        (969, '4432', '2025-03-12 20:32:42.370077 +00:00'),
        (971, '2385', '2025-03-12 20:32:42.578040 +00:00'),
        (973, '0273', '2025-03-12 20:32:42.782268 +00:00'),
        (975, '3259', '2025-03-12 20:32:43.003689 +00:00'),
        (977, '2257', '2025-03-12 20:32:43.250156 +00:00'),
        (979, '0912', '2025-03-12 20:32:43.489566 +00:00'),
        (981, '1061', '2025-03-12 20:32:43.803450 +00:00'),
        (983, '0219', '2025-03-12 20:32:44.016177 +00:00'),
        (985, '0133', '2025-03-12 20:32:44.228979 +00:00'),
        (987, '0259', '2025-03-12 20:32:44.500060 +00:00'),
        (989, '7833', '2025-03-12 20:32:44.701276 +00:00'),
        (991, '2384', '2025-03-12 20:32:44.902962 +00:00'),
        (993, '2076', '2025-03-12 20:32:45.089975 +00:00'),
        (995, '0724', '2025-03-12 20:32:45.303242 +00:00'),
        (997, '0913', '2025-03-12 20:32:45.514632 +00:00'),
        (999, '0112', '2025-03-12 20:32:45.761199 +00:00'),
        (1001, '1475', '2025-03-12 20:32:45.970599 +00:00'),
        (1003, '2397', '2025-03-12 20:32:46.172629 +00:00'),
        (1005, '9000', '2025-03-12 20:32:46.378357 +00:00'),
        (1007, '9002', '2025-03-12 20:32:46.594276 +00:00'),
        (1009, '9004', '2025-03-12 20:32:46.785729 +00:00'),
        (1011, '9006', '2025-03-12 20:32:46.961208 +00:00'),
        (1013, '9008', '2025-03-12 20:32:47.162301 +00:00'),
        (1015, '9010', '2025-03-12 20:32:47.378930 +00:00'),
        (1017, '9012', '2025-03-12 20:32:47.570507 +00:00'),
        (1019, '9014', '2025-03-12 20:32:47.849362 +00:00'),
        (1021, '9016', '2025-03-12 20:32:48.031477 +00:00'),
        (1023, '9018', '2025-03-12 20:32:48.217414 +00:00'),
        (1025, '9020', '2025-03-12 20:32:48.422469 +00:00'),
        (1027, '9022', '2025-03-12 20:32:48.602299 +00:00'),
        (1029, '9024', '2025-03-12 20:32:48.796832 +00:00'),
        (1031, '9026', '2025-03-12 20:32:48.981874 +00:00'),
        (1641, '9660', '2025-03-12 20:33:49.124771 +00:00'),
        (1643, '9663', '2025-03-12 20:33:49.318336 +00:00'),
        (1645, '9665', '2025-03-12 20:33:49.491212 +00:00'),
        (1647, '9667', '2025-03-12 20:33:49.673744 +00:00'),
        (1649, '9669', '2025-03-12 20:33:49.889943 +00:00'),
        (1651, '9671', '2025-03-12 20:33:50.091223 +00:00'),
        (1653, '9673', '2025-03-12 20:33:50.284381 +00:00'),
        (1655, '9675', '2025-03-12 20:33:50.487172 +00:00'),
        (1657, '9677', '2025-03-12 20:33:50.696647 +00:00'),
        (1659, '9679', '2025-03-12 20:33:50.874660 +00:00'),
        (1661, '9681', '2025-03-12 20:33:51.062605 +00:00'),
        (1663, '9683', '2025-03-12 20:33:51.253597 +00:00'),
        (1665, '9685', '2025-03-12 20:33:51.474731 +00:00'),
        (1667, '9687', '2025-03-12 20:33:51.650940 +00:00'),
        (1669, '9689', '2025-03-12 20:33:51.850853 +00:00'),
        (1671, '9691', '2025-03-12 20:33:52.044807 +00:00'),
        (1673, '9693', '2025-03-12 20:33:52.301600 +00:00'),
        (1675, '9695', '2025-03-12 20:33:52.512949 +00:00'),
        (1677, '9697', '2025-03-12 20:33:52.692052 +00:00'),
        (1679, '9699', '2025-03-12 20:33:52.898740 +00:00'),
        (1681, '9701', '2025-03-12 20:33:53.112204 +00:00'),
        (1683, '9703', '2025-03-12 20:33:53.329932 +00:00'),
        (1685, '9705', '2025-03-12 20:33:53.515587 +00:00'),
        (1687, '9707', '2025-03-12 20:33:53.703501 +00:00'),
        (1689, '9709', '2025-03-12 20:33:53.899937 +00:00'),
        (1691, '9712', '2025-03-12 20:33:54.102389 +00:00'),
        (1693, '9714', '2025-03-12 20:33:54.296047 +00:00'),
        (1695, '9716', '2025-03-12 20:33:54.479933 +00:00'),
        (1697, '9718', '2025-03-12 20:33:54.676841 +00:00'),
        (1699, '9720', '2025-03-12 20:33:54.909239 +00:00'),
        (1701, '9723', '2025-03-12 20:33:55.105337 +00:00'),
        (1703, '9725', '2025-03-12 20:33:55.296670 +00:00'),
        (1705, '9727', '2025-03-12 20:33:55.482788 +00:00'),
        (1707, '9729', '2025-03-12 20:33:55.680631 +00:00'),
        (1709, '9731', '2025-03-12 20:33:55.885710 +00:00'),
        (1711, '9733', '2025-03-12 20:33:56.069495 +00:00'),
        (1713, '9735', '2025-03-12 20:33:56.272189 +00:00'),
        (1715, '9737', '2025-03-12 20:33:56.457969 +00:00'),
        (1717, '9739', '2025-03-12 20:33:56.658911 +00:00'),
        (1719, '9741', '2025-03-12 20:33:56.852054 +00:00'),
        (1721, '9743', '2025-03-12 20:33:57.050303 +00:00'),
        (1723, '9745', '2025-03-12 20:33:57.281368 +00:00'),
        (1725, '9747', '2025-03-12 20:33:57.480799 +00:00'),
        (1727, '9749', '2025-03-12 20:33:57.681900 +00:00'),
        (1729, '9751', '2025-03-12 20:33:57.905527 +00:00'),
        (1731, '9753', '2025-03-12 20:33:58.114004 +00:00'),
        (1733, '9755', '2025-03-12 20:33:58.325062 +00:00'),
        (1735, '9757', '2025-03-12 20:33:58.601701 +00:00'),
        (1737, '9759', '2025-03-12 20:33:58.808955 +00:00'),
        (1739, '9761', '2025-03-12 20:33:59.030283 +00:00'),
        (1741, '9763', '2025-03-12 20:33:59.227220 +00:00'),
        (1743, '9765', '2025-03-12 20:33:59.419313 +00:00'),
        (1745, '9767', '2025-03-12 20:33:59.610319 +00:00'),
        (1747, '9769', '2025-03-12 20:33:59.843576 +00:00'),
        (1749, '9771', '2025-03-12 20:34:00.072214 +00:00'),
        (1751, '9773', '2025-03-12 20:34:00.300635 +00:00'),
        (1753, '9775', '2025-03-12 20:34:00.518661 +00:00'),
        (1755, '9777', '2025-03-12 20:34:00.735681 +00:00'),
        (1757, '9779', '2025-03-12 20:34:00.958666 +00:00'),
        (1759, '9781', '2025-03-12 20:34:01.193941 +00:00'),
        (1761, '9783', '2025-03-12 20:34:01.408896 +00:00'),
        (1763, '9785', '2025-03-12 20:34:01.660087 +00:00'),
        (1765, '9787', '2025-03-12 20:34:01.924572 +00:00'),
        (1767, '9789', '2025-03-12 20:34:02.122012 +00:00'),
        (1769, '9791', '2025-03-12 20:34:02.345154 +00:00'),
        (1771, '9793', '2025-03-12 20:34:02.538772 +00:00'),
        (1773, '9795', '2025-03-12 20:34:02.823159 +00:00'),
        (1775, '9797', '2025-03-12 20:34:03.017141 +00:00'),
        (1777, '9799', '2025-03-12 20:34:03.203541 +00:00'),
        (1779, '9801', '2025-03-12 20:34:03.418831 +00:00'),
        (1781, '9803', '2025-03-12 20:34:03.607450 +00:00'),
        (1783, '9805', '2025-03-12 20:34:03.791820 +00:00'),
        (1785, '9807', '2025-03-12 20:34:04.000421 +00:00'),
        (1787, '9809', '2025-03-12 20:34:04.229237 +00:00'),
        (1789, '9811', '2025-03-12 20:34:04.433787 +00:00'),
        (1791, '9813', '2025-03-12 20:34:04.632042 +00:00'),
        (1793, '9815', '2025-03-12 20:34:04.816756 +00:00'),
        (1795, '9817', '2025-03-12 20:34:05.020393 +00:00'),
        (1797, '9819', '2025-03-12 20:34:05.227055 +00:00'),
        (1799, '9821', '2025-03-12 20:34:05.417329 +00:00'),
        (1801, '9823', '2025-03-12 20:34:05.603497 +00:00'),
        (1803, '9825', '2025-03-12 20:34:05.806162 +00:00'),
        (1805, '9827', '2025-03-12 20:34:06.047413 +00:00'),
        (1807, '9829', '2025-03-12 20:34:06.283985 +00:00'),
        (1809, '9831', '2025-03-12 20:34:06.483321 +00:00'),
        (1811, '9833', '2025-03-12 20:34:06.681230 +00:00'),
        (1813, '9835', '2025-03-12 20:34:06.865716 +00:00'),
        (1815, '9837', '2025-03-12 20:34:07.070814 +00:00'),
        (1817, '9839', '2025-03-12 20:34:07.261220 +00:00'),
        (1819, '9841', '2025-03-12 20:34:07.458432 +00:00'),
        (1821, '9843', '2025-03-12 20:34:07.685483 +00:00'),
        (1823, '9845', '2025-03-12 20:34:07.883957 +00:00'),
        (1825, '9847', '2025-03-12 20:34:08.088347 +00:00'),
        (1827, '9849', '2025-03-12 20:34:08.285749 +00:00'),
        (1829, '9851', '2025-03-12 20:34:08.483445 +00:00'),
        (1831, '9853', '2025-03-12 20:34:08.668801 +00:00'),
        (1833, '9855', '2025-03-12 20:34:08.860254 +00:00'),
        (1835, '9857', '2025-03-12 20:34:09.079201 +00:00'),
        (1837, '9859', '2025-03-12 20:34:09.301729 +00:00'),
        (1839, '9861', '2025-03-12 20:34:09.521813 +00:00'),
        (1841, '9863', '2025-03-12 20:34:09.730636 +00:00'),
        (1843, '9865', '2025-03-12 20:34:09.971701 +00:00'),
        (1845, '9867', '2025-03-12 20:34:10.218580 +00:00'),
        (1847, '9869', '2025-03-12 20:34:10.431311 +00:00'),
        (1849, '9871', '2025-03-12 20:34:10.649765 +00:00'),
        (1851, '9873', '2025-03-12 20:34:10.882859 +00:00'),
        (1853, '9875', '2025-03-12 20:34:11.097826 +00:00'),
        (1855, '9877', '2025-03-12 20:34:11.304141 +00:00'),
        (1857, '9879', '2025-03-12 20:34:11.528783 +00:00'),
        (1859, '9881', '2025-03-12 20:34:11.740775 +00:00'),
        (1861, '9883', '2025-03-12 20:34:11.976801 +00:00'),
        (1863, '9885', '2025-03-12 20:34:12.176166 +00:00'),
        (944, '3547', '2025-03-12 20:32:39.718994 +00:00'),
        (946, '1031', '2025-03-12 20:32:39.938054 +00:00'),
        (948, '0179', '2025-03-12 20:32:40.188599 +00:00'),
        (950, '0171', '2025-03-12 20:32:40.429180 +00:00'),
        (952, '0722', '2025-03-12 20:32:40.620209 +00:00'),
        (954, '2262', '2025-03-12 20:32:40.820122 +00:00'),
        (956, '1474', '2025-03-12 20:32:41.023547 +00:00'),
        (958, '6019', '2025-03-12 20:32:41.212117 +00:00'),
        (960, '7631', '2025-03-12 20:32:41.420930 +00:00'),
        (962, '0116', '2025-03-12 20:32:41.645433 +00:00'),
        (964, '2342', '2025-03-12 20:32:41.852762 +00:00'),
        (966, '2259', '2025-03-12 20:32:42.053204 +00:00'),
        (968, '2386', '2025-03-12 20:32:42.252220 +00:00'),
        (970, '2429', '2025-03-12 20:32:42.467774 +00:00'),
        (972, '2282', '2025-03-12 20:32:42.680032 +00:00'),
        (974, '2141', '2025-03-12 20:32:42.900886 +00:00'),
        (976, '2083', '2025-03-12 20:32:43.121317 +00:00'),
        (978, '1044', '2025-03-12 20:32:43.357250 +00:00'),
        (980, '3263', '2025-03-12 20:32:43.600734 +00:00'),
        (982, '2322', '2025-03-12 20:32:43.898695 +00:00'),
        (984, '3151', '2025-03-12 20:32:44.141324 +00:00'),
        (986, '2517', '2025-03-12 20:32:44.365846 +00:00'),
        (988, '7251', '2025-03-12 20:32:44.603918 +00:00'),
        (990, '2387', '2025-03-12 20:32:44.807718 +00:00'),
        (992, '3262', '2025-03-12 20:32:44.998890 +00:00'),
        (994, '0253', '2025-03-12 20:32:45.185423 +00:00'),
        (996, '0919', '2025-03-12 20:32:45.399763 +00:00'),
        (998, '0271', '2025-03-12 20:32:45.621649 +00:00'),
        (1000, '0214', '2025-03-12 20:32:45.869445 +00:00'),
        (1002, '2371', '2025-03-12 20:32:46.064498 +00:00'),
        (1004, '6517', '2025-03-12 20:32:46.264527 +00:00'),
        (1006, '9001', '2025-03-12 20:32:46.490359 +00:00'),
        (1008, '9003', '2025-03-12 20:32:46.696159 +00:00'),
        (1010, '9005', '2025-03-12 20:32:46.875031 +00:00'),
        (1012, '9007', '2025-03-12 20:32:47.059847 +00:00'),
        (1014, '9009', '2025-03-12 20:32:47.280459 +00:00'),
        (1016, '9011', '2025-03-12 20:32:47.469711 +00:00'),
        (1018, '9013', '2025-03-12 20:32:47.666308 +00:00'),
        (1020, '9015', '2025-03-12 20:32:47.945272 +00:00'),
        (1022, '9017', '2025-03-12 20:32:48.124701 +00:00'),
        (1024, '9019', '2025-03-12 20:32:48.309611 +00:00'),
        (1026, '9021', '2025-03-12 20:32:48.511800 +00:00'),
        (1028, '9023', '2025-03-12 20:32:48.697533 +00:00'),
        (1030, '9025', '2025-03-12 20:32:48.889299 +00:00'),
        (1032, '9027', '2025-03-12 20:32:49.087140 +00:00'),
        (1033, '9028', '2025-03-12 20:32:49.203481 +00:00'),
        (1034, '9029', '2025-03-12 20:32:49.315285 +00:00'),
        (1035, '9030', '2025-03-12 20:32:49.413721 +00:00'),
        (1036, '9031', '2025-03-12 20:32:49.500931 +00:00'),
        (1037, '9032', '2025-03-12 20:32:49.601465 +00:00'),
        (1038, '9033', '2025-03-12 20:32:49.690562 +00:00'),
        (1039, '9034', '2025-03-12 20:32:49.792785 +00:00'),
        (1040, '9035', '2025-03-12 20:32:49.902582 +00:00'),
        (1041, '9036', '2025-03-12 20:32:49.985788 +00:00'),
        (1042, '9037', '2025-03-12 20:32:50.114004 +00:00'),
        (1043, '9038', '2025-03-12 20:32:50.220978 +00:00'),
        (1044, '9039', '2025-03-12 20:32:50.306601 +00:00'),
        (1045, '9040', '2025-03-12 20:32:50.398645 +00:00'),
        (1046, '9041', '2025-03-12 20:32:50.480976 +00:00'),
        (1047, '9042', '2025-03-12 20:32:50.584320 +00:00'),
        (1048, '9043', '2025-03-12 20:32:50.674988 +00:00'),
        (1049, '9044', '2025-03-12 20:32:50.770928 +00:00'),
        (1050, '9045', '2025-03-12 20:32:50.863633 +00:00'),
        (1051, '9046', '2025-03-12 20:32:50.968748 +00:00'),
        (1052, '9047', '2025-03-12 20:32:51.081281 +00:00'),
        (1053, '9048', '2025-03-12 20:32:51.182825 +00:00'),
        (1054, '9049', '2025-03-12 20:32:51.274650 +00:00'),
        (1055, '9050', '2025-03-12 20:32:51.360700 +00:00'),
        (1056, '9051', '2025-03-12 20:32:51.454956 +00:00'),
        (1057, '9052', '2025-03-12 20:32:51.551489 +00:00'),
        (1058, '9053', '2025-03-12 20:32:51.647796 +00:00'),
        (1059, '9054', '2025-03-12 20:32:51.742776 +00:00'),
        (1060, '9055', '2025-03-12 20:32:51.849984 +00:00'),
        (1061, '9056', '2025-03-12 20:32:51.979327 +00:00'),
        (1062, '9057', '2025-03-12 20:32:52.068581 +00:00'),
        (1063, '9058', '2025-03-12 20:32:52.152470 +00:00'),
        (1064, '9059', '2025-03-12 20:32:52.254874 +00:00'),
        (1065, '9060', '2025-03-12 20:32:52.360568 +00:00'),
        (1066, '9061', '2025-03-12 20:32:52.459483 +00:00'),
        (1067, '9062', '2025-03-12 20:32:52.555439 +00:00'),
        (1068, '9063', '2025-03-12 20:32:52.657730 +00:00'),
        (1069, '9064', '2025-03-12 20:32:52.746323 +00:00'),
        (1070, '9065', '2025-03-12 20:32:52.840944 +00:00'),
        (1071, '9066', '2025-03-12 20:32:52.941390 +00:00'),
        (1072, '9067', '2025-03-12 20:32:53.050370 +00:00'),
        (1073, '9068', '2025-03-12 20:32:53.154189 +00:00'),
        (1074, '9069', '2025-03-12 20:32:53.254485 +00:00'),
        (1075, '9070', '2025-03-12 20:32:53.377050 +00:00'),
        (1076, '9071', '2025-03-12 20:32:53.477349 +00:00'),
        (1077, '9072', '2025-03-12 20:32:53.577195 +00:00'),
        (1078, '9073', '2025-03-12 20:32:53.675880 +00:00'),
        (1079, '9074', '2025-03-12 20:32:53.773418 +00:00'),
        (1080, '9075', '2025-03-12 20:32:53.882754 +00:00'),
        (1081, '9076', '2025-03-12 20:32:53.997883 +00:00'),
        (1082, '9077', '2025-03-12 20:32:54.082540 +00:00'),
        (1083, '9078', '2025-03-12 20:32:54.176936 +00:00'),
        (1084, '9079', '2025-03-12 20:32:54.285342 +00:00'),
        (1085, '9080', '2025-03-12 20:32:54.381267 +00:00'),
        (1086, '9081', '2025-03-12 20:32:54.471005 +00:00'),
        (1087, '9082', '2025-03-12 20:32:54.555174 +00:00'),
        (1088, '9083', '2025-03-12 20:32:54.639831 +00:00'),
        (1089, '9084', '2025-03-12 20:32:54.733332 +00:00'),
        (1090, '9085', '2025-03-12 20:32:54.813994 +00:00'),
        (1091, '9086', '2025-03-12 20:32:54.910392 +00:00'),
        (1092, '9087', '2025-03-12 20:32:54.999716 +00:00'),
        (1093, '9088', '2025-03-12 20:32:55.094788 +00:00'),
        (1094, '9089', '2025-03-12 20:32:55.195919 +00:00'),
        (1095, '9090', '2025-03-12 20:32:55.287997 +00:00'),
        (1096, '9091', '2025-03-12 20:32:55.406831 +00:00'),
        (1097, '9092', '2025-03-12 20:32:55.516058 +00:00'),
        (1098, '9093', '2025-03-12 20:32:55.618002 +00:00'),
        (1099, '9094', '2025-03-12 20:32:55.706386 +00:00'),
        (1100, '9095', '2025-03-12 20:32:55.794680 +00:00'),
        (1101, '9096', '2025-03-12 20:32:55.889159 +00:00'),
        (1102, '9097', '2025-03-12 20:32:55.981076 +00:00'),
        (1103, '9098', '2025-03-12 20:32:56.068012 +00:00'),
        (1104, '9099', '2025-03-12 20:32:56.185493 +00:00'),
        (1105, '9100', '2025-03-12 20:32:56.275378 +00:00'),
        (1106, '9101', '2025-03-12 20:32:56.383175 +00:00'),
        (1107, '9102', '2025-03-12 20:32:56.476978 +00:00'),
        (1108, '9103', '2025-03-12 20:32:56.568081 +00:00'),
        (1109, '9104', '2025-03-12 20:32:56.652164 +00:00'),
        (1110, '9105', '2025-03-12 20:32:56.758463 +00:00'),
        (1111, '9106', '2025-03-12 20:32:56.850190 +00:00'),
        (1112, '9107', '2025-03-12 20:32:56.939659 +00:00'),
        (1113, '9108', '2025-03-12 20:32:57.029279 +00:00'),
        (1114, '9109', '2025-03-12 20:32:57.127030 +00:00'),
        (1115, '9110', '2025-03-12 20:32:57.211255 +00:00'),
        (1116, '9112', '2025-03-12 20:32:57.328001 +00:00'),
        (1117, '9113', '2025-03-12 20:32:57.420105 +00:00'),
        (1118, '9114', '2025-03-12 20:32:57.536689 +00:00'),
        (1119, '9115', '2025-03-12 20:32:57.641338 +00:00'),
        (1120, '9116', '2025-03-12 20:32:57.737685 +00:00'),
        (1121, '9117', '2025-03-12 20:32:57.836958 +00:00'),
        (1122, '9118', '2025-03-12 20:32:57.923314 +00:00'),
        (1123, '9119', '2025-03-12 20:32:58.039290 +00:00'),
        (1124, '9120', '2025-03-12 20:32:58.153131 +00:00'),
        (1125, '9122', '2025-03-12 20:32:58.238509 +00:00'),
        (1126, '9123', '2025-03-12 20:32:58.331920 +00:00'),
        (1127, '9124', '2025-03-12 20:32:58.420529 +00:00'),
        (1128, '9125', '2025-03-12 20:32:58.529414 +00:00'),
        (1129, '9126', '2025-03-12 20:32:58.637778 +00:00'),
        (1130, '9127', '2025-03-12 20:32:58.724377 +00:00'),
        (1131, '9128', '2025-03-12 20:32:58.818377 +00:00'),
        (1132, '9129', '2025-03-12 20:32:58.908349 +00:00'),
        (1133, '9130', '2025-03-12 20:32:59.003461 +00:00'),
        (1134, '9132', '2025-03-12 20:32:59.086724 +00:00'),
        (1135, '9133', '2025-03-12 20:32:59.193637 +00:00'),
        (1136, '9134', '2025-03-12 20:32:59.286820 +00:00'),
        (1137, '9135', '2025-03-12 20:32:59.380886 +00:00'),
        (1138, '9136', '2025-03-12 20:32:59.463268 +00:00'),
        (1139, '9137', '2025-03-12 20:32:59.561054 +00:00'),
        (1140, '9138', '2025-03-12 20:32:59.664529 +00:00'),
        (1141, '9139', '2025-03-12 20:32:59.761764 +00:00'),
        (1142, '9140', '2025-03-12 20:32:59.850466 +00:00'),
        (1143, '9141', '2025-03-12 20:32:59.939330 +00:00'),
        (1144, '9142', '2025-03-12 20:33:00.025931 +00:00'),
        (1145, '9143', '2025-03-12 20:33:00.131322 +00:00'),
        (1147, '9145', '2025-03-12 20:33:00.369556 +00:00'),
        (1149, '9147', '2025-03-12 20:33:00.551437 +00:00'),
        (1151, '9149', '2025-03-12 20:33:00.725817 +00:00'),
        (1153, '9151', '2025-03-12 20:33:00.920986 +00:00'),
        (1155, '9153', '2025-03-12 20:33:01.105365 +00:00'),
        (1157, '9155', '2025-03-12 20:33:01.293313 +00:00'),
        (1159, '9157', '2025-03-12 20:33:01.513226 +00:00'),
        (1161, '9159', '2025-03-12 20:33:01.708419 +00:00'),
        (1163, '9161', '2025-03-12 20:33:01.902418 +00:00'),
        (1165, '9163', '2025-03-12 20:33:02.116789 +00:00'),
        (1167, '9165', '2025-03-12 20:33:02.300736 +00:00'),
        (1169, '9167', '2025-03-12 20:33:02.491945 +00:00'),
        (1171, '9169', '2025-03-12 20:33:02.705389 +00:00'),
        (1173, '9171', '2025-03-12 20:33:02.908310 +00:00'),
        (1175, '9173', '2025-03-12 20:33:03.089596 +00:00'),
        (1177, '9175', '2025-03-12 20:33:03.283783 +00:00'),
        (1179, '9177', '2025-03-12 20:33:03.500507 +00:00'),
        (1181, '9179', '2025-03-12 20:33:03.692353 +00:00'),
        (1183, '9181', '2025-03-12 20:33:03.865455 +00:00'),
        (1185, '9183', '2025-03-12 20:33:04.053225 +00:00'),
        (1187, '9185', '2025-03-12 20:33:04.224730 +00:00'),
        (1189, '9187', '2025-03-12 20:33:04.411216 +00:00'),
        (1191, '9189', '2025-03-12 20:33:04.637913 +00:00'),
        (1193, '9191', '2025-03-12 20:33:04.831927 +00:00'),
        (1195, '9193', '2025-03-12 20:33:05.024223 +00:00'),
        (1197, '9195', '2025-03-12 20:33:05.203277 +00:00'),
        (1199, '9197', '2025-03-12 20:33:05.413931 +00:00'),
        (1201, '9200', '2025-03-12 20:33:05.583531 +00:00'),
        (1203, '9202', '2025-03-12 20:33:05.773016 +00:00'),
        (1205, '9204', '2025-03-12 20:33:05.967436 +00:00'),
        (1207, '9206', '2025-03-12 20:33:06.151620 +00:00'),
        (1209, '9208', '2025-03-12 20:33:06.333031 +00:00'),
        (1211, '9210', '2025-03-12 20:33:06.553670 +00:00'),
        (1213, '9213', '2025-03-12 20:33:06.860975 +00:00'),
        (1215, '9215', '2025-03-12 20:33:07.043402 +00:00'),
        (1217, '9217', '2025-03-12 20:33:07.231042 +00:00'),
        (1219, '9219', '2025-03-12 20:33:07.447383 +00:00'),
        (1221, '9225', '2025-03-12 20:33:07.656438 +00:00'),
        (1223, '9227', '2025-03-12 20:33:07.843050 +00:00'),
        (1225, '9230', '2025-03-12 20:33:08.011261 +00:00'),
        (1227, '9232', '2025-03-12 20:33:08.232220 +00:00'),
        (1229, '9234', '2025-03-12 20:33:08.437228 +00:00'),
        (1231, '9236', '2025-03-12 20:33:08.613433 +00:00'),
        (1233, '9238', '2025-03-12 20:33:08.792078 +00:00'),
        (1235, '9240', '2025-03-12 20:33:08.976370 +00:00'),
        (1237, '9242', '2025-03-12 20:33:09.164295 +00:00'),
        (1239, '9244', '2025-03-12 20:33:09.345688 +00:00'),
        (1241, '9246', '2025-03-12 20:33:09.537798 +00:00'),
        (1243, '9248', '2025-03-12 20:33:09.725703 +00:00'),
        (1245, '9250', '2025-03-12 20:33:09.929025 +00:00'),
        (1247, '9252', '2025-03-12 20:33:10.162747 +00:00'),
        (1249, '9254', '2025-03-12 20:33:10.343855 +00:00'),
        (1251, '9256', '2025-03-12 20:33:10.555067 +00:00'),
        (1253, '9258', '2025-03-12 20:33:10.767673 +00:00'),
        (1255, '9260', '2025-03-12 20:33:10.967019 +00:00'),
        (1257, '9262', '2025-03-12 20:33:11.174040 +00:00'),
        (1259, '9264', '2025-03-12 20:33:11.425845 +00:00'),
        (1261, '9266', '2025-03-12 20:33:11.621385 +00:00'),
        (1263, '9268', '2025-03-12 20:33:11.797451 +00:00'),
        (1265, '9270', '2025-03-12 20:33:11.952649 +00:00'),
        (1267, '9272', '2025-03-12 20:33:12.147504 +00:00'),
        (1269, '9274', '2025-03-12 20:33:12.321184 +00:00'),
        (1271, '9276', '2025-03-12 20:33:12.497313 +00:00'),
        (1273, '9278', '2025-03-12 20:33:12.665347 +00:00'),
        (1275, '9280', '2025-03-12 20:33:12.854836 +00:00'),
        (1277, '9282', '2025-03-12 20:33:13.047772 +00:00'),
        (1279, '9284', '2025-03-12 20:33:13.230654 +00:00'),
        (1281, '9286', '2025-03-12 20:33:13.415883 +00:00'),
        (1283, '9288', '2025-03-12 20:33:13.590639 +00:00'),
        (1285, '9290', '2025-03-12 20:33:13.810268 +00:00'),
        (1287, '9292', '2025-03-12 20:33:13.999365 +00:00'),
        (1289, '9294', '2025-03-12 20:33:14.176746 +00:00'),
        (1291, '9296', '2025-03-12 20:33:14.365179 +00:00'),
        (1293, '9298', '2025-03-12 20:33:14.555153 +00:00'),
        (1295, '9300', '2025-03-12 20:33:14.765475 +00:00'),
        (1297, '9302', '2025-03-12 20:33:14.958036 +00:00'),
        (1299, '9304', '2025-03-12 20:33:15.127353 +00:00'),
        (1301, '9306', '2025-03-12 20:33:15.304211 +00:00'),
        (1303, '9308', '2025-03-12 20:33:15.490923 +00:00'),
        (1305, '9310', '2025-03-12 20:33:15.701206 +00:00'),
        (1307, '9313', '2025-03-12 20:33:15.894668 +00:00'),
        (1309, '9315', '2025-03-12 20:33:16.102387 +00:00'),
        (1311, '9317', '2025-03-12 20:33:16.306761 +00:00'),
        (1313, '9319', '2025-03-12 20:33:16.507346 +00:00'),
        (1315, '9321', '2025-03-12 20:33:16.690423 +00:00'),
        (1317, '9323', '2025-03-12 20:33:16.925668 +00:00'),
        (1319, '9325', '2025-03-12 20:33:17.119387 +00:00'),
        (1321, '9327', '2025-03-12 20:33:17.296284 +00:00'),
        (1323, '9329', '2025-03-12 20:33:17.485271 +00:00'),
        (1325, '9331', '2025-03-12 20:33:17.656020 +00:00'),
        (1327, '9333', '2025-03-12 20:33:17.842834 +00:00'),
        (1329, '9335', '2025-03-12 20:33:18.026236 +00:00'),
        (1331, '9337', '2025-03-12 20:33:18.198793 +00:00'),
        (1333, '9339', '2025-03-12 20:33:18.394983 +00:00'),
        (1335, '9341', '2025-03-12 20:33:18.576240 +00:00'),
        (1337, '9343', '2025-03-12 20:33:18.760095 +00:00'),
        (1339, '9345', '2025-03-12 20:33:18.943927 +00:00'),
        (1341, '9347', '2025-03-12 20:33:19.170316 +00:00'),
        (1343, '9349', '2025-03-12 20:33:19.379355 +00:00'),
        (1345, '9351', '2025-03-12 20:33:19.558660 +00:00'),
        (1347, '9353', '2025-03-12 20:33:19.754198 +00:00'),
        (1349, '9355', '2025-03-12 20:33:19.937535 +00:00'),
        (1351, '9357', '2025-03-12 20:33:20.113661 +00:00'),
        (1353, '9359', '2025-03-12 20:33:20.312062 +00:00'),
        (1355, '9361', '2025-03-12 20:33:20.489725 +00:00'),
        (1357, '9363', '2025-03-12 20:33:20.667401 +00:00'),
        (1359, '9365', '2025-03-12 20:33:20.898415 +00:00'),
        (1361, '9367', '2025-03-12 20:33:21.080210 +00:00'),
        (1363, '9369', '2025-03-12 20:33:21.280174 +00:00'),
        (1365, '9371', '2025-03-12 20:33:21.476918 +00:00'),
        (1367, '9373', '2025-03-12 20:33:21.674332 +00:00'),
        (1369, '9375', '2025-03-12 20:33:21.862164 +00:00'),
        (1371, '9377', '2025-03-12 20:33:22.035256 +00:00'),
        (1373, '9379', '2025-03-12 20:33:22.219664 +00:00'),
        (1375, '9381', '2025-03-12 20:33:22.397643 +00:00'),
        (1377, '9383', '2025-03-12 20:33:22.578464 +00:00'),
        (1379, '9385', '2025-03-12 20:33:22.788963 +00:00'),
        (1381, '9387', '2025-03-12 20:33:22.976321 +00:00'),
        (1383, '9389', '2025-03-12 20:33:23.154820 +00:00'),
        (1385, '9391', '2025-03-12 20:33:23.318949 +00:00'),
        (1387, '9393', '2025-03-12 20:33:23.559468 +00:00'),
        (1389, '9395', '2025-03-12 20:33:23.740362 +00:00'),
        (1391, '9397', '2025-03-12 20:33:23.934969 +00:00'),
        (1393, '9399', '2025-03-12 20:33:24.127132 +00:00'),
        (1395, '9401', '2025-03-12 20:33:24.345331 +00:00'),
        (1397, '9403', '2025-03-12 20:33:24.576820 +00:00'),
        (1399, '9405', '2025-03-12 20:33:24.781859 +00:00'),
        (1401, '9407', '2025-03-12 20:33:24.987505 +00:00'),
        (1403, '9409', '2025-03-12 20:33:25.163167 +00:00'),
        (1405, '9412', '2025-03-12 20:33:25.378529 +00:00'),
        (1407, '9414', '2025-03-12 20:33:25.578826 +00:00'),
        (1409, '9416', '2025-03-12 20:33:25.810046 +00:00'),
        (1411, '9418', '2025-03-12 20:33:26.015923 +00:00'),
        (1413, '9420', '2025-03-12 20:33:26.194451 +00:00'),
        (1415, '9422', '2025-03-12 20:33:26.427406 +00:00'),
        (1417, '9424', '2025-03-12 20:33:26.624202 +00:00'),
        (1419, '9426', '2025-03-12 20:33:26.825303 +00:00'),
        (1421, '9428', '2025-03-12 20:33:27.055596 +00:00'),
        (1423, '9430', '2025-03-12 20:33:27.245854 +00:00'),
        (1425, '9433', '2025-03-12 20:33:27.468649 +00:00'),
        (1427, '9435', '2025-03-12 20:33:27.669018 +00:00'),
        (1429, '9437', '2025-03-12 20:33:27.887601 +00:00'),
        (1431, '9439', '2025-03-12 20:33:28.092851 +00:00'),
        (1433, '9442', '2025-03-12 20:33:28.295512 +00:00'),
        (1435, '9444', '2025-03-12 20:33:28.535346 +00:00'),
        (1437, '9446', '2025-03-12 20:33:28.733252 +00:00'),
        (1439, '9448', '2025-03-12 20:33:28.956604 +00:00'),
        (1441, '9450', '2025-03-12 20:33:29.168905 +00:00'),
        (1443, '9453', '2025-03-12 20:33:29.384142 +00:00'),
        (1445, '9455', '2025-03-12 20:33:29.617919 +00:00'),
        (1447, '9457', '2025-03-12 20:33:29.834271 +00:00'),
        (1449, '9459', '2025-03-12 20:33:30.017171 +00:00'),
        (1451, '9461', '2025-03-12 20:33:30.222711 +00:00'),
        (1453, '9463', '2025-03-12 20:33:30.428890 +00:00'),
        (1455, '9465', '2025-03-12 20:33:30.644839 +00:00'),
        (1457, '9467', '2025-03-12 20:33:30.832639 +00:00'),
        (1146, '9144', '2025-03-12 20:33:00.237908 +00:00'),
        (1148, '9146', '2025-03-12 20:33:00.464797 +00:00'),
        (1150, '9148', '2025-03-12 20:33:00.633090 +00:00'),
        (1152, '9150', '2025-03-12 20:33:00.820471 +00:00'),
        (1154, '9152', '2025-03-12 20:33:01.010440 +00:00'),
        (1156, '9154', '2025-03-12 20:33:01.207312 +00:00'),
        (1158, '9156', '2025-03-12 20:33:01.393001 +00:00'),
        (1160, '9158', '2025-03-12 20:33:01.605011 +00:00'),
        (1162, '9160', '2025-03-12 20:33:01.814822 +00:00'),
        (1164, '9162', '2025-03-12 20:33:01.997306 +00:00'),
        (1166, '9164', '2025-03-12 20:33:02.212858 +00:00'),
        (1168, '9166', '2025-03-12 20:33:02.393416 +00:00'),
        (1170, '9168', '2025-03-12 20:33:02.601084 +00:00'),
        (1172, '9170', '2025-03-12 20:33:02.811030 +00:00'),
        (1174, '9172', '2025-03-12 20:33:02.993138 +00:00'),
        (1176, '9174', '2025-03-12 20:33:03.186065 +00:00'),
        (1178, '9176', '2025-03-12 20:33:03.394474 +00:00'),
        (1180, '9178', '2025-03-12 20:33:03.590935 +00:00'),
        (1182, '9180', '2025-03-12 20:33:03.779328 +00:00'),
        (1184, '9182', '2025-03-12 20:33:03.962202 +00:00'),
        (1186, '9184', '2025-03-12 20:33:04.145434 +00:00'),
        (1188, '9186', '2025-03-12 20:33:04.314139 +00:00'),
        (1190, '9188', '2025-03-12 20:33:04.509294 +00:00'),
        (1192, '9190', '2025-03-12 20:33:04.726322 +00:00'),
        (1194, '9192', '2025-03-12 20:33:04.939009 +00:00'),
        (1196, '9194', '2025-03-12 20:33:05.106487 +00:00'),
        (1198, '9196', '2025-03-12 20:33:05.303253 +00:00'),
        (1200, '9198', '2025-03-12 20:33:05.496418 +00:00'),
        (1202, '9201', '2025-03-12 20:33:05.676727 +00:00'),
        (1204, '9203', '2025-03-12 20:33:05.864503 +00:00'),
        (1206, '9205', '2025-03-12 20:33:06.065849 +00:00'),
        (1208, '9207', '2025-03-12 20:33:06.238519 +00:00'),
        (1210, '9209', '2025-03-12 20:33:06.439300 +00:00'),
        (1212, '9212', '2025-03-12 20:33:06.780204 +00:00'),
        (1214, '9214', '2025-03-12 20:33:06.945193 +00:00'),
        (1216, '9216', '2025-03-12 20:33:07.138333 +00:00'),
        (1218, '9218', '2025-03-12 20:33:07.331460 +00:00'),
        (1220, '9220', '2025-03-12 20:33:07.564937 +00:00'),
        (1222, '9226', '2025-03-12 20:33:07.745230 +00:00'),
        (1224, '9228', '2025-03-12 20:33:07.921057 +00:00'),
        (1226, '9231', '2025-03-12 20:33:08.123838 +00:00'),
        (1228, '9233', '2025-03-12 20:33:08.328043 +00:00'),
        (1230, '9235', '2025-03-12 20:33:08.528692 +00:00'),
        (1232, '9237', '2025-03-12 20:33:08.705234 +00:00'),
        (1234, '9239', '2025-03-12 20:33:08.895857 +00:00'),
        (1236, '9241', '2025-03-12 20:33:09.067386 +00:00'),
        (1238, '9243', '2025-03-12 20:33:09.259328 +00:00'),
        (1240, '9245', '2025-03-12 20:33:09.440280 +00:00'),
        (1242, '9247', '2025-03-12 20:33:09.630786 +00:00'),
        (1244, '9249', '2025-03-12 20:33:09.819195 +00:00'),
        (1246, '9251', '2025-03-12 20:33:10.056068 +00:00'),
        (1248, '9253', '2025-03-12 20:33:10.252687 +00:00'),
        (1250, '9255', '2025-03-12 20:33:10.460595 +00:00'),
        (1252, '9257', '2025-03-12 20:33:10.668581 +00:00'),
        (1254, '9259', '2025-03-12 20:33:10.867749 +00:00'),
        (1256, '9261', '2025-03-12 20:33:11.075423 +00:00'),
        (1258, '9263', '2025-03-12 20:33:11.304887 +00:00'),
        (1260, '9265', '2025-03-12 20:33:11.514157 +00:00'),
        (1262, '9267', '2025-03-12 20:33:11.709047 +00:00'),
        (1264, '9269', '2025-03-12 20:33:11.874074 +00:00'),
        (1266, '9271', '2025-03-12 20:33:12.053032 +00:00'),
        (1268, '9273', '2025-03-12 20:33:12.232681 +00:00'),
        (1270, '9275', '2025-03-12 20:33:12.405319 +00:00'),
        (1272, '9277', '2025-03-12 20:33:12.581782 +00:00'),
        (1274, '9279', '2025-03-12 20:33:12.763260 +00:00'),
        (1276, '9281', '2025-03-12 20:33:12.945328 +00:00'),
        (1278, '9283', '2025-03-12 20:33:13.131497 +00:00'),
        (1280, '9285', '2025-03-12 20:33:13.322907 +00:00'),
        (1282, '9287', '2025-03-12 20:33:13.504115 +00:00'),
        (1284, '9289', '2025-03-12 20:33:13.692233 +00:00'),
        (1286, '9291', '2025-03-12 20:33:13.892209 +00:00'),
        (1288, '9293', '2025-03-12 20:33:14.082380 +00:00'),
        (1290, '9295', '2025-03-12 20:33:14.270905 +00:00'),
        (1292, '9297', '2025-03-12 20:33:14.465896 +00:00'),
        (1294, '9299', '2025-03-12 20:33:14.666376 +00:00'),
        (1296, '9301', '2025-03-12 20:33:14.867473 +00:00'),
        (1298, '9303', '2025-03-12 20:33:15.039983 +00:00'),
        (1300, '9305', '2025-03-12 20:33:15.213528 +00:00'),
        (1302, '9307', '2025-03-12 20:33:15.404932 +00:00'),
        (1304, '9309', '2025-03-12 20:33:15.580056 +00:00'),
        (1306, '9312', '2025-03-12 20:33:15.805042 +00:00'),
        (1308, '9314', '2025-03-12 20:33:15.987771 +00:00'),
        (1310, '9316', '2025-03-12 20:33:16.186911 +00:00'),
        (1312, '9318', '2025-03-12 20:33:16.415418 +00:00'),
        (1314, '9320', '2025-03-12 20:33:16.599093 +00:00'),
        (1316, '9322', '2025-03-12 20:33:16.794755 +00:00'),
        (1318, '9324', '2025-03-12 20:33:17.030581 +00:00'),
        (1320, '9326', '2025-03-12 20:33:17.208514 +00:00'),
        (1322, '9328', '2025-03-12 20:33:17.380284 +00:00'),
        (1324, '9330', '2025-03-12 20:33:17.565121 +00:00'),
        (1326, '9332', '2025-03-12 20:33:17.736600 +00:00'),
        (1328, '9334', '2025-03-12 20:33:17.930137 +00:00'),
        (1330, '9336', '2025-03-12 20:33:18.108853 +00:00'),
        (1332, '9338', '2025-03-12 20:33:18.303596 +00:00'),
        (1334, '9340', '2025-03-12 20:33:18.484019 +00:00'),
        (1336, '9342', '2025-03-12 20:33:18.669012 +00:00'),
        (1338, '9344', '2025-03-12 20:33:18.854018 +00:00'),
        (1340, '9346', '2025-03-12 20:33:19.069764 +00:00'),
        (1342, '9348', '2025-03-12 20:33:19.276998 +00:00'),
        (1344, '9350', '2025-03-12 20:33:19.468283 +00:00'),
        (1346, '9352', '2025-03-12 20:33:19.663971 +00:00'),
        (1348, '9354', '2025-03-12 20:33:19.839568 +00:00'),
        (1350, '9356', '2025-03-12 20:33:20.023050 +00:00'),
        (1352, '9358', '2025-03-12 20:33:20.220420 +00:00'),
        (1354, '9360', '2025-03-12 20:33:20.404329 +00:00'),
        (1356, '9362', '2025-03-12 20:33:20.577569 +00:00'),
        (1358, '9364', '2025-03-12 20:33:20.807959 +00:00'),
        (1360, '9366', '2025-03-12 20:33:20.985939 +00:00'),
        (1362, '9368', '2025-03-12 20:33:21.191826 +00:00'),
        (1364, '9370', '2025-03-12 20:33:21.385240 +00:00'),
        (1366, '9372', '2025-03-12 20:33:21.589300 +00:00'),
        (1368, '9374', '2025-03-12 20:33:21.769487 +00:00'),
        (1370, '9376', '2025-03-12 20:33:21.948601 +00:00'),
        (1372, '9378', '2025-03-12 20:33:22.138540 +00:00'),
        (1374, '9380', '2025-03-12 20:33:22.306633 +00:00'),
        (1376, '9382', '2025-03-12 20:33:22.492319 +00:00'),
        (1378, '9384', '2025-03-12 20:33:22.679157 +00:00'),
        (1380, '9386', '2025-03-12 20:33:22.886614 +00:00'),
        (1382, '9388', '2025-03-12 20:33:23.059493 +00:00'),
        (1384, '9390', '2025-03-12 20:33:23.238034 +00:00'),
        (1386, '9392', '2025-03-12 20:33:23.466033 +00:00'),
        (1388, '9394', '2025-03-12 20:33:23.647002 +00:00'),
        (1390, '9396', '2025-03-12 20:33:23.836463 +00:00'),
        (1392, '9398', '2025-03-12 20:33:24.029776 +00:00'),
        (1394, '9400', '2025-03-12 20:33:24.252013 +00:00'),
        (1396, '9402', '2025-03-12 20:33:24.456763 +00:00'),
        (1398, '9404', '2025-03-12 20:33:24.660687 +00:00'),
        (1400, '9406', '2025-03-12 20:33:24.888381 +00:00'),
        (1402, '9408', '2025-03-12 20:33:25.070773 +00:00'),
        (1404, '9410', '2025-03-12 20:33:25.270882 +00:00'),
        (1406, '9413', '2025-03-12 20:33:25.467928 +00:00'),
        (1408, '9415', '2025-03-12 20:33:25.695079 +00:00'),
        (1410, '9417', '2025-03-12 20:33:25.909984 +00:00'),
        (1412, '9419', '2025-03-12 20:33:26.108007 +00:00'),
        (1414, '9421', '2025-03-12 20:33:26.282472 +00:00'),
        (1416, '9423', '2025-03-12 20:33:26.530810 +00:00'),
        (1418, '9425', '2025-03-12 20:33:26.714250 +00:00'),
        (1420, '9427', '2025-03-12 20:33:26.941343 +00:00'),
        (1422, '9429', '2025-03-12 20:33:27.150544 +00:00'),
        (1424, '9432', '2025-03-12 20:33:27.363135 +00:00'),
        (1426, '9434', '2025-03-12 20:33:27.581332 +00:00'),
        (1428, '9436', '2025-03-12 20:33:27.794243 +00:00'),
        (1430, '9438', '2025-03-12 20:33:27.993790 +00:00'),
        (1432, '9440', '2025-03-12 20:33:28.206222 +00:00'),
        (1434, '9443', '2025-03-12 20:33:28.415683 +00:00'),
        (1436, '9445', '2025-03-12 20:33:28.630860 +00:00'),
        (1438, '9447', '2025-03-12 20:33:28.855638 +00:00'),
        (1440, '9449', '2025-03-12 20:33:29.059970 +00:00'),
        (1442, '9452', '2025-03-12 20:33:29.298880 +00:00'),
        (1444, '9454', '2025-03-12 20:33:29.487484 +00:00'),
        (1446, '9456', '2025-03-12 20:33:29.724349 +00:00'),
        (1448, '9458', '2025-03-12 20:33:29.926848 +00:00'),
        (1450, '9460', '2025-03-12 20:33:30.125425 +00:00'),
        (1452, '9462', '2025-03-12 20:33:30.316541 +00:00'),
        (1454, '9464', '2025-03-12 20:33:30.554609 +00:00'),
        (1456, '9466', '2025-03-12 20:33:30.728789 +00:00'),
        (1458, '9468', '2025-03-12 20:33:30.923305 +00:00'),
        (1459, '9469', '2025-03-12 20:33:31.018568 +00:00'),
        (1461, '9471', '2025-03-12 20:33:31.213747 +00:00'),
        (1463, '9473', '2025-03-12 20:33:31.432684 +00:00'),
        (1465, '9475', '2025-03-12 20:33:31.711022 +00:00'),
        (1467, '9477', '2025-03-12 20:33:31.902934 +00:00'),
        (1469, '9479', '2025-03-12 20:33:32.080472 +00:00'),
        (1471, '9481', '2025-03-12 20:33:32.262760 +00:00'),
        (1473, '9483', '2025-03-12 20:33:32.441780 +00:00'),
        (1475, '9485', '2025-03-12 20:33:32.651485 +00:00'),
        (1477, '9487', '2025-03-12 20:33:32.850863 +00:00'),
        (1479, '9489', '2025-03-12 20:33:33.031550 +00:00'),
        (1481, '9491', '2025-03-12 20:33:33.211093 +00:00'),
        (1483, '9493', '2025-03-12 20:33:33.406751 +00:00'),
        (1485, '9495', '2025-03-12 20:33:33.602979 +00:00'),
        (1487, '9497', '2025-03-12 20:33:33.792059 +00:00'),
        (1489, '9499', '2025-03-12 20:33:33.967071 +00:00'),
        (1491, '9501', '2025-03-12 20:33:34.184151 +00:00'),
        (1493, '9503', '2025-03-12 20:33:34.383498 +00:00'),
        (1495, '9505', '2025-03-12 20:33:34.596954 +00:00'),
        (1497, '9507', '2025-03-12 20:33:34.830687 +00:00'),
        (1499, '9509', '2025-03-12 20:33:35.021262 +00:00'),
        (1501, '9513', '2025-03-12 20:33:35.196681 +00:00'),
        (1503, '9515', '2025-03-12 20:33:35.386882 +00:00'),
        (1505, '9517', '2025-03-12 20:33:35.573886 +00:00'),
        (1507, '9519', '2025-03-12 20:33:35.791421 +00:00'),
        (1509, '9521', '2025-03-12 20:33:36.016975 +00:00'),
        (1511, '9523', '2025-03-12 20:33:36.194646 +00:00'),
        (1513, '9525', '2025-03-12 20:33:36.416703 +00:00'),
        (1515, '9527', '2025-03-12 20:33:36.646703 +00:00'),
        (1517, '9529', '2025-03-12 20:33:36.838964 +00:00'),
        (1519, '9533', '2025-03-12 20:33:37.061369 +00:00'),
        (1521, '9535', '2025-03-12 20:33:37.251942 +00:00'),
        (1523, '9537', '2025-03-12 20:33:37.448707 +00:00'),
        (1525, '9539', '2025-03-12 20:33:37.675740 +00:00'),
        (1527, '9541', '2025-03-12 20:33:37.880117 +00:00'),
        (1529, '9543', '2025-03-12 20:33:38.092102 +00:00'),
        (1531, '9545', '2025-03-12 20:33:38.280829 +00:00'),
        (1533, '9547', '2025-03-12 20:33:38.512852 +00:00'),
        (1535, '9549', '2025-03-12 20:33:38.697632 +00:00'),
        (1537, '9551', '2025-03-12 20:33:38.898638 +00:00'),
        (1539, '9553', '2025-03-12 20:33:39.082741 +00:00'),
        (1541, '9555', '2025-03-12 20:33:39.265805 +00:00'),
        (1543, '9557', '2025-03-12 20:33:39.444463 +00:00'),
        (1545, '9559', '2025-03-12 20:33:39.636584 +00:00'),
        (1547, '9561', '2025-03-12 20:33:39.800171 +00:00'),
        (1549, '9563', '2025-03-12 20:33:39.981795 +00:00'),
        (1551, '9565', '2025-03-12 20:33:40.186719 +00:00'),
        (1553, '9567', '2025-03-12 20:33:40.397306 +00:00'),
        (1555, '9569', '2025-03-12 20:33:40.574252 +00:00'),
        (1557, '9571', '2025-03-12 20:33:40.777878 +00:00'),
        (1559, '9573', '2025-03-12 20:33:40.970932 +00:00'),
        (1561, '9575', '2025-03-12 20:33:41.174285 +00:00'),
        (1563, '9577', '2025-03-12 20:33:41.381789 +00:00'),
        (1565, '9579', '2025-03-12 20:33:41.587862 +00:00'),
        (1567, '9581', '2025-03-12 20:33:41.780187 +00:00'),
        (1569, '9583', '2025-03-12 20:33:41.978299 +00:00'),
        (1571, '9585', '2025-03-12 20:33:42.169320 +00:00'),
        (1573, '9587', '2025-03-12 20:33:42.417696 +00:00'),
        (1575, '9589', '2025-03-12 20:33:42.659036 +00:00'),
        (1576, '9590', '2025-03-12 20:33:42.750941 +00:00'),
        (1578, '9592', '2025-03-12 20:33:42.923699 +00:00'),
        (1579, '9593', '2025-03-12 20:33:43.019642 +00:00'),
        (1580, '9594', '2025-03-12 20:33:43.110245 +00:00'),
        (1583, '9597', '2025-03-12 20:33:43.406968 +00:00'),
        (1584, '9598', '2025-03-12 20:33:43.517165 +00:00'),
        (1586, '9600', '2025-03-12 20:33:43.740062 +00:00'),
        (1588, '9602', '2025-03-12 20:33:43.935806 +00:00'),
        (1590, '9604', '2025-03-12 20:33:44.165443 +00:00'),
        (1592, '9606', '2025-03-12 20:33:44.366847 +00:00'),
        (1594, '9608', '2025-03-12 20:33:44.584734 +00:00'),
        (1596, '9610', '2025-03-12 20:33:44.769532 +00:00'),
        (1598, '9613', '2025-03-12 20:33:44.958498 +00:00'),
        (1600, '9615', '2025-03-12 20:33:45.135785 +00:00'),
        (1602, '9617', '2025-03-12 20:33:45.323918 +00:00'),
        (1604, '9619', '2025-03-12 20:33:45.510236 +00:00'),
        (1606, '9622', '2025-03-12 20:33:45.693533 +00:00'),
        (1608, '9624', '2025-03-12 20:33:45.895493 +00:00'),
        (1610, '9626', '2025-03-12 20:33:46.089438 +00:00'),
        (1612, '9628', '2025-03-12 20:33:46.314454 +00:00'),
        (1614, '9630', '2025-03-12 20:33:46.531936 +00:00'),
        (1616, '9633', '2025-03-12 20:33:46.729991 +00:00'),
        (1618, '9635', '2025-03-12 20:33:46.914551 +00:00'),
        (1620, '9637', '2025-03-12 20:33:47.109695 +00:00'),
        (1622, '9639', '2025-03-12 20:33:47.301206 +00:00'),
        (1624, '9642', '2025-03-12 20:33:47.479237 +00:00'),
        (1626, '9644', '2025-03-12 20:33:47.706320 +00:00'),
        (1628, '9646', '2025-03-12 20:33:47.877209 +00:00'),
        (1630, '9648', '2025-03-12 20:33:48.054189 +00:00'),
        (1632, '9650', '2025-03-12 20:33:48.229595 +00:00'),
        (1634, '9653', '2025-03-12 20:33:48.446748 +00:00'),
        (1636, '9655', '2025-03-12 20:33:48.630167 +00:00'),
        (1638, '9657', '2025-03-12 20:33:48.804994 +00:00'),
        (1640, '9659', '2025-03-12 20:33:49.021447 +00:00'),
        (1642, '9662', '2025-03-12 20:33:49.223717 +00:00'),
        (1644, '9664', '2025-03-12 20:33:49.404351 +00:00'),
        (1646, '9666', '2025-03-12 20:33:49.583421 +00:00'),
        (1648, '9668', '2025-03-12 20:33:49.781560 +00:00'),
        (1650, '9670', '2025-03-12 20:33:49.997672 +00:00'),
        (1652, '9672', '2025-03-12 20:33:50.185431 +00:00'),
        (1654, '9674', '2025-03-12 20:33:50.395330 +00:00'),
        (1656, '9676', '2025-03-12 20:33:50.596730 +00:00'),
        (1658, '9678', '2025-03-12 20:33:50.788017 +00:00'),
        (1660, '9680', '2025-03-12 20:33:50.977071 +00:00'),
        (1662, '9682', '2025-03-12 20:33:51.146856 +00:00'),
        (1664, '9684', '2025-03-12 20:33:51.353148 +00:00'),
        (1666, '9686', '2025-03-12 20:33:51.564464 +00:00'),
        (1668, '9688', '2025-03-12 20:33:51.759241 +00:00'),
        (1670, '9690', '2025-03-12 20:33:51.943186 +00:00'),
        (1672, '9692', '2025-03-12 20:33:52.160505 +00:00'),
        (1674, '9694', '2025-03-12 20:33:52.411158 +00:00'),
        (1676, '9696', '2025-03-12 20:33:52.599412 +00:00'),
        (1678, '9698', '2025-03-12 20:33:52.804429 +00:00'),
        (1680, '9700', '2025-03-12 20:33:52.983413 +00:00'),
        (1682, '9702', '2025-03-12 20:33:53.228551 +00:00'),
        (1684, '9704', '2025-03-12 20:33:53.424447 +00:00'),
        (1686, '9706', '2025-03-12 20:33:53.612469 +00:00'),
        (1688, '9708', '2025-03-12 20:33:53.801727 +00:00'),
        (1690, '9710', '2025-03-12 20:33:53.995022 +00:00'),
        (1692, '9713', '2025-03-12 20:33:54.205721 +00:00'),
        (1694, '9715', '2025-03-12 20:33:54.384728 +00:00'),
        (1696, '9717', '2025-03-12 20:33:54.569210 +00:00'),
        (1698, '9719', '2025-03-12 20:33:54.780158 +00:00'),
        (1700, '9722', '2025-03-12 20:33:55.007517 +00:00'),
        (1702, '9724', '2025-03-12 20:33:55.209317 +00:00'),
        (1704, '9726', '2025-03-12 20:33:55.392217 +00:00'),
        (1706, '9728', '2025-03-12 20:33:55.581758 +00:00'),
        (1708, '9730', '2025-03-12 20:33:55.775006 +00:00'),
        (1710, '9732', '2025-03-12 20:33:55.979378 +00:00'),
        (1712, '9734', '2025-03-12 20:33:56.175389 +00:00'),
        (1714, '9736', '2025-03-12 20:33:56.369757 +00:00'),
        (1716, '9738', '2025-03-12 20:33:56.566032 +00:00'),
        (1718, '9740', '2025-03-12 20:33:56.747402 +00:00'),
        (1720, '9742', '2025-03-12 20:33:56.941828 +00:00'),
        (1722, '9744', '2025-03-12 20:33:57.193104 +00:00'),
        (1724, '9746', '2025-03-12 20:33:57.375763 +00:00'),
        (1726, '9748', '2025-03-12 20:33:57.574334 +00:00'),
        (1728, '9750', '2025-03-12 20:33:57.796368 +00:00'),
        (1730, '9752', '2025-03-12 20:33:58.002230 +00:00'),
        (1732, '9754', '2025-03-12 20:33:58.213200 +00:00'),
        (1734, '9756', '2025-03-12 20:33:58.482065 +00:00'),
        (1736, '9758', '2025-03-12 20:33:58.709646 +00:00'),
        (1738, '9760', '2025-03-12 20:33:58.922907 +00:00'),
        (1740, '9762', '2025-03-12 20:33:59.132285 +00:00'),
        (1742, '9764', '2025-03-12 20:33:59.326070 +00:00'),
        (1744, '9766', '2025-03-12 20:33:59.511403 +00:00'),
        (1746, '9768', '2025-03-12 20:33:59.753946 +00:00'),
        (1748, '9770', '2025-03-12 20:33:59.954409 +00:00'),
        (1750, '9772', '2025-03-12 20:34:00.190622 +00:00'),
        (1752, '9774', '2025-03-12 20:34:00.407974 +00:00'),
        (1754, '9776', '2025-03-12 20:34:00.634276 +00:00'),
        (1756, '9778', '2025-03-12 20:34:00.861798 +00:00'),
        (1758, '9780', '2025-03-12 20:34:01.079914 +00:00'),
        (1760, '9782', '2025-03-12 20:34:01.294097 +00:00'),
        (1762, '9784', '2025-03-12 20:34:01.539144 +00:00'),
        (1764, '9786', '2025-03-12 20:34:01.773632 +00:00'),
        (1766, '9788', '2025-03-12 20:34:02.023974 +00:00'),
        (1768, '9790', '2025-03-12 20:34:02.212897 +00:00'),
        (1460, '9470', '2025-03-12 20:33:31.113044 +00:00'),
        (1462, '9472', '2025-03-12 20:33:31.327561 +00:00'),
        (1464, '9474', '2025-03-12 20:33:31.555055 +00:00'),
        (1466, '9476', '2025-03-12 20:33:31.810217 +00:00'),
        (1468, '9478', '2025-03-12 20:33:31.990550 +00:00'),
        (1470, '9480', '2025-03-12 20:33:32.168516 +00:00'),
        (1472, '9482', '2025-03-12 20:33:32.351035 +00:00'),
        (1474, '9484', '2025-03-12 20:33:32.539507 +00:00'),
        (1476, '9486', '2025-03-12 20:33:32.740377 +00:00'),
        (1478, '9488', '2025-03-12 20:33:32.941303 +00:00'),
        (1480, '9490', '2025-03-12 20:33:33.123803 +00:00'),
        (1482, '9492', '2025-03-12 20:33:33.316682 +00:00'),
        (1484, '9494', '2025-03-12 20:33:33.511936 +00:00'),
        (1486, '9496', '2025-03-12 20:33:33.704014 +00:00'),
        (1488, '9498', '2025-03-12 20:33:33.876977 +00:00'),
        (1490, '9500', '2025-03-12 20:33:34.054697 +00:00'),
        (1492, '9502', '2025-03-12 20:33:34.286770 +00:00'),
        (1494, '9504', '2025-03-12 20:33:34.486785 +00:00'),
        (1496, '9506', '2025-03-12 20:33:34.710058 +00:00'),
        (1498, '9508', '2025-03-12 20:33:34.922528 +00:00'),
        (1500, '9510', '2025-03-12 20:33:35.109699 +00:00'),
        (1502, '9514', '2025-03-12 20:33:35.291763 +00:00'),
        (1504, '9516', '2025-03-12 20:33:35.486696 +00:00'),
        (1506, '9518', '2025-03-12 20:33:35.670165 +00:00'),
        (1508, '9520', '2025-03-12 20:33:35.898568 +00:00'),
        (1510, '9522', '2025-03-12 20:33:36.106706 +00:00'),
        (1512, '9524', '2025-03-12 20:33:36.311762 +00:00'),
        (1514, '9526', '2025-03-12 20:33:36.533703 +00:00'),
        (1516, '9528', '2025-03-12 20:33:36.742577 +00:00'),
        (1518, '9530', '2025-03-12 20:33:36.936957 +00:00'),
        (1520, '9534', '2025-03-12 20:33:37.159032 +00:00'),
        (1522, '9536', '2025-03-12 20:33:37.346779 +00:00'),
        (1524, '9538', '2025-03-12 20:33:37.576266 +00:00'),
        (1526, '9540', '2025-03-12 20:33:37.783600 +00:00'),
        (1528, '9542', '2025-03-12 20:33:37.973431 +00:00'),
        (1530, '9544', '2025-03-12 20:33:38.182498 +00:00'),
        (1532, '9546', '2025-03-12 20:33:38.395350 +00:00'),
        (1534, '9548', '2025-03-12 20:33:38.604718 +00:00'),
        (1536, '9550', '2025-03-12 20:33:38.812009 +00:00'),
        (1538, '9552', '2025-03-12 20:33:38.989001 +00:00'),
        (1540, '9554', '2025-03-12 20:33:39.176862 +00:00'),
        (1542, '9556', '2025-03-12 20:33:39.357751 +00:00'),
        (1544, '9558', '2025-03-12 20:33:39.544163 +00:00'),
        (1546, '9560', '2025-03-12 20:33:39.717851 +00:00'),
        (1548, '9562', '2025-03-12 20:33:39.883061 +00:00'),
        (1550, '9564', '2025-03-12 20:33:40.089149 +00:00'),
        (1552, '9566', '2025-03-12 20:33:40.292578 +00:00'),
        (1554, '9568', '2025-03-12 20:33:40.481045 +00:00'),
        (1556, '9570', '2025-03-12 20:33:40.669110 +00:00'),
        (1558, '9572', '2025-03-12 20:33:40.881080 +00:00'),
        (1560, '9574', '2025-03-12 20:33:41.053837 +00:00'),
        (1562, '9576', '2025-03-12 20:33:41.287498 +00:00'),
        (1564, '9578', '2025-03-12 20:33:41.490887 +00:00'),
        (1566, '9580', '2025-03-12 20:33:41.682066 +00:00'),
        (1568, '9582', '2025-03-12 20:33:41.885774 +00:00'),
        (1570, '9584', '2025-03-12 20:33:42.068655 +00:00'),
        (1572, '9586', '2025-03-12 20:33:42.269688 +00:00'),
        (1574, '9588', '2025-03-12 20:33:42.519720 +00:00'),
        (1577, '9591', '2025-03-12 20:33:42.834909 +00:00'),
        (1581, '9595', '2025-03-12 20:33:43.205076 +00:00'),
        (1582, '9596', '2025-03-12 20:33:43.294498 +00:00'),
        (1585, '9599', '2025-03-12 20:33:43.630134 +00:00'),
        (1587, '9601', '2025-03-12 20:33:43.836882 +00:00'),
        (1589, '9603', '2025-03-12 20:33:44.044992 +00:00'),
        (1591, '9605', '2025-03-12 20:33:44.260151 +00:00'),
        (1593, '9607', '2025-03-12 20:33:44.482204 +00:00'),
        (1595, '9609', '2025-03-12 20:33:44.682545 +00:00'),
        (1597, '9612', '2025-03-12 20:33:44.865727 +00:00'),
        (1599, '9614', '2025-03-12 20:33:45.050510 +00:00'),
        (1601, '9616', '2025-03-12 20:33:45.229072 +00:00'),
        (1603, '9618', '2025-03-12 20:33:45.417902 +00:00'),
        (1605, '9620', '2025-03-12 20:33:45.602195 +00:00'),
        (1607, '9623', '2025-03-12 20:33:45.795518 +00:00'),
        (1609, '9625', '2025-03-12 20:33:45.987284 +00:00'),
        (1611, '9627', '2025-03-12 20:33:46.212353 +00:00'),
        (1613, '9629', '2025-03-12 20:33:46.432971 +00:00'),
        (1615, '9632', '2025-03-12 20:33:46.641324 +00:00'),
        (1617, '9634', '2025-03-12 20:33:46.820506 +00:00'),
        (1619, '9636', '2025-03-12 20:33:47.011140 +00:00'),
        (1621, '9638', '2025-03-12 20:33:47.202335 +00:00'),
        (1623, '9640', '2025-03-12 20:33:47.384127 +00:00'),
        (1625, '9643', '2025-03-12 20:33:47.599941 +00:00'),
        (1627, '9645', '2025-03-12 20:33:47.792982 +00:00'),
        (1629, '9647', '2025-03-12 20:33:47.957527 +00:00'),
        (1631, '9649', '2025-03-12 20:33:48.143455 +00:00'),
        (1633, '9652', '2025-03-12 20:33:48.334859 +00:00'),
        (1635, '9654', '2025-03-12 20:33:48.532178 +00:00'),
        (1637, '9656', '2025-03-12 20:33:48.722234 +00:00'),
        (1639, '9658', '2025-03-12 20:33:48.915320 +00:00'),
        (1770, '9792', '2025-03-12 20:34:02.438593 +00:00'),
        (1772, '9794', '2025-03-12 20:34:02.645919 +00:00'),
        (1774, '9796', '2025-03-12 20:34:02.914247 +00:00'),
        (1776, '9798', '2025-03-12 20:34:03.114080 +00:00'),
        (1778, '9800', '2025-03-12 20:34:03.316955 +00:00'),
        (1780, '9802', '2025-03-12 20:34:03.515443 +00:00'),
        (1782, '9804', '2025-03-12 20:34:03.697436 +00:00'),
        (1784, '9806', '2025-03-12 20:34:03.896876 +00:00'),
        (1786, '9808', '2025-03-12 20:34:04.119770 +00:00'),
        (1788, '9810', '2025-03-12 20:34:04.334718 +00:00'),
        (1790, '9812', '2025-03-12 20:34:04.532014 +00:00'),
        (1792, '9814', '2025-03-12 20:34:04.718684 +00:00'),
        (1794, '9816', '2025-03-12 20:34:04.906792 +00:00'),
        (1796, '9818', '2025-03-12 20:34:05.121607 +00:00'),
        (1798, '9820', '2025-03-12 20:34:05.320295 +00:00'),
        (1800, '9822', '2025-03-12 20:34:05.508261 +00:00'),
        (1802, '9824', '2025-03-12 20:34:05.704255 +00:00'),
        (1804, '9826', '2025-03-12 20:34:05.931481 +00:00'),
        (1806, '9828', '2025-03-12 20:34:06.150887 +00:00'),
        (1808, '9830', '2025-03-12 20:34:06.381548 +00:00'),
        (1810, '9832', '2025-03-12 20:34:06.585174 +00:00'),
        (1812, '9834', '2025-03-12 20:34:06.773703 +00:00'),
        (1814, '9836', '2025-03-12 20:34:06.971243 +00:00'),
        (1816, '9838', '2025-03-12 20:34:07.166884 +00:00'),
        (1818, '9840', '2025-03-12 20:34:07.363160 +00:00'),
        (1820, '9842', '2025-03-12 20:34:07.542813 +00:00'),
        (1822, '9844', '2025-03-12 20:34:07.789560 +00:00'),
        (1824, '9846', '2025-03-12 20:34:07.985546 +00:00'),
        (1826, '9848', '2025-03-12 20:34:08.193968 +00:00'),
        (1828, '9850', '2025-03-12 20:34:08.383797 +00:00'),
        (1830, '9852', '2025-03-12 20:34:08.574242 +00:00'),
        (1832, '9854', '2025-03-12 20:34:08.762628 +00:00'),
        (1834, '9856', '2025-03-12 20:34:08.979132 +00:00'),
        (1836, '9858', '2025-03-12 20:34:09.196471 +00:00'),
        (1838, '9860', '2025-03-12 20:34:09.412589 +00:00'),
        (1840, '9862', '2025-03-12 20:34:09.617601 +00:00'),
        (1842, '9864', '2025-03-12 20:34:09.837500 +00:00'),
        (1844, '9866', '2025-03-12 20:34:10.100278 +00:00'),
        (1846, '9868', '2025-03-12 20:34:10.326477 +00:00'),
        (1848, '9870', '2025-03-12 20:34:10.534631 +00:00'),
        (1850, '9872', '2025-03-12 20:34:10.763908 +00:00'),
        (1852, '9874', '2025-03-12 20:34:10.988182 +00:00'),
        (1854, '9876', '2025-03-12 20:34:11.197217 +00:00'),
        (1856, '9878', '2025-03-12 20:34:11.420378 +00:00'),
        (1858, '9880', '2025-03-12 20:34:11.622092 +00:00'),
        (1860, '9882', '2025-03-12 20:34:11.851585 +00:00'),
        (1862, '9884', '2025-03-12 20:34:12.064135 +00:00'),
        (1864, '9886', '2025-03-12 20:34:12.284241 +00:00'),
        (1865, '9887', '2025-03-12 20:34:12.382791 +00:00'),
        (1866, '9888', '2025-03-12 20:34:12.484890 +00:00'),
        (1867, '9889', '2025-03-12 20:34:12.576811 +00:00'),
        (1868, '9890', '2025-03-12 20:34:12.673596 +00:00'),
        (1869, '9891', '2025-03-12 20:34:12.757747 +00:00'),
        (1870, '9892', '2025-03-12 20:34:12.854937 +00:00'),
        (1871, '9893', '2025-03-12 20:34:12.967911 +00:00'),
        (1872, '9894', '2025-03-12 20:34:13.068116 +00:00'),
        (1873, '9895', '2025-03-12 20:34:13.165846 +00:00'),
        (1874, '9896', '2025-03-12 20:34:13.271989 +00:00'),
        (1875, '9897', '2025-03-12 20:34:13.406249 +00:00'),
        (1876, '9898', '2025-03-12 20:34:13.494604 +00:00'),
        (1877, '9899', '2025-03-12 20:34:13.591552 +00:00'),
        (1878, '9900', '2025-03-12 20:34:13.675149 +00:00'),
        (1879, '9901', '2025-03-12 20:34:13.783311 +00:00'),
        (1880, '9902', '2025-03-12 20:34:13.877347 +00:00'),
        (1881, '9903', '2025-03-12 20:34:13.967061 +00:00'),
        (1882, '9904', '2025-03-12 20:34:14.079372 +00:00'),
        (1883, '9905', '2025-03-12 20:34:14.197379 +00:00'),
        (1884, '9906', '2025-03-12 20:34:14.286388 +00:00'),
        (1885, '9907', '2025-03-12 20:34:14.393888 +00:00'),
        (1887, '9909', '2025-03-12 20:34:14.599309 +00:00'),
        (1889, '9911', '2025-03-12 20:34:14.822377 +00:00'),
        (1891, '9913', '2025-03-12 20:34:15.022294 +00:00'),
        (1893, '9915', '2025-03-12 20:34:15.208955 +00:00'),
        (1895, '9917', '2025-03-12 20:34:15.410647 +00:00'),
        (1897, '9919', '2025-03-12 20:34:15.606550 +00:00'),
        (1899, '9921', '2025-03-12 20:34:15.849745 +00:00'),
        (1901, '9923', '2025-03-12 20:34:16.064641 +00:00'),
        (1903, '9925', '2025-03-12 20:34:16.264404 +00:00'),
        (1905, '9927', '2025-03-12 20:34:16.490908 +00:00'),
        (1907, '9929', '2025-03-12 20:34:16.734116 +00:00'),
        (1909, '9931', '2025-03-12 20:34:16.954365 +00:00'),
        (1911, '9933', '2025-03-12 20:34:17.178421 +00:00'),
        (1913, '9935', '2025-03-12 20:34:17.376043 +00:00'),
        (1915, '9937', '2025-03-12 20:34:17.569905 +00:00'),
        (1917, '9939', '2025-03-12 20:34:17.758929 +00:00'),
        (1919, '9941', '2025-03-12 20:34:17.991721 +00:00'),
        (1921, '9943', '2025-03-12 20:34:18.186716 +00:00'),
        (1923, '9945', '2025-03-12 20:34:18.397447 +00:00'),
        (1925, '9947', '2025-03-12 20:34:18.582988 +00:00'),
        (1927, '9949', '2025-03-12 20:34:18.771721 +00:00'),
        (1929, '9951', '2025-03-12 20:34:19.024106 +00:00'),
        (1931, '9953', '2025-03-12 20:34:19.266157 +00:00'),
        (1933, '9955', '2025-03-12 20:34:19.472170 +00:00'),
        (1935, '9957', '2025-03-12 20:34:19.668763 +00:00'),
        (1937, '9959', '2025-03-12 20:34:19.883931 +00:00'),
        (1939, '9961', '2025-03-12 20:34:20.102421 +00:00'),
        (1941, '9963', '2025-03-12 20:34:20.315870 +00:00'),
        (1943, '9965', '2025-03-12 20:34:20.526621 +00:00'),
        (1945, '9967', '2025-03-12 20:34:20.740283 +00:00'),
        (1947, '9969', '2025-03-12 20:34:20.939747 +00:00'),
        (1949, '9971', '2025-03-12 20:34:21.157009 +00:00'),
        (1951, '9973', '2025-03-12 20:34:21.356377 +00:00'),
        (1953, '9975', '2025-03-12 20:34:21.566288 +00:00'),
        (1955, '9977', '2025-03-12 20:34:21.763834 +00:00'),
        (1957, '9979', '2025-03-12 20:34:21.971549 +00:00'),
        (1959, '9981', '2025-03-12 20:34:22.159199 +00:00'),
        (1961, '9983', '2025-03-12 20:34:22.350863 +00:00'),
        (1963, '9985', '2025-03-12 20:34:22.578358 +00:00'),
        (1965, '9987', '2025-03-12 20:34:22.817342 +00:00'),
        (1967, '9989', '2025-03-12 20:34:23.075263 +00:00'),
        (1969, '9991', '2025-03-12 20:34:23.263933 +00:00'),
        (1971, '9993', '2025-03-12 20:34:23.492401 +00:00'),
        (1973, '9995', '2025-03-12 20:34:23.702706 +00:00'),
        (1975, '9997', '2025-03-12 20:34:23.921311 +00:00'),
        (1886, '9908', '2025-03-12 20:34:14.507601 +00:00'),
        (1888, '9910', '2025-03-12 20:34:14.707410 +00:00'),
        (1890, '9912', '2025-03-12 20:34:14.915471 +00:00'),
        (1892, '9914', '2025-03-12 20:34:15.112802 +00:00'),
        (1894, '9916', '2025-03-12 20:34:15.308912 +00:00'),
        (1896, '9918', '2025-03-12 20:34:15.512824 +00:00'),
        (1898, '9920', '2025-03-12 20:34:15.715907 +00:00'),
        (1900, '9922', '2025-03-12 20:34:15.950826 +00:00'),
        (1902, '9924', '2025-03-12 20:34:16.164536 +00:00'),
        (1904, '9926', '2025-03-12 20:34:16.369159 +00:00'),
        (1906, '9928', '2025-03-12 20:34:16.589195 +00:00'),
        (1908, '9930', '2025-03-12 20:34:16.839059 +00:00'),
        (1910, '9932', '2025-03-12 20:34:17.066818 +00:00'),
        (1912, '9934', '2025-03-12 20:34:17.270036 +00:00'),
        (1914, '9936', '2025-03-12 20:34:17.476060 +00:00'),
        (1916, '9938', '2025-03-12 20:34:17.664373 +00:00'),
        (1918, '9940', '2025-03-12 20:34:17.858041 +00:00'),
        (1920, '9942', '2025-03-12 20:34:18.087638 +00:00'),
        (1922, '9944', '2025-03-12 20:34:18.295044 +00:00'),
        (1924, '9946', '2025-03-12 20:34:18.487650 +00:00'),
        (1926, '9948', '2025-03-12 20:34:18.676392 +00:00'),
        (1928, '9950', '2025-03-12 20:34:18.892121 +00:00'),
        (1930, '9952', '2025-03-12 20:34:19.167875 +00:00'),
        (1932, '9954', '2025-03-12 20:34:19.366789 +00:00'),
        (1934, '9956', '2025-03-12 20:34:19.568894 +00:00'),
        (1936, '9958', '2025-03-12 20:34:19.774378 +00:00'),
        (1938, '9960', '2025-03-12 20:34:20.003838 +00:00'),
        (1940, '9962', '2025-03-12 20:34:20.217143 +00:00'),
        (1942, '9964', '2025-03-12 20:34:20.421908 +00:00'),
        (1944, '9966', '2025-03-12 20:34:20.639173 +00:00'),
        (1946, '9968', '2025-03-12 20:34:20.833861 +00:00'),
        (1948, '9970', '2025-03-12 20:34:21.053667 +00:00'),
        (1950, '9972', '2025-03-12 20:34:21.242556 +00:00'),
        (1952, '9974', '2025-03-12 20:34:21.465368 +00:00'),
        (1954, '9976', '2025-03-12 20:34:21.662050 +00:00'),
        (1956, '9978', '2025-03-12 20:34:21.879428 +00:00'),
        (1958, '9980', '2025-03-12 20:34:22.057268 +00:00'),
        (1960, '9982', '2025-03-12 20:34:22.266703 +00:00'),
        (1962, '9984', '2025-03-12 20:34:22.474878 +00:00'),
        (1964, '9986', '2025-03-12 20:34:22.701707 +00:00'),
        (1966, '9988', '2025-03-12 20:34:22.955971 +00:00'),
        (1968, '9990', '2025-03-12 20:34:23.167634 +00:00'),
        (1970, '9992', '2025-03-12 20:34:23.385579 +00:00'),
        (1972, '9994', '2025-03-12 20:34:23.599805 +00:00'),
        (1974, '9996', '2025-03-12 20:34:23.823844 +00:00'),
        (1976, '9998', '2025-03-12 20:34:24.026910 +00:00');
create table if not exists public.pixel (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  website_name text not null,
  website_url text not null,
  webhook_url text null,
  last_webhook_event_time timestamptz null,
  last_sync timestamptz null,
  delivr_id text not null,
  delivr_install_url text not null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.pixel
revoke all on public.pixel from public, service_role;

-- grant required permissions on public.pixel
grant select, insert, update, delete on public.pixel to authenticated;
grant select, insert, update, delete on public.pixel to service_role;

-- Indexes
create index ix_pixel_account_id on public.pixel(account_id);

-- RLS
alter table public.pixel enable row level security;

-- Realtime
alter publication supabase_realtime add table pixel;

-- SELECT(public.pixel)
create policy select_pixel
  on public.pixel
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.pixel)
create policy delete_pixel
  on public.pixel
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.pixel)
create policy update_pixel
  on public.pixel
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.pixel)
create policy insert_pixel
  on public.pixel
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

select cron.schedule(
  'send-pixel-webhooks',
  '*/15 * * * *', -- every 15 minutes
  $$
    SELECT net.http_post(
      url := 'http://host.docker.internal:3000/api/db/pixel',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Supabase-Event-Signature', 'WEBHOOKSECRET'
      ),
      timeout_milliseconds := 60000
    );
  $$
);

create table if not exists public.pixel_export (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  pixel_id uuid not null references public.pixel(id) on delete cascade,
  csv_url text not null,
  count integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.pixel_export
revoke all on public.pixel_export from public, service_role;

-- grant required permissions on public.pixel_export
grant select, insert, update, delete on public.pixel_export to authenticated;
grant select, insert, update, delete on public.pixel_export to service_role;

-- Indexes
create index ix_pixel_export_pixel_id on public.pixel_export(pixel_id);

-- RLS
alter table public.pixel_export enable row level security;

-- SELECT(public.pixel_export)
create policy select_pixel_export
  on public.pixel_export
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.pixel_export)
create policy delete_pixel_export
  on public.pixel_export
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.pixel_export)
create policy update_pixel_export
  on public.pixel_export
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.pixel_export)
create policy insert_pixel_export
  on public.pixel_export
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

CREATE OR REPLACE FUNCTION public.increment_pixel_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.credits
    SET current_pixel = current_pixel + 1
  WHERE account_id = NEW.account_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_pixel_count() FROM public;

CREATE TRIGGER after_insert_pixel
AFTER INSERT ON public.pixel
FOR EACH ROW
EXECUTE FUNCTION public.increment_pixel_count();

CREATE OR REPLACE FUNCTION public.decrement_pixel_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.deleted IS DISTINCT FROM NEW.deleted) AND NEW.deleted = true THEN
    UPDATE public.credits
      SET current_pixel = GREATEST(current_pixel - 1, 0)
    WHERE account_id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_pixel_count() FROM public;

CREATE TRIGGER after_soft_delete_pixel
AFTER UPDATE ON public.pixel
FOR EACH ROW
EXECUTE FUNCTION public.decrement_pixel_count();create table if not exists public.audience_sync (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  audience_id uuid not null references public.audience(id) on delete cascade,
  integration_key text not null,
  integration_details jsonb not null default '{}',
  sync_status text not null default 'scheduled',
  processing boolean not null default false,
  sync_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.audience_sync
revoke all on public.audience_sync from public, service_role;

-- grant required permissions on public.audience_sync
grant select, insert, delete on public.audience_sync to authenticated;
grant select, insert, update, delete on public.audience_sync to service_role;

-- Indexes
create index ix_audience_sync_account_id on public.audience_sync(account_id);

-- RLS
alter table public.audience_sync enable row level security;

-- Realtime
alter publication supabase_realtime add table audience_sync;

-- SELECT(public.audience_sync)
create policy select_audience_sync
  on public.audience_sync
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.audience_sync)
create policy delete_audience_sync
  on public.audience_sync
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.audience_sync)
create policy update_audience_sync
  on public.audience_sync
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.audience_sync)
create policy insert_audience_sync
  on public.audience_sync
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

create or replace function public.enqueue_job_call_webhooks()
returns trigger
language plpgsql
as $$
declare
  sync_rec record;
begin
  if tg_op = 'UPDATE'
    and old.csv_url is null
    and new.csv_url is not null
  then
    for sync_rec in
      select id, account_id
      from public.audience_sync
      where audience_id = new.audience_id
    loop
      perform net.http_post(
        url := 'http://host.docker.internal:3000/api/db/sync',
        headers := jsonb_build_object(
          'Content-Type',                'application/json',
          'X-Supabase-Event-Signature',  'WEBHOOKSECRET'
        ),
        body := jsonb_build_object(
          'account_id',       sync_rec.account_id,
          'audience_sync_id', sync_rec.id,
          'csv_url',          new.csv_url
        ),
        timeout_milliseconds := 20000
      );
    end loop;
  end if;

  return new;
end;
$$;

create trigger enqueue_job_csv_url
  after update on public.enqueue_job
  for each row
  when (old.csv_url is null and new.csv_url is not null)
  execute function public.enqueue_job_call_webhooks();
create table if not exists public.whitelabel_credits (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  monthly_audience_limit integer not null,
  max_custom_interests integer not null,
  audience_size_limit integer not null,
  b2b_access boolean not null,
  intent_access boolean not null,
  monthly_pixel_limit integer not null,
  pixel_size_limit integer not null,
  monthly_enrichment_limit integer not null,
  enrichment_size_limit integer not null,
  restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whitelabel_branding (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  company_name text,
  logo_url text,
  icon_url text,
  domain text,
  domain_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.whitelabel_branding
revoke all on public.whitelabel_branding from public, service_role;

-- grant required permissions on public.whitelabel_branding
grant select, insert, delete on public.whitelabel_branding to authenticated;
grant select, insert, update, delete on public.whitelabel_branding to service_role;
grant select on public.whitelabel_branding to public;
GRANT USAGE ON SCHEMA public TO public;


-- Indexes
create index ix_audience_domain on public.whitelabel_branding(domain);

-- RLS
alter table public.whitelabel_branding enable row level security;

-- SELECT(public.whitelabel_branding)
create policy select_whitelabel_branding
  on public.whitelabel_branding
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id)
  );

-- UPDATE(public.whitelabel_branding)
create policy update_whitelabel_branding
  on public.whitelabel_branding
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.whitelabel_branding)
create policy insert_whitelabel_branding
  on public.whitelabel_branding
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

create policy public_select_verified_branding
on public.whitelabel_branding
for select
to public
using (
  domain_verified = true
);

insert into
  storage.buckets (id, name, PUBLIC)
values
  ('whitelabel_logo', 'whitelabel_logo', true);

-- RLS policies for storage bucket whitelabel_logo
create policy whitelabel_logo on storage.objects for all using (
  bucket_id = 'whitelabel_logo'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_role_on_account(kit.get_storage_filename_as_uuid(name))
  )
)
with check (
  bucket_id = 'whitelabel_logo'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_permission(
      auth.uid(),
      kit.get_storage_filename_as_uuid(name),
      'settings.manage'
    )
  )
);

insert into
  storage.buckets (id, name, PUBLIC)
values
  ('whitelabel_icon', 'whitelabel_icon', true);

-- RLS policies for storage bucket whitelabel_icon
create policy whitelabel_icon on storage.objects for all using (
  bucket_id = 'whitelabel_icon'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_role_on_account(kit.get_storage_filename_as_uuid(name))
  )
)
with check (
  bucket_id = 'whitelabel_icon'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_permission(
      auth.uid(),
      kit.get_storage_filename_as_uuid(name),
      'settings.manage'
    )
  )
);

create or replace view public.whitelabel_credits_usage as
select
  whitelabel_host_account_id as account_id,

  sum(current_enrichment) as current_enrichment,
  sum(current_audience) as current_audience,
  sum(current_pixel) as current_pixel,
  sum(current_custom) as current_custom,

  sum(monthly_enrichment_limit) as allocated_monthly_enrichment_limit,
  sum(enrichment_size_limit) as allocated_enrichment_size_limit,

  sum(monthly_audience_limit) as allocated_monthly_audience_limit,
  sum(audience_size_limit) as allocated_audience_size_limit,

  sum(monthly_pixel_limit) as allocated_monthly_pixel_limit,
  sum(pixel_size_limit) as allocated_pixel_size_limit,

  sum(max_custom_interests) as allocated_max_custom_interests

from public.credits
where whitelabel_host_account_id is not null
group by whitelabel_host_account_id;-- Step 1: Create a dedicated private schema for API key data
CREATE SCHEMA IF NOT EXISTS api_keys_private;

-- Step 2: Create the tables in the private schema
CREATE TABLE api_keys_private.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_prefix VARCHAR(7) NOT NULL,
  key_hash TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER table api_keys_private.api_keys enable row level security;

create policy "Accounts can read API Keys" on api_keys_private.api_keys
    for select
    to authenticated
    using (
        public.has_role_on_account(account_id)
    );

CREATE TABLE api_keys_private.api_key_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys_private.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER table api_keys_private.api_key_logs enable row level security;

-- Step 3: Create indexes for performance optimization
CREATE INDEX idx_api_keys_account_id ON api_keys_private.api_keys(account_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys_private.api_keys(key_prefix);
CREATE INDEX idx_api_key_logs_api_key_id ON api_keys_private.api_key_logs(api_key_id);
CREATE INDEX idx_api_key_logs_timestamp ON api_keys_private.api_key_logs(timestamp);

-- Step 4: Lock down the private schema
REVOKE ALL ON SCHEMA api_keys_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA api_keys_private FROM PUBLIC;

-- Grant usage to roles that need it
GRANT USAGE ON SCHEMA api_keys_private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA api_keys_private TO service_role;

-- Create our API key role
CREATE ROLE api_key NOBYPASSRLS;
GRANT api_key TO authenticator;
GRANT anon TO api_key;

CREATE TYPE public.create_api_key_response AS (
  id UUID,
  name TEXT,
  key TEXT,
  key_prefix TEXT,
  account_id UUID,
  scopes JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Function 1: Create API Key (accessible to authenticated users)
CREATE OR REPLACE FUNCTION public.create_api_key(
    p_account_id UUID,
    p_name TEXT,
    p_scopes JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
    RETURNS public.create_api_key_response AS
$$
DECLARE
    v_is_authorized BOOLEAN;
    v_key           TEXT;
    v_key_prefix    TEXT;
    v_key_hash      TEXT;
    v_id            UUID;
    v_created_at    TIMESTAMPTZ;
BEGIN
    select public.has_role_on_account(p_account_id) into v_is_authorized;

    -- Security check: Verify user has permission to create API keys for this account
    IF NOT (v_is_authorized) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to create API keys for this account';
    END IF;

    -- Generate a secure random API key
    v_key := 'sk_' || encode(gen_random_bytes(32), 'base64');
    v_key := replace(replace(replace(v_key, '/', ''), '+', ''), '=', '');
    v_key_prefix := substring(v_key, 1, 7);

    -- Hash the key using pgcrypto's crypt function with a strong algorithm
    v_key_hash := crypt(v_key, gen_salt('bf', 12));

    -- Insert the new API key record
    INSERT INTO api_keys_private.api_keys (account_id,
                                           name,
                                           key_prefix,
                                           key_hash,
                                           scopes,
                                           expires_at,
                                           created_by)
    VALUES (p_account_id,
            p_name,
            v_key_prefix,
            v_key_hash,
            p_scopes,
            p_expires_at,
            auth.uid())
    RETURNING id, created_at INTO v_id, v_created_at;

    -- Return the API key details including the full key (only shown once)
    RETURN (
            v_id, p_name, v_key, v_key_prefix, p_account_id, p_scopes, p_expires_at, v_created_at
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: List API Keys for an account
CREATE OR REPLACE FUNCTION public.list_api_keys(
    p_account_id UUID
)
    RETURNS TABLE
            (
                id           UUID,
                name         TEXT,
                key_prefix   TEXT,
                scopes       JSONB,
                expires_at   TIMESTAMPTZ,
                created_at   TIMESTAMPTZ,
                last_used_at TIMESTAMPTZ,
                is_active    BOOLEAN,
                created_by   UUID
            )
AS
$$
BEGIN
    -- Security check: Verify user has permission to view API keys for this account
    IF NOT (
        public.has_role_on_account(p_account_id)
        ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to view API keys for this account';
    END IF;

    -- Return API keys (without sensitive hash information)
    RETURN QUERY
        SELECT k.id,
               k.name,
               k.key_prefix::TEXT,
               k.scopes,
               k.expires_at,
               k.created_at,
               k.last_used_at,
               k.is_active,
               k.created_by
        FROM api_keys_private.api_keys k
        WHERE k.account_id = p_account_id
        ORDER BY k.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Revoke API Key
CREATE OR REPLACE FUNCTION public.revoke_api_key(
    p_api_key_id UUID
)
    RETURNS BOOLEAN AS
$$
DECLARE
    v_account_id UUID;
BEGIN
    -- Get the account ID for this API key
    SELECT account_id
    INTO v_account_id
    FROM api_keys_private.api_keys
    WHERE id = p_api_key_id;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'API key not found';
    END IF;

    -- Verify user is authorized to revoke API keys
    IF NOT (
        public.has_role_on_account(
                v_account_id
        )
        ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to revoke API keys for this account';
    END IF;

    -- Revoke the API key
    UPDATE api_keys_private.api_keys
    SET is_active = FALSE
    WHERE id = p_api_key_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TYPE public.verify_api_key_response AS (
  valid BOOLEAN,
  api_key_id UUID,
  account_id UUID,
  error TEXT
);

-- Function 5: Verify API Key (for authentication)
CREATE OR REPLACE FUNCTION public.verify_api_key(
    p_api_key TEXT
)
    RETURNS verify_api_key_response AS
$$
DECLARE
    v_key_prefix TEXT;
    v_key_record RECORD;
    v_found      BOOLEAN := FALSE;
BEGIN
    -- Extract key prefix
    v_key_prefix := substring(p_api_key, 1, 7);

    -- Find potential matching keys by prefix
    FOR v_key_record IN
        SELECT id, key_hash, account_id, is_active, expires_at
        FROM api_keys_private.api_keys
        WHERE key_prefix = v_key_prefix
          AND is_active = TRUE
        LOOP
            -- Check if the key matches
            IF crypt(p_api_key, v_key_record.key_hash) = v_key_record.key_hash THEN
                v_found := TRUE;

                -- Check if expired
                IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
                    RETURN (FALSE, NULL, NULL, 'Invalid API key');
                END IF;

                -- Return success with key details
                RETURN (TRUE, v_key_record.id, v_key_record.account_id, NULL);
            END IF;
        END LOOP;

    -- If we get here, no matching key was found
    RETURN (FALSE, NULL, NULL, 'Invalid API key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TYPE public.api_key_usage_log_response AS (
  success BOOLEAN,
  log_id UUID,
  timestamp TIMESTAMPTZ,
  error TEXT,
  error_code TEXT
);

-- Function 6: Log API Key Usage
CREATE OR REPLACE FUNCTION public.log_api_key_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS api_key_usage_log_response AS $$
DECLARE
  v_current_time TIMESTAMPTZ := now();
  v_log_id UUID;
BEGIN
  -- Update last_used_at timestamp
  UPDATE api_keys_private.api_keys
  SET last_used_at = v_current_time
  WHERE id = p_api_key_id;

  -- Insert usage log
  INSERT INTO api_keys_private.api_key_logs (
    api_key_id,
    endpoint,
    method,
    status_code,
    ip_address,
    user_agent,
    timestamp
  ) VALUES (
    p_api_key_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_ip_address,
    p_user_agent,
    v_current_time
  )
  RETURNING id INTO v_log_id;

  RETURN (TRUE, v_log_id, v_current_time, NULL, NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN (FALSE, NULL, NULL, SQLERRM, SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 7: Has Scope (for RLS policies)
CREATE OR REPLACE FUNCTION public.has_scope(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_scopes JSONB;
  v_api_key_id UUID;
BEGIN
  -- Get API key ID from session variable
  v_api_key_id := auth.uid();

  IF v_api_key_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get scopes for the current API key
  SELECT scopes INTO v_scopes
  FROM api_keys_private.api_keys
  WHERE id = v_api_key_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now());

  IF v_scopes IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for global wildcard
  IF v_scopes @> '[{"entity_type": "*", "entity_id": "*", "action": "*"}]' THEN
    RETURN TRUE;
  END IF;

  -- Check for entity type wildcard
  IF v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', '*',
    'action', '*'
  )) THEN
    RETURN TRUE;
  END IF;

  -- Check for specific action wildcard
  IF v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', '*',
    'action', p_action
  )) THEN
    RETURN TRUE;
  END IF;

  -- Check for specific entity permission
  IF v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'action', p_action
  )) OR v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'action', '*'
  )) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 8: Get API Key Account ID (for RLS policies)
CREATE OR REPLACE FUNCTION public.get_api_key_account_id()
    RETURNS UUID AS
$$
DECLARE
    v_api_key_id UUID;
    v_account_id UUID;
BEGIN
    v_api_key_id := auth.uid();

    IF v_api_key_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get account_id for this API key
    SELECT account_id
    INTO v_account_id
    FROM api_keys_private.api_keys
    WHERE id = v_api_key_id
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > now());

    RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.create_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_api_key_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_api_key TO service_role, api_key;
GRANT EXECUTE ON FUNCTION public.has_scope TO api_key;
GRANT EXECUTE ON FUNCTION public.get_api_key_account_id TO api_key;-- WEBHOOKS SEED
-- PLEASE NOTE: These webhooks are only for development purposes. Leave them as they are or add new ones.

-- These webhooks are only for development purposes.
-- In production, you should manually create webhooks in the Supabase dashboard (or create a migration to do so).
-- We don't do it because you'll need to manually add your webhook URL and secret key.

-- this webhook will be triggered after deleting an account
create trigger "accounts_teardown" after delete
on "public"."accounts" for each row
execute function "supabase_functions"."http_request"(
  'http://host.docker.internal:3000/api/db/webhook',
  'POST',
  '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}',
  '{}',
  '5000'
);

-- this webhook will be triggered after a delete on the subscriptions table
-- which should happen when a user deletes their account (and all their subscriptions)
create trigger "subscriptions_delete" after delete
on "public"."subscriptions" for each row
execute function "supabase_functions"."http_request"(
  'http://host.docker.internal:3000/api/db/webhook',
  'POST',
  '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}',
  '{}',
  '5000'
);

-- this webhook will be triggered after every insert on the invitations table
-- which should happen when a user invites someone to their account
create trigger "invitations_insert" after insert
on "public"."invitations" for each row
execute function "supabase_functions"."http_request"(
  'http://host.docker.internal:3000/api/db/webhook',
  'POST',
  '{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}',
  '{}',
  '5000'
);


-- DATA SEED
-- This is a data dump for testing purposes. It should be used to seed the database with data for testing.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
        ('00000000-0000-0000-0000-000000000000', 'b73eb03e-fb7a-424d-84ff-18e2791ce0b4', 'authenticated', 'authenticated', 'custom@audiencelab.io', '$2a$10$b3ZPpU6TU3or30QzrXnZDuATPAx2pPq3JW.sNaneVY3aafMSuR4yi', '2024-04-20 08:38:00.860548+00', NULL, '', '2024-04-20 08:37:43.343769+00', '', NULL, '', '', NULL, '2024-04-20 08:38:00.93864+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "b73eb03e-fb7a-424d-84ff-18e2791ce0b4", "email": "custom@audiencelab.io", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:37:43.3385+00', '2024-04-20 08:38:00.942809+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
        ('00000000-0000-0000-0000-000000000000', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'authenticated', 'authenticated', 'test@audiencelab.io', '$2a$10$NaMVRrI7NyfwP.AfAVWt6O/abulGnf9BBqwa6DqdMwXMvOCGpAnVO', '2024-04-20 08:20:38.165331+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-04-20 09:36:02.521776+00', '{"provider": "email", "providers": ["email"], "role": "super-admin"}', '{"sub": "31a03e74-1639-45b6-bfa7-77447f1a4762", "email": "test@audiencelab.io", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:20:34.459113+00', '2024-04-20 10:07:48.554125+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
        ('00000000-0000-0000-0000-000000000000', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', 'authenticated', 'authenticated', 'owner@audiencelab.io', '$2a$10$D6arGxWJShy8q4RTW18z7eW0vEm2hOxEUovUCj5f3NblyHfamm5/a', '2024-04-20 08:36:37.517993+00', NULL, '', '2024-04-20 08:36:27.639648+00', '', NULL, '', '', NULL, '2024-04-20 08:36:37.614337+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", "email": "owner@audiencelab.io", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:36:27.630379+00', '2024-04-20 08:36:37.617955+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
        ('00000000-0000-0000-0000-000000000000', '6b83d656-e4ab-48e3-a062-c0c54a427368', 'authenticated', 'authenticated', 'member@audiencelab.io', '$2a$10$6h/x.AX.6zzphTfDXIJMzuYx13hIYEi/Iods9FXH19J2VxhsLycfa', '2024-04-20 08:41:15.376778+00', NULL, '', '2024-04-20 08:41:08.689674+00', '', NULL, '', '', NULL, '2024-04-20 08:41:15.484606+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "6b83d656-e4ab-48e3-a062-c0c54a427368", "email": "member@audiencelab.io", "email_verified": false, "phone_verified": false}', NULL, '2024-04-20 08:41:08.683395+00', '2024-04-20 08:41:15.485494+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);

--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
 ('31a03e74-1639-45b6-bfa7-77447f1a4762', '31a03e74-1639-45b6-bfa7-77447f1a4762', '{"sub": "31a03e74-1639-45b6-bfa7-77447f1a4762", "email": "test@audiencelab.io", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:20:34.46275+00', '2024-04-20 08:20:34.462773+00', '2024-04-20 08:20:34.462773+00', '9bb58bad-24a4-41a8-9742-1b5b4e2d8abd'),        ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '{"sub": "5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", "email": "owner@audiencelab.io", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:36:27.637388+00', '2024-04-20 08:36:27.637409+00', '2024-04-20 08:36:27.637409+00', '090598a1-ebba-4879-bbe3-38d517d5066f'),
        ('b73eb03e-fb7a-424d-84ff-18e2791ce0b4', 'b73eb03e-fb7a-424d-84ff-18e2791ce0b4', '{"sub": "b73eb03e-fb7a-424d-84ff-18e2791ce0b4", "email": "custom@audiencelab.io", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:37:43.342194+00', '2024-04-20 08:37:43.342218+00', '2024-04-20 08:37:43.342218+00', '4392e228-a6d8-4295-a7d6-baed50c33e7c'),
        ('6b83d656-e4ab-48e3-a062-c0c54a427368', '6b83d656-e4ab-48e3-a062-c0c54a427368', '{"sub": "6b83d656-e4ab-48e3-a062-c0c54a427368", "email": "member@audiencelab.io", "email_verified": false, "phone_verified": false}', 'email', '2024-04-20 08:41:08.687948+00', '2024-04-20 08:41:08.687982+00', '2024-04-20 08:41:08.687982+00', 'd122aca5-4f29-43f0-b1b1-940b000638db');

--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--





--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accounts" ("id", "primary_owner_user_id", "name", "slug", "email", "is_personal_account", "updated_at", "created_at", "created_by", "updated_by", "picture_url", "public_data") VALUES
        ('5deaa894-2094-4da3-b4fd-1fada0809d1c', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'Audience Lab', 'audience-lab', NULL, false, NULL, NULL, NULL, NULL, NULL, '{}');

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("name", "hierarchy_level") VALUES
        ('custom-role', 4);

--
-- Data for Name: accounts_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accounts_memberships" ("user_id", "account_id", "account_role", "created_at", "updated_at", "created_by", "updated_by") VALUES
        ('31a03e74-1639-45b6-bfa7-77447f1a4762', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'owner', '2024-04-20 08:21:16.802867+00', '2024-04-20 08:21:16.802867+00', NULL, NULL),
        ('5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'owner', '2024-04-20 08:36:44.21028+00', '2024-04-20 08:36:44.21028+00', NULL, NULL),
        ('b73eb03e-fb7a-424d-84ff-18e2791ce0b4', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'custom-role', '2024-04-20 08:38:02.50993+00', '2024-04-20 08:38:02.50993+00', NULL, NULL),
        ('6b83d656-e4ab-48e3-a062-c0c54a427368', '5deaa894-2094-4da3-b4fd-1fada0809d1c', 'member', '2024-04-20 08:41:17.833709+00', '2024-04-20 08:41:17.833709+00', NULL, NULL);


--
-- Data for Name: billing_customers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscription_items; Type: TABLE DATA; Schema: public; Owner: postgres
--


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 5, true);




--
-- Name: billing_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."billing_customers_id_seq"', 1, false);


--
-- Name: invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."invitations_id_seq"', 19, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."role_permissions_id_seq"', 7, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 19, true);
