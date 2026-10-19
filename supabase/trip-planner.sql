-- Trip Planner schema. Run in the Supabase SQL editor; safe to re-run.
-- A couple can have many trips; both partners can read and edit all of them.

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'My trip',
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- Upgrade path for databases created before trips had names.
alter table public.trips add column if not exists name text not null default 'My trip';
alter table public.trips drop constraint if exists trips_name_check;
alter table public.trips add constraint trips_name_check
  check (char_length(btrim(name)) between 1 and 60);

create table if not exists public.trip_events (
  id uuid primary key,
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  date date not null,
  start_minute int not null check (start_minute % 60 = 0 and start_minute >= 420),
  end_minute int not null check (end_minute % 60 = 0 and end_minute <= 1380),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_minute - start_minute >= 60)
);

create index if not exists trip_events_trip_id_idx on public.trip_events (trip_id);

-- True when the trip owner is the caller or the caller's partner.
create or replace function public.can_access_trip(trip_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select trip_owner = auth.uid()
    or trip_owner = (select partner_id from public.profiles where id = auth.uid())
$$;

-- Replaced by direct inserts under the "trips insert" policy below.
drop function if exists public.get_or_create_trip(date, date);

revoke all on function public.can_access_trip(uuid) from public, anon;
grant execute on function public.can_access_trip(uuid) to authenticated;

alter table public.trips enable row level security;
alter table public.trip_events enable row level security;

drop policy if exists "trips select" on public.trips;
drop policy if exists "trips insert" on public.trips;
drop policy if exists "trips update" on public.trips;
drop policy if exists "trips delete" on public.trips;
create policy "trips select" on public.trips
  for select to authenticated using (public.can_access_trip(owner_id));
create policy "trips insert" on public.trips
  for insert to authenticated with check (owner_id = auth.uid());
create policy "trips update" on public.trips
  for update to authenticated
  using (public.can_access_trip(owner_id))
  with check (public.can_access_trip(owner_id));
create policy "trips delete" on public.trips
  for delete to authenticated using (public.can_access_trip(owner_id));

drop policy if exists "trip_events all" on public.trip_events;
create policy "trip_events all" on public.trip_events
  for all to authenticated
  using (exists (
    select 1 from public.trips t
    where t.id = trip_events.trip_id and public.can_access_trip(t.owner_id)
  ))
  with check (exists (
    select 1 from public.trips t
    where t.id = trip_events.trip_id and public.can_access_trip(t.owner_id)
  ));

-- Realtime: add each table to the publication only if it isn't there yet.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_events'
  ) then
    alter publication supabase_realtime add table public.trip_events;
  end if;
end;
$$;
