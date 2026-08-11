// create-project.mjs — builds the entire Fellowship Attendance System.
// Usage: node create-project.mjs   (run inside the fellowship-attendance folder)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = {

'package.json': `
{
  "name": "fellowship-attendance",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.441.0",
    "qrcode.react": "^3.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8"
  }
}
`,

'vite.config.js': `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
`,

'tailwind.config.js': `
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#dcebe3',
          200: '#b9d7c9',
          300: '#8fbda8',
          400: '#629d84',
          500: '#458168',
          600: '#356754',
          700: '#2c5345',
          800: '#254339',
          900: '#1f3830',
          950: '#0f1f1a',
        },
      },
      fontFamily: {
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
`,

'postcss.config.js': `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,

'index.html': `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fellowship Attendance</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,

'.env.example': `
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
`,

'.gitignore': `
node_modules
dist
.env
.env.local
.env.*.local
*.log
.DS_Store
`,

'README.md': `
# Fellowship Attendance System

QR-code check-in for a fellowship. React + Vite + Tailwind + Supabase (no backend server).

## Setup

1. Create a Supabase project.
2. SQL Editor: run supabase/schema.sql, then supabase/seed.sql.
3. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   (Supabase Dashboard, Project Settings, API).
4. npm install
5. npm run dev  ->  http://localhost:5173

## Pages

- /            QR kiosk (display at the entrance)
- /check-in    member check-in + registration flow
- /dashboard   today's stats + recent check-ins
- /members     search + profiles + attendance history
- /attendance  records filtered by date
- /analytics   bar + line charts
`,

'supabase/schema.sql': `
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
`,

'supabase/seed.sql': `
-- Sample data: 10 members + attendance across 5 meetings (incl. today).

insert into public.members (id, name, phone, email, course, created_at) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', 'Chidi Okafor',  '+2348031110001', 'chidi.okafor@example.com',  'Computer Science',       now() - interval '62 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', 'Amina Bello',   '+2348031110002', 'amina.bello@example.com',   'Law',                    now() - interval '55 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', 'Tunde Adeyemi', '+2348031110003', null,                         null,                     now() - interval '48 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', 'Ngozi Eze',     '+2348031110004', 'ngozi.eze@example.com',     'Medicine',               now() - interval '41 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', 'Ibrahim Musa',  '+2348031110005', null,                         'Electrical Engineering', now() - interval '35 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', 'Funke Alade',   '+2348031110006', 'funke.alade@example.com',   'Accounting',             now() - interval '28 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', 'Emeka Nwosu',   '+2348031110007', 'emeka.nwosu@example.com',   null,                     now() - interval '24 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', 'Halima Sani',   '+2348031110008', 'halima.sani@example.com',   'Biochemistry',           now() - interval '18 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', 'Segun Adewale', '+2348031110009', null,                         null,                     now() - interval '12 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d410', 'Blessing Umoh', '+2348031110010', 'blessing.umoh@example.com', 'Mass Communication',     now() - interval '2 hours')
on conflict (id) do nothing;

insert into public.attendance (member_id, attendance_date, check_in_time) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date,      now() - interval '72 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date,      now() - interval '65 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date,      now() - interval '51 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', current_date,      now() - interval '23 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d410', current_date,      now() - interval '4 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 3,  current_date - 3 + interval '9 hours 5 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', current_date - 3,  current_date - 3 + interval '9 hours 11 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date - 3,  current_date - 3 + interval '9 hours 14 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date - 3,  current_date - 3 + interval '9 hours 26 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', current_date - 3,  current_date - 3 + interval '9 hours 38 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', current_date - 3,  current_date - 3 + interval '10 hours 2 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 7,  current_date - 7 + interval '9 hours 2 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', current_date - 7,  current_date - 7 + interval '9 hours 9 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', current_date - 7,  current_date - 7 + interval '9 hours 17 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date - 7,  current_date - 7 + interval '9 hours 21 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', current_date - 7,  current_date - 7 + interval '9 hours 33 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', current_date - 7,  current_date - 7 + interval '9 hours 47 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', current_date - 7,  current_date - 7 + interval '10 hours 5 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 10, current_date - 10 + interval '9 hours 8 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date - 10, current_date - 10 + interval '9 hours 15 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', current_date - 10, current_date - 10 + interval '9 hours 29 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', current_date - 10, current_date - 10 + interval '9 hours 41 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', current_date - 10, current_date - 10 + interval '9 hours 58 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 14, current_date - 14 + interval '9 hours 3 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', current_date - 14, current_date - 14 + interval '9 hours 12 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date - 14, current_date - 14 + interval '9 hours 19 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', current_date - 14, current_date - 14 + interval '9 hours 24 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date - 14, current_date - 14 + interval '9 hours 36 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', current_date - 14, current_date - 14 + interval '9 hours 52 minutes')
on conflict on constraint attendance_one_per_member_per_day do nothing;
`,

