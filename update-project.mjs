// update-project.mjs — applies: sky/cream/red theme, admin PIN lock, 50-member roster.
// Usage: node update-project.mjs   (run inside fellowship-attendance)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = {

'tailwind.config.js': `
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sky blue — primary brand colour
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Cream — page background + soft accents
        cream: '#faf5ec',
        'cream-dark': '#f3e7cf',
      },
      fontFamily: {
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
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
    @apply bg-cream font-sans text-stone-900 antialiased;
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
    @apply inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60;
  }
}
`,

'.env.example': `
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# PIN required to open the admin dashboard (change this!)
VITE_ADMIN_PIN=1234
`,

'supabase/seed-50.sql': `
-- 50-member sample data. Clears existing members/attendance first.
-- Run AFTER schema.sql. Safe to re-run.

truncate table public.attendance, public.members;

insert into public.members (id, name, phone, email, course, created_at) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', 'Adaeze Okonkwo',   '+2348031110001', 'adaeze.okonkwo@example.com',   'Computer Science',   now() - interval '92 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', 'Bolanle Adebayo',  '+2348031110002', 'bolanle.adebayo@example.com',  'Law',                now() - interval '90 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', 'Chukwuemeka Eze',  '+2348031110003', 'chukwuemeka.eze@example.com',  'Engineering',        now() - interval '88 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', 'Damilare Ogunleye','+2348031110004', 'damilare.ogunleye@example.com', null,                 now() - interval '85 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', 'Eseoghene Efe',    '+2348031110005', 'eseoghene.efe@example.com',    'Medicine',           now() - interval '83 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', 'Fatima Abdullahi', '+2348031110006', 'fatima.abdullahi@example.com', 'Accounting',         now() - interval '80 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', 'Gabriel Oladele',  '+2348031110007', 'gabriel.oladele@example.com',  'Computer Science',   now() - interval '78 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', 'Hadiza Mohammed',  '+2348031110008', 'hadiza.mohammed@example.com',  'Law',                now() - interval '76 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', 'Ikenna Nwachukwu', '+2348031110009', 'ikenna.nwachukwu@example.com', 'Engineering',        now() - interval '74 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d410', 'Jumoke Balogun',   '+2348031110010', 'jumoke.balogun@example.com',   'Mass Communication', now() - interval '71 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d411', 'Kelechi Okeke',    '+2348031110011', 'kelechi.okeke@example.com',    'Computer Science',   now() - interval '69 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d412', 'Lolade Ajayi',     '+2348031110012', 'lolade.ajayi@example.com',     null,                 now() - interval '67 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d413', 'Miriam Danjuma',   '+2348031110013', 'miriam.danjuma@example.com',   'Biochemistry',       now() - interval '65 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d414', 'Nnamdi Uzoma',     '+2348031110014', 'nnamdi.uzoma@example.com',     'Engineering',        now() - interval '62 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d415', 'Omolara Adeyemi',  '+2348031110015', 'omolara.adeyemi@example.com',  'Law',                now() - interval '60 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d416', 'Peter Anyanwu',    '+2348031110016', 'peter.anyanwu@example.com',    'Computer Science',   now() - interval '58 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d417', 'Queensley Egbuna', '+2348031110017', 'queensley.egbuna@example.com', 'Medicine',           now() - interval '55 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d418', 'Rasheedat Lawal',  '+2348031110018', 'rasheedat.lawal@example.com',  'Accounting',         now() - interval '53 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d419', 'Samuel Adekunle',  '+2348031110019', 'samuel.adekunle@example.com',  'Engineering',        now() - interval '51 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d420', 'Titiola Bakare',   '+2348031110020', 'titiola.bakare@example.com',   'Mass Communication', now() - interval '49 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d421', 'Uche Nwankwo',     '+2348031110021', 'uche.nwankwo@example.com',     'Computer Science',   now() - interval '46 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d422', 'Vanessa Igwe',     '+2348031110022', 'vanessa.igwe@example.com',     'Law',                now() - interval '44 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d423', 'Wale Fashola',     '+2348031110023', 'wale.fashola@example.com',     null,                 now() - interval '42 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d424', 'Xaveria Okoro',    '+2348031110024', 'xaveria.okoro@example.com',    'Medicine',           now() - interval '40 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d425', 'Yusuf Garba',      '+2348031110025', 'yusuf.garba@example.com',      'Engineering',        now() - interval '38 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d426', 'Zainab Suleiman',  '+2348031110026', 'zainab.suleiman@example.com',  'Accounting',         now() - interval '36 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d427', 'Abiodun Olatunji', '+2348031110027', 'abiodun.olatunji@example.com', 'Computer Science',   now() - interval '33 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d428', 'Chioma Agu',       '+2348031110028', 'chioma.agu@example.com',       'Law',                now() - interval '31 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d429', 'David Okon',       '+2348031110029', 'david.okon@example.com',       'Engineering',        now() - interval '29 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d430', 'Efe Esiri',        '+2348031110030', 'efe.esiri@example.com',        'Biochemistry',       now() - interval '27 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d431', 'Funmilayo Ransome','+2348031110031', 'funmilayo.ransome@example.com','Medicine',           now() - interval '25 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d432', 'Godwin Obi',       '+2348031110032', 'godwin.obi@example.com',       'Computer Science',   now() - interval '23 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d433', 'Hauwa Bello',      '+2348031110033', 'hauwa.bello@example.com',      'Law',                now() - interval '21 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d434', 'Ibrahim Danladi',  '+2348031110034', 'ibrahim.danladi@example.com',  'Engineering',        now() - interval '19 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d435', 'Joy Ekpo',         '+2348031110035', 'joy.ekpo@example.com',         'Accounting',         now() - interval '17 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d436', 'Kunle Awosika',    '+2348031110036', 'kunle.awosika@example.com',    'Computer Science',   now() - interval '15 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d437', 'Love Okafor',      '+2348031110037', 'love.okafor@example.com',      'Mass Communication', now() - interval '13 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d438', 'Maryam Yusuf',     '+2348031110038', 'maryam.yusuf@example.com',     'Medicine',           now() - interval '11 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d439', 'Ndubisi Kanu',     '+2348031110039', 'ndubisi.kanu@example.com',     null,                 now() - interval '9 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d440', 'Oluwaseun Ade',    '+2348031110040', 'oluwaseun.ade@example.com',    'Engineering',        now() - interval '8 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d441', 'Patience Effiong', '+2348031110041', 'patience.effiong@example.com', 'Law',                now() - interval '7 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d442', 'Quadri Ayinde',    '+2348031110042', 'quadri.ayinde@example.com',    'Computer Science',   now() - interval '6 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d443', 'Rebecca Mba',      '+2348031110043', 'rebecca.mba@example.com',      'Accounting',         now() - interval '5 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d444', 'Solomon Tar',      '+2348031110044', 'solomon.tar@example.com',      'Engineering',        now() - interval '4 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d445', 'Tara Nwosu',       '+2348031110045', 'tara.nwosu@example.com',       'Biochemistry',       now() - interval '3 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d446', 'Udo Bassey',       '+2348031110046', 'udo.bassey@example.com',       'Law',                now() - interval '2 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d447', 'Vivian Chukwu',    '+2348031110047', 'vivian.chukwu@example.com',    'Medicine',           now() - interval '1 day'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d448', 'Yakubu Musa',      '+2348031110048', 'yakubu.musa@example.com',      'Computer Science',   now() - interval '1 day'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d449', 'Yetunde Alao',     '+2348031110049', 'yetunde.alao@example.com',     'Mass Communication', now() - interval '3 hours'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d450', 'Zion Eze',         '+2348031110050', 'zion.eze@example.com',         'Engineering',        now() - interval '2 hours');

-- Today: 30 attended, 20 missed
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date, current_date + interval '9 hours' + (m.rn * 3 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,2,3,5,6,8,9,11,12,14,15,17,19,20,22,23,25,26,28,30,31,33,35,36,38,40,42,44,47,50)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 3 days ago: 26 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 3, current_date - 3 + interval '9 hours' + (m.rn * 4 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,3,4,6,7,9,10,12,14,16,18,19,21,23,24,26,28,29,31,33,34,37,39,42,45,48)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 7 days ago: 35 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 7, current_date - 7 + interval '9 hours' + (m.rn * 2 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,2,3,4,5,7,8,10,11,12,13,15,16,18,20,21,22,24,25,26,27,29,30,32,34,35,37,38,40,41,43,44,46,48,49)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 10 days ago: 24 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 10, current_date - 10 + interval '9 hours' + (m.rn * 4 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (2,4,5,7,9,11,13,15,17,19,22,24,26,27,30,32,33,36,38,41,43,45,47,50)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 14 days ago: 33 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 14, current_date - 14 + interval '9 hours' + (m.rn * 3 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,2,4,5,6,8,9,10,12,13,14,16,17,19,21,23,24,25,27,28,30,31,33,35,36,38,39,41,43,45,46,48,50)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;
`,

