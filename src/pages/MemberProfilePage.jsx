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