'src/main.jsx': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`,

'src/App.jsx': `
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AnalyticsPage from './pages/AnalyticsPage';
import AttendancePage from './pages/AttendancePage';
import CheckInPage from './pages/CheckInPage';
import DashboardPage from './pages/DashboardPage';
import KioskPage from './pages/KioskPage';
import MemberProfilePage from './pages/MemberProfilePage';
import MembersPage from './pages/MembersPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskPage />} />
      <Route path="/check-in" element={<CheckInPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/:id" element={<MemberProfilePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
`,

'src/index.css': `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply bg-stone-50 font-sans text-stone-900 antialiased;
  }
}

@layer components {
  .card {
    @apply rounded-2xl border border-stone-200 bg-white shadow-sm;
  }
  .label {
    @apply mb-1.5 block text-sm font-medium text-stone-700;
  }
  .input {
    @apply w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20;
  }
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60;
  }
}
`,

'src/lib/supabase.js': `
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Create a .env file from .env.example and restart the dev server.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
`,

'src/utils/dates.js': `
import { format, parseISO } from 'date-fns';

export function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return format(parseISO(isoDate), 'EEE, MMM d, yyyy');
}

export function formatDateShort(isoDate) {
  if (!isoDate) return '';
  return format(parseISO(isoDate), 'MMM d');
}

export function formatTime(isoDateTime) {
  if (!isoDateTime) return '—';
  return format(new Date(isoDateTime), 'h:mm a');
}
`,

'src/utils/phone.js': `
export function normalizePhone(input = '') {
  return String(input).trim().replace(/[\\s\\-().]/g, '');
}

export function isValidPhone(input = '') {
  return /^\\+?\\d{10,15}$/.test(normalizePhone(input));
}
`,

'src/utils/errors.js': `
export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  if (err.code === '23505') return 'This record already exists (duplicate).';
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  return err.message || 'Something went wrong. Please try again.';
}
`,

'src/utils/misc.js': `
const AVATAR_PALETTE = [
  'bg-brand-100 text-brand-800',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-emerald-100 text-emerald-800',
];