'src/components/AdminGate.jsx': `
import { Lock, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

const STORAGE_KEY = 'fa_admin_unlocked';
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

export function lockAdmin() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function AdminGate() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
    } else {
      setError('Incorrect PIN. Only fellowship admins can access this dashboard.');
      setPin('');
    }
  }

  if (unlocked) return <Outlet />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <UserRound className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-stone-900">Admin access</h1>
        <p className="mt-1 text-sm text-stone-500">
          This dashboard is reserved for fellowship admins. Enter the admin PIN to continue.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          className="input mt-6 text-center text-lg tracking-[0.4em]"
          placeholder="••••"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(''); }}
        />
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" className="btn-primary mt-5 w-full py-3">
          <Lock className="h-4 w-4" /> Unlock dashboard
        </button>
        <p className="mt-4 text-xs text-stone-400">
          Not an admin? Use the QR code at the entrance to check in.
        </p>
      </form>
    </div>
  );
}
`,

'src/App.jsx': `
import { Route, Routes } from 'react-router-dom';
import AdminGate from './components/AdminGate';
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
      {/* Public: kiosk + member sign-in */}
      <Route path="/" element={<KioskPage />} />
      <Route path="/check-in" element={<CheckInPage />} />

      {/* Admin-only (PIN protected) */}
      <Route element={<AdminGate />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberProfilePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
`,

