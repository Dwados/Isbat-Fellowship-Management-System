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
      {/* Public: kiosk + member sign-in */}
      <Route path="/" element={<KioskPage />} />
      <Route path="/check-in" element={<CheckInPage />} />

      {/* Admin-only (PIN protected) */}
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