export function avatarClasses(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
`,

'src/services/membersService.js': `
import { supabase } from '../lib/supabase';
import { normalizePhone } from '../utils/phone';

export async function findMemberByPhone(phone) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', normalizePhone(phone))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMembers(search = '') {
  const q = search.trim().replace(/[%,()]/g, '');
  let query = supabase.from('members').select('*').order('name', { ascending: true });
  if (q) query = query.or('name.ilike.%' + q + '%,phone.ilike.%' + q + '%');
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMember({ name, phone, email, course }) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: name.trim(),
      phone: normalizePhone(phone),
      email: email?.trim() || null,
      course: course?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function countMembers() {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function countNewMembersSince(isoDateTime) {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDateTime);
  if (error) throw error;
  return count ?? 0;
}
`,

'src/services/attendanceService.js': `
import { supabase } from '../lib/supabase';
import { daysAgoISO, todayISO } from '../utils/dates';

const ATTENDANCE_SELECT =
  'id, attendance_date, check_in_time, member:members(id, name, phone, course)';

export async function findAttendance(memberId, dateISO = todayISO()) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, attendance_date, check_in_time')
    .eq('member_id', memberId)
    .eq('attendance_date', dateISO)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordAttendance(memberId, dateISO = todayISO()) {
  const existing = await findAttendance(memberId, dateISO);
  if (existing) return { created: false, record: existing };

  const { data, error } = await supabase
    .from('attendance')
    .insert({ member_id: memberId, attendance_date: dateISO })
    .select('id, attendance_date, check_in_time')
    .single();

  if (error) {
    if (error.code === '23505') return { created: false, record: null };
    throw error;
  }
  return { created: true, record: data };
}

export async function getAttendanceForDate(dateISO) {
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .eq('attendance_date', dateISO)
    .order('check_in_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRecentCheckIns(limit = 10) {
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .eq('attendance_date', todayISO())
    .order('check_in_time', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getAttendanceForMember(memberId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, attendance_date, check_in_time')
    .eq('member_id', memberId)
    .order('attendance_date', { ascending: false })
    .order('check_in_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function countAttendanceForDate(dateISO) {
  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('attendance_date', dateISO);
  if (error) throw error;
  return count ?? 0;
}

export async function getAttendanceByDay(days = 14) {
  const { data, error } = await supabase.rpc('attendance_by_day', {
    range_start: daysAgoISO(days - 1),
    range_end: todayISO(),
  });
  if (error) throw error;

  const counts = new Map((data ?? []).map((r) => [r.attendance_date, Number(r.check_ins)]));
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = daysAgoISO(i);
    result.push({ date, count: counts.get(date) ?? 0 });
  }
  return result;
}

export async function getLastMeetings(n = 7) {
  const { data, error } = await supabase.rpc('last_meetings', { meeting_count: n });
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({ date: r.attendance_date, count: Number(r.check_ins) }))
    .reverse();
}
`,

'src/services/statsService.js': `
import { startOfTodayISO, todayISO } from '../utils/dates';
import { countAttendanceForDate } from './attendanceService';
import { countMembers, countNewMembersSince } from './membersService';

export async function getDashboardStats() {
  const [attendanceToday, totalMembers, newMembersToday] = await Promise.all([
    countAttendanceForDate(todayISO()),
    countMembers(),
    countNewMembersSince(startOfTodayISO()),
  ]);
  return { attendanceToday, totalMembers, newMembersToday };
}
`,

'src/hooks/useCheckIn.js': `
import { useCallback, useState } from 'react';
import { recordAttendance } from '../services/attendanceService';
import { createMember, findMemberByPhone } from '../services/membersService';
import { friendlyError } from '../utils/errors';
import { normalizePhone } from '../utils/phone';

export function useCheckIn() {
  const [step, setStep] = useState('phone');
  const [member, setMember] = useState(null);
  const [record, setRecord] = useState(null);
  const [prefillPhone, setPrefillPhone] = useState('');
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStep('phone');
    setMember(null);
    setRecord(null);
    setPrefillPhone('');
    setError(null);
  }, []);

  const submitPhone = useCallback(async (rawPhone) => {
    setError(null);
    setStep('checking');
    try {
      const found = await findMemberByPhone(rawPhone);
      if (!found) {
        setPrefillPhone(normalizePhone(rawPhone));
        setStep('not-found');
        return;
      }
      setMember(found);
      const result = await recordAttendance(found.id);
      setRecord(result.record);
      setStep(result.created ? 'welcome' : 'already');
    } catch (err) {
      setError(friendlyError(err));
      setStep('error');
    }
  }, []);

  const openRegistration = useCallback(() => {
    setError(null);
    setStep('register');
  }, []);

  const submitRegistration = useCallback(async (form) => {
    setError(null);
    setStep('registering');
    try {
      const created = await createMember(form);
      const result = await recordAttendance(created.id);
      setMember(created);
      setRecord(result.record);
      setStep('registered');
    } catch (err) {
      if (err?.code === '23505') {
        setError('That phone number is already registered. Go back and check in with it instead.');
      } else {
        setError(friendlyError(err));
      }
      setStep('register');
    }
  }, []);

  return {
    step, member, record, prefillPhone, error,
    reset, submitPhone, openRegistration, submitRegistration,
  };
}
`,

'src/hooks/useStats.js': `
import { useCallback, useEffect, useState } from 'react';
import { getDashboardStats } from '../services/statsService';
import { friendlyError } from '../utils/errors';

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getDashboardStats());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
`,

'src/hooks/useDebounce.js': `
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
`,

'src/components/Spinner.jsx': `
export default function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={'animate-spin ' + className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}
`,

'src/components/Alert.jsx': `
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const VARIANTS = {
  success: { classes: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  error: { classes: 'border-red-200 bg-red-50 text-red-800', Icon: XCircle },
  warning: { classes: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
  info: { classes: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
};

export default function Alert({ variant = 'info', className = '', children }) {
  const { classes, Icon } = VARIANTS[variant] ?? VARIANTS.info;
  return (
    <div role="alert" className={'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ' + classes + ' ' + className}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
`,

'src/components/LoadingBlock.jsx': `
import Spinner from './Spinner';

export default function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-stone-200 bg-white py-14 text-sm text-stone-500">
      <Spinner className="h-4 w-4 text-brand-700" />
      {label}
    </div>
  );
}
`,

'src/components/EmptyState.jsx': `
export default function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {message && <p className="max-w-sm text-sm text-stone-500">{message}</p>}
      {children}
    </div>
  );
}
`,

'src/components/Avatar.jsx': `
import { avatarClasses, getInitials } from '../utils/misc';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export default function Avatar({ name, size = 'md' }) {
  return (
    <div
      className={'flex shrink-0 items-center justify-center rounded-full font-semibold ' + SIZES[size] + ' ' + avatarClasses(name)}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
`,

'src/components/StatCard.jsx': `
const TONES = {
  brand: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
};

export default function StatCard({ icon: Icon, label, value, tone = 'brand', loading = false }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <div className={'rounded-xl p-2.5 ' + TONES[tone]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-stone-500">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-8 w-16 animate-pulse rounded-md bg-stone-200" />
        ) : (
          <p className="mt-0.5 truncate text-2xl font-bold text-stone-900">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}
`,

'src/components/SearchInput.jsx': `
import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        className="input pl-10 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
`,

'src/components/PageHeader.jsx': `
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
`,

'src/components/ConfigBanner.jsx': `
import { isSupabaseConfigured } from '../lib/supabase';
import Alert from './Alert';

export default function ConfigBanner({ className = 'mb-6' }) {
  if (isSupabaseConfigured) return null;
  return (
    <Alert variant="error" className={className}>
      <strong>Supabase is not configured.</strong> Create a <code>.env</code> file with{' '}
      <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev
      server.
    </Alert>
  );
}
`,

'src/components/Layout.jsx': `
import { BarChart3, ClipboardCheck, LayoutDashboard, QrCode, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import ConfigBanner from './ConfigBanner';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Layout() {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-tight text-white">Fellowship</span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-brand-300">
                Attendance
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ' +
                (isActive ? 'bg-brand-800 text-white' : 'text-brand-200/80 hover:bg-brand-900 hover:text-white')}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-brand-900 p-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-brand-800 px-3 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-900 hover:text-white"
          >
            <QrCode className="h-4 w-4" /> Open QR Kiosk
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <QrCode className="h-4 w-4" />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-stone-900">
              Fellowship Attendance
            </span>
          </Link>
          <Link to="/" className="btn-secondary !px-3 !py-2 text-xs">
            <QrCode className="h-4 w-4" /> Kiosk
          </Link>
        </div>
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <ConfigBanner />
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ' +
              (isActive ? 'text-brand-700' : 'text-stone-400 hover:text-stone-600')}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
`,

'src/pages/KioskPage.jsx': `
import { format } from 'date-fns';
import { LayoutDashboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function KioskPage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkInUrl = window.location.origin + '/check-in';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-950 px-6 py-12 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-300">
          Fellowship Attendance
        </p>
        <p className="mt-6 text-5xl font-extrabold tabular-nums sm:text-6xl">
          {format(now, 'h:mm:ss a')}
        </p>
        <p className="mt-2 text-sm font-medium text-brand-300">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>

        <div className="mt-10 rounded-3xl bg-white p-5 shadow-2xl shadow-black/40">
          <QRCodeSVG value={checkInUrl} size={220} level="M" fgColor="#14251f" bgColor="#ffffff" />
        </div>

        <h1 className="mt-8 text-2xl font-bold sm:text-3xl">Scan to check in</h1>
        <p className="mt-2 break-all font-mono text-sm text-brand-300">{checkInUrl}</p>

        <Link
          to="/dashboard"
          className="mt-10 inline-flex items-center gap-2 rounded-xl border border-brand-700 px-4 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-900 hover:text-white"
        >
          <LayoutDashboard className="h-4 w-4" /> Open dashboard
        </Link>
      </div>
    </div>
  );
}
`,

'src/pages/CheckInPage.jsx': `
import {
  ArrowLeft, CheckCircle2, Clock3, Phone, QrCode, UserPlus, UserX, XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import ConfigBanner from '../components/ConfigBanner';
import Spinner from '../components/Spinner';
import { useCheckIn } from '../hooks/useCheckIn';
import { formatTime } from '../utils/dates';
import { isValidPhone } from '../utils/phone';

const TONES = {
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-rose-100 text-rose-600',
};

function ResultCard({ tone = 'success', icon: Icon, title, message, meta, onDone, doneLabel = 'Done' }) {
  return (
    <div className="card p-8 text-center">
      <div className={'mx-auto flex h-16 w-16 items-center justify-center rounded-full ' + TONES[tone]}>
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-stone-900">{title}</h2>
      {message && <p className="mt-2 text-stone-600">{message}</p>}
      {meta && <p className="mt-1 text-sm text-stone-400">{meta}</p>}
      <button type="button" onClick={onDone} className="btn-primary mt-7 w-full py-3">
        {doneLabel}
      </button>
    </div>
  );
}

function PhoneStep({ onSubmit }) {
  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setFieldError('Please enter a valid phone number (10–15 digits).');
      return;
    }
    setFieldError('');
    onSubmit(phone);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <Phone className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Check in</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Enter the phone number you registered with.
      </p>

      <div className="mt-6">
        <label className="label" htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus
          placeholder="e.g. +234 803 111 0001"
          className="input py-3 text-base"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (fieldError) setFieldError('');
          }}
        />
        {fieldError && <p className="mt-2 text-sm text-red-600" role="alert">{fieldError}</p>}
      </div>

      <button type="submit" className="btn-primary mt-6 w-full py-3 text-base">Check in</button>
    </form>
  );
}

