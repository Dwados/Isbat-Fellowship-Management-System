// update-wednesday-stats.mjs — Wednesday-only stats, roster & analytics
// Usage: node update-wednesday-stats.mjs
   import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = {};

files['src/utils/dates.js'] = `
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

/** Absolute instant of local midnight for a given YYYY-MM-DD date. */
export function startOfDayISO(dateISO) {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toISOString();
}

export function isWednesdayToday() {
  return new Date().getDay() === 3;
}

/** Today if today is Wednesday, otherwise the most recent past Wednesday. */
export function lastMeetingDateISO() {
  const diff = (new Date().getDay() - 3 + 7) % 7;
  return daysAgoISO(diff);
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
`;

files['src/services/statsService.js'] = `
import { isWednesdayToday, lastMeetingDateISO, startOfDayISO } from '../utils/dates';
import { countAttendanceForDate } from './attendanceService';
import { countMembers, countNewMembersSince } from './membersService';

export async function getDashboardStats() {
  const meetingDate = lastMeetingDateISO();
  const isMeetingToday = isWednesdayToday();
  const [attendanceToday, totalMembers, newMembersToday] = await Promise.all([
    countAttendanceForDate(meetingDate),
    countMembers(),
    countNewMembersSince(startOfDayISO(meetingDate)),
  ]);
  return {
    meetingDate,
    isMeetingToday,
    attendanceToday,
    totalMembers,
    newMembersToday,
    missedToday: Math.max(totalMembers - attendanceToday, 0),
  };
}
`;

files['src/services/streakService.js'] = `
import { getAttendanceForMember, getWednesdayMeetings } from './attendanceService';

/**
 * Consecutive-Wednesday streak, counted backwards from the most recent meeting.
 */
export async function getStreakForMember(memberId) {
  const [history, meetings] = await Promise.all([
    getAttendanceForMember(memberId),
    getWednesdayMeetings(20),
  ]);
  let list = meetings;
  // Ignore this week's Wednesday if nobody has checked in yet
  if (list.length && list[list.length - 1].count === 0) list = list.slice(0, -1);
  const attended = new Set(history.map((h) => h.attendance_date));
  let streak = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (attended.has(list[i].date)) streak += 1;
    else break;
  }
  return streak;
}
`;

files['src/components/RosterCard.jsx'] = `
import { CheckCircle2, UserCheck, UserX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRosterForDate } from '../services/attendanceService';
import { formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';
import Alert from './Alert';
import Avatar from './Avatar';
import LoadingBlock from './LoadingBlock';

export default function RosterCard({ refreshToken = null, title = "Today's attendance", dateISO = null }) {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('attended');

  useEffect(() => {
    if (!dateISO) return undefined;
    let active = true;
    setError(null);
    setRoster(null);
    getRosterForDate(dateISO)
      .then((data) => active && setRoster(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [refreshToken, dateISO]);

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
              {tab === 'attended' ? 'No one checked in on this Wednesday.' : 'Everyone attended. 🎉'}
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
`;

files['src/pages/DashboardPage.jsx'] = `
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
import { getAttendanceForDate, getWednesdayMeetings } from '../services/attendanceService';
import { formatDate, formatDateShort, formatTime, lastMeetingDateISO } from '../utils/dates';
import { friendlyError } from '../utils/errors';

const REFRESH_INTERVAL_MS = 30000;

function MeetingTrendCard({ refreshToken }) {
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);
    getWednesdayMeetings(7)
      .then((data) => active && setMeetings(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [refreshToken]);

  const highlight = lastMeetingDateISO();
  const latest = (meetings ?? [])[meetings.length - 1];
  const earlier = (meetings ?? []).slice(0, -1).filter((m) => m.count > 0);
  const avg = earlier.length
    ? Math.round(earlier.reduce((sum, m) => sum + m.count, 0) / earlier.length)
    : 0;
  const diff = latest ? latest.count - avg : null;

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between bg-brand-50 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-brand-800">
          <TrendingUp className="h-4 w-4" /> Wednesday Meetings
        </h2>
        <span className="text-xs font-medium text-brand-700">
          <span className="mr-3 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand-600" /> Past</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-600" /> Latest</span>
        </span>
      </header>

      <div className="p-5">
        {error && <Alert variant="error">{error}</Alert>}
        {!meetings && !error && <LoadingBlock label="Loading analytics…" />}

        {meetings && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-800">
                Latest Wednesday: {latest ? latest.count : 0}
              </span>
              <span className="rounded-lg bg-stone-100 px-3 py-1.5 font-medium text-stone-600">
                Earlier average: {avg}
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
                    <Cell key={m.date} fill={m.date === highlight ? '#dc2626' : '#0284c7'} />
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

  const loadCheckIns = useCallback(async (dateISO) => {
    try {
      setCheckInsError(null);
      setCheckIns(await getAttendanceForDate(dateISO));
    } catch (err) {
      setCheckInsError(friendlyError(err));
    }
  }, []);

  const refreshAll = useCallback(() => {
    refresh();
    setRefreshToken((t) => t + 1);
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(refreshAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshAll]);

  useEffect(() => {
    if (stats?.meetingDate) loadCheckIns(stats.meetingDate);
  }, [stats?.meetingDate, refreshToken, loadCheckIns]);

  const isToday = stats?.isMeetingToday;
  const wedLabel = isToday
    ? 'Today'
    : 'Last Wed' + (stats?.meetingDate ? ' (' + formatDateShort(stats.meetingDate) + ')' : '');

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={format(new Date(), 'EEEE, MMMM d, yyyy') + ' · Meetings happen on Wednesdays'}
      >
        <button type="button" onClick={refreshAll} className="btn-secondary">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label={'Attendance — ' + wedLabel} value={stats?.attendanceToday} loading={loading} tone="brand" />
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={loading} tone="brand" />
        <StatCard icon={Sparkles} label={'New Members — ' + wedLabel} value={stats?.newMembersToday} loading={loading} tone="white" />
        <StatCard icon={UserX} label={'Missed — ' + wedLabel} value={stats?.missedToday} loading={loading} tone="red" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RosterCard
          refreshToken={refreshToken}
          dateISO={stats?.meetingDate}
          title={isToday ? 'Attended vs Missed (Today)' : 'Attended vs Missed (Last Wednesday)'}
        />
        <MeetingTrendCard refreshToken={refreshToken} />
      </div>

      <section className="card mt-6 overflow-hidden">
        <header className="flex items-center justify-between bg-brand-50 px-5 py-4">
          <h2 className="font-semibold text-brand-800">Recent Check-ins ({wedLabel})</h2>
          <Link to="/attendance" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </header>

        {checkInsError && <Alert variant="error" className="m-4">{checkInsError}</Alert>}
        {checkIns === null && !checkInsError && <LoadingBlock label="Loading check-ins…" />}
        {checkIns && checkIns.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title="No check-ins for this Wednesday"
            message="Check-ins will appear here after the Wednesday meeting."
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
`;

