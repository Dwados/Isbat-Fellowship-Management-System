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