function CheckingCard() {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Spinner className="h-8 w-8 text-brand-700" />
      <p className="text-sm font-medium text-stone-600">Looking you up…</p>
    </div>
  );
}

function NotFoundCard({ onRegister, onRetry }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <UserX className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-stone-900">
        We couldn't find your phone number.
      </h2>
      <p className="mt-2 text-stone-600">
        Looks like you're new here — register below and you'll be checked in right away.
      </p>
      <button type="button" onClick={onRegister} className="btn-primary mt-7 w-full py-3">
        <UserPlus className="h-4 w-4" /> Register now
      </button>
      <button type="button" onClick={onRetry} className="btn-secondary mt-3 w-full">
        Try another number
      </button>
    </div>
  );
}

function RegisterStep({ prefillPhone, submitting, serverError, onSubmit, onBack }) {
  const [form, setForm] = useState({ name: '', phone: prefillPhone ?? '', email: '', course: '' });
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Please enter your full name.';
    if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number (10–15 digits).';
    if (form.email.trim() && !/^\\S+@\\S+\\.\\S+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <UserPlus className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Register</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Join the fellowship — it only takes a few seconds.
      </p>

      {serverError && <Alert variant="error" className="mt-5">{serverError}</Alert>}

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="reg-name">Full name</label>
          <input id="reg-name" className="input" placeholder="e.g. Ada Obi"
            value={form.name} onChange={setField('name')} disabled={submitting} />
          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reg-phone">Phone number</label>
          <input id="reg-phone" type="tel" inputMode="tel" className="input"
            value={form.phone} onChange={setField('phone')} disabled={submitting} />
          {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reg-email">
            Email <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input id="reg-email" type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={setField('email')} disabled={submitting} />
          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reg-course">
            Course <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input id="reg-course" className="input" placeholder="e.g. Computer Science"
            value={form.course} onChange={setField('course')} disabled={submitting} />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full py-3 text-base">
        {submitting ? (<><Spinner className="h-4 w-4" /> Registering…</>) : 'Register & check in'}
      </button>
      <button type="button" onClick={onBack} disabled={submitting} className="btn-secondary mt-3 w-full">
        Back
      </button>
    </form>
  );
}

export default function CheckInPage() {
  const flow = useCheckIn();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> Kiosk
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold text-brand-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white">
            <QrCode className="h-4 w-4" />
          </span>
          Fellowship
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-16 pt-4 sm:pt-10">
        <div className="w-full max-w-md">
          <ConfigBanner className="mb-4" />

          {flow.step === 'phone' && <PhoneStep onSubmit={flow.submitPhone} />}
          {flow.step === 'checking' && <CheckingCard />}

          {flow.step === 'welcome' && (
            <ResultCard
              icon={CheckCircle2}
              title={'Welcome back, ' + flow.member.name + '.'}
              message="Attendance recorded."
              meta={flow.record?.check_in_time ? 'Checked in at ' + formatTime(flow.record.check_in_time) : null}
              onDone={flow.reset}
            />
          )}

          {flow.step === 'already' && (
            <ResultCard
              tone="warning"
              icon={Clock3}
              title={'Hi ' + flow.member.name + '.'}
              message="You have already checked in today."
              meta={flow.record?.check_in_time ? 'Checked in at ' + formatTime(flow.record.check_in_time) : null}
              onDone={flow.reset}
            />
          )}

          {flow.step === 'not-found' && (
            <NotFoundCard onRegister={flow.openRegistration} onRetry={flow.reset} />
          )}

          {(flow.step === 'register' || flow.step === 'registering') && (
            <RegisterStep
              prefillPhone={flow.prefillPhone}
              submitting={flow.step === 'registering'}
              serverError={flow.error}
              onSubmit={flow.submitRegistration}
              onBack={flow.reset}
            />
          )}

          {flow.step === 'registered' && (
            <ResultCard
              icon={CheckCircle2}
              title={'Welcome, ' + flow.member.name + '!'}
              message="You're registered and today's attendance has been recorded."
              meta={flow.record?.check_in_time ? 'Checked in at ' + formatTime(flow.record.check_in_time) : null}
              onDone={flow.reset}
            />
          )}

          {flow.step === 'error' && (
            <ResultCard
              tone="danger"
              icon={XCircle}
              title="Something went wrong"
              message={flow.error}
              onDone={flow.reset}
              doneLabel="Try again"
            />
          )}
        </div>
      </main>
    </div>
  );
}
`,

'src/pages/DashboardPage.jsx': `
import { format } from 'date-fns';
import { CalendarCheck, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useStats } from '../hooks/useStats';
import { getRecentCheckIns } from '../services/attendanceService';
import { formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';

const REFRESH_INTERVAL_MS = 30000;

export default function DashboardPage() {
  const { stats, loading, error, refresh } = useStats();
  const [checkIns, setCheckIns] = useState(null);
  const [checkInsError, setCheckInsError] = useState(null);

  const loadCheckIns = useCallback(async () => {
    try {
      setCheckInsError(null);
      setCheckIns(await getRecentCheckIns(10));
    } catch (err) {
      setCheckInsError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    loadCheckIns();
    const timer = setInterval(() => {
      loadCheckIns();
      refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadCheckIns, refresh]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}>
        <button
          type="button"
          onClick={() => { refresh(); loadCheckIns(); }}
          className="btn-secondary"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={loading} tone="brand" />
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers} loading={loading} tone="sky" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={loading} tone="amber" />
      </div>

      <section className="card mt-6 overflow-hidden">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Recent Check-ins</h2>
          <Link to="/attendance" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </header>

        {checkInsError && <Alert variant="error" className="m-4">{checkInsError}</Alert>}
        {checkIns === null && !checkInsError && <LoadingBlock label="Loading check-ins…" />}
        {checkIns && checkIns.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title="No check-ins yet"
            message="Today's check-ins will appear here as members scan the QR code."
          />
        )}
        {checkIns && checkIns.length > 0 && (
          <ul className="divide-y divide-stone-100">
            {checkIns.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={row.member?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={'/members/' + row.member?.id}
                    className="block truncate text-sm font-medium text-stone-900 hover:text-brand-700"
                  >
                    {row.member?.name ?? 'Unknown member'}
                  </Link>
                  {row.member?.course && (
                    <p className="truncate text-xs text-stone-400">{row.member.course}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-stone-500">
                  {formatTime(row.check_in_time)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
`,

'src/pages/MembersPage.jsx': `
import { ChevronRight, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import SearchInput from '../components/SearchInput';
import { useDebounce } from '../hooks/useDebounce';
import { getMembers } from '../services/membersService';
import { friendlyError } from '../utils/errors';

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);
    getMembers(debouncedSearch)
      .then((data) => active && setMembers(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [debouncedSearch]);

  const subtitle = members
    ? members.length + (members.length === 1 ? ' member' : ' members')
    : 'All registered members';

  return (
    <>
      <PageHeader title="Members" subtitle={subtitle}>
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or phone…" />
        </div>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {members === null ? (
        <LoadingBlock label="Loading members…" />
      ) : members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={search ? 'No members match your search' : 'No members yet'}
            message={
              search
                ? 'Try a different name or phone number.'
                : 'Members appear here after they register through the QR kiosk.'
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-stone-100">
            {members.map((m) => (
              <li key={m.id}>
                <Link
                  to={'/members/' + m.id}
                  className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-stone-50"
                >
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{m.name}</p>
                    <p className="truncate text-sm text-stone-500">
                      {m.phone}
                      {m.course ? ' · ' + m.course : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
`,

'src/pages/MemberProfilePage.jsx': `
import { ArrowLeft, CalendarCheck, Clock3, GraduationCap, Mail, Phone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import StatCard from '../components/StatCard';
import { getAttendanceForMember } from '../services/attendanceService';
import { getMemberById } from '../services/membersService';
import { formatDate, formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';

export default function MemberProfilePage() {
  const { id } = useParams();
  const [state, setState] = useState({ member: null, history: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ member: null, history: null, loading: true, error: null });
    Promise.all([getMemberById(id), getAttendanceForMember(id)])
      .then(([member, history]) => {
        if (active) setState({ member, history, loading: false, error: null });
      })
      .catch((err) => {
        if (active) setState({ member: null, history: null, loading: false, error: friendlyError(err) });
      });
    return () => { active = false; };
  }, [id]);

  const { member, history, loading, error } = state;

  if (loading) return <LoadingBlock label="Loading profile…" />;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!member) {
    return (
      <div className="card">
        <EmptyState icon={Users} title="Member not found" message="This member may have been removed." />
      </div>
    );
  }

  const lastVisit = history[0] ?? null;

  return (
    <>
      <Link
        to="/members"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to members
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar name={member.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-stone-900">{member.name}</h1>
            <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm text-stone-500 sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {member.phone}
              </span>
              {member.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {member.email}
                </span>
              )}
              {member.course && (
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> {member.course}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Member since {formatDate(member.created_at?.slice(0, 10))}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard icon={CalendarCheck} label="Total Check-ins" value={history.length} />
        <StatCard icon={Clock3} label="Last Check-in" value={lastVisit ? formatDate(lastVisit.attendance_date) : '—'} />
      </div>

      <section className="card mt-4 overflow-hidden">
        <header className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Attendance History</h2>
        </header>
        {history.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance yet" message="This member hasn't checked in yet." />
        ) : (
          <ul className="divide-y divide-stone-100">
            {history.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-stone-700">{formatDate(row.attendance_date)}</span>
                <span className="tabular-nums text-stone-400">{formatTime(row.check_in_time)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
`,

'src/pages/AttendancePage.jsx': `
import { ClipboardCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import SearchInput from '../components/SearchInput';
import { getAttendanceForDate } from '../services/attendanceService';
import { formatDate, formatTime, todayISO } from '../utils/dates';
import { friendlyError } from '../utils/errors';

export default function AttendancePage() {
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    setError(null);
    getAttendanceForDate(date)
      .then((data) => active && setRows(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [date]);

  const q = search.trim().toLowerCase();
  const filtered = (rows ?? []).filter((row) => {
    if (!q) return true;
    const name = (row.member?.name ?? '').toLowerCase();
    const phone = (row.member?.phone ?? '').toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={
          rows
            ? filtered.length + ' check-in' + (filtered.length === 1 ? '' : 's') + ' on ' + formatDate(date)
            : 'Daily check-in records'
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Search member…" />
          </div>
          <input
            type="date"
            aria-label="Filter by date"
            className="input w-full sm:w-44"
            value={date}
            max={todayISO()}
            onChange={(e) => { setDate(e.target.value); setSearch(''); }}
          />
        </div>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {rows === null && !error ? (
        <LoadingBlock label="Loading attendance…" />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardCheck}
            title="No attendance records"
            message={q ? 'No records match your search for this date.' : 'No one has checked in on this date.'}
          />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-stone-50">
                  <td className="px-5 py-3.5">
                    <Link to={'/members/' + row.member?.id} className="flex items-center gap-3">
                      <Avatar name={row.member?.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-stone-900">
                          {row.member?.name ?? 'Unknown'}
                        </span>
                        <span className="block truncate text-xs text-stone-400">{row.member?.phone}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-stone-600">{formatDate(row.attendance_date)}</td>
                  <td className="px-5 py-3.5 tabular-nums text-stone-600">{formatTime(row.check_in_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
`,

'src/pages/AnalyticsPage.jsx': `
import { BarChart3, CalendarCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useStats } from '../hooks/useStats';
import { getAttendanceByDay, getLastMeetings } from '../services/attendanceService';
import { formatDate, formatDateShort } from '../utils/dates';
import { friendlyError } from '../utils/errors';

function ChartCard({ icon: Icon, title, hint, children }) {
  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-700" />
        <h2 className="font-semibold text-stone-900">{title}</h2>
        {hint && <span className="ml-auto text-xs text-stone-400">{hint}</span>}
      </header>
      {children}
    </section>
  );
}

export default function AnalyticsPage() {
  const { stats, loading: statsLoading } = useStats();
  const [byDay, setByDay] = useState(null);
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getAttendanceByDay(14), getLastMeetings(7)])
      .then(([daily, last]) => {
        if (!active) return;
        setByDay(daily);
        setMeetings(last);
      })
      .catch((err) => { if (active) setError(friendlyError(err)); });
    return () => { active = false; };
  }, []);

  const chartsLoading = !byDay || !meetings;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Attendance trends at a glance" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers} loading={statsLoading} tone="sky" />
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={statsLoading} tone="brand" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={statsLoading} tone="amber" />
      </div>

      {error && <Alert variant="error" className="mt-6">{error}</Alert>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard icon={BarChart3} title="Attendance by Date" hint="Last 14 days">
          {chartsLoading ? <LoadingBlock label="Loading chart…" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={formatDateShort}
                  tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(d) => formatDate(d)} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="count" name="Check-ins" fill="#2c5345" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard icon={TrendingUp} title="Last 7 Meetings" hint="Check-ins per meeting">
          {chartsLoading ? <LoadingBlock label="Loading chart…" /> : meetings.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No meetings yet"
              message="Once members start checking in, the trend will appear here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={meetings} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={formatDateShort}
                  tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(d) => formatDate(d)} />
                <Line type="monotone" dataKey="count" name="Check-ins"
                  stroke="#b45309" strokeWidth={2.5} dot={{ r: 3.5, fill: '#b45309' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <p className="mt-6 text-center text-xs text-stone-400">
        The analytics grid is modular — additional charts and reports can be added as new cards.
      </p>
    </>
  );
}
`,

'src/pages/NotFoundPage.jsx': `
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-brand-700">404</p>
      <h1 className="text-2xl font-bold text-stone-900">Page not found</h1>
      <p className="text-sm text-stone-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  );
}
`,

};

let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const full = join(process.cwd(), filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.startsWith('\n') ? content.slice(1) : content);
  console.log('created', filePath);
  count += 1;
}

console.log('');
console.log('Done! ' + count + ' files created.');
console.log('');
console.log('Next steps:');
console.log('  1. Run the SQL: Supabase Dashboard -> SQL Editor -> paste supabase/schema.sql -> Run, then supabase/seed.sql -> Run');
console.log('  2. Copy .env.example to .env and add your Supabase URL + anon key');
console.log('  3. npm install');
console.log('  4. npm run dev');