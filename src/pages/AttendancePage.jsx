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
