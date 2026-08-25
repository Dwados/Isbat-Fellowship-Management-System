// update-qr.mjs — shorter QR url (/c), stronger QR, manual fallback on kiosk
// Usage: node update-qr.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = {

'src/App.jsx': `
import { Route, Routes } from 'react-router-dom';
import AdminGate from './components/AdminGate';
import Layout from './components/Layout';
import AnalyticsPage from './pages/AnalyticsPage';
import AttendancePage from './pages/AttendancePage';
import CheckInPage from './pages/CheckInPage';
import DashboardPage from './pages/DashboardPage';
import KioskPage from './pages/KioskPage';
import MemberProfilePage from './pages/MemberProfilePage';
import MembersPage from './pages/MembersPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public: kiosk + student check-in (/check-in and short /c both work) */}
      <Route path="/" element={<KioskPage />} />
      <Route path="/check-in" element={<CheckInPage />} />
      <Route path="/c" element={<CheckInPage />} />

      {/* Admin-only (password protected) */}
      <Route element={<AdminGate />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberProfilePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
`,

'src/pages/KioskPage.jsx': `
import { format } from 'date-fns';
import { LayoutDashboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function KioskPage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Short URL = simple QR that cheap cameras can read + easy to type by hand
  const checkInUrl = window.location.origin + '/c';
  const shortText = checkInUrl.replace('https://', '');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-950 px-6 py-12 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-300">
          IF Management System
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> LIVE
        </span>
        <p className="mt-5 text-5xl font-extrabold tabular-nums sm:text-6xl">
          {format(now, 'h:mm:ss a')}
        </p>
        <p className="mt-2 text-sm font-medium text-brand-300">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl shadow-black/40">
          <QRCodeSVG
            value={checkInUrl}
            size={240}
            level="H"
            fgColor="#082f49"
            bgColor="#ffffff"
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Scan to check in</h1>
        <p className="mt-2 text-sm text-brand-200">
          Point your phone camera at the code — it opens automatically on iPhone and most Android phones.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-brand-700 bg-brand-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
            Camera not scanning?
          </p>
          <p className="mt-1 text-sm text-brand-200">Open your browser and type:</p>
          <p className="mt-2 break-all font-mono text-lg font-bold text-white">{shortText}</p>
        </div>

        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-brand-700 px-4 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-900 hover:text-white"
        >
          <LayoutDashboard className="h-4 w-4" /> Admin dashboard
        </Link>
      </div>
    </div>
  );
}
`,

};

let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const full = join(process.cwd(), filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.startsWith('\n') ? content.slice(1) : content);
  console.log('updated', filePath);
  count += 1;
}
console.log('');
console.log('Done! ' + count + ' files updated.');
console.log('Now push to GitHub so Vercel redeploys:');
console.log('  git add . && git commit -m "Short QR + manual fallback" && git push');