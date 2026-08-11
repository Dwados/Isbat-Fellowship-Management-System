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
