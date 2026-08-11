import { BarChart3, ClipboardCheck, LayoutDashboard, LogOut, QrCode, UserRound, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { lockAdmin } from './AdminGate';
import ConfigBanner from './ConfigBanner';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function handleLock() {
  lockAdmin();
  window.location.reload();
}

export default function Layout() {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-tight text-white">IF Management</span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-brand-300">
                Attendance
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ' +
                (isActive ? 'bg-brand-800 text-white' : 'text-brand-200/80 hover:bg-brand-900 hover:text-white')}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-brand-900 p-4">
          <div className="flex items-center gap-2 rounded-xl bg-brand-900 px-3 py-2.5">
            <UserRound className="h-4 w-4 shrink-0 text-brand-300" />
            <span className="flex-1 truncate text-sm font-medium text-brand-100">Admin</span>
            <button
              type="button"
              onClick={handleLock}
              title="Lock dashboard"
              className="rounded p-1 text-brand-300 transition-colors hover:bg-brand-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-brand-800 px-3 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-900 hover:text-white"
          >
            <QrCode className="h-4 w-4" /> Open QR Kiosk
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <QrCode className="h-4 w-4" />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-stone-900">
              IF Management System
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-secondary !px-3 !py-2 text-xs">
              <QrCode className="h-4 w-4" /> Kiosk
            </Link>
            <button
              type="button"
              onClick={handleLock}
              title="Lock dashboard"
              className="btn-secondary !px-3 !py-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <ConfigBanner />
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ' +
              (isActive ? 'text-brand-600' : 'text-stone-400 hover:text-stone-600')}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
