// update-dashboard.mjs — full dashboard (stats, attended/missed, 7-meeting trend)
// + white background / sky-blue sections / red headings theme.
// Usage: node update-dashboard.mjs
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
        // Sky blue — primary
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
        // White background theme (cream kept as alias for compatibility)
        cream: '#ffffff',
        'cream-dark': '#f0f9ff',
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
    @apply bg-white font-sans text-stone-900 antialiased;
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

'src/components/PageHeader.jsx': `
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-red-700">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
`,

'src/components/StatCard.jsx': `
const TONES = {
  brand: { card: 'border-brand-100 bg-brand-50', chip: 'bg-white text-brand-700' },
  red: { card: 'border-red-100 bg-red-50', chip: 'bg-white text-red-600' },
  white: { card: 'border-stone-200 bg-white', chip: 'bg-brand-50 text-brand-700' },
};

export default function StatCard({ icon: Icon, label, value, tone = 'brand', loading = false }) {
  const t = TONES[tone] ?? TONES.brand;
  return (
    <div className={'flex items-start gap-4 rounded-2xl border p-5 shadow-sm ' + t.card}>
      <div className={'rounded-xl p-2.5 shadow-sm ' + t.chip}>
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

'src/components/RosterCard.jsx': `
import { CheckCircle2, UserCheck, UserX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRosterForDate } from '../services/attendanceService';
import { formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';
import Alert from './Alert';
import Avatar from './Avatar';
import LoadingBlock from './LoadingBlock';

export default function RosterCard({ refreshToken = null, title = "Today's attendance" }) {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('attended');

  useEffect(() => {
    let active = true;
    setError(null);
    getRosterForDate()
      .then((data) => active && setRoster(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [refreshToken]);

  const attended = (roster ?? []).filter((m) => m.attended);
  const missed = (roster ?? []).filter((m) => !m.attended);
  const shown = tab === 'attended' ? attended : missed;

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between bg-brand-50 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-brand-800">
          <Users className="h-4 w-4" /> {title}
        </h2>
        {roster && (
          <span className="text-xs font-medium text-brand-700">
            {attended.length} attended · {missed.length} missed
          </span>
        )}
      </header>

      {error && <Alert variant="error" className="m-4">{error}</Alert>}
      {!roster && !error && <LoadingBlock label="Loading members…" />}

      {roster && (
        <>
          <div className="grid grid-cols-2 border-b border-stone-200 text-sm font-medium">
            <button
              type="button"
              onClick={() => setTab('attended')}
              className={'flex items-center justify-center gap-2 border-b-2 py-3 transition-colors ' +
                (tab === 'attended'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700')}
            >
              <UserCheck className="h-4 w-4" /> Attended ({attended.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('missed')}
              className={'flex items-center justify-center gap-2 border-b-2 py-3 transition-colors ' +
                (tab === 'missed'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700')}
            >
              <UserX className="h-4 w-4" /> Missed ({missed.length})
            </button>
          </div>

          {shown.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-stone-400">
              {tab === 'attended' ? 'No one has checked in yet.' : 'Everyone has checked in. 🎉'}
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-stone-100 overflow-y-auto">
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
        </>
      )}
    </section>
  );
}
`,

'src/pages/DashboardPage.jsx': `
import { format } from 'date-fns';
import { CalendarCheck, RefreshCw, Sparkles, TrendingUp, UserRound, UserX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import RosterCard from '../components/RosterCard';
import StatCard from '../components/StatCard';
import { useStats } from '../hooks/useStats';
import { getLastMeetings, getRecentCheckIns } from '../services/attendanceService';
import { formatDate, formatDateShort, formatTime, todayISO } from '../utils/dates';
import { friendlyError } from '../utils/errors';

const REFRESH_INTERVAL_MS = 30000;

function MeetingTrendCard({ refreshToken }) {
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);
    getLastMeetings(7)
      .then((data) => active && setMeetings(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [refreshToken]);

  const today = todayISO();
  const todayRow = (meetings ?? []).find((m) => m.date === today);
  const previous = (meetings ?? []).filter((m) => m.date !== today);
  const avg = previous.length
    ? Math.round(previous.reduce((sum, m) => sum + m.count, 0) / previous.length)
    : 0;
  const diff = todayRow ? todayRow.count - avg : null;

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between bg-brand-50 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-brand-800">
          <TrendingUp className="h-4 w-4" /> Last 7 Meetings vs Today
        </h2>
        <span className="text-xs font-medium text-brand-700">
          <span className="mr-3 inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-brand-600" /> Past
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-600" /> Today
          </span>
        </span>
      </header>

      <div className="p-5">
        {error && <Alert variant="error">{error}</Alert>}
        {!meetings && !error && <LoadingBlock label="Loading analytics…" />}

        {meetings && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-800">
                Today: {todayRow ? todayRow.count : 0}
              </span>
              <span className="rounded-lg bg-stone-100 px-3 py-1.5 font-medium text-stone-600">
                Previous meetings average: {avg}
              </span>
              {diff !== null && (
                <span className={'rounded-lg px-3 py-1.5 font-semibold ' +
                  (diff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                  {(diff >= 0 ? '+' : '') + diff + ' vs average'}
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={meetings} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={formatDateShort}
                  tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(d) => formatDate(d)} cursor={{ fill: 'rgba(2,132,199,0.06)' }} />
                <Bar dataKey="count" name="Check-ins" radius={[6, 6, 0, 0]} maxBarSize={34}>
                  {meetings.map((m) => (
                    <Cell key={m.date} fill={m.date === today ? '#dc2626' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { stats, loading, error, refresh } = useStats();
  const [checkIns, setCheckIns] = useState(null);
  const [checkInsError, setCheckInsError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadCheckIns = useCallback(async () => {
    try {
      setCheckInsError(null);
      setCheckIns(await getRecentCheckIns(8));
    } catch (err) {
      setCheckInsError(friendlyError(err));
    }
  }, []);

  const refreshAll = useCallback(() => {
    refresh();
    loadCheckIns();
    setRefreshToken((t) => t + 1);
  }, [refresh, loadCheckIns]);

  useEffect(() => {
    loadCheckIns();
    const timer = setInterval(refreshAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadCheckIns, refreshAll]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}>
        <button type="button" onClick={refreshAll} className="btn-secondary">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={loading} tone="brand" />
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={loading} tone="brand" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={loading} tone="white" />
        <StatCard icon={UserX} label="Missed Today" value={stats?.missedToday} loading={loading} tone="red" />
      </div>

      {/* Attended vs Missed + 7-meeting trend */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RosterCard refreshToken={refreshToken} title="Attended vs Missed (Today)" />
        <MeetingTrendCard refreshToken={refreshToken} />
      </div>

      {/* Recent check-ins */}
      <section className="card mt-6 overflow-hidden">
        <header className="flex items-center justify-between bg-brand-50 px-5 py-4">
          <h2 className="font-semibold text-brand-800">Recent Check-ins</h2>
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
    <section className="card overflow-hidden">
      <header className="flex items-center gap-2 bg-brand-50 px-5 py-4">
        <Icon className="h-4 w-4 text-brand-700" />
        <h2 className="font-semibold text-brand-800">{title}</h2>
        {hint && <span className="ml-auto text-xs text-brand-700">{hint}</span>}
      </header>
      <div className="p-5">{children}</div>
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
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={statsLoading} tone="brand" />
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={statsLoading} tone="brand" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={statsLoading} tone="white" />
        <StatCard icon={UserX} label="Missed Today" value={stats?.missedToday} loading={statsLoading} tone="red" />
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
console.log('Now: restart the dev server (Ctrl+C, npm run dev) and hard-refresh the browser.');