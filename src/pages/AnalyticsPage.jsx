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
