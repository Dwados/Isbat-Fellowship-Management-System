import { Lock, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

const STORAGE_KEY = 'fa_admin_unlocked_v2';
const LOCKOUT_KEY = 'fa_admin_lockout';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export function lockAdmin() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export default function AdminGate() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(() => parseInt(sessionStorage.getItem('fa_admin_attempts') || '0', 10));
  const [lockedUntil, setLockedUntil] = useState(() => {
    const stored = sessionStorage.getItem(LOCKOUT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockedUntil <= 0) return undefined;
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      setLockedUntil(0);
      setAttempts(0);
      sessionStorage.removeItem(LOCKOUT_KEY);
      sessionStorage.setItem('fa_admin_attempts', '0');
      return undefined;
    }
    setSecondsLeft(remaining);
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!ADMIN_PASSWORD) return;

    // Check if locked out
    const now = Date.now();
    if (lockedUntil > now) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      sessionStorage.removeItem('fa_admin_attempts');
      sessionStorage.removeItem(LOCKOUT_KEY);
      setUnlocked(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      sessionStorage.setItem('fa_admin_attempts', String(newAttempts));

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntilTime = now + LOCKOUT_DURATION;
        setLockedUntil(lockUntilTime);
        sessionStorage.setItem(LOCKOUT_KEY, String(lockUntilTime));
        setError('Too many incorrect attempts. Try again in 5 minutes.');
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      }
      setPassword('');
    }
  }

  const isLocked = lockedUntil > Date.now();

  if (unlocked) return <Outlet />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <UserRound className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-red-700">Admin sign in</h1>
        {ADMIN_PASSWORD ? (
          <>
            <p className="mt-1 text-sm text-stone-500">
              This dashboard is reserved for IF admins. Enter the admin password.
            </p>
            <input
              type="password"
              autoFocus
              autoComplete="off"
              disabled={isLocked}
              className="input mt-6 disabled:bg-stone-100 disabled:text-stone-400"
              placeholder="Admin password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (!isLocked) setError(''); }}
            />
            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
            {isLocked && (
              <p className="mt-3 text-sm font-medium text-amber-600">
                Unlocks in {secondsLeft}s
              </p>
            )}
            <button type="submit" disabled={isLocked} className="btn-primary mt-5 w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <Lock className="h-4 w-4" /> Sign in
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-red-600">
            No admin password configured. Run: node fix-all.mjs
          </p>
        )}
        <p className="mt-4 text-xs text-stone-400">
          Not an admin? Use the QR code at the entrance to check in.
        </p>
      </form>
    </div>
  );
}
