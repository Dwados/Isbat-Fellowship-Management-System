// final-wednesday-dashboard.mjs — Bulletproof Wednesday Dashboard
import { writeFileSync } from 'node:fs';

const dashboardCode = `
import { format } from 'date-fns';
import { CalendarCheck, RefreshCw, Sparkles, TrendingUp, UserRound, UserX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getWednesdayMeetings(7)
      .then((data) => { if (active) setMeetings(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active) setError(friendlyError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshToken]);

  const highlight = lastMeetingDateISO();
  const latest = meetings.length > 0 ? meetings[meetings.length - 1] : null;
  const earlier = meetings.slice(0, -1).filter((m) => m.count > 0);
  const avg = earlier.length ? Math.round(earlier.reduce((sum, m) => sum + m.count, 0) / earlier.length) : 0;

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between bg-brand-50 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-brand-800">
          <TrendingUp className="h-4 w-4" /> Wednesday Meetings
        </h2>
      </header>
      <div className="p-5">
        {error && <Alert variant="error">{error}</Alert>}
        {loading && <LoadingBlock label="Loading analytics…" />}
        
        {!loading && !error && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-800">
                Latest: {latest ? latest.count : 0}
              </span>
              <span className="rounded-lg bg-stone-100 px-3 py-1.5 font-medium text-stone-600">
                Average: {avg}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={meetings} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(d) => formatDate(d)} />
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
      if (dateISO) setCheckIns(await getAttendanceForDate(dateISO));
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
        subtitle={format(new Date(), 'EEEE, MMMM d, yyyy') + ' · Wednesday-only tracking'}
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
          <Link to="/attendance" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
        </header>

        {checkInsError && <Alert variant="error" className="m-4">{checkInsError}</Alert>}
        {checkIns === null && !checkInsError && <LoadingBlock label="Loading check-ins…" />}
        {checkIns && checkIns.length === 0 && (
          <EmptyState icon={CalendarCheck} title="No check-ins for this Wednesday" message="Check-ins will appear here after the Wednesday meeting." />
        )}
        {checkIns && checkIns.length > 0 && (
          <ul className="divide-y divide-stone-100">
            {checkIns.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={row.member?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link to={'/members/' + row.member?.id} className="block truncate text-sm font-medium text-stone-900 hover:text-brand-600">
                    {row.member?.name ?? 'Unknown'}
                  </Link>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-stone-500">{formatTime(row.check_in_time)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
`;

writeFileSync('src/pages/DashboardPage.jsx', dashboardCode);
console.log('Bulletproof Wednesday Dashboard applied!');