files['src/pages/AnalyticsPage.jsx'] = `
import { BarChart3, CalendarCheck, Sparkles, TrendingUp, UserRound, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Alert from '../components/Alert';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useStats } from '../hooks/useStats';
import { getWednesdayMeetings } from '../services/attendanceService';
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
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getWednesdayMeetings(7)
      .then((d) => active && setMeetings(d))
      .catch((e) => active && setError(friendlyError(e)));
    return () => { active = false; };
  }, []);

  const data = useMemo(() => {
    if (!meetings || !stats) return null;
    return meetings.map((m) => ({
      date: m.date,
      attended: m.count,
      missed: Math.max(stats.totalMembers - m.count, 0),
    }));
  }, [meetings, stats]);

  const isToday = stats?.isMeetingToday;
  const wedLabel = isToday
    ? 'Today'
    : 'Last Wed' + (stats?.meetingDate ? ' (' + formatDateShort(stats.meetingDate) + ')' : '');

  return (
    <>
      <PageHeader title="Analytics" subtitle="Wednesday-only attendance trends" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label={'Attendance — ' + wedLabel} value={stats?.attendanceToday} loading={statsLoading} tone="brand" />
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={statsLoading} tone="brand" />
        <StatCard icon={Sparkles} label={'New Members — ' + wedLabel} value={stats?.newMembersToday} loading={statsLoading} tone="white" />
        <StatCard icon={UserX} label={'Missed — ' + wedLabel} value={stats?.missedToday} loading={statsLoading} tone="red" />
      </div>

      {error && <Alert variant="error" className="mt-6">{error}</Alert>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard icon={BarChart3} title="Attended vs Missed per Wednesday" hint="Last 7 Wednesdays">
          {!data ? <LoadingBlock label="Loading charts…" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={formatDateShort}
                  tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(d) => formatDate(d)} cursor={{ fill: 'rgba(2,132,199,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="attended" name="Attended" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={24} />
                <Bar dataKey="missed" name="Missed" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard icon={TrendingUp} title="Missed Members per Wednesday" hint="Trend">
          {!data ? <LoadingBlock label="Loading charts…" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={formatDateShort}
                  tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(d) => formatDate(d)} />
                <Line type="monotone" dataKey="missed" name="Missed"
                  stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3.5, fill: '#dc2626' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </>
  );
}
`;

/* ---- Append getWednesdayMeetings to attendanceService (keeps everything else) ---- */
const APPEND = `

/** Last n Wednesdays (oldest first) with check-in counts (0 when nobody attended). */
export async function getWednesdayMeetings(n = 6) {
  const diff = (new Date().getDay() - 3 + 7) % 7;
  const dates = [];
  for (let i = 0; i < n; i += 1) dates.push(daysAgoISO(diff + i * 7));
  dates.reverse();
  const { data, error } = await supabase.rpc('attendance_by_day', {
    range_start: dates[0],
    range_end: dates[dates.length - 1],
  });
  if (error) throw error;
  const counts = new Map((data ?? []).map((r) => [r.attendance_date, Number(r.check_ins)]));
  return dates.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}
`;

let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const full = join(process.cwd(), filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.startsWith('\n') ? content.slice(1) : content);
  console.log('updated', filePath);
  count += 1;
}

const attPath = join(process.cwd(), 'src/services/attendanceService.js');
let att = readFileSync(attPath, 'utf8');
if (!att.includes('getWednesdayMeetings')) {
  writeFileSync(attPath, att + APPEND);
  console.log('updated src/services/attendanceService.js');
  count += 1;
}

console.log('');
console.log('Done! ' + count + ' files updated.');
console.log('Push to GitHub: git add . && git commit -m "Wednesday-only stats & analytics" && git push');