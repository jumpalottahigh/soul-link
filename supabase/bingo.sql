create table if not exists public.bingo_boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.bingo_cells (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.bingo_boards(id) on delete cascade,
  position integer not null check (position between 0 and 24),
  text text not null default '' check (char_length(text) <= 200),
  unique (board_id, position)
);

create table if not exists public.bingo_marks (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.bingo_cells(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed boolean not null default false,
  unique (cell_id, user_id)
);

create or replace function public.can_access_bingo(board_owner uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select board_owner = auth.uid()
    or board_owner = (select partner_id from public.profiles where id = auth.uid())
$$;

revoke all on function public.can_access_bingo(uuid) from public, anon;
grant execute on function public.can_access_bingo(uuid) to authenticated;

alter table public.bingo_boards enable row level security;
alter table public.bingo_cells enable row level security;
alter table public.bingo_marks enable row level security;

drop policy if exists "bingo boards select" on public.bingo_boards;
create policy "bingo boards select" on public.bingo_boards
  for select to authenticated using (public.can_access_bingo(owner_id));
drop policy if exists "bingo boards update" on public.bingo_boards;
create policy "bingo boards update" on public.bingo_boards
  for update to authenticated using (public.can_access_bingo(owner_id))
  with check (public.can_access_bingo(owner_id));
drop policy if exists "bingo boards delete" on public.bingo_boards;
create policy "bingo boards delete" on public.bingo_boards
  for delete to authenticated using (public.can_access_bingo(owner_id));
drop policy if exists "bingo cells select" on public.bingo_cells;
create policy "bingo cells select" on public.bingo_cells
  for select to authenticated using (exists (
    select 1 from public.bingo_boards board
    where board.id = board_id and public.can_access_bingo(board.owner_id)
  ));
drop policy if exists "bingo marks select" on public.bingo_marks;
create policy "bingo marks select" on public.bingo_marks
  for select to authenticated using (exists (
    select 1 from public.bingo_cells cell
    join public.bingo_boards board on board.id = cell.board_id
    where cell.id = cell_id and public.can_access_bingo(board.owner_id)
  ));

revoke all on public.bingo_boards, public.bingo_cells, public.bingo_marks from anon, authenticated;
grant select, delete on public.bingo_boards to authenticated;
grant update (name) on public.bingo_boards to authenticated;
grant select on public.bingo_cells, public.bingo_marks to authenticated;

create or replace function public.create_bingo_board(board_id uuid, board_name text, cell_ids uuid[])
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to create a board';
  end if;
  if cardinality(cell_ids) is distinct from 25 then
    raise exception 'A board must have 25 cells';
  end if;
  insert into public.bingo_boards(id, owner_id, name)
  values (board_id, auth.uid(), btrim(board_name));
  insert into public.bingo_cells(id, board_id, position)
  select cell_id, board_id, (ordinality - 1)::integer
  from unnest(cell_ids) with ordinality as entries(cell_id, ordinality);
end;
$$;

create or replace function public.save_bingo_cell(target_cell uuid, cell_text text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform cell.id from public.bingo_cells cell
  join public.bingo_boards board on board.id = cell.board_id
  where cell.id = target_cell and public.can_access_bingo(board.owner_id)
  for update of cell;
  if not found then
    raise exception 'Cell not found or access denied';
  end if;
  update public.bingo_cells set text = btrim(cell_text) where id = target_cell;
  if btrim(cell_text) = '' then
    update public.bingo_marks set completed = false where cell_id = target_cell;
  end if;
end;
$$;

create or replace function public.set_bingo_mark(target_cell uuid, is_completed boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  current_text text;
begin
  select cell.text into current_text from public.bingo_cells cell
  join public.bingo_boards board on board.id = cell.board_id
  where cell.id = target_cell and public.can_access_bingo(board.owner_id)
  for update of cell;
  if not found then
    raise exception 'Cell not found or access denied';
  end if;
  if current_text = '' then
    raise exception 'Add an item before marking this cell';
  end if;
  insert into public.bingo_marks(cell_id, user_id, completed)
  values (target_cell, auth.uid(), is_completed)
  on conflict (cell_id, user_id) do update set completed = excluded.completed;
end;
$$;

revoke all on function public.create_bingo_board(uuid, text, uuid[]) from public, anon;
revoke all on function public.save_bingo_cell(uuid, text) from public, anon;
revoke all on function public.set_bingo_mark(uuid, boolean) from public, anon;
grant execute on function public.create_bingo_board(uuid, text, uuid[]) to authenticated;
grant execute on function public.save_bingo_cell(uuid, text) to authenticated;
grant execute on function public.set_bingo_mark(uuid, boolean) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['bingo_boards', 'bingo_cells', 'bingo_marks'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;