'src/components/Layout.jsx': `
import { BarChart3, ClipboardCheck, LayoutDashboard, LogOut, QrCode, UserRound, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { lockAdmin } from './AdminGate';
import ConfigBanner from './ConfigBanner';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function handleLock() {
  lockAdmin();
  window.location.reload();
}

export default function Layout() {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
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

        <div className="space-y-2 border-t border-brand-900 p-4">
          <div className="flex items-center gap-2 rounded-xl bg-brand-900 px-3 py-2.5">
            <UserRound className="h-4 w-4 shrink-0 text-brand-300" />
            <span className="flex-1 truncate text-sm font-medium text-brand-100">Admin</span>
            <button
              type="button"
              onClick={handleLock}
              title="Lock dashboard"
              className="rounded p-1 text-brand-300 transition-colors hover:bg-brand-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <QrCode className="h-4 w-4" />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-stone-900">
              Fellowship Attendance
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-secondary !px-3 !py-2 text-xs">
              <QrCode className="h-4 w-4" /> Kiosk
            </Link>
            <button
              type="button"
              onClick={handleLock}
              title="Lock dashboard"
              className="btn-secondary !px-3 !py-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
              (isActive ? 'text-brand-600' : 'text-stone-400 hover:text-stone-600')}
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
  return {
    attendanceToday,
    totalMembers,
    newMembersToday,
    missedToday: Math.max(totalMembers - attendanceToday, 0),
  };
}
`,

'src/services/attendanceService.js': `
import { supabase } from '../lib/supabase';
import { daysAgoISO, todayISO } from '../utils/dates';
import { getMembers } from './membersService';

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

/** Full roster for a date: every member marked attended/missed. */
export async function getRosterForDate(dateISO = todayISO()) {
  const [members, records] = await Promise.all([
    getMembers(),
    getAttendanceForDate(dateISO),
  ]);
  const checkIns = new Map(records.map((r) => [r.member?.id, r.check_in_time]));
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    course: m.course,
    attended: checkIns.has(m.id),
    checkInTime: checkIns.get(m.id) ?? null,
  }));
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
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-300">
          Fellowship Attendance
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> LIVE
        </span>
        <p className="mt-5 text-5xl font-extrabold tabular-nums sm:text-6xl">
          {format(now, 'h:mm:ss a')}
        </p>
        <p className="mt-2 text-sm font-medium text-brand-300">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>

        <div className="mt-10 rounded-3xl bg-white p-5 shadow-2xl shadow-black/40">
          <QRCodeSVG value={checkInUrl} size={220} level="M" fgColor="#082f49" bgColor="#ffffff" />
        </div>

        <h1 className="mt-8 text-2xl font-bold sm:text-3xl">Scan to check in</h1>
        <p className="mt-2 break-all font-mono text-sm text-brand-300">{checkInUrl}</p>

        <Link
          to="/dashboard"
          className="mt-10 inline-flex items-center gap-2 rounded-xl border border-brand-700 px-4 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-900 hover:text-white"
        >
          <LayoutDashboard className="h-4 w-4" /> Admin dashboard
        </Link>
      </div>
    </div>
  );
}
`,

