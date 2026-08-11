import { Lock, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

const STORAGE_KEY = 'fa_admin_unlocked_v2';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

export function lockAdmin() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function AdminGate() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!ADMIN_PASSWORD) return;
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
    } else {
      setError('Incorrect password. Only IF admins can access this dashboard.');
      setPassword('');
    }
  }

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
              className="input mt-6"
              placeholder="Admin password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
            <button type="submit" className="btn-primary mt-5 w-full py-3">
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
