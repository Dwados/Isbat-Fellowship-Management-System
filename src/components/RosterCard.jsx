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
