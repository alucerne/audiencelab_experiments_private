create function updated_at_column() returns trigger
    language plpgsql
as
$$
BEGIN
    -- Update the timestamp
    NEW.updated_at = NOW();

    -- Calculate resolution time
    NEW.resolution_time = EXTRACT(EPOCH FROM (NEW.updated_at - NEW.created_at));

    -- Increment the update counter
    -- If the field is NULL (first update), set it to 1
    IF NEW.update_count IS NULL THEN
        NEW.update_count = 1;
    ELSE
        NEW.update_count = NEW.update_count + 1;
    END IF;

    RETURN NEW;
END;
$$;

alter function updated_at_column() owner to postgres;

grant execute on function updated_at_column() to service_role;


drop table enqueue_job;

create table enqueue_job
(
    id              uuid                     default uuid_generate_v4() not null
        primary key,
    account_id      uuid                                                not null
        references accounts
            on delete cascade,
    audience_id     uuid                                                not null
        references audience
            on delete cascade,
    status          text                     default 'no data'::text    not null,
    csv_url         text,
    current         integer,
    total           integer,
    created_at      timestamp with time zone default now()              not null,
    updated_at      timestamp with time zone default now()              not null,
    payload_enqueue text,
    payload_process text,
    payload_hydrate text,
    resolution_time double precision,
    update_count    integer
);

alter table enqueue_job
    owner to postgres;

create index ix_enqueue_job_account_id
    on enqueue_job (account_id);

create trigger set_updated_at
    before update
    on enqueue_job
    for each row
execute procedure updated_at_column();

create policy select_enqueue_job on enqueue_job
    for select
    to authenticated
    using (has_role_on_account(account_id));

create policy delete_enqueue_job on enqueue_job
    for delete
    to authenticated
    using (has_role_on_account(account_id));

create policy update_enqueue_job on enqueue_job
    for update
    to authenticated
    using (has_role_on_account(account_id))
with check (has_role_on_account(account_id));

create policy insert_enqueue_job on enqueue_job
    for insert
    to authenticated
    with check (has_role_on_account(account_id));

grant delete, insert, references, select, trigger, truncate, update on enqueue_job to anon;

grant delete, insert, references, select, trigger, truncate, update on enqueue_job to authenticated;

grant delete, insert, select, update on enqueue_job to service_role;

