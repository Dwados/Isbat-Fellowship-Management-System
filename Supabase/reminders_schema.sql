-- WhatsApp Reminders & Broadcasts Schema for Isbat Fellowship Management System
-- Run this in your Supabase SQL Editor.

-- 1. Reminder Settings Table
create table if not exists public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  next_meeting_date date not null default (current_date + ((7 - extract(dow from current_date)::integer) % 7)),
  next_meeting_time text not null default '17:00',
  venue text not null default 'Main Fellowship Hall, ISBAT University',
  topic text default 'Weekly Youth Fellowship & Worship',
  message_template text not null default 'Hello {{name}}! 👋 You are warmly invited to our upcoming ISBAT Fellowship meeting on *{{meeting_date}}* at *{{meeting_time}}* in *{{venue}}*.\n\nTheme: *{{topic}}*.\n\nWe look forward to seeing you there! God bless you! 🙏✨',
  auto_send_enabled boolean not null default true,
  auto_send_day_of_week integer not null default 5, -- 0=Sunday, 5=Friday, 6=Saturday
  auto_send_time text not null default '10:00',
  target_cohort text not null default 'inactive', -- 'all', 'inactive', 'active'
  whatsapp_phone_number_id text,
  whatsapp_access_token text,
  updated_at timestamptz not null default now()
);

-- Ensure a single default settings row exists
insert into public.reminder_settings (
  next_meeting_date,
  next_meeting_time,
  venue,
  topic,
  message_template,
  auto_send_enabled,
  auto_send_day_of_week,
  auto_send_time,
  target_cohort
)
select 
  current_date + interval '3 days',
  '17:00',
  'Main Fellowship Hall, ISBAT University',
  'Weekly Youth Fellowship & Worship',
  'Hello {{name}}! 👋 You are warmly invited to our upcoming ISBAT Fellowship meeting on *{{meeting_date}}* at *{{meeting_time}}* in *{{venue}}*.\n\nTheme: *{{topic}}*.\n\nWe look forward to seeing you there! God bless you! 🙏✨',
  true,
  5,
  '10:00',
  'inactive'
where not exists (select 1 from public.reminder_settings);

-- 2. Reminder & Broadcast Delivery Logs Table
create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members (id) on delete set null,
  recipient_name text not null,
  phone text not null,
  meeting_date date not null,
  message_content text not null,
  channel text not null default 'whatsapp_cloud_api', -- 'whatsapp_cloud_api', 'whatsapp_web'
  status text not null default 'sent', -- 'sent', 'failed', 'opened_wa'
  error_message text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_reminder_logs_sent_at on public.reminder_logs (sent_at desc);
create index if not exists idx_reminder_logs_meeting_date on public.reminder_logs (meeting_date desc);
create index if not exists idx_reminder_logs_member_id on public.reminder_logs (member_id);

-- Enable RLS
alter table public.reminder_settings enable row level security;
alter table public.reminder_logs enable row level security;

-- Policies for public / authenticated app access
drop policy if exists "reminder_settings_select" on public.reminder_settings;
drop policy if exists "reminder_settings_insert" on public.reminder_settings;
drop policy if exists "reminder_settings_update" on public.reminder_settings;

create policy "reminder_settings_select" on public.reminder_settings for select using (true);
create policy "reminder_settings_insert" on public.reminder_settings for insert with check (true);
create policy "reminder_settings_update" on public.reminder_settings for update using (true);

drop policy if exists "reminder_logs_select" on public.reminder_logs;
drop policy if exists "reminder_logs_insert" on public.reminder_logs;

create policy "reminder_logs_select" on public.reminder_logs for select using (true);
create policy "reminder_logs_insert" on public.reminder_logs for insert with check (true);

-- 3. SQL helper function to get members categorized by attendance recency
create or replace function public.get_inactive_past_members(days_since_last_attendance integer default 14)
returns table (
  id uuid,
  name text,
  phone text,
  email text,
  course text,
  last_attended_date date,
  total_attendances bigint
)
language sql stable security invoker set search_path = public
as $$
  with member_stats as (
    select 
      m.id,
      m.name,
      m.phone,
      m.email,
      m.course,
      max(a.attendance_date) as last_attended_date,
      count(a.id) as total_attendances
    from public.members m
    left join public.attendance a on a.member_id = m.id
    group by m.id, m.name, m.phone, m.email, m.course
  )
  select 
    id,
    name,
    phone,
    email,
    course,
    last_attended_date,
    total_attendances
  from member_stats
  where last_attended_date is null or last_attended_date < (current_date - days_since_last_attendance)
  order by last_attended_date asc nulls first, name asc;
$$;
