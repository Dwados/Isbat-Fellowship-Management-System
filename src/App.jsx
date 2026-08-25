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
import ManualCheckInPage from './pages/ManualCheckInPage';
import NotFoundPage from './pages/NotFoundPage';
import RemindersPage from './pages/RemindersPage';

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
          <Route path="/manual-checkin" element={<ManualCheckInPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
