// safe-dashboard.mjs — Resets the dashboard to a bulletproof "Safe Mode"
import { writeFileSync } from 'node:fs';

const code = `
import { format } from 'date-fns';
import { CalendarCheck, Sparkles, UserRound, UserX } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useStats } from '../hooks/useStats';
import Alert from '../components/Alert';

export default function DashboardPage() {
  const { stats, loading, error } = useStats();

  return (
    <>
      <PageHeader title="Dashboard (Safe Mode)" subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')} />
      
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's Attendance" value={stats?.attendanceToday} loading={loading} tone="brand" />
        <StatCard icon={UserRound} label="Total Members" value={stats?.totalMembers} loading={loading} tone="brand" />
        <StatCard icon={Sparkles} label="New Members Today" value={stats?.newMembersToday} loading={loading} tone="white" />
        <StatCard icon={UserX} label="Missed Today" value={stats?.missedToday} loading={loading} tone="red" />
      </div>
      
      <div className="card mt-6 p-8 text-center">
        <h2 className="text-xl font-bold text-stone-900">Charts temporarily disabled</h2>
        <p className="mt-2 text-stone-500">We are in Safe Mode to fix a display error. The core data is loading above.</p>
      </div>
    </>
  );
}
`;

writeFileSync('src/pages/DashboardPage.jsx', code);
console.log('Dashboard reset to Safe Mode!');