'src/pages/DashboardPage.jsx': `
import { format } from 'date-fns';
import { CalendarCheck, RefreshCw, Sparkles, UserRound, UserX } from 'lucide-react';
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={loading} tone="brand" />
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={loading} tone="cream" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={loading} tone="amber" />
        <StatCard icon={UserX} label="Missed Today" value={stats?.missedToday} loading={loading} tone="rose" />
      </div>

      <section className="card mt-6 overflow-hidden">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Recent Check-ins</h2>
          <Link to="/attendance" className="text-sm font-medium text-brand-600 hover:underline">
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
                    className="block truncate text-sm font-medium text-stone-900 hover:text-brand-600"
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

'src/components/StatCard.jsx': `
const TONES = {
  brand: 'bg-brand-100 text-brand-700',
  sky: 'bg-sky-50 text-sky-600',
  cream: 'bg-cream-dark text-amber-800',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-red-100 text-red-700',
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

'src/pages/CheckInPage.jsx': `
import {
  ArrowLeft, CheckCircle2, Clock3, Phone, QrCode, UserCheck, UserPlus, Users, UserX, XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import ConfigBanner from '../components/ConfigBanner';
import LoadingBlock from '../components/LoadingBlock';
import Spinner from '../components/Spinner';
import { useCheckIn } from '../hooks/useCheckIn';
import { getRosterForDate } from '../services/attendanceService';
import { formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';
import { isValidPhone } from '../utils/phone';

const TONES = {
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-rose-100 text-rose-600',
};

/* ---------- Today's roster: attended vs missed ---------- */

function TodayRoster({ refreshToken }) {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('attended');

  useEffect(() => {
    let active = true;
    getRosterForDate()
      .then((data) => active && setRoster(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [refreshToken]);

  if (error) return <Alert variant="error" className="mt-6">{error}</Alert>;
  if (!roster) return <div className="mt-6"><LoadingBlock label="Loading members…" /></div>;

  const attended = roster.filter((m) => m.attended);
  const missed = roster.filter((m) => !m.attended);
  const shown = tab === 'attended' ? attended : missed;

  return (
    <section className="card mt-6 overflow-hidden">
      <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <h3 className="flex items-center gap-2 font-semibold text-stone-900">
          <Users className="h-4 w-4 text-brand-600" /> Today's attendance
        </h3>
        <span className="text-xs text-stone-400">
          {attended.length} attended · {missed.length} missed
        </span>
      </header>

      <div className="grid grid-cols-2 border-b border-stone-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab('attended')}
          className={'flex items-center justify-center gap-2 border-b-2 py-3 transition-colors ' +
            (tab === 'attended' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700')}
        >
          <UserCheck className="h-4 w-4" /> Attended ({attended.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('missed')}
          className={'flex items-center justify-center gap-2 border-b-2 py-3 transition-colors ' +
            (tab === 'missed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent text-stone-500 hover:text-stone-700')}
        >
          <UserX className="h-4 w-4" /> Missed ({missed.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-400">
          {tab === 'attended' ? 'No one has checked in yet.' : 'Everyone has checked in. 🎉'}
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
          {shown.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{m.name}</p>
                {m.course && <p className="truncate text-xs text-stone-400">{m.course}</p>}
              </div>
              {m.attended ? (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> {formatTime(m.checkInTime)}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                  Missed
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Check-in flow cards ---------- */

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
          placeholder="e.g. +234 803 111 0004"
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
      <Spinner className="h-8 w-8 text-brand-600" />
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
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> Kiosk
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
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

          {/* Members + attended vs missed */}
          <TodayRoster refreshToken={flow.step} />
        </div>
      </main>
    </div>
  );
}
`,

'src/pages/AnalyticsPage.jsx': `
import { BarChart3, CalendarCheck, Sparkles, TrendingUp, UserRound, UserX } from 'lucide-react';
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
        <Icon className="h-4 w-4 text-brand-600" />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={statsLoading} tone="cream" />
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={statsLoading} tone="brand" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={statsLoading} tone="amber" />
        <StatCard icon={UserX} label="Missed Today" value={stats?.missedToday} loading={statsLoading} tone="rose" />
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
                <Tooltip labelFormatter={(d) => formatDate(d)} cursor={{ fill: 'rgba(2,132,199,0.06)' }} />
                <Bar dataKey="count" name="Check-ins" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={30} />
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
                  stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3.5, fill: '#e11d48' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </>
  );
}
`,

};

let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const full = join(process.cwd(), filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.startsWith('\n') ? content.slice(1) : content);
  console.log('updated', filePath);
  count += 1;
}
console.log('');
console.log('Done! ' + count + ' files updated.');
console.log('');
console.log('Next steps:');
console.log('  1. Supabase -> SQL Editor -> paste supabase/seed-50.sql -> Run');
console.log('  2. Add VITE_ADMIN_PIN to your .env (default PIN is 1234)');
console.log('  3. Restart the dev server (Ctrl+C, then npm run dev)');