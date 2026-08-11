-- Fellowship Attendance System — schema. Run in Supabase SQL Editor.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.members (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null check (char_length(trim(name)) >= 2),
  phone       text        not null,
  email       text,
  course      text,
  created_at  timestamptz not null default now(),
  constraint members_phone_unique unique (phone)
);

create table if not exists public.attendance (
  id               uuid        primary key default gen_random_uuid(),
  member_id        uuid        not null,
  attendance_date  date        not null default current_date,
  check_in_time    timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint attendance_member_fk
    foreign key (member_id) references public.members (id)
    on delete cascade,
  constraint attendance_one_per_member_per_day
    unique (member_id, attendance_date)
);

create index if not exists idx_members_name_trgm
  on public.members using gin (name gin_trgm_ops);
create index if not exists idx_members_created_at
  on public.members (created_at);
create index if not exists idx_attendance_member_id
  on public.attendance (member_id);
create index if not exists idx_attendance_date
  on public.attendance (attendance_date);
create index if not exists idx_attendance_check_in_time
  on public.attendance (check_in_time desc);

alter table public.members    enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "members_select"    on public.members;
drop policy if exists "members_insert"    on public.members;
drop policy if exists "attendance_select" on public.attendance;
drop policy if exists "attendance_insert" on public.attendance;

create policy "members_select"    on public.members    for select using (true);
create policy "members_insert"    on public.members    for insert with check (true);
create policy "attendance_select" on public.attendance for select using (true);
create policy "attendance_insert" on public.attendance for insert with check (true);

create or replace function public.attendance_by_day(range_start date, range_end date)
returns table (attendance_date date, check_ins bigint)
language sql stable security invoker set search_path = public
as $$
  select a.attendance_date, count(*) as check_ins
  from public.attendance a
  where a.attendance_date between range_start and range_end
  group by a.attendance_date
  order by a.attendance_date;
$$;

create or replace function public.last_meetings(meeting_count integer default 7)
returns table (attendance_date date, check_ins bigint)
language sql stable security invoker set search_path = public
as $$
  select a.attendance_date, count(*) as check_ins
  from public.attendance a
  group by a.attendance_date
  order by a.attendance_date desc
  limit meeting_count;
$